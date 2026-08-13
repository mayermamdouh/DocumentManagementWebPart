import { useState } from "react";
import { IEditDocumentFormData } from "../../../../../types/adminTypes";

interface IUseEditDocumentFormProps {
  document: any;
  isViewMode: boolean;
}

export const useEditDocumentForm = ({
  document,
  isViewMode,
}: IUseEditDocumentFormProps) => {
  const [formData, setFormData] = useState<IEditDocumentFormData>({
    docName: document.FileLeafRef,
    docReference: document.DocReference,
    docType: document.DocType,
    docParent: document.DocParent,
    docCategory: document.DocCategory,
    docDepartment: document.DocDepartment,
    docKeywords: document.DocKeywords,
    docOwnerId: document.DocOwner?.Id,
  });

  const isChildDocument = formData.docType === "Child";

  const handleChangeInput = (
    field: keyof IEditDocumentFormData,
    value: string,
  ) => {
    if (isViewMode) return;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDocumentTypeChange = (value: string) => {
    if (isViewMode) return;

    if (value !== "Parent" && value !== "Child") {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      docType: value,
      docParent: value === "Parent" ? undefined : prev.docParent,
    }));
  };

  const handleOwnerChange = (items: any[]) => {
    if (isViewMode) return;

    const owner = items[0];

    setFormData((prev) => ({
      ...prev,
      docOwnerId: owner?.id ? Number(owner.id) : undefined,
    }));
  };

  const setParent = (parentId: number) => {
    if (isViewMode) return;

    setFormData((prev) => ({
      ...prev,
      docParent: parentId,
    }));
  };

  const clearParent = () => {
    if (isViewMode) return;

    setFormData((prev) => ({
      ...prev,
      docParent: undefined,
    }));
  };

  const handleParentSearchChange = (value: string) => {
    if (isViewMode) return;

    if (!value.trim()) {
      setFormData((prev) => ({
        ...prev,
        docParent: undefined,
      }));
    }
  };



  const isValidDocumentReference = /^[^-]+-[^-]+-[^-]+$/.test(
    formData.docReference.trim(),
  );

  const isFormChanged =
    formData.docName !== document.FileLeafRef ||
    formData.docReference !== document.DocReference ||
    formData.docType !== document.DocType ||
    formData.docParent !== document.DocParent ||
    formData.docCategory !== document.DocCategory ||
    formData.docDepartment !== document.DocDepartment ||
    formData.docKeywords !== document.DocKeywords ||
    formData.docOwnerId !== document.DocOwner?.Id;

  return {
    formData,
    isChildDocument,
    isFormChanged,
    handleChangeInput,
    handleDocumentTypeChange,
    handleParentSearchChange,
    isValidDocumentReference,
    handleOwnerChange,
    setParent,
    clearParent,
  };
};
