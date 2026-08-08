import { SPFI } from "@pnp/sp";
import { ICurrentFile, IFileVersion } from "../../types/adminTypes";

export const GetFileVersions = async (
  sp: SPFI,
  serverRelativeUrl: string,
): Promise<IFileVersion[]> => {
  const file = sp.web.getFileByServerRelativePath(serverRelativeUrl);

  const [versions, lastFile] = await Promise.all([
    file.versions
      .select(
        "ID",
        "VersionLabel",
        "Created",
        "IsCurrentVersion",
        "CreatedBy/Title",
      )
      .expand("CreatedBy")(),

    file
      .select(
        "Name",
        "TimeLastModified",
        "MajorVersion",
        "MinorVersion",
        "ModifiedBy/Title",
      )
      .expand("ModifiedBy")() as Promise<ICurrentFile>,
  ]);

  const lastVersionLabel = `${lastFile.MajorVersion}.${lastFile.MinorVersion}`;
  const [, minor] = lastVersionLabel.split(".").map(Number);

  const lastVersion: IFileVersion = {
    ID: 0,
    VersionLabel: `${lastFile.MajorVersion}.${lastFile.MinorVersion}`,
    Created: lastFile.TimeLastModified,
    ModifiedBy: {
      Title: lastFile.ModifiedBy?.Title,
    },
    IsCurrentVersion: true,
    IsApprovalVersion: minor === 0,
  };

  const historicalVersions: IFileVersion[] = versions
    .map((version) => ({
      ID: version.ID,
      VersionLabel: version.VersionLabel,
      Created: version.Created,
      ModifiedBy: {
        Title: version.CreatedBy?.Title,
      },

      IsApprovalVersion: version.IsCurrentVersion,
    }))
    .sort((a, b) => parseFloat(b.VersionLabel) - parseFloat(a.VersionLabel));

  return [
    lastVersion,
    ...historicalVersions.filter(
      (version) => version.VersionLabel !== lastVersion.VersionLabel,
    ),
  ];
};

export const ApproveAndPublishVersion = async (
  sp: SPFI,
  serverRelativeUrl: string,
) => {
  const file = sp.web.getFileByServerRelativePath(serverRelativeUrl);
  await file.approve();
};

export const DeleteVersion = async (
  sp: SPFI,
  serverRelativeUrl: string,
  versionId: number,
): Promise<void> => {
  const file = sp.web.getFileByServerRelativePath(serverRelativeUrl);

  await file.versions.getById(versionId).delete();
};

export const RestoreVersion = async (
  sp: SPFI,
  serverRelativeUrl: string,
  versionLabel: string,
): Promise<void> => {
  if (!serverRelativeUrl || !versionLabel) {
    throw new Error("File path and version Label are required.");
  }

  const file = sp.web.getFileByServerRelativePath(serverRelativeUrl);
  await file.versions.restoreByLabel(versionLabel);
};

export const RejectFileVersion = async (
  sp: SPFI,
  serverRelativeUrl: string,
  versionId: number,
): Promise<void> => {
  if (!serverRelativeUrl || versionId == null) {
    throw new Error("File path and version ID are required.");
  }

  const file = sp.web.getFileByServerRelativePath(serverRelativeUrl);
  await file.deny();
};
