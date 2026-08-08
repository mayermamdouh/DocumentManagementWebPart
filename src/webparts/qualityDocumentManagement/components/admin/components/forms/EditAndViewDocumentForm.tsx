import React, { useMemo, useState } from "react";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/controls/peoplepicker";
import AppButton from "../../../common/AppButton/AppButton";
import AppInput from "../../../common/AppInput/AppInput";
import AppDropdown from "../../../common/AppDropdown/AppDropdown";
import AppTextarea from "../../../common/AppTextarea/AppTextarea";
import AppLoading from "../../../common/AppLoading/Apploading";
import styles from "./DocumentForm.module.scss";
import { IEditAndViewDocumentFormProps } from "../../../../types/adminTypes";
import { useSharePoint } from "../../../../contexts/SharePointContext";
import { useCategoryContext } from "../../../../contexts/CategoryContext";
import { useParentDocumentSearch } from "../AddNewDocument/hooks/useParentDocumentSearch";
import { useDocumentActions } from "../Actions/hooks/useDocumentActions";
import { useEditDocumentForm } from "../Actions/hooks/useEditDocumentForm";

const EditAndViewDocumentForm = ({
  document,
  mode,
  onClose,
  libraryName,
  onRefresh,
}: IEditAndViewDocumentFormProps) => {
  const { context, sp } = useSharePoint();
  const { categoriesMap } = useCategoryContext();
  const [isEditingParent, setIsEditingParent] = useState(false);

  const isViewMode = mode === "view";
  const {
    formData,
    isChildDocument,
    isFormChanged,
    handleChangeInput,
    handleDocumentTypeChange,
    handleOwnerChange,
    handleParentSearchChange,
    isValidDocumentReference,
    setParent,
  } = useEditDocumentForm({
    document,
    isViewMode,
  });

  const {
    isDocNameExists,
    isDocReferenceExists,
    isValidating,
    isLoadingEdit,
    handleEditDocument,
  } = useDocumentActions({
    onClose,
    libraryName,
    document,
    formData,
    onRefresh,
  });

  const categoryOptions = useMemo(
    () =>
      Object.values(categoriesMap).map((category) => ({
        key: category.Id,
        text: category.Title,
      })),
    [categoriesMap],
  );

  const {
    searchValue: parentSearch,
    setSearchValue: setParentSearch,
    parentDocuments,
    isSearching: isSearchingParent,
    selectedParent,
    selectParent,
  } = useParentDocumentSearch({
    sp,
    libraryName,
    enabled: isChildDocument && !isViewMode,
    initialSearchValue: document.DocParentName,
    documentId: document.Id,
  });

  const isSaveDisabled =
    !isFormChanged ||
    (isChildDocument && !formData.docParent) ||
    isDocNameExists ||
    isDocReferenceExists ||
    isValidating ||
    !isValidDocumentReference;

  return (
    <div className={styles.form}>
      {isLoadingEdit ? (
        <AppLoading />
      ) : (
        <>
          {" "}
          <div className={styles.inputs}>
            <AppInput
              label="Document Name"
              required
              value={formData.docName}
              disabled={isViewMode}
              onChange={(value) => handleChangeInput("docName", value)}
              errorMessage={
                isDocNameExists
                  ? "A document with this name already exists."
                  : undefined
              }
            />

            <AppInput
              label="Document Reference"
              required
              value={formData.docReference}
              disabled={isViewMode}
              onChange={(value) => handleChangeInput("docReference", value)}
              errorMessage={
                isDocReferenceExists
                  ? "A document with this reference already exists."
                  : !isValidDocumentReference
                    ? "Document Reference must follow the format: PO-CPM-001"
                    : undefined
              }
            />

            <PeoplePicker
              context={context as any}
              webAbsoluteUrl={context.pageContext.web.absoluteUrl}
              titleText="Owner"
              personSelectionLimit={1}
              showtooltip={true}
              required={true}
              ensureUser={true}
              resolveDelay={200}
              principalTypes={[
                PrincipalType.User,
                PrincipalType.SharePointGroup,
                PrincipalType.SecurityGroup,
                PrincipalType.DistributionList,
              ]}
              defaultSelectedUsers={
                document.DocOwner?.EMail ? [document.DocOwner.EMail] : []
              }
              disabled={isViewMode}
              onChange={handleOwnerChange}
            />

            <AppInput
              label="Department"
              required
              value={formData.docDepartment}
              disabled={isViewMode}
              onChange={(value) => handleChangeInput("docDepartment", value)}
            />

            <AppDropdown
              required
              label="Document Type"
              value={formData.docType}
              disabled={isViewMode}
              onChange={handleDocumentTypeChange}
              options={[
                {
                  key: "Parent",
                  text: "Parent",
                },
                {
                  key: "Child",
                  text: "Child",
                },
              ]}
            />

            {isChildDocument && (
              <div className={styles.parentSearchWrapper}>
                {isViewMode ? (
                  <AppInput
                    label="Parent Document"
                    value={document.DocParentName || "-"}
                    disabled
                  />
                ) : (
                  <>
                    <AppInput
                      label="Parent Document"
                      required
                      placeholder="Search for parent document..."
                      value={parentSearch}
                      onChange={(value) => {
                        setIsEditingParent(true);
                        setParentSearch(value);
                        handleParentSearchChange(value);
                      }}
                    />

                    {isSearchingParent && isEditingParent && <AppLoading />}

                    {isEditingParent &&
                      !isSearchingParent &&
                      !selectedParent &&
                      parentSearch.trim() &&
                      parentDocuments.length > 0 && (
                        <div className={styles.parentResults}>
                          {parentDocuments.map((parentDocument) => (
                            <button
                              type="button"
                              key={parentDocument.Id}
                              className={styles.parentResultItem}
                              onClick={() => {
                                selectParent(parentDocument);
                                setParent(parentDocument.Id);
                              }}
                            >
                              {parentDocument.DocName}
                            </button>
                          ))}
                        </div>
                      )}

                    {isEditingParent &&
                      !isSearchingParent &&
                      !selectedParent &&
                      parentSearch.trim() &&
                      parentDocuments.length === 0 && (
                        <div className={styles.noParentResults}>
                          No parent documents found.
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            <AppDropdown
              required
              label="Category"
              value={formData.docCategory}
              disabled={isViewMode}
              onChange={(value) => handleChangeInput("docCategory", value)}
              options={categoryOptions}
            />

            <AppTextarea
              label="Keywords"
              placeholder="Separate keywords with spaces."
              value={formData.docKeywords}
              disabled={isViewMode}
              onChange={(value) => handleChangeInput("docKeywords", value)}
            />
          </div>
          <div className={styles.actions}>
            {mode === "edit" && (
              <AppButton
                fullWidth
                text="Save Changes"
                disabled={isSaveDisabled}
                onClick={handleEditDocument}
              />
            )}

            <AppButton
              fullWidth
              text={isViewMode ? "Close" : "Cancel"}
              variant="secondary"
              onClick={onClose}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default EditAndViewDocumentForm;
