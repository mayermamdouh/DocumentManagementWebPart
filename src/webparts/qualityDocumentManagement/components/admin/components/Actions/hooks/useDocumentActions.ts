import { useEffect, useState } from "react";
import {
  validateDocumentMetadata,
  EditDocument,
} from "../../../../../services/AdminServices/FileActionsServices";
import { ILibraryDocument } from "../../../../../types/adminTypes";
import { useSharePoint } from "../../../../../contexts/SharePointContext";
import { useNotification } from "../../../../../contexts/NotificationContext";

interface IEditDocumentFormData {
  docName: string;
  docReference: string;
  docType: "Parent" | "Child";
  docParent?: number;
  docCategory: string;
  docDepartment: string;
  docKeywords: string;
  docOwnerId?: number;
}

interface IUseDocumentActions {
  onClose: () => void;
  libraryName: string;
  document: ILibraryDocument;
  formData: IEditDocumentFormData;
  onRefresh: () => Promise<void>;
}

export const useDocumentActions = ({
  onClose,
  libraryName,
  document,
  formData,
  onRefresh,
}: IUseDocumentActions) => {
  const { sp } = useSharePoint();
  const { setError, setMessage } = useNotification();
  const [isDocNameExists, setIsDocNameExists] = useState(false);
  const [isDocReferenceExists, setIsDocReferenceExists] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  useEffect(() => {
    const docName = formData.docName.trim();
    const docReference = formData.docReference.trim();

    if (!docName || !docReference) {
      setIsDocNameExists(false);
      setIsDocReferenceExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsValidating(true);

        const validation = await validateDocumentMetadata(
          sp,
          libraryName,
          docName,
          docReference,
          document.Id,
        );

        setIsDocNameExists(validation.docNameExists);
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

      await EditDocument(sp, libraryName, {
        Id: document.Id,
        ...formData,
      });
      setMessage("Document updated successfully.");
      await onRefresh();
    } catch (error) {
      console.error("Failed to edit document:", error);
      setError(
        error instanceof Error ? error.message : "Failed to edit document",
      );
    } finally {
      onClose();
      setIsValidating(false);
      setIsLoadingEdit(false);
    }
  };

  return {
    isDocNameExists,
    isDocReferenceExists,
    isValidating,
    isLoadingEdit,
    handleEditDocument,
  };
};
