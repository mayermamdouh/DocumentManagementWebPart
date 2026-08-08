import * as React from "react";
import styles from "./AppDropdown.module.scss";
import { SelectHTMLAttributes } from "react";

interface IAppDropdownOption {
  key: string | number;
  text: string;
}

interface IAppDropdownProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  label?: string;
  placeholder?: string;
  options: IAppDropdownOption[];
  value?: string | number;
  errorMessage?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
}

const AppDropdown = ({
  label,
  placeholder = "Select...",
  options,
  value,
  errorMessage,
  fullWidth = true,
  className = "",
  onChange,
  required,
  ...rest
}: IAppDropdownProps): React.ReactElement => {
  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ""}`}>
      {label && (
        <label className={styles.label}>
          {label}

          {required && <span className={styles.required}> *</span>}
        </label>
      )}

      <select
        className={`${styles.dropdown} ${className}`}
        value={value ?? ""}
        onChange={(e) => {
          onChange?.(e.target.value);
        }}
        {...rest}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.key} value={option.text}>
            {option.text}
          </option>
        ))}
      </select>

      {errorMessage && <span className={styles.error}>{errorMessage}</span>}
    </div>
  );
};

export default AppDropdown;
