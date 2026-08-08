import React from "react";
import {
  IAdminActionsProps,
} from "../../../../types/adminTypes";
import styles from "./AdminActions.module.scss";

import {
  Eye24Regular,
  Edit24Regular,
  ArrowSwap24Regular,
  LockClosed24Regular,
  History24Regular,
  Delete12Regular,
} from "@fluentui/react-icons";

export type AdminActionType =
  | "view"
  | "edit"
  | "replace"
  | "versionHistory"
  | "DeleteDocument"
  | "Permissions";

const AdminActions = ({ document, onAction }: IAdminActionsProps) => {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.actionButton}
        title="View Document"
        aria-label={`View ${document.DocName}`}
        onClick={() => onAction("view")}
      >
        <Eye24Regular />
      </button>

      <button
        type="button"
        className={styles.actionButton}
        title="Edit Document"
        aria-label={`Edit ${document.DocName}`}
        onClick={() => onAction("edit")}
      >
        <Edit24Regular />
      </button>

      <button
        type="button"
        className={styles.actionButton}
        title="Replace Document"
        aria-label={`Replace ${document.DocName}`}
        onClick={() => onAction("replace")}
      >
        <ArrowSwap24Regular />
      </button>

      <button
        type="button"
        className={styles.actionButton}
        title="Document Permissions"
        aria-label={`Manage permissions for ${document.DocName}`}
        onClick={() => onAction("Permissions")}
      >
        <LockClosed24Regular />
      </button>

      <button
        type="button"
        className={styles.actionButton}
        title="Version History"
        aria-label={`View version history for ${document.DocName}`}
        onClick={() => onAction("versionHistory")}
      >
        <History24Regular />
      </button>

      <button
        type="button"
        className={styles.actionButton}
        title="Delete Document"
        aria-label={`Delete ${document.DocName}`}
        onClick={() => onAction("DeleteDocument")}
      >
        <Delete12Regular />
      </button>
    </div>
  );
};

export default AdminActions;
