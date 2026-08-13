import React, { ChangeEvent, useState } from "react";
import { IReplaceFormProps } from "../../../../types/adminTypes";
import AppButton from "../../../common/AppButton/AppButton";
import styles from "./DocumentForm.module.scss";
import DocumentFileInput from "../DocumentFileInput/DocumentFileInput";
import { ReplaceDocument } from "../../../../services/AdminServices/FileActionsServices";
import { useSharePoint } from "../../../../contexts/SharePointContext";
import { useNotification } from "../../../../contexts/NotificationContext";
import AppLoading from "../../../common/AppLoading/Apploading";
import AppToast from "../../../common/AppToast/AppToast";

const ReplaceDocumentForm = ({
  document,
  onClose,
  setDocuments,
}: IReplaceFormProps) => {
  const { sp } = useSharePoint();
  const { setMessage } = useNotification();
  const [error, setError] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const handleChangeFile = (event: ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0] ?? null;

    setFileError(undefined);

    if (!newFile) {
      setFile(null);
      return;
    }

    const oldExtension = document.File.Name.split(".").pop()?.toLowerCase();
    const newExtension = newFile.name.split(".").pop()?.toLowerCase();

    if (!oldExtension || !newExtension) {
      setFile(null);
      setFileError("Unable to determine the file type.");
      return;
    }

    if (oldExtension !== newExtension) {
      setFile(null);
      setFileError(
        `The replacement file must have the same file type: ${oldExtension.toUpperCase()}.`,
      );
      return;
    }

    setFile(newFile);
  };

  const handleReplace = async () => {
    if (!file) {
      return;
    }

    try {
      setLoading(true);

      await ReplaceDocument(sp, document.File, file);

      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) =>
          doc.Id === document.Id
            ? {
                ...doc,
                File: {
                  ...doc.File,
                  Name: doc.File.Name,
                  ServerRelativeUrl: doc.File.ServerRelativeUrl,
                },
              }
            : doc,
        ),
      );

      setMessage("Document replaced successfully.");
      onClose();
    } catch (error) {
      console.error("Failed to replace document:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("[423]") ||
        errorMessage.toLowerCase().includes("locked for shared use")
      ) {
        setError(
          "This document is currently locked because it is open or being edited by another user. Please close the document and try again.",
        );
      } else {
        setError(errorMessage || "Failed to replace document.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError("");
  };

  return (
    <div className={styles.form}>
      {loading ? (
        <AppLoading />
      ) : (
        <>
          {" "}
          <DocumentFileInput
            file={file}
            onChange={handleChangeFile}
            errorMessage={fileError}
          />
          <div className={styles.actions}>
            {error && (
              <AppToast message={error} onClose={clearError} type="error" />
            )}
            <div className={styles.flexColumn}>
              <AppButton
                fullWidth
                text="Replace Document"
                disabled={!file || !!fileError}
                onClick={handleReplace}
              />

              <AppButton
                fullWidth
                text="Cancel"
                variant="secondary"
                onClick={onClose}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReplaceDocumentForm;
