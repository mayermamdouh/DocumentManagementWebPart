import { SPFI } from "@pnp/sp";
import {
  IDocumentParent,
  ILibraryDocument,
  IQualityDocumentForm,
  ISearchParent,
} from "../../types/adminTypes";
import { AddToList } from "./ListsService";
import { DOCUMENT_COLUMNS } from "../../constants/columns";

export const validateDocument = async (
  sp: SPFI,
  libraryName: string,
  fileName: string,
  docName: string,
  docReference: string,
) => {
  const escapeODataValue = (value: string) => value.trim().replace(/'/g, "''");

  const safeFileName = escapeODataValue(fileName);
  const safeDocName = escapeODataValue(docName);
  const safeDocReference = escapeODataValue(docReference);

  const library = sp.web.lists.getByTitle(libraryName);

  const filters = [
    `FileLeafRef eq '${safeFileName}'`,
    `DocName eq '${safeDocName}'`,
    `DocReference eq '${safeDocReference}'`,
  ];

  const [fileNameItems, docNameItems, docReferenceItems] = await Promise.all(
    filters.map((filter) => {
      let query = library.items.select("Id").filter(filter).top(1);

      return query();
    }),
  );

  return {
    fileNameExists: fileNameItems.length > 0,
    docNameExists: docNameItems.length > 0,
    docReferenceExists: docReferenceItems.length > 0,
  };
};

export const getDocumentLevel = async (
  sp: SPFI,
  libraryName: string,
  documentId: number,
): Promise<number> => {
  let level = 1;
  let currentId: number | null = documentId;

  while (currentId !== null) {
    const document: IDocumentParent = await sp.web.lists
      .getByTitle(libraryName)
      .items.getById(currentId)
      .select("DocParent")();

    if (!document.DocParent) {
      break;
    }

    currentId = document.DocParent;
    level++;
  }

  return level;
};

export const uploadFile = async (sp: SPFI, file: File, libraryName: string) => {
  const webInfo = await sp.web.select("ServerRelativeUrl")();

  const webServerRelativeUrl = webInfo.ServerRelativeUrl.replace(/\/$/, "");
  const libraryServerRelativeUrl = `${webServerRelativeUrl}/${libraryName}`;
  const folder = sp.web.getFolderByServerRelativePath(libraryServerRelativeUrl);
  const uploadResult = await folder.files.addUsingPath(file.name, file, {
    Overwrite: false,
  });

  return uploadResult;
};

export const AddNewDocument = async (
  sp: SPFI,
  libraryName: string,
  docDataForm: IQualityDocumentForm,
) => {
  // validate max children
  if (docDataForm.docParent) {
    const parentLevel = await getDocumentLevel(
      sp,
      libraryName,
      docDataForm.docParent,
    );

    if (parentLevel >= 5) {
      throw new Error(
        "You cannot add a child because the maximum hierarchy level is 5.",
      );
    }
  }

  let uploadedFile: ReturnType<
    typeof sp.web.getFileByServerRelativePath
  > | null = null;

  try {
    const uploadResult = await uploadFile(sp, docDataForm.file!, libraryName);

    uploadedFile = sp.web.getFileByServerRelativePath(
      uploadResult.ServerRelativeUrl,
    );
    const listItem = await uploadedFile.getItem();

    await listItem.validateUpdateListItem(
      [
        {
          FieldName: DOCUMENT_COLUMNS.DOCUMENT_NAME,
          FieldValue: docDataForm.docName,
        },
        {
          FieldName: DOCUMENT_COLUMNS.DOCUMENT_REFERENCE,
          FieldValue: docDataForm.docReference,
        },
        {
          FieldName: DOCUMENT_COLUMNS.CATEGORY,
          FieldValue: docDataForm.docCategory,
        },
        {
          FieldName: DOCUMENT_COLUMNS.DEPARTMENT,
          FieldValue: docDataForm.docDepartment,
        },
        {
          FieldName: DOCUMENT_COLUMNS.DOCUMENT_TYPE,
          FieldValue: docDataForm.docType,
        },
        {
          FieldName: DOCUMENT_COLUMNS.PARENT_DOCUMENT,
          FieldValue: docDataForm.docParent?.toString() ?? "",
        },
        {
          FieldName: DOCUMENT_COLUMNS.OWNER,
          FieldValue: `[{"Key":"${docDataForm.docOwnerLoginName}"}]`,
        },
        {
          FieldName: DOCUMENT_COLUMNS.KEYWORDS,
          FieldValue: JSON.stringify(
            docDataForm.docKeywords
              .split(/\s+/)
              .map((keyword) => keyword.trim())
              .filter(Boolean),
          ),
        },
      ],
      true,
    );

    const item = await listItem.select("Id")();

    await AddToList(sp, libraryName, {
      DocumentId: item.Id,
      ParentDocumentId: docDataForm.docParent ?? null,
      [DOCUMENT_COLUMNS.DOCUMENT_REFERENCE]: docDataForm.docReference,
      [DOCUMENT_COLUMNS.DOCUMENT_NAME]: docDataForm.docName,
      [DOCUMENT_COLUMNS.CATEGORY]: docDataForm.docCategory,
      [DOCUMENT_COLUMNS.DEPARTMENT]: docDataForm.docDepartment,
    });

    return item.Id;
  } catch (error) {
    if (uploadedFile) {
      try {
        await uploadedFile.delete();
      } catch (deleteError) {
        console.error("Failed to rollback uploaded document:", deleteError);
      }
    }

    throw error;
  }
};

export const PublishDocument = async (
  sp: SPFI,
  libraryName: string,
  itemId: number,
) => {
  const result = await sp.web.lists
    .getByTitle(libraryName)
    .items.getById(itemId)
    .validateUpdateListItem([
      {
        FieldName: "_ModerationStatus",
        FieldValue: "0",
      },
    ]);

  return result;
};

export const getApprovalStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return "Approved";
    case 1:
      return "Rejected";
    case 2:
      return "Pending";
    case 3:
      return "Draft";
    case 4:
      return "Scheduled";
    default:
      return "Unknown";
  }
};

