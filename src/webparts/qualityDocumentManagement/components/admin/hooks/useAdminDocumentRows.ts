import { useMemo } from "react";

import type { ILibraryDocument } from "../../../types/adminTypes";

export interface IAdminDocumentRow extends ILibraryDocument {
  level: number;
}

export const useAdminDocumentRows = (
  documents: ILibraryDocument[],
): IAdminDocumentRow[] => {
  return useMemo(() => {
    if (documents.length === 0) {
      return [];
    }

    const documentMap = new Map<number, ILibraryDocument>();
    const childrenMap = new Map<number, ILibraryDocument[]>();

    documents.forEach((document) => {
      documentMap.set(document.Id, document);
    });

    documents.forEach((document) => {
      if (!document.DocParent) {
        return;
      }

      const children = childrenMap.get(document.DocParent) ?? [];
      children.push(document);
      childrenMap.set(document.DocParent, children);
    });

    const rows: IAdminDocumentRow[] = [];

    const addDocument = (document: ILibraryDocument, level: number): void => {
      rows.push({
        ...document,
        level,
      });

      const children = childrenMap.get(document.Id) ?? [];

      children.forEach((child) => {
        addDocument(child, level + 1);
      });
    };

const roots = documents.filter(
  (document) => !document.DocParent || !documentMap.has(document.DocParent),
);

    roots.forEach((root) => {
      addDocument(root, 0);
    });

    return rows;
  }, [documents]);
};
