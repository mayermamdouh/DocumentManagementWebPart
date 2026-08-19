import React, { useEffect, useMemo, useState } from "react";
import styles from "./DocumentTable.module.scss";

import {
  IDocumentTableProps,
  ILibraryDocument,
} from "../../../../types/adminTypes";
import { useAdminDocumentRows } from "../../hooks/useAdminDocumentRows";
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
  setDocuments,
  valueTypeFilter,
  activeDocumentId,
}: IDocumentTableProps) => {
  const rows = useAdminDocumentRows(documents);
  const [expandedDocuments, setExpandedDocuments] = useState<Set<number>>(
    new Set(),
  );

  const parentIds = useMemo(() => {
    return new Set(
      rows
        .map((row) => row.DocParent)
        .filter((parentId): parentId is number => !!parentId),
    );
  }, [rows]);

  const [selectedDocument, setSelectedDocument] =
    useState<ILibraryDocument | null>(null);

  const [popupType, setPopupType] = useState<AdminActionType | null>(null);

  useEffect(() => {
    if (activeDocumentId === null || activeDocumentId === undefined) {
      return;
    }

    const document = rows.find((item) => item.Id === activeDocumentId);
    if (!document) {
      return;
    }

    setSelectedDocument(document);
    setPopupType("versionHistory");
  }, [activeDocumentId, rows]);

  const visibleRows = useMemo(() => {
    const result = [];
    const collapsedIds = new Set<number>();

    for (const row of rows) {
      if (row.DocParent && collapsedIds.has(row.DocParent)) {
        collapsedIds.add(row.Id);
        continue;
      }

      result.push(row);

      if (parentIds.has(row.Id) && !expandedDocuments.has(row.Id)) {
        collapsedIds.add(row.Id);
      }
    }

    return result;
  }, [rows, parentIds, expandedDocuments]);

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
            setDocuments={setDocuments}
            document={selectedDocument}
            libraryName={libraryName}
            mode="view"
            onClose={handleClosePopup}
          />
        );

      case "edit":
        return (
          <EditAndViewDocumentForm
            setDocuments={setDocuments}
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
            onClose={handleClosePopup}
            setDocuments={setDocuments}
          />
        );

      case "versionHistory":
        return (
          <DocumentVersions
            serverRelativeUrl={selectedDocument.File.ServerRelativeUrl}
            isRejected={selectedDocument.OData__ModerationStatus === 1}
            setDocuments={setDocuments}
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
            setDocuments={setDocuments}
            libraryName={libraryName}
            documentId={selectedDocument.Id}
          />
        );

      default:
        return null;
    }
  };

  if (rows.length === 0) {
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

  const toggleDocument = (documentId: number): void => {
    setExpandedDocuments((currentExpanded) => {
      const nextExpanded = new Set(currentExpanded);

      if (nextExpanded.has(documentId)) {
        nextExpanded.delete(documentId);
      } else {
        nextExpanded.add(documentId);
      }

      return nextExpanded;
    });
  };

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Document Name</th>
              {valueTypeFilter === "Child" ? <th>Document Parent</th> : ""}
              <th>Status</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Category</th>
              <th>Department</th>
              <th>Owner</th>
              <th>Created By</th>
              <th>Created Date</th>
              <th className={styles.actionsHeader}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {(valueTypeFilter === "Child" ? documents : visibleRows).map(
              (document) => (
                <tr key={document.Id}>
                  <td>
                    <div
                      className={styles.documentTreeName}
                      style={{
                        paddingLeft: `${(document.level ?? 0) * 20}px`,
                      }}
                    >
                      {valueTypeFilter !== "Child" &&
                        parentIds.has(document.Id) && (
                          <button
                            type="button"
                            className={styles.expandButton}
                            onClick={() => toggleDocument(document.Id)}
                            aria-label={
                              expandedDocuments.has(document.Id)
                                ? "Collapse document"
                                : "Expand document"
                            }
                          >
                            {expandedDocuments.has(document.Id) ? "▼" : "▶"}
                          </button>
                        )}
                      {document.childrenCount}

                      <a
                        className={styles.fileLink}
                        href={`${document.File.ServerRelativeUrl}?web=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={document.File.Name}
                      >
                        {document.DocName}
                      </a>

                      <button
                        type="button"
                        className={styles.copyLinkButton}
                        onClick={() => {
                          const link = `${window.location.origin}${document.File.ServerRelativeUrl}`;
                          navigator.clipboard.writeText(link);
                        }}
                        title="Copy link"
                        aria-label={`Copy link for ${document.DocName}`}
                      >
                        🔗
                      </button>
                    </div>
                  </td>
                  {valueTypeFilter === "Child" ? (
                    <td className={styles.documentParentName}>
                      <span
                        className={styles.documentName}
                        title={document.DocParentName || "-"}
                      >
                        {document.DocParentName || "-"}
                      </span>
                    </td>
                  ) : (
                    ""
                  )}

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
                        ? new Date(document.Created).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "-"}
                    </span>
                  </td>

                  <td className={styles.actionsCell}>
                    <AdminActions
                      document={document}
                      onAction={(action) => handleAction(document, action)}
                    />
                  </td>
                </tr>
              ),
            )}
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