export const getLibraryDocuemnts = async (
  sp: SPFI,
  libraryId: string,
): Promise<ILibraryDocument[]> => {
  const documents = await sp.web.lists
    .getById(libraryId)
    .items.select(
      "Id",
      "FileLeafRef",
      "FileRef",
      "File/Name",
      "File/ServerRelativeUrl",
      "Created",
      "Author/Id",
      "Author/Title",
      "Author/EMail",
      DOCUMENT_COLUMNS.DOCUMENT_REFERENCE,
      DOCUMENT_COLUMNS.DOCUMENT_NAME,
      DOCUMENT_COLUMNS.DOCUMENT_TYPE,
      DOCUMENT_COLUMNS.PARENT_DOCUMENT,
      DOCUMENT_COLUMNS.CATEGORY,
      DOCUMENT_COLUMNS.DEPARTMENT,
      DOCUMENT_COLUMNS.KEYWORDS,
      "OData__ModerationStatus",
      "DocOwner/Id",
      "DocOwner/Title",
      "DocOwner/EMail",
    )
    .expand("File", "Author", "DocOwner")();

  return documents.map((document) => ({
    ...document,
    ApprovalStatus: getApprovalStatusText(document.OData__ModerationStatus),
    DocKeywords: document.DocKeywords
      ? JSON.parse(document.DocKeywords).join(" ")
      : "",
    DocParentName: document.DocParent
      ? documents.find(
          (parentDocument) => parentDocument.Id === document.DocParent,
        )?.DocName
      : undefined,
  }));
};

export const getParentDocument = async (
  sp: SPFI,
  libraryName: string,
  value: string,
  currentDocumentId?: number,
): Promise<ISearchParent[]> => {
  const searchValue = value.trim().replace(/'/g, "''");

  if (!searchValue) {
    return [];
  }

  let filter = `substringof('${searchValue}', ${DOCUMENT_COLUMNS.DOCUMENT_NAME})`;

  if (currentDocumentId !== undefined) {
    filter += ` and Id ne ${currentDocumentId}`;
  }

  const items = await sp.web.lists
    .getByTitle(libraryName)
    .items.select(
      "Id",
      DOCUMENT_COLUMNS.DOCUMENT_NAME,
      DOCUMENT_COLUMNS.DOCUMENT_TYPE,
      DOCUMENT_COLUMNS.PARENT_DOCUMENT,
    )
    .filter(filter)
    .top(10)();

  return items;
};
