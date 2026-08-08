import React, { useState } from "react";
import styles from "./DocumentTable.module.scss";

import {
  IDocumentTableProps,
  ILibraryDocument,
} from "../../../../types/adminTypes";

import AdminActions, { AdminActionType } from "../Actions/AdminActions";

import AppPopup from "../../../common/AppPopup/AppPopup";

import EditAndViewDocumentForm from "../forms/EditAndViewDocumentForm";
import ReplaceDocumentForm from "../forms/ReplaceDocumentForm";
import DocumentVersions from "../Actions/DocumentVersions/DocumentVersions";
import DocumentPermission from "../Actions/DocumentPermissions/DocumentPermission";
import DeleteDocument from "../DeleteDocument/DeleteDocument";

const DocumentTable = ({
  documents,
  libraryName,
  onRefresh,
}: IDocumentTableProps) => {
  const [selectedDocument, setSelectedDocument] =
    useState<ILibraryDocument | null>(null);

  const [popupType, setPopupType] = useState<AdminActionType | null>(null);

  const handleAction = (
    document: ILibraryDocument,
    action: AdminActionType,
  ) => {
    setSelectedDocument(document);
    setPopupType(action);
  };

  const handleClosePopup = () => {
    setPopupType(null);
    setSelectedDocument(null);
  };

  const getPopupTitle = () => {
    switch (popupType) {
      case "view":
        return "View Document";

      case "edit":
        return "Edit Document";

      case "replace":
        return "Replace Document";

      case "versionHistory":
        return "Versions History";

      case "Permissions":
        return "Document Permissions";

      case "DeleteDocument":
        return "Delete Document";
      default:
        return "";
    }
  };

  const renderPopupContent = () => {
    if (!popupType || !selectedDocument) {
      return null;
    }

    switch (popupType) {
      case "view":
        return (
          <EditAndViewDocumentForm
            onRefresh={onRefresh}
            document={selectedDocument}
            libraryName={libraryName}
            mode="view"
            onClose={handleClosePopup}
          />
        );

      case "edit":
        return (
          <EditAndViewDocumentForm
            onRefresh={onRefresh}
            document={selectedDocument}
            libraryName={libraryName}
            mode="edit"
            onClose={handleClosePopup}
          />
        );

      case "replace":
        return (
          <ReplaceDocumentForm
            document={selectedDocument}
            libraryName={libraryName}
            onClose={handleClosePopup}
            onRefresh={onRefresh}
          />
        );

      case "versionHistory":
        return (
          <DocumentVersions
            serverRelativeUrl={selectedDocument.File.ServerRelativeUrl}
            onRefreshDocuments={onRefresh}
            isRejected={selectedDocument.OData__ModerationStatus === 1}
          />
        );

      case "Permissions":
        return (
          <DocumentPermission
            onClose={handleClosePopup}
            libraryName={libraryName}
            documentId={selectedDocument.Id}
          />
        );
      case "DeleteDocument":
        return (
          <DeleteDocument
            onClose={handleClosePopup}
            onRefreshDocuments={onRefresh}
            libraryName={libraryName}
            documentId={selectedDocument.Id}
          />
        );

      default:
        return null;
    }
  };

  if (documents.length === 0) {
    return <div className={styles.emptyState}>No documents found.</div>;
  }

  const approvalStatusClass: Record<string, string> = {
    Approved: styles.approved,
    Draft: styles.draft,
    Pending: styles.pending,
    Rejected: styles.rejected,
    Scheduled: styles.scheduled,
    Unknown: styles.unknown,
  };

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Document Parent</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Category</th>
              <th>Department</th>
              <th>Owner</th>
              <th>Created By</th>
              <th>Created Date</th>
              <th>File</th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {documents.map((document: ILibraryDocument) => (
              <tr key={document.Id}>
                <td>
                  <span className={styles.documentName}>
                    {document.DocName}
                  </span>
                </td>

                <td>
                  <span className={styles.documentName}>
                    {document.DocParentName || "-"}
                  </span>
                </td>

                <td>
                  <span
                    className={`${styles.approvalStatus} ${
                      approvalStatusClass[document.ApprovalStatus] ??
                      styles.unknown
                    }`}
                  >
                    {document.ApprovalStatus}
                  </span>
                </td>

                <td>
                  <span className={styles.reference}>
                    {document.DocReference}
                  </span>
                </td>

                <td>
                  <span className={styles.type}>{document.DocType}</span>
                </td>

                <td>{document.DocCategory}</td>

                <td>{document.DocDepartment}</td>

                <td>
                  <span className={styles.owner}>
                    {document.DocOwner?.Title || "-"}
                  </span>
                </td>

                <td>
                  <span className={styles.owner}>
                    {document.Author?.Title || "-"}
                  </span>
                </td>

                <td>
                  <span className={styles.createdDate}>
                    {document.Created
                      ? new Date(document.Created).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </td>

                <td>
                  <a
                    className={styles.fileLink}
                    href={`${document.File.ServerRelativeUrl}?web=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={document.File.Name}
                  >
                    {document.File.Name}
                  </a>
                </td>

                <td className={styles.actionsCell}>
                  <AdminActions
                    document={document}
                    onAction={(action) => handleAction(document, action)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {popupType && selectedDocument && (
        <AppPopup Title={getPopupTitle()} onClose={handleClosePopup}>
          {renderPopupContent()}
        </AppPopup>
      )}
    </>
  );
};

export default DocumentTable;
