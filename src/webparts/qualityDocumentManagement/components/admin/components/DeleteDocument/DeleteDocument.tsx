import React, { useEffect, useState } from "react";
import {
  IDocumentChildrenInfo,
  IDocumentDeleteProps,
} from "../../../../types/adminTypes";
import { useSharePoint } from "../../../../contexts/SharePointContext";
import {
  checkDocumentHasChildren,
  DeleteDocuments,
} from "../../../../services/AdminServices/FileActionsServices";
import AppLoading from "../../../common/AppLoading/Apploading";
import styles from "./DeleteDocument.module.scss";
import AppButton from "../../../common/AppButton/AppButton";
import { useNotification } from "../../../../contexts/NotificationContext";

const DeleteDocument = ({
  documentId,
  libraryName,
  onClose,
  onRefreshDocuments,
}: IDocumentDeleteProps) => {
  const { sp } = useSharePoint();
  const { setMessage } = useNotification();
  const [childrenInfo, setChildrenInfo] =
    useState<IDocumentChildrenInfo | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const result = await checkDocumentHasChildren(
          sp,
          libraryName,
          documentId,
        );
        setChildrenInfo(result);
      } finally {
        setLoading(false);
      }
    };

    void loadChildren();
  }, [libraryName, documentId]);

  const handleDeleteDocuments = async () => {
    try {
      setLoading(true);
      const childrensIds = childrenInfo?.children.map((item) => item.id) ?? [];
      const ids = [documentId, ...childrensIds];

      await DeleteDocuments(sp, libraryName, ids);
      await onRefreshDocuments();
      setMessage(
        "The document and all related child documents were deleted successfully.",
      );
    } catch (error) {
      console.error("Error in deleating documents", error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div>
      {loading ? (
        <AppLoading />
      ) : (
        <div className={styles.container}>
          <p className={styles.message}>
            {childrenInfo?.childrenCount
              ? `This document has ${childrenInfo.childrenCount} child document(s). Deleting this document will also delete the following document(s):`
              : "Are you sure you want to delete this document?"}
          </p>
          {childrenInfo && childrenInfo.childrenCount > 0 && (
            <div className={styles.childrenList}>
              {childrenInfo.children.map((child) => (
                <div key={child.id} className={styles.childItem}>
                  {child.name}
                </div>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <AppButton
              fullWidth={true}
              variant="primary"
              text="Confirm"
              onClick={handleDeleteDocuments}
            />
            <AppButton
              fullWidth={true}
              variant="secondary"
              text="Cancel"
              onClick={onClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteDocument;
