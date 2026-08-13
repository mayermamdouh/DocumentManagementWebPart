import { useEffect, useState } from "react";
import {
  validateDocumentMetadata,
  EditDocument,
} from "../../../../../services/AdminServices/FileActionsServices";
import {
  IEditDocumentFormData,
  ILibraryDocument,
} from "../../../../../types/adminTypes";
import { useSharePoint } from "../../../../../contexts/SharePointContext";
import { useNotification } from "../../../../../contexts/NotificationContext";

interface IUseDocumentActions {
  onClose: () => void;
  libraryName: string;
  document: ILibraryDocument;
  formData: IEditDocumentFormData;
  setDocuments: React.Dispatch<React.SetStateAction<ILibraryDocument[]>>;
}

export const useDocumentActions = ({
  onClose,
  libraryName,
  document,
  formData,
  setDocuments,
}: IUseDocumentActions) => {
  const { sp } = useSharePoint();
  const { setMessage } = useNotification();
  const [error, setError] = useState<string>("");
  const [isFileNameExists, setIsFileNameExists] = useState(false);
  const [isDocReferenceExists, setIsDocReferenceExists] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  useEffect(() => {
    const fileName = formData.docName.trim();
    const docReference = formData.docReference.trim();

    if (!fileName || !docReference) {
      setIsFileNameExists(false);
      setIsDocReferenceExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsValidating(true);

        const validation = await validateDocumentMetadata(
          sp,
          libraryName,
          fileName,
          docReference,
          document.Id,
        );

        setIsFileNameExists(validation.fileNameExists);
        setIsDocReferenceExists(validation.docReferenceExists);
      } catch (error) {
        console.error("Failed to validate document metadata:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to validate document metadata",
        );
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.docName, formData.docReference, sp, libraryName, document.Id]);

const handleEditDocument = async () => {
  if (!formData || !document.Id) {
    return;
  }

  try {
    setIsLoadingEdit(true);
    setIsValidating(true);
    setError("");

    const updatedDocument = await EditDocument(sp, libraryName, {
      Id: document.Id,
      ...formData,
    });

    setDocuments((prev) =>
      prev.map((item) =>
        item.Id === updatedDocument.Id ? updatedDocument : item,
      ),
    );

    setMessage("Document updated successfully.");

    onClose();
  } catch (error) {
    console.error("Failed to edit document:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("[423]") ||
      errorMessage.toLowerCase().includes("locked for shared use")
    ) {
      setError(
        "This document is currently locked because it is open or being edited by another user. Please close the document and try again.",
      );
    } else {
      setError(errorMessage || "Failed to edit document.");
    }
  } finally {
    setIsValidating(false);
    setIsLoadingEdit(false);
  }
};

  const clearError = () => {
    setError("");
  };

  return {
    error,
    clearError,
    isFileNameExists,
    isDocReferenceExists,
    isValidating,
    isLoadingEdit,
    handleEditDocument,
  };
};
