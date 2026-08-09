import { useCallback, useState } from "react";
import { useSharePoint } from "../../../contexts/SharePointContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { searchUserDocuments } from "../../../services/User/userServices";
import {
  IUserLibraryDocument,
  IUseUserDocumentsProps,
} from "../../../types/userTypes";

export const useUserDocuments = ({
  libraryName,
  activeLibraryId,
}: IUseUserDocumentsProps) => {
  const { sp } = useSharePoint();
  const { setError } = useNotification();

  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [documents, setDocuments] = useState<IUserLibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchDocuments = useCallback(async () => {
    const searchTerm = searchValue.trim();

    if (!searchTerm) {
      setDocuments([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const results = await searchUserDocuments(
        sp,
        searchTerm,
        activeLibraryId,
        libraryName,
        categoryFilter,
      );

      setDocuments(results);
    } catch (error) {
      console.error("Failed to search user documents:", error);

      setDocuments([]);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to search user documents",
      );
    } finally {
      setLoading(false);
    }
  }, [sp, activeLibraryId, searchValue, categoryFilter, setError]);

  const resetSearch = useCallback(() => {
    setSearchValue("");
    setCategoryFilter(null);
    setDocuments([]);
    setHasSearched(false);
  }, []);

  return {
    searchValue,
    setSearchValue,
    categoryFilter,
    setCategoryFilter,
    documents,
    loading,
    hasSearched,
    searchDocuments,
    resetSearch,
  };
};
