import { useMemo } from "react";
import { ILibraryDocument } from "../../../types/adminTypes";

interface IUseAdminDocumentFilterProps {
  documents: ILibraryDocument[];
  searchValue: string;
  categoryFilter: string | null;
  typeFilter: string | null;
}

export const useAdminDocumentFilter = ({
  documents,
  searchValue,
  categoryFilter,
  typeFilter,
}: IUseAdminDocumentFilterProps): ILibraryDocument[] => {
  return useMemo(() => {
    const searchTerm = searchValue.trim().toLowerCase();

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

    const matchesSearch = (document: ILibraryDocument): boolean => {
      if (!searchTerm) {
        return true;
      }

      return (
        document.DocName?.toLowerCase().includes(searchTerm) ||
        document.DocReference?.toLowerCase().includes(searchTerm) ||
        document.DocDepartment?.toLowerCase().includes(searchTerm)
      );
    };

    const matchedDocuments = documents.filter(matchesSearch);

    const resultIds = new Set<number>();

    const addDocumentAndChildren = (document: ILibraryDocument): void => {
      if (resultIds.has(document.Id)) {
        return;
      }

      resultIds.add(document.Id);

      const children = childrenMap.get(document.Id) ?? [];

      children.forEach((child) => {
        addDocumentAndChildren(child);
      });
    };

    matchedDocuments.forEach((document) => {
      addDocumentAndChildren(document);
    });

    return documents.filter((document) => {
      if (!resultIds.has(document.Id)) {
        return false;
      }

      const matchesCategory =
        !categoryFilter || document.DocCategory === categoryFilter;

      const matchesType =
        !typeFilter || document.DocType === typeFilter;

      return matchesCategory && matchesType;
    });
  }, [documents, searchValue, categoryFilter, typeFilter]);
};
