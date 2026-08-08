import React from "react";
import styles from "./AppTextarea.module.scss";

interface IAppTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  fullWidth?: boolean;
}

const AppTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  required = false,
  error,
  fullWidth = true,
}: IAppTextareaProps): JSX.Element => {
  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ""}`}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && " *"}
        </label>
      )}

      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default AppTextarea;
