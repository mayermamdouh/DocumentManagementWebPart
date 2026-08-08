import React, { useCallback, useEffect, useState } from "react";

import styles from "./DocumentVersions.module.scss";
import { useSharePoint } from "../../../../../contexts/SharePointContext";
import {
  IDocumentVersionsProps,
  IFileVersion,
} from "../../../../../types/adminTypes";
import { GetFileVersions } from "../../../../../services/AdminServices/DocumentVersions";
import AppLoading from "../../../../common/AppLoading/Apploading";
import DocumentVersionsActions from "./components/DocumentVersionsActions/DocumentVersionsActions";

const DocumentVersions = ({
  serverRelativeUrl,
  onRefreshDocuments,
  isRejected,
}: IDocumentVersionsProps) => {
  const { sp } = useSharePoint();

  const [versions, setVersions] = useState<IFileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<IFileVersion | null>(
    null,
  );

  const loadVersions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await GetFileVersions(sp, serverRelativeUrl);
      setVersions(result);
    } catch (error) {
      console.error("Failed to load document versions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sp, serverRelativeUrl]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.stickyHeader}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Version History</h3>
            <p className={styles.subtitle}>
              All available versions of this document
            </p>
          </div>
          <div className={styles.versionCount}>
            {versions.length} {versions.length === 1 ? "Version" : "Versions"}
          </div>
        </div>

        {selectedVersion && (
          <DocumentVersionsActions
            isRejected={isRejected}
            versions={versions}
            selectedVersion={selectedVersion}
            serverRelativeUrl={serverRelativeUrl}
            onRefresh={loadVersions}
            onRefreshDocuments={onRefreshDocuments}
          />
        )}
      </div>

      {versions.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>No version history available</div>

          <div className={styles.emptyText}>
            This document does not have any previous versions.
          </div>
        </div>
      ) : (
        <div className={styles.versionList}>
          <div className={styles.versionsTableWrapper}>
            <table className={styles.versionsTable}>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Modified By</th>
                  <th>Modified Date</th>
                </tr>
              </thead>

              <tbody>
                {versions.map((version) => (
                  <tr
                    key={version.ID}
                    onClick={() => setSelectedVersion(version)}
                    className={`
                      ${version.IsCurrentVersion ? styles.currentVersion : ""}
                      ${
                        selectedVersion?.ID === version.ID
                          ? styles.selectedVersion
                          : ""
                      }
                    `}
                  >
                    <td>
                      <span className={styles.versionLabel}>
                        {version.VersionLabel}
                      </span>
                    </td>

                    <td>
                      <div className={styles.versionBadges}>
                        {version.IsCurrentVersion && (
                          <span className={styles.currentBadge}>Current</span>
                        )}

                        {version.IsApprovalVersion && (
                          <span className={styles.approvalBadge}>Approved</span>
                        )}
                      </div>
                    </td>

                    <td>{version.ModifiedBy?.Title || "-"}</td>

                    <td>
                      {version.Created
                        ? new Date(version.Created).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVersions;
