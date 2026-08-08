import * as React from "react";
import { ReactNode } from "react";
import styles from "./AppPopup.module.scss";

interface IAppPopupProps {
  Title: string;
  children: ReactNode;
  onClose?: () => void;
  headerContent?: ReactNode;
  scrollable?: boolean;
}

const AppPopup = ({
  Title,
  children,
  onClose,
  headerContent,
  scrollable,
}: IAppPopupProps): JSX.Element => {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.popupDiv}>
        <div className={styles.header}>
          <h2 className={styles.title}>{Title}</h2>

          {onClose && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
        {headerContent && (
          <div className={styles.headerContent}> {headerContent} </div>
        )}
        <div
          className={`${styles.content} ${scrollable === false ? styles.noScroll : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppPopup;
