import React, { useState } from "react";
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
import { IDocumentForm } from "../../../../types/adminTypes";
import { useSharePoint } from "../../../../contexts/SharePointContext";
import { useNotification } from "../../../../contexts/NotificationContext";
import { useAddDocumentForm } from "../AddNewDocument/hooks/useAddDocumentForm";
import { useAddDocumentActions } from "../AddNewDocument/hooks/useAddDocumentActions";
import { useParentDocumentSearch } from "../AddNewDocument/hooks/useParentDocumentSearch";
import DocumentFileInput from "../DocumentFileInput/DocumentFileInput";
import {
  getFileExtension,
  getFileNameWithoutExtension,
} from "../../../../utils/fileUtils";

const AddDocumentForm = ({
  onCancel,
  onDocumentCreated,
  libraryName,
  setDocuments,
}: IDocumentForm) => {
  const { sp, context } = useSharePoint();
  const { setMessage } = useNotification();
  const [publishAndApprove, setPublishAndApprove] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [messageError, setMessageError] = useState("");
  const {
    formData,
    isChildDocument,
    isValidDocumentReference,
    fileNameExists,
    docReferenceExists,
    isValidating,
    isSaveDisabled,
    categoryOptions,
    handleChangeInput,
    handleChangeFile,
    handleDocumentTypeChange,
    handleOwnerChange,
    setParent,
  } = useAddDocumentForm({ libraryName });

  const { saveDraft, saveAndPublish } = useAddDocumentActions({
    sp,
    libraryName,
    setDocuments,
  });

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
    enabled: isChildDocument,
  });

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const document = await saveDraft(formData);
      setMessage("Document saved as draft successfully.");
      onDocumentCreated(document.Id);
    } catch (error) {
      console.error("Failed to save document as draft:", error);
      setMessageError(
        error instanceof Error
          ? error.message
          : "Failed to save the document as draft.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSavePublish = async () => {
    try {
      setLoading(true);
      const document = await saveAndPublish(formData);
      setMessage("Document published successfully.");
      onDocumentCreated(document.Id);
    } catch (error) {
      console.error("Failed to save and publish document:", error);
      setMessageError(
        error instanceof Error
          ? error.message
          : "Failed to publish the document.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fileExtension = formData.file?.name.match(/\.[^/.]+$/)?.[0] ?? "";

  return (
    <div className={styles.form}>
      {loading ? (
        <AppLoading />
      ) : (
        <>
          <div className={styles.formContent}>
            <DocumentFileInput
              file={formData.file}
              onChange={handleChangeFile}
            />

            <div className={styles.inputs}>
              <AppInput
                label="Document Name"
                required
                value={getFileNameWithoutExtension(formData.docName)}
                suffix={getFileExtension(formData.docName)}
                onChange={(value) => {
                  handleChangeInput(
                    "docName",
                    `${value}${getFileExtension(formData.docName)}`,
                  );
                }}
                helperText="Document Name must be unique within this library."
                errorMessage={
                  fileNameExists
                    ? "A file with this name already exists."
                    : undefined
                }
              />

              <AppInput
                label="Document Reference"
                required
                placeholder="e.g. PO-CPM-001"
                value={formData.docReference}
                onChange={(value) => handleChangeInput("docReference", value)}
                helperText="Document Reference must be unique within this library."
                errorMessage={
                  formData.docReference.trim() && !isValidDocumentReference
                    ? "Document Reference must follow the format: PO-CPM-001"
                    : docReferenceExists
                      ? "A document with this reference already exists"
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
                onChange={handleOwnerChange}
              />

              <AppInput
                label="Department"
                required
                value={formData.docDepartment}
                onChange={(value) => handleChangeInput("docDepartment", value)}
              />

              <AppDropdown
                required
                label="Document Type"
                value={formData.docType}
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
                  <AppInput
                    label="Parent Document"
                    required
                    placeholder="Search for parent document..."
                    value={parentSearch}
                    onChange={setParentSearch}
                  />

                  {isSearchingParent && <AppLoading />}

                  {!isSearchingParent &&
                    !selectedParent &&
                    parentSearch.trim() &&
                    parentDocuments.length > 0 && (
                      <div className={styles.parentResults}>
                        {parentDocuments.map((document) => (
                          <button
                            type="button"
                            key={document.Id}
                            className={styles.parentResultItem}
                            onClick={() => {
                              selectParent(document);

                              setParent(document.Id);
                            }}
                          >
                            {document.FileLeafRef}
                          </button>
                        ))}
                      </div>
                    )}

                  {!isSearchingParent &&
                    !selectedParent &&
                    parentSearch.trim() &&
                    parentDocuments.length === 0 && (
                      <div className={styles.noParentResults}>
                        No parent documents found.
                      </div>
                    )}
                </div>
              )}

              <AppDropdown
                required
                label="Category"
                value={formData.docCategory}
                onChange={(value) => handleChangeInput("docCategory", value)}
                options={categoryOptions}
              />

              <AppTextarea
                label="Keywords"
                placeholder="Separate keywords with spaces."
                value={formData.docKeywords}
                onChange={(value) => handleChangeInput("docKeywords", value)}
              />
            </div>
          </div>

          <div className={styles.addNewDocButtons}>
            {messageError && (
              <span className={styles.error}>{messageError}</span>
            )}

            <div className={styles.publishOption}>
              <label>
                <input
                  type="checkbox"
                  checked={publishAndApprove}
                  onChange={(event) =>
                    setPublishAndApprove(event.target.checked)
                  }
                />

                <span>Publish and Approve</span>
              </label>
            </div>

            <div className={styles.buttons}>
              <AppButton
                fullWidth
                text={
                  publishAndApprove
                    ? "Publish & Approve"
                    : "Upload and Configure Permissions"
                }
                disabled={isSaveDisabled}
                onClick={
                  publishAndApprove ? handleSavePublish : handleSaveDraft
                }
              />

              <AppButton
                fullWidth
                text="Cancel"
                variant="secondary"
                onClick={onCancel}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddDocumentForm;
