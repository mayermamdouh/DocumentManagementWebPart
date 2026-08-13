import { useState } from "react";
import { useSharePoint } from "../../../../../contexts/SharePointContext";
import {
  ApproveAndPublishVersion,
  DeleteVersion,
  RejectFileVersion,
  RestoreVersion,
} from "../../../../../services/AdminServices/DocumentVersions";
import {
  IFileVersion,
  ILibraryDocument,
} from "../../../../../types/adminTypes";
import { getApprovalStatusText } from "../../../../../services/AdminServices/DocumentService";

interface IUseDocumentVersionsActions {
  loading: boolean;
  canApprove: boolean;
  canReject: boolean;
  canDelete: boolean;
  canRestore: boolean;
  versionsMessage: string | null;
  handleAction: (
    value: "approve" | "reject" | "delete" | "restore",
  ) => Promise<void>;
}

export const useDocumentVersionsActions = (
  setDocuments: React.Dispatch<React.SetStateAction<ILibraryDocument[]>>,
  isRejected: boolean,
  serverRelativeUrl: string,
  onRefreshVersions: () => Promise<void>,
  selectedVersion?: IFileVersion | null,
  versions: IFileVersion[] = [],
): IUseDocumentVersionsActions => {
  const { sp } = useSharePoint();

  const [loading, setLoading] = useState<boolean>(false);
  const [versionsMessage, setVersionsMessage] = useState<string | null>(null);

  const handleAction = async (
    action: "approve" | "reject" | "delete" | "restore",
  ): Promise<void> => {
    if (!selectedVersion || loading) {
      return;
    }

    setVersionsMessage(null);
    setLoading(true);

    try {
      switch (action) {
        case "approve":
          await ApproveAndPublishVersion(sp, serverRelativeUrl);
          setDocuments((prevDocuments) =>
            prevDocuments.map((doc) =>
              doc.File.ServerRelativeUrl === serverRelativeUrl
                ? {
                    ...doc,
                    OData__ModerationStatus: 0,
                    ApprovalStatus: getApprovalStatusText(0),
                  }
                : doc,
            ),
          );
          setVersionsMessage("Version approved and published successfully.");
          await onRefreshVersions?.();
          break;

        case "reject":
          await RejectFileVersion(sp, serverRelativeUrl, selectedVersion.ID);
          setDocuments((prevDocuments) =>
            prevDocuments.map((doc) =>
              doc.File.ServerRelativeUrl === serverRelativeUrl
                ? {
                    ...doc,
                    OData__ModerationStatus: 1,
                    ApprovalStatus: getApprovalStatusText(1),
                  }
                : doc,
            ),
          );
          setVersionsMessage("Version rejected successfully.");
          await onRefreshVersions?.();
          break;

        case "delete":
          await DeleteVersion(sp, serverRelativeUrl, selectedVersion.ID);
          setVersionsMessage("Version deleted successfully.");
          await onRefreshVersions?.();
          break;

        case "restore":
          await RestoreVersion(
            sp,
            serverRelativeUrl,
            selectedVersion.VersionLabel,
          );
          setDocuments((prevDocuments) =>
            prevDocuments.map((doc) =>
              doc.File.ServerRelativeUrl === serverRelativeUrl
                ? {
                    ...doc,
                    OData__ModerationStatus: 3,
                    ApprovalStatus: getApprovalStatusText(3),
                  }
                : doc,
            ),
          );
          setVersionsMessage("Version restored successfully.");
          await onRefreshVersions?.();
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} version:`, error);

      setVersionsMessage(`Failed to ${action} version.`);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedVersion) {
    return {
      loading,
      canApprove: false,
      canReject: false,
      canDelete: false,
      canRestore: false,
      versionsMessage,
      handleAction,
    };
  }

  const [, minor] = selectedVersion.VersionLabel.split(".").map(Number);

  const isDraft = minor > 0;

  const isCurrentVersion = selectedVersion.IsCurrentVersion === true;

  const latestDraft = versions
    .filter((version) => {
      const [, versionMinor] = version.VersionLabel.split(".").map(Number);

      return versionMinor > 0;
    })
    .sort((a, b) => {
      const [aMajor, aMinor] = a.VersionLabel.split(".").map(Number);

      const [bMajor, bMinor] = b.VersionLabel.split(".").map(Number);

      return bMajor - aMajor || bMinor - aMinor;
    })[0];

  const isLatestDraft = selectedVersion.ID === latestDraft?.ID;

  const latestApprovalVersion = versions
    .filter((version) => version.IsApprovalVersion === true)
    .sort((a, b) => {
      const [aMajor, aMinor] = a.VersionLabel.split(".").map(Number);

      const [bMajor, bMinor] = b.VersionLabel.split(".").map(Number);

      return bMajor - aMajor || bMinor - aMinor;
    })[0];

  const isLatestApprovalVersion =
    selectedVersion.ID === latestApprovalVersion?.ID;

  const canApprove = isDraft && isLatestDraft;

  const canReject = isDraft && isLatestDraft && !isRejected;

  const canDelete = !isCurrentVersion && !isLatestApprovalVersion;

  const canRestore = !isCurrentVersion;

  return {
    loading,
    canApprove,
    canReject,
    canDelete,
    canRestore,
    versionsMessage,
    handleAction,
  };
};
