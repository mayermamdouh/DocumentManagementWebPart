import { SPFI } from "@pnp/sp";
import { IListItem } from "../../types/listTypes";

export const AddToList = async (
  sp: SPFI,
  libraryName: string,
  listItemData: IListItem,
) => {
  const relationListName = `${libraryName}Relations`;
  await sp.web.lists.getByTitle(relationListName).items.add({
    DocReference: listItemData.DocReference,
    DocName: listItemData.DocName,
    DocCategory: listItemData.DocCategory,
    DocDepartment: listItemData.DocDepartment,
    DocumentId: listItemData.DocumentId,
    ParentDocumentId: listItemData.ParentDocumentId,
  });
};

export const DeleteFromList = async (
  sp: SPFI,
  libraryName: string,
  documentId: number,
): Promise<void> => {
  const relationListName = `${libraryName}Relations`;

  const items = await sp.web.lists
    .getByTitle(relationListName)
    .items.filter(`DocumentId eq ${documentId}`)
    .select("Id")();

  for (const item of items) {
    await sp.web.lists
      .getByTitle(relationListName)
      .items.getById(item.Id)
      .delete();
  }
};

export const UpdateList = async (
  sp: SPFI,
  libraryName: string,
  relation: IListItem,
): Promise<void> => {
  const relationList = sp.web.lists.getByTitle(`${libraryName}Relations`);

  const [item] = await relationList.items
    .filter(`DocumentId eq ${relation.DocumentId}`)
    .select("Id")();

  if (!item) {
    throw new Error("Relation item not found.");
  }

  await relationList.items.getById(item.Id).update({
    ...(relation.ParentDocumentId !== undefined && {
      ParentDocumentId: relation.ParentDocumentId,
    }),
    ...(relation.ParentDocumentId === undefined && {
      ParentDocumentId: null,
    }),
    DocReference: relation.DocReference,
    DocName: relation.DocName,
    DocCategory: relation.DocCategory,
    DocDepartment: relation.DocDepartment,
  });
};
