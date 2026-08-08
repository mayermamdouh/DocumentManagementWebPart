import * as React from "react";
import { ButtonHTMLAttributes } from "react";
import { Icon } from "@fluentui/react";
import styles from "./AppButton.module.scss";

interface IAppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  iconName?: string;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const AppButton = ({
  text,
  iconName,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  ...rest
}: IAppButtonProps): React.ReactElement => {
  return (
    <button
      className={`
        ${styles.button}
        ${styles[variant]}
        ${styles[size]}
        ${fullWidth ? styles.fullWidth : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        "Loading..."
      ) : (
        <>
          {iconName && <Icon iconName={iconName} className={styles.icon} />}
          <span>{text}</span>
        </>
      )}
    </button>
  );
};

export default AppButton;
