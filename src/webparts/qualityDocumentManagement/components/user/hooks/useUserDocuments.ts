import { useCallback, useState } from "react";
import { useSharePoint } from "../../../contexts/SharePointContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { searchUserDocuments } from "../../../services/User/userServices";
import {
  IUserLibraryDocument,
  IUseUserDocumentsProps,
} from "../../../types/userTypes";
import { useDocumentSession } from "../../../hooks/useDocumentSession";

export const useUserDocuments = ({ libraryName }: IUseUserDocumentsProps) => {
  const { sp } = useSharePoint();
  const { setError } = useNotification();

  const { user, activeLibraryId, updateUserValue } =
    useDocumentSession();

  const [documents, setDocuments] = useState<IUserLibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchDocuments = useCallback(async () => {
    const searchTerm = user.searchTerm.trim();

    if (!searchTerm || !activeLibraryId) {
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
        user.selectedCategory,
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
  }, [
    sp,
    user.searchTerm,
    activeLibraryId,
    user.selectedCategory,
    libraryName,
    setError,
  ]);

  const resetSearch = useCallback(() => {
    setDocuments([]);
    setHasSearched(false);
  }, []);

  return {
    user,
    updateUserValue,
    documents,
    loading,
    hasSearched,
    searchDocuments,
    resetSearch,
  };
};
