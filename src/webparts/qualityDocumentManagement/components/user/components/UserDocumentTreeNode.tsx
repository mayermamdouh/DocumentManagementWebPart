import React, { useState } from "react";
import styles from "./UserDocumentTree.module.scss";
import { IUserDocumentTreeNodeProps } from "../../../types/userTypes";

const UserDocumentTreeNode = ({ document }: IUserDocumentTreeNodeProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = document.children.length > 0;

  const getFileIcon = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📕";
      case "doc":
      case "docx":
        return "📘";
      case "xls":
      case "xlsx":
      case "csv":
        return "📗";
      case "ppt":
      case "pptx":
        return "📙";
      case "txt":
        return "📄";
      default:
        return "📄";
    }
  };
  return (
    <div className={styles.node}>
      <div className={styles.row}>
        {hasChildren ? (
          <button
            type="button"
            className={styles.expandButton}
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Collapse document" : "Expand document"}
          >
            {expanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className={styles.expandPlaceholder} />
        )}

        <span className={styles.fileIcon}>
          {getFileIcon(
            document.hasAccess && document.File
              ? document.File.Name
              : document.DocName,
          )}
        </span>

        {document.hasAccess && document.File ? (
          <a
            href={`${document.File.ServerRelativeUrl}?web=1`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fileLink}
            onClick={(event) => event.stopPropagation()}
          >
            {document.File.Name}
          </a>
        ) : (
          <span className={styles.fileName}>{document.DocName}</span>
        )}
      </div>

      {expanded && hasChildren && (
        <div className={styles.children}>
          {document.children.map((child) => (
            <UserDocumentTreeNode key={child.Id} document={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserDocumentTreeNode;
