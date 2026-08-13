import { SPFI } from "@pnp/sp";
import { ILibraryDocument } from "../../types/adminTypes";
import { IListItem } from "../../types/listTypes";
import { IUserLibraryDocument } from "../../types/userTypes";
import {
  DOCUMENT_COLUMNS,
  DOCUMENT_RELATION_COLUMNS,
} from "../../constants/columns";

const escapeODataValue = (value: string): string => {
  return value.replace(/'/g, "''");
};

const selectFields = [
  "Id",
  "File",
  "File/Name",
  "File/ServerRelativeUrl",
  DOCUMENT_COLUMNS.DOCUMENT_REFERENCE,
  "FileLeafRef",
  DOCUMENT_COLUMNS.DOCUMENT_TYPE,
  DOCUMENT_COLUMNS.PARENT_DOCUMENT,
  DOCUMENT_COLUMNS.CATEGORY,
  DOCUMENT_COLUMNS.DEPARTMENT,
  "OData__ModerationStatus",
  `${DOCUMENT_COLUMNS.OWNER}/Id`,
  `${DOCUMENT_COLUMNS.OWNER}/Title`,
];

const relationSelectFields = [
  DOCUMENT_COLUMNS.DOCUMENT_REFERENCE,
  DOCUMENT_COLUMNS.DOCUMENT_NAME,
  DOCUMENT_COLUMNS.CATEGORY,
  DOCUMENT_COLUMNS.DEPARTMENT,
  DOCUMENT_RELATION_COLUMNS.DOCUMENT_ID,
  DOCUMENT_RELATION_COLUMNS.PARENT_DOCUMENT_ID,
];

const getRelationById = async (
  sp: SPFI,
  relationsListName: string,
  documentId: number,
): Promise<IListItem | null> => {
  const items = await sp.web.lists
    .getByTitle(relationsListName)
    .items.filter(`${DOCUMENT_RELATION_COLUMNS.DOCUMENT_ID} eq ${documentId}`)
    .select(...relationSelectFields)();

  if (items.length === 0) {
    return null;
  }

  return items[0] as IListItem;
};

const getRelationsByParentId = async (
  sp: SPFI,
  relationsListName: string,
  parentId: number,
): Promise<IListItem[]> => {
  const items = await sp.web.lists
    .getByTitle(relationsListName)
    .items.filter(
      `${DOCUMENT_RELATION_COLUMNS.PARENT_DOCUMENT_ID} eq ${parentId}`,
    )
    .select(...relationSelectFields)();

  return items as IListItem[];
};

const getAllParents = async (
  sp: SPFI,
  relationsListName: string,
  relation: IListItem,
  relationsMap: Map<number, IListItem>,
): Promise<void> => {
  let current = relation;

  const visited = new Set<number>();

  while (current.ParentDocumentId != null) {
    const parentId = current.ParentDocumentId;

    if (visited.has(parentId)) {
      break;
    }

    visited.add(parentId);

    if (relationsMap.has(parentId)) {
      current = relationsMap.get(parentId)!;
      continue;
    }

    const parent = await getRelationById(sp, relationsListName, parentId);

    if (!parent) {
      break;
    }

    relationsMap.set(parent.DocumentId, parent);

    current = parent;
  }
};

const getAllChildren = async (
  sp: SPFI,
  relationsListName: string,
  documentId: number,
  relationsMap: Map<number, IListItem>,
  visited: Set<number>,
): Promise<void> => {
  if (visited.has(documentId)) {
    return;
  }

  visited.add(documentId);

  const children = await getRelationsByParentId(
    sp,
    relationsListName,
    documentId,
  );

  for (const child of children) {
    if (!relationsMap.has(child.DocumentId)) {
      relationsMap.set(child.DocumentId, child);
    }

    await getAllChildren(
      sp,
      relationsListName,
      child.DocumentId,
      relationsMap,
      visited,
    );
  }
};

const getAccessibleDocuments = async (
  sp: SPFI,
  activeLibraryId: string,
  documentIds: number[],
): Promise<ILibraryDocument[]> => {
  if (documentIds.length === 0) {
    return [];
  }

  const filter = documentIds.map((id) => `Id eq ${id}`).join(" or ");

  const documents = await sp.web.lists
    .getById(activeLibraryId)
    .items.select(...selectFields)
    .expand("File", "DocOwner")
    .filter(filter)();

  return documents as ILibraryDocument[];
};

export const searchUserDocuments = async (
  sp: SPFI,
  searchValue: string,
  activeLibraryId: string | null,
  libraryName: string,
  category?: string | null,
): Promise<IUserLibraryDocument[]> => {
  const relationsListName = `${libraryName}Relations`;
  const searchTerm = searchValue.trim();

  if (!searchTerm) {
    return [];
  }

  const escapedSearchTerm = escapeODataValue(searchTerm);

  const searchFilter = `
  substringof('${escapedSearchTerm}', ${DOCUMENT_COLUMNS.DOCUMENT_NAME})
  or substringof('${escapedSearchTerm}', ${DOCUMENT_COLUMNS.DOCUMENT_REFERENCE})
  or substringof('${escapedSearchTerm}', ${DOCUMENT_COLUMNS.DEPARTMENT})
`;

  const categoryFilter = category
    ? ` and ${DOCUMENT_COLUMNS.CATEGORY} eq '${escapeODataValue(category)}'`
    : "";

  const filter = `
    (${searchFilter})
    ${categoryFilter}
  `;

  const matchedRelations = await sp.web.lists
    .getByTitle(relationsListName)
    .items.select(...relationSelectFields)
    .filter(filter)();

  const relationsMap = new Map<number, IListItem>();

  matchedRelations.forEach((relation) => {
    relationsMap.set(relation.DocumentId, relation);
  });

  await Promise.all(
    matchedRelations.map(async (relation) => {
      await Promise.all([
        getAllParents(sp, relationsListName, relation, relationsMap),

        getAllChildren(
          sp,
          relationsListName,
          relation.DocumentId,
          relationsMap,
          new Set<number>(),
        ),
      ]);
    }),
  );

  const accessibleDocuments = await getAccessibleDocuments(
    sp,
    activeLibraryId ? activeLibraryId : "",
    Array.from(relationsMap.keys()),
  );
  const documentsMap = new Map<number, ILibraryDocument>();

  accessibleDocuments.forEach((document) => {
    documentsMap.set(document.Id, document);
  });

  const result: IUserLibraryDocument[] = Array.from(relationsMap.values()).map(
    (relation) => {
      const document = documentsMap.get(relation.DocumentId);

      return {
        ...(document ?? {}),

        Id: relation.DocumentId,

        DocReference: relation.DocReference,
        DocName: document?.FileLeafRef ?? relation.DocName,
        DocCategory: relation.DocCategory,
        DocDepartment: relation.DocDepartment,
        DocParent: relation.ParentDocumentId,

        hasAccess: !!document,
      };
    },
  );
  return result;
};
