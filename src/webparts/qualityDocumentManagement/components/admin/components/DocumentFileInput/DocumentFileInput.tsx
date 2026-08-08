
import React, { ChangeEvent } from "react";
import styles from "./DocumentFileInput.module.scss";

interface IDocumentFileInputProps {
  file: File | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  errorMessage?: string;
}

const DocumentFileInput = ({
  file,
  onChange,
  errorMessage,
}: IDocumentFileInputProps) => {
  return (
    <div className={styles.fileInputWrapper}>
      <label
        className={`${styles.fileInputLabel} ${
          file ? styles.fileSelected : ""
        }`}
      >
        <span className={styles.fileInputText}>
          {file ? file.name : "Choose a document"}
        </span>

        <input
          type="file"
          className={styles.fileInput}
          onChange={onChange}
        />
      </label>

      {errorMessage && (
        <div className={styles.error}>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default DocumentFileInput;

