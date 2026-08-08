import * as React from "react";
import AppButton from "../AppButton/AppButton";
import styles from "./AppDialog.module.scss";

export interface IAppDialogProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  showFooter?: boolean;
  closeOnOverlayClick?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const AppDialog = ({
  isOpen,
  title,
  children,
  confirmText = "Save",
  cancelText = "Cancel",
  showFooter = true,
  closeOnOverlayClick = true,
  loading = false,
  onConfirm,
  onCancel,
}: IAppDialogProps): React.ReactElement | null => {
  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onCancel?.();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className={styles.header}>
            <h3>{title}</h3>
          </div>
        )}

        <div className={styles.body}>{children}</div>

        {showFooter && (
          <div className={styles.footer}>
            <AppButton
              variant="secondary"
              text={cancelText}
              onClick={onCancel}
            />

            <AppButton
              variant="primary"
              text={confirmText}
              loading={loading}
              onClick={onConfirm}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AppDialog;
