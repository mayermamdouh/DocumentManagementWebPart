import React, { useEffect } from "react";
import styles from "./AppToast.module.scss";

export type ToastType = "success" | "error" | "warning" | "info";

export interface IAppToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
  duration?: number;
}

const AppToast = ({
  message,
  type = "info",
  onClose,
  duration = 8000,
}: IAppToastProps) => {
  useEffect(() => {
    if (!onClose || duration <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [onClose, duration]);

  return (
    <div
      className={`${styles.toast} ${styles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.message}>{message}</span>

      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default AppToast;
