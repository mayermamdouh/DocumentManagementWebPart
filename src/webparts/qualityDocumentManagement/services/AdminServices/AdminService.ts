import { SPFI } from "@pnp/sp";

export const isCurrentUserSiteAdmin = async (sp: SPFI): Promise<boolean> => {
  const currentUser = await sp.web.currentUser();

  const ownersGroup = await sp.web.associatedOwnerGroup();

  const owners = await sp.web.siteGroups.getById(ownersGroup.Id).users();

  return owners.some((user) => user.Id === currentUser.Id);
};
