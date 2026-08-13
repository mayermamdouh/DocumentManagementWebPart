import { InputHTMLAttributes } from "react";
import * as React from "react";
import styles from "./AppInput.module.scss";

interface IAppInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "onChange"
> {
  label?: string;
  errorMessage?: string;
  helperText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onChange?: (value: string) => void;
  suffix?: React.ReactNode;
}

const AppInput = ({
  label,
  errorMessage,
  helperText,
  fullWidth = true,
  startIcon,
  endIcon,
  onChange,
  suffix,
  className = "",
  required,
  ...rest
}: IAppInputProps): React.ReactElement => {
  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ""}`}>
      {label && (
        <label className={styles.label}>
          {label}

          {required && <span className={styles.required}> *</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {startIcon && <span className={styles.icon}>{startIcon}</span>}

        <input
          className={`${styles.input} ${className}`}
          {...rest}
          onChange={(e) => onChange?.(e.target.value)}
        />

        {suffix && <span className={styles.suffix}>{suffix}</span>}

        {endIcon && <span className={styles.icon}>{endIcon}</span>}
      </div>

      {helperText && !errorMessage && (
        <small className={styles.helper}>{helperText}</small>
      )}

      {errorMessage && (
        <small className={styles.error}>{errorMessage || "\u00A0"}</small>
      )}
    </div>
  );
};

export default AppInput;
