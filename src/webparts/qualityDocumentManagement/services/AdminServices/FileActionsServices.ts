import { SPFI } from "@pnp/sp";
import {
  IDocumentChildrenInfo,
  IEditDocumentFormData,
} from "../../types/adminTypes";
import { getDocumentLevel } from "./DocumentService";
import { DeleteFromList, UpdateList } from "./ListsService";
import { DOCUMENT_COLUMNS } from "../../constants/columns";

export const DeleteDocument = async (
  sp: SPFI,
  libraryName: string,
  documentId: number,
) => {
  await sp.web.lists.getByTitle(libraryName).items.getById(documentId).delete();
};

export const validateDocumentMetadata = async (
  sp: SPFI,
  libraryName: string,
  docName: string,
  docReference: string,
  excludeItemId: number,
) => {
  const escapeODataValue = (value: string) => value.trim().replace(/'/g, "''");

  const safeDocName = escapeODataValue(docName);
  const safeDocReference = escapeODataValue(docReference);

  const library = sp.web.lists.getByTitle(libraryName);

  const [docNameItems, docReferenceItems] = await Promise.all([
    library.items
      .select("Id")
      .filter(
        `${DOCUMENT_COLUMNS.DOCUMENT_NAME} eq '${safeDocName}' and Id ne ${excludeItemId}`,
      )
      .top(1)(),

    library.items
      .select("Id")
      .filter(
        `${DOCUMENT_COLUMNS.DOCUMENT_REFERENCE} eq '${safeDocReference}' and Id ne ${excludeItemId}`,
      )
      .top(1)(),
  ]);

  return {
    docNameExists: docNameItems.length > 0,
    docReferenceExists: docReferenceItems.length > 0,
  };
};

export const validateDocumentParent = async (
  sp: SPFI,
  libraryName: string,
  documentId: number,
  newParentId?: number,
): Promise<void> => {
  if (!newParentId) {
    return;
  }

  if (documentId === newParentId) {
    throw new Error("A document cannot be its own parent.");
  }

  let currentId: number | null = newParentId;

  while (currentId !== null) {
    if (currentId === documentId) {
      throw new Error(
        "This parent selection would create a circular document relationship.",
      );
    }

    const parentDocument: any = await sp.web.lists
      .getByTitle(libraryName)
      .items.getById(currentId)
      .select("Id", DOCUMENT_COLUMNS.PARENT_DOCUMENT)();

    currentId = parentDocument.DocParent ?? null;
  }
};

export const EditDocument = async (
  sp: SPFI,
  libraryName: string,
  docDataForm: IEditDocumentFormData & { Id: number },
) => {
  await validateDocumentParent(
    sp,
    libraryName,
    docDataForm.Id,
    docDataForm.docParent,
  );

  if (docDataForm.docParent !== undefined) {
    const parentLevel = await getDocumentLevel(
      sp,
      libraryName,
      docDataForm.docParent,
    );

    if (parentLevel >= 5) {
      throw new Error("The maximum document hierarchy depth is 5 levels.");
    }
  }

  await sp.web.lists
    .getByTitle(libraryName)
    .items.getById(docDataForm.Id)
    .update({
      [DOCUMENT_COLUMNS.DOCUMENT_NAME]: docDataForm.docName,
      [DOCUMENT_COLUMNS.DOCUMENT_REFERENCE]: docDataForm.docReference,
      [DOCUMENT_COLUMNS.CATEGORY]: docDataForm.docCategory,
      [DOCUMENT_COLUMNS.DEPARTMENT]: docDataForm.docDepartment,
      [DOCUMENT_COLUMNS.DOCUMENT_TYPE]: docDataForm.docType,
      [DOCUMENT_COLUMNS.PARENT_DOCUMENT]: docDataForm.docParent,
      [`${DOCUMENT_COLUMNS.OWNER}Id`]: docDataForm.docOwnerId,
      [DOCUMENT_COLUMNS.KEYWORDS]: JSON.stringify(
        docDataForm.docKeywords
          .split(/\s+/)
          .map((keyword: string) => keyword.trim())
          .filter(Boolean),
      ),
    });

  await UpdateList(sp, libraryName, {
    DocumentId: docDataForm.Id,
    ParentDocumentId: docDataForm.docParent,
    DocReference: docDataForm.docReference,
    DocName: docDataForm.docName,
    DocCategory: docDataForm.docCategory,
    DocDepartment: docDataForm.docDepartment,
  });
};

export const ApproveDocument = async (
  sp: SPFI,
  libraryName: string,
  itemId: number,
) => {
  await sp.web.lists
    .getByTitle(libraryName)
    .items.getById(itemId)
    .validateUpdateListItem([
      {
        FieldName: "_ModerationStatus",
        FieldValue: "0",
      },
    ]);
};

export const RejectDocument = async (
  sp: SPFI,
  libraryName: string,
  itemId: number,
) => {
  await sp.web.lists
    .getByTitle(libraryName)
    .items.getById(itemId)
    .validateUpdateListItem([
      {
        FieldName: "_ModerationStatus",
        FieldValue: "1",
      },
    ]);
};

export const checkDocumentHasChildren = async (
  sp: SPFI,
  libraryName: string,
  documentId: number,
): Promise<IDocumentChildrenInfo> => {
  const children: { id: number; name: string }[] = [];

  const loadChildren = async (parentId: number): Promise<void> => {
    const items = await sp.web.lists
      .getByTitle(libraryName)
      .items.filter(`${DOCUMENT_COLUMNS.PARENT_DOCUMENT} eq ${parentId}`)
      .select("Id", DOCUMENT_COLUMNS.DOCUMENT_NAME)();

    for (const item of items) {
      children.push({
        id: item.Id,
        name: item.DocName,
      });

      await loadChildren(item.Id);
    }
  };

  await loadChildren(documentId);

  return {
    childrenCount: children.length,
    children,
  };
};

export const DeleteDocuments = async (
  sp: SPFI,
  libraryName: string,
  documentIds: number[],
): Promise<void> => {
  for (const id of [...documentIds].reverse()) {
    await DeleteFromList(sp, libraryName, id);
    await sp.web.lists.getByTitle(libraryName).items.getById(id).delete();
  }
};

// export const ReplaceDocument = async (
//   context: WebPartContext,
//   oldFile: { ServerRelativeUrl: string },
//   newFile: File,
//   libraryName: string,
// ) => {
//   if (!oldFile?.ServerRelativeUrl || !newFile) {
//     throw new Error("Old file and new file are required.");
//   }

//   const serverRelativeUrl = oldFile.ServerRelativeUrl.startsWith("/")
//     ? oldFile.ServerRelativeUrl
//     : `/${oldFile.ServerRelativeUrl}`;

//   const baseUrl = context.pageContext.web.absoluteUrl;
//   const headers = {
//     Accept: "application/json;odata=nometadata",
//   };

//   // Get existing metadata
//   const itemResponse = await context.spHttpClient.get(
//     `${baseUrl}/_api/web/GetFileByServerRelativePath(decodedurl='${serverRelativeUrl}')/ListItemAllFields`,
//     SPHttpClient.configurations.v1,
//     { headers },
//   );

//   if (!itemResponse.ok) {
//     throw new Error("Failed to get document metadata.");
//   }

//   const item = await itemResponse.json();

//   // Save metadata
//   const fields = [
//     "DocReference",
//     "DocName",
//     "DocType",
//     "DocParent",
//     "DocCategory",
//     "DocDepartment",
//     "DocKeywords",
//   ];

//   const formValues = fields
//     .filter((field) => item[field] !== undefined)
//     .map((FieldName) => ({
//       FieldName,
//       FieldValue: item[FieldName] == null ? "" : String(item[FieldName]),
//     }));

//   const ownerEmail = item.DocOwner?.email || item.DocOwner?.emailAddress;

//   if (ownerEmail) {
//     formValues.push({
//       FieldName: "DocOwner",
//       FieldValue: ownerEmail,
//     });
//   }

//   // Replace file content
//   const fileResponse = await context.spHttpClient.post(
//     `${baseUrl}/_api/web/GetFileByServerRelativePath(decodedurl='${serverRelativeUrl}')/$value`,
//     SPHttpClient.configurations.v1,
//     {
//       headers: {
//         ...headers,
//         "Content-Type": newFile.type || "application/octet-stream",
//         "X-HTTP-Method": "PUT",
//       },
//       body: newFile,
//     },
//   );

//   if (!fileResponse.ok) {
//     throw new Error(
//       `Failed to replace file. Status: ${fileResponse.status}. ${await fileResponse.text()}`,
//     );
//   }

//   // Restore metadata
//   const metadataResponse = await context.spHttpClient.post(
//     `${baseUrl}/_api/web/lists/getbytitle('${libraryName}')/items(${item.Id})/ValidateUpdateListItem`,
//     SPHttpClient.configurations.v1,
//     {
//       headers: {
//         ...headers,
//         "Content-Type": "application/json;odata=nometadata",
//       },
//       body: JSON.stringify({
//         formValues,
//         bNewDocumentUpdate: true,
//       }),
//     },
//   );

//   if (!metadataResponse.ok) {
//     throw new Error(
//       `File replaced, but metadata restoration failed. ${await metadataResponse.text()}`,
//     );
//   }

//   return {
//     itemId: item.Id,
//     serverRelativeUrl,
//   };
// };

export const ReplaceDocument = async (
  sp: SPFI,
  oldFile: { ServerRelativeUrl: string },
  newFile: File,
) => {
  if (!oldFile?.ServerRelativeUrl || !newFile) {
    throw new Error("Old file and new file are required.");
  }

  const serverRelativeUrl = oldFile.ServerRelativeUrl.startsWith("/")
    ? oldFile.ServerRelativeUrl
    : `/${oldFile.ServerRelativeUrl}`;

  const file = sp.web.getFileByServerRelativePath(serverRelativeUrl);

  // Get existing metadata
  const item = await file.listItemAllFields();

  const fields = [
    DOCUMENT_COLUMNS.DOCUMENT_REFERENCE,
    DOCUMENT_COLUMNS.DOCUMENT_NAME,
    DOCUMENT_COLUMNS.DOCUMENT_TYPE,
    DOCUMENT_COLUMNS.PARENT_DOCUMENT,
    DOCUMENT_COLUMNS.CATEGORY,
    DOCUMENT_COLUMNS.DEPARTMENT,
    DOCUMENT_COLUMNS.KEYWORDS,
  ];

  const formValues: {
    FieldName: string;
    FieldValue: string;
  }[] = fields
    .filter((field) => item[field] !== undefined)
    .map((field) => ({
      FieldName: field,
      FieldValue: item[field] == null ? "" : String(item[field]),
    }));

  if (item.DocOwner?.EMail) {
    formValues.push({
      FieldName: DOCUMENT_COLUMNS.OWNER,
      FieldValue: item.DocOwner.EMail,
    });
  }

  // Replace file content
  await file.setContent(newFile);

  // Restore metadata
  const listItem = await file.getItem();
  await listItem.validateUpdateListItem(formValues, true);

  return {
    itemId: item.Id,
    serverRelativeUrl,
  };
};
