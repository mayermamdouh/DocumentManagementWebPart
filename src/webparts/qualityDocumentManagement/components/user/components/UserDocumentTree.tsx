import React from "react";
import styles from "./UserDocumentTree.module.scss";
import { IUserDocumentTreeProps } from "../../../types/userTypes";
import { useDocumentTree } from "../hooks/useDocumentTree";
import UserDocumentTreeNode from "./UserDocumentTreeNode";
import { useVisibleDocumentTree } from "../hooks/useVisibleDocumentTree";

const UserDocumentTree = ({ documents }: IUserDocumentTreeProps) => {
  const tree = useDocumentTree(documents);
  const visibleTree = useVisibleDocumentTree(tree);
  return (
    <div className={styles.tree}>
      {visibleTree.length > 0 ? (
        visibleTree.map((document) => (
          <UserDocumentTreeNode key={document.Id} document={document} />
        ))
      ) : (
        <div className={styles.noDocuments}>No documents found.</div>
      )}
    </div>
  );
};

export default UserDocumentTree;
