import React from "react";
import { IDocumentVersionsActions } from "../../../../../../../types/adminTypes";
import styles from "./DocumentVersionsActions.module.scss";
import AppButton from "../../../../../../common/AppButton/AppButton";
import { useDocumentVersionsActions } from "../../../hooks/useDocumentVersionsActions";
import AppToast from "../../../../../../common/AppToast/AppToast";
import AppLoading from "../../../../../../common/AppLoading/Apploading";

const DocumentVersionsActions = ({
  isRejected,
  selectedVersion,
  versions,
  serverRelativeUrl,
  onRefresh,
  onRefreshDocuments,
}: IDocumentVersionsActions) => {

  const {
    loading,
    canApprove,
    canReject,
    canDelete,
    canRestore,
    versionsMessage,
    handleAction,
  } = useDocumentVersionsActions(
    isRejected,
    serverRelativeUrl,
    onRefresh,
    onRefreshDocuments,
    selectedVersion,
    versions,
  );

  return (
    <div className={styles.versionContainer}>
      {versionsMessage && <AppToast message={versionsMessage} type="success" />}
      {loading && <AppLoading />}
      <div className={styles.versionsActions}>
        {canApprove && (
          <AppButton
            variant="success"
            text="Approve & Publish"
            fullWidth={true}
            onClick={() => handleAction("approve")}
          />
        )}

        {canReject && (
          <AppButton
            text="Reject"
            variant="danger"
            fullWidth={true}
            onClick={() => handleAction("reject")}
          />
        )}

        {canRestore && (
          <AppButton
            text="Restore"
            variant="success"
            fullWidth={true}
            onClick={() => handleAction("restore")}
          />
        )}
        {canDelete && (
          <AppButton
            text="Delete"
            variant="danger"
            fullWidth={true}
            onClick={() => handleAction("delete")}
          />
        )}
      </div>
    </div>
  );
};

export default DocumentVersionsActions;
