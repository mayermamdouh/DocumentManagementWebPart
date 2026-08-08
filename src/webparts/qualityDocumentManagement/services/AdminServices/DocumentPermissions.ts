import { SPFI } from "@pnp/sp";
import { IPermissionEntry } from "../../types/adminTypes";

export const getPrincipalTypeName = (id: number): string => {
  switch (id) {
    case 1:
      return "User";

    case 2:
      return "DistributionList";

    case 4:
      return "SecurityGroup";

    case 8:
      return "SharePointGroup";

    default:
      return "Unknown";
  }
};

export const getDocumentPermissions = async (
  sp: SPFI,
  libraryName: string,
  itemId: number,
): Promise<IPermissionEntry[]> => {
  const roleAssignments = await sp.web.lists
    .getByTitle(libraryName)
    .items.getById(itemId)
    .roleAssignments.expand("Member", "RoleDefinitionBindings")
    .select(
      "Member/Id",
      "Member/Title",
      "Member/LoginName",
      "Member/PrincipalType",
      "RoleDefinitionBindings/Name",
    )();

  return roleAssignments.map((roleAssignment: any) => ({
    id: roleAssignment.Member.Id,
    title: roleAssignment.Member.Title,
    loginName: roleAssignment.Member.LoginName,
    principalType: getPrincipalTypeName(roleAssignment.Member.PrincipalType),
    permissions:
      roleAssignment.RoleDefinitionBindings?.map((role: any) => role.Name) ??
      [],
  }));
};

export const getPrincipalType = async (
  sp: SPFI,
  loginName: string,
): Promise<number | null> => {
  const users = await sp.web.siteUsers
    .filter(`LoginName eq '${loginName}'`)
    .select("PrincipalType")();

  return users.length ? users[0].PrincipalType : null;
};

export const updateDocumentPermissions = async (
  sp: SPFI,
  libraryName: string,
  documentId: number,
  addedPermissions: IPermissionEntry[],
  removedPermissions: IPermissionEntry[],
): Promise<void> => {
  if (!addedPermissions.length && !removedPermissions.length) {
    return;
  }

  try {
    const item = sp.web.lists.getByTitle(libraryName).items.getById(documentId);
    await item.breakRoleInheritance(true);

    const roleDefinitions = await sp.web.roleDefinitions();

    const readRoleDefinitionId = roleDefinitions.find(
      (role) => role.Name === "Read",
    )?.Id;

    if (!readRoleDefinitionId) {
      throw new Error("Read role definition was not found.");
    }

    await Promise.all([
      ...addedPermissions.map((permission) => {
        return item.roleAssignments.add(permission.id, readRoleDefinitionId);
      }),

      ...removedPermissions.map((permission) => {
        return item.roleAssignments.remove(permission.id, readRoleDefinitionId);
      }),
    ]);
  } catch (error) {
    console.error("Failed to update document permissions:", error);

    throw new Error("Failed to update document permissions. Please try again.");
  }
};
