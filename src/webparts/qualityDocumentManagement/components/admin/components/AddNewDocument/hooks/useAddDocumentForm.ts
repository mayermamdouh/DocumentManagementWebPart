import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useCategoryContext } from "../../../../../contexts/CategoryContext";
import { IQualityDocumentForm } from "../../../../../types/adminTypes";
import { validateDocument } from "../../../../../services/AdminServices/DocumentService";
import { useSharePoint } from "../../../../../contexts/SharePointContext";
import { useNotification } from "../../../../../contexts/NotificationContext";

interface IUseDocumentForm {
  libraryName: string;
}

export const useAddDocumentForm = ({ libraryName }: IUseDocumentForm) => {
  const { sp } = useSharePoint();
  const { setError } = useNotification();
  const { categoriesMap } = useCategoryContext();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState({
    fileNameExists: false,
    docNameExists: false,
    docReferenceExists: false,
  });
  const [formData, setFormData] = useState<IQualityDocumentForm>({
    file: null,
    docReference: "",
    docName: "",
    docType: "Parent",
    docParent: undefined,
    docCategory: "",
    docDepartment: "",
    docKeywords: "",
    docOwnerId: undefined,
    docOwnerLoginName: "",
  });

  useEffect(() => {
    const fileName = formData.file?.name;

    if (
      !fileName &&
      !formData.docName.trim() &&
      !formData.docReference.trim()
    ) {
      setValidationResult({
        fileNameExists: false,
        docNameExists: false,
        docReferenceExists: false,
      });

      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsValidating(true);

        const result = await validateDocument(
          sp,
          libraryName,
          fileName || "",
          formData.docName,
          formData.docReference,
        );

        setValidationResult(result);
      } catch (error) {
        console.error("Failed to validate document:", error);
         setError(
           error instanceof Error
             ? error.message
             : "Failed to validate document",
         );
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [sp, libraryName, formData.file, formData.docName, formData.docReference]);

  const categoryOptions = useMemo(
    () =>
      Object.values(categoriesMap).map((category) => ({
        key: category.Id,
        text: category.Title,
      })),
    [categoriesMap],
  );

  const isChildDocument = formData.docType === "Child";

  const isValidDocumentReference = /^[^-]+-[^-]+-[^-]+$/.test(
    formData.docReference.trim(),
  );

  const handleChangeInput = (
    field: keyof IQualityDocumentForm,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangeFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setFormData((prev) => ({
      ...prev,
      file,
    }));
  };

  const handleDocumentTypeChange = (value: string) => {
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
    const owner = items[0];
    setFormData((prev) => ({
      ...prev,
      docOwnerId: owner?.id ? Number(owner.id) : undefined,
      docOwnerLoginName: owner?.loginName,
    }));
  };

  const setParent = (parentId: number) => {
    setFormData((prev) => ({
      ...prev,
      docParent: parentId,
    }));
  };

  const isSaveDisabled =
    !formData.file ||
    !formData.docReference.trim() ||
    !isValidDocumentReference ||
    !formData.docName.trim() ||
    !formData.docOwnerId ||
    !formData.docDepartment.trim() ||
    !formData.docCategory ||
    (isChildDocument && !formData.docParent) ||
    validationResult.fileNameExists ||
    validationResult.docNameExists ||
    validationResult.docReferenceExists ||
    isValidating;

  return {
    formData,
    setFormData,
    isChildDocument,
    isValidDocumentReference,
    fileNameExists: validationResult.fileNameExists,
    docNameExists: validationResult.docNameExists,
    docReferenceExists: validationResult.docReferenceExists,
    isValidating,
    isSaveDisabled,
    categoryOptions,
    handleChangeInput,
    handleChangeFile,
    handleDocumentTypeChange,
    handleOwnerChange,
    setParent,
  };
};
