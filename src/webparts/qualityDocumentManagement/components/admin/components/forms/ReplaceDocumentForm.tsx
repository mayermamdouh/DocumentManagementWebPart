import React, { ChangeEvent, useState } from "react";
import { IReplaceFormProps } from "../../../../types/adminTypes";
import AppButton from "../../../common/AppButton/AppButton";
import styles from "./DocumentForm.module.scss";
import DocumentFileInput from "../DocumentFileInput/DocumentFileInput";
import { ReplaceDocument } from "../../../../services/AdminServices/FileActionsServices";
import { useSharePoint } from "../../../../contexts/SharePointContext";
import { useNotification } from "../../../../contexts/NotificationContext";
import AppLoading from "../../../common/AppLoading/Apploading";

const ReplaceDocumentForm = ({
  document,
  onClose,
  libraryName,
  onRefresh,
}: IReplaceFormProps) => {
  const { context , sp} = useSharePoint();
  const { setMessage, setError } = useNotification();
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

      onClose();
      await onRefresh();
      setMessage("Document replaced successfully.");
    } catch (error) {
      console.error("Failed to replace document:", error);
      setError(
        error instanceof Error ? error.message : "Failed to replace document.",
      );
    } finally {
      setLoading(false);
    }
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
        </>
      )}
    </div>
  );
};

export default ReplaceDocumentForm;
