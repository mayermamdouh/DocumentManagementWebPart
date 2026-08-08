import { useEffect, useState } from "react";
import { SPFI } from "@pnp/sp";
import { ISearchParent } from "../../../../../types/adminTypes";
import { useNotification } from "../../../../../contexts/NotificationContext";
import { getParentDocument } from "../../../../../services/AdminServices/DocumentService";

interface IUseParentDocumentSearchProps {
  sp: SPFI;
  libraryName: string;
  enabled: boolean;
  initialSearchValue?: string;
  documentId?: number;
}

interface IUseParentDocumentSearchResult {
  searchValue: string;
  setSearchValue: (value: string) => void;
  parentDocuments: ISearchParent[];
  isSearching: boolean;
  selectedParent: ISearchParent | null;
  selectParent: (document: ISearchParent) => void;
  clearSelection: () => void;
}

export const useParentDocumentSearch = ({
  sp,
  libraryName,
  enabled,
  initialSearchValue,
  documentId,
}: IUseParentDocumentSearchProps): IUseParentDocumentSearchResult => {
  const { setError } = useNotification();

  const [searchValue, setSearchValue] = useState(initialSearchValue || "");
  const [parentDocuments, setParentDocuments] = useState<ISearchParent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ISearchParent | null>(
    null,
  );

  useEffect(() => {
    if (!enabled) {
      setSearchValue("");
      setParentDocuments([]);
      setIsSearching(false);
      setSelectedParent(null);

      return;
    }

    if (selectedParent) {
      setParentDocuments([]);
      setIsSearching(false);

      return;
    }

    const value = searchValue.trim();

    if (!value) {
      setParentDocuments([]);
      setIsSearching(false);

      return;
    }

    let isCancelled = false;

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);

        const documents = await getParentDocument(
          sp,
          libraryName,
          value,
          documentId,
        );

        if (isCancelled) {
          return;
        }

        setParentDocuments(documents);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("Error searching parent documents:", error);

        setParentDocuments([]);
        setError(error);
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchValue, selectedParent, enabled, sp, libraryName, setError]);

  const handleSetSearchValue = (value: string): void => {
    setSearchValue(value);

    if (selectedParent) {
      setSelectedParent(null);
    }
  };

  const selectParent = (document: ISearchParent): void => {
    setSelectedParent(document);
    setSearchValue(document.DocName);
    setParentDocuments([]);
    setIsSearching(false);
  };

  const clearSelection = (): void => {
    setSelectedParent(null);
    setSearchValue("");
    setParentDocuments([]);
    setIsSearching(false);
  };

  return {
    searchValue,
    setSearchValue: handleSetSearchValue,
    parentDocuments,
    isSearching,
    selectedParent,
    selectParent,
    clearSelection,
  };
};
