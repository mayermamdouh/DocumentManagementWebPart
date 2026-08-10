import { SPFI } from "@pnp/sp";

import {
  DOCUMENT_COLUMNS,
  DOCUMENT_RELATION_COLUMNS,
} from "../../constants/columns";

export const ensureDocumentLibraryColumns = async (
  sp: SPFI,
  libraryId: string,
): Promise<void> => {
  const library = sp.web.lists.getById(libraryId);

  const fields = await library.fields.select("InternalName")();

  const existingColumns = fields.map((field) => field.InternalName);

  const promises: Promise<any>[] = [];

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.DOCUMENT_REFERENCE) === -1) {
    promises.push(
      library.fields.addText(DOCUMENT_COLUMNS.DOCUMENT_REFERENCE, {
        MaxLength: 255,
      }),
    );
  }

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.DOCUMENT_NAME) === -1) {
    promises.push(
      library.fields.addText(DOCUMENT_COLUMNS.DOCUMENT_NAME, {
        MaxLength: 255,
      }),
    );
  }

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.DOCUMENT_TYPE) === -1) {
    promises.push(
      library.fields.addChoice(DOCUMENT_COLUMNS.DOCUMENT_TYPE, {
        Choices: ["Parent", "Child"],
      }),
    );
  }

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.PARENT_DOCUMENT) === -1) {
    promises.push(library.fields.addNumber(DOCUMENT_COLUMNS.PARENT_DOCUMENT));
  }

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.CATEGORY) === -1) {
    promises.push(
      library.fields.addText(DOCUMENT_COLUMNS.CATEGORY, {
        MaxLength: 255,
      }),
    );
  }

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.DEPARTMENT) === -1) {
    promises.push(
      library.fields.addText(DOCUMENT_COLUMNS.DEPARTMENT, {
        MaxLength: 255,
      }),
    );
  }

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.KEYWORDS) === -1) {
    promises.push(
      library.fields.addMultilineText(DOCUMENT_COLUMNS.KEYWORDS, {
        NumberOfLines: 6,
        RichText: false,
      }),
    );
  }

  if (existingColumns.indexOf(DOCUMENT_COLUMNS.OWNER) === -1) {
    promises.push(library.fields.addUser(DOCUMENT_COLUMNS.OWNER));
  }

  await Promise.all(promises);
};

export const ensureDocumentLibraryVersioning = async (
  sp: SPFI,
  libraryId: string,
): Promise<void> => {
  const library = sp.web.lists.getById(libraryId);

  await library.update({
    EnableVersioning: true,
    EnableMinorVersions: true,
    EnableModeration: true,
  });
};

export const ensureDocumentLibraryAdministrators = async (
  sp: SPFI,
  libraryId: string,
  administrators: string[],
  previousAdministrators: string[],
): Promise<void> => {
  const library = sp.web.lists.getById(libraryId);

  const listInfo = (await library.select(
    "HasUniqueRoleAssignments",
    "Title",
  )()) as unknown as {
    HasUniqueRoleAssignments: boolean;
    Title: string;
  };

  if (!listInfo.HasUniqueRoleAssignments) {
    await library.breakRoleInheritance(true, false);
  }

  const webInfo = await sp.web.select("Title")();

  const siteName = webInfo.Title;

  const membersGroupTitle = `${siteName} Members`;
  const visitorsGroupTitle = `${siteName} Visitors`;

  const fullControlRole =
    await sp.web.roleDefinitions.getByName("Full Control")();

  const readRole = await sp.web.roleDefinitions.getByName("Read")();

  const membersGroup = await sp.web.siteGroups
    .getByName(membersGroupTitle)()
    .catch(() => null);

  if (membersGroup) {
    const membersBindings = await library.roleAssignments
      .getById(membersGroup.Id)
      .bindings()
      .catch(() => []);

    if (membersBindings.length > 0) {
      await library.roleAssignments.getById(membersGroup.Id).delete();
    }

    await library.roleAssignments.add(membersGroup.Id, readRole.Id);
  } else {
    console.warn(`SharePoint group "${membersGroupTitle}" was not found.`);
  }

  const visitorsGroup = await sp.web.siteGroups
    .getByName(visitorsGroupTitle)()
    .catch(() => null);

  if (visitorsGroup) {
    const visitorsBindings = await library.roleAssignments
      .getById(visitorsGroup.Id)
      .bindings()
      .catch(() => []);

    if (visitorsBindings.length > 0) {
      await library.roleAssignments.getById(visitorsGroup.Id).delete();
    }

    await library.roleAssignments.add(visitorsGroup.Id, readRole.Id);
  } else {
    console.warn(`SharePoint group "${visitorsGroupTitle}" was not found.`);
  }

  const groupTitle = `${listInfo.Title} Administrators`;

  let group = await sp.web.siteGroups
    .getByName(groupTitle)()
    .catch(() => null);

  if (!group) {
    group = await sp.web.siteGroups.add({
      Title: groupTitle,
      Description: `Administrators for the ${listInfo.Title} document library.`,
    });
  }

  const groupId = group.Id;

  const groupBindings = await library.roleAssignments
    .getById(groupId)
    .bindings()
    .catch(() => []);

  const groupHasFullControl = groupBindings.some(
    (role: any) => role.Id === fullControlRole.Id,
  );

  if (!groupHasFullControl) {
    await library.roleAssignments.add(groupId, fullControlRole.Id);
  }

  const sharePointGroup = sp.web.siteGroups.getById(groupId);

  const currentGroupUsers = await sharePointGroup.users.select(
    "Id",
    "LoginName",
  )();

  for (const loginName of administrators) {
    const user = await sp.web.ensureUser(loginName);

    const alreadyMember = currentGroupUsers.some(
      (member) => member.Id === user.Id,
    );

    if (!alreadyMember) {
      await sharePointGroup.users.add(user.LoginName);
    }
  }

  const removedAdministrators = previousAdministrators.filter(
    (previousAdmin) =>
      !administrators.some(
        (admin) => admin.toLowerCase() === previousAdmin.toLowerCase(),
      ),
  );

  for (const loginName of removedAdministrators) {
    try {
      await sharePointGroup.users.removeByLoginName(loginName);
    } catch (error) {
      console.warn(`Failed to remove ${loginName} from ${groupTitle}`, error);
    }
  }
};

export const ensureDocumentRelationsList = async (
  sp: SPFI,
  libraryName: string,
  administrators: string[],
  previousAdministrators: string[],
): Promise<void> => {
  const listTitle = `${libraryName}Relations`;

  let listExists = false;

  const existingLists = await sp.web.lists
    .filter(`Title eq '${listTitle}'`)
    .select("Id")();

  listExists = existingLists.length > 0;

  if (!listExists) {
    try {
      await sp.web.lists.add(listTitle);
    } catch (error) {
      const listsAfterCreateAttempt = await sp.web.lists
        .filter(`Title eq '${listTitle}'`)
        .select("Id")();

      if (listsAfterCreateAttempt.length === 0) {
        throw error;
      }
    }
  }

  const list = sp.web.lists.getByTitle(listTitle);

  const existingFields = await list.fields.select("InternalName")();

  const existingFieldNames = new Set(
    existingFields.map((field) => field.InternalName),
  );

  if (!existingFieldNames.has("DocReference")) {
    await list.fields.addText("DocReference", {
      MaxLength: 255,
    });
  }

  if (!existingFieldNames.has("DocName")) {
    await list.fields.addText("DocName", {
      MaxLength: 255,
    });
  }

  if (!existingFieldNames.has("DocCategory")) {
    await list.fields.addText("DocCategory", {
      MaxLength: 255,
    });
  }

  if (!existingFieldNames.has("DocDepartment")) {
    await list.fields.addText("DocDepartment", {
      MaxLength: 255,
    });
  }

  if (!existingFieldNames.has(DOCUMENT_RELATION_COLUMNS.DOCUMENT_ID)) {
    await list.fields.addNumber(DOCUMENT_RELATION_COLUMNS.DOCUMENT_ID);
  }

  if (!existingFieldNames.has(DOCUMENT_RELATION_COLUMNS.PARENT_DOCUMENT_ID)) {
    await list.fields.addNumber(DOCUMENT_RELATION_COLUMNS.PARENT_DOCUMENT_ID);
  }

  const listInfo = (await list.select(
    "HasUniqueRoleAssignments",
  )()) as unknown as {
    HasUniqueRoleAssignments: boolean;
  };

  if (!listInfo.HasUniqueRoleAssignments) {
    await list.breakRoleInheritance(true, false);
  }

  const contributeRole = await sp.web.roleDefinitions.getByName("Contribute")();

  for (const loginName of administrators) {
    try {
      const user = await sp.web.ensureUser(loginName);

      const bindings = await list.roleAssignments
        .getById(user.Id)
        .bindings()
        .catch(() => []);

      const hasContribute = bindings.some(
        (role: any) => role.Id === contributeRole.Id,
      );

      if (!hasContribute) {
        await list.roleAssignments.add(user.Id, contributeRole.Id);
      }
    } catch (error) {
      console.warn(
        `Failed to add Relations permissions for ${loginName}`,
        error,
      );
    }
  }

  const removedAdministrators = previousAdministrators.filter(
    (previousAdmin) =>
      !administrators.some(
        (admin) => admin.toLowerCase() === previousAdmin.toLowerCase(),
      ),
  );

  for (const loginName of removedAdministrators) {
    try {
      const user = await sp.web.ensureUser(loginName);

      await list.roleAssignments.remove(user.Id, contributeRole.Id);
    } catch (error) {
      console.warn(
        `Failed to remove Relations permissions for ${loginName}`,
        error,
      );
    }
  }
};

export const ensureDocumentCategoriesList = async (
  sp: SPFI,
  administrators: string[],
  previousAdministrators: string[],
): Promise<void> => {
  const listTitle = "DocumentCategories";
  const administratorsGroupName = "QualityDocument Administrators";

  const lists = await sp.web.lists
    .filter(`Title eq '${listTitle}'`)
    .select("Id")();

  if (lists.length === 0) {
    await sp.web.lists.add(listTitle);
  }

  const list = sp.web.lists.getByTitle(listTitle);

  const listInfo = (await list.select(
    "HasUniqueRoleAssignments",
  )()) as unknown as {
    HasUniqueRoleAssignments: boolean;
  };

  if (!listInfo.HasUniqueRoleAssignments) {
    await list.breakRoleInheritance(true, false);
  }

  const readRole = await sp.web.roleDefinitions.getByName("Read")();
  const contributeRole = await sp.web.roleDefinitions.getByName("Contribute")();

  const groups = await sp.web.siteGroups
    .filter(`Title eq '${administratorsGroupName}'`)
    .select("Id", "Title")();

  let administratorsGroupId: number;

  if (groups.length === 0) {
    const groupResult = await sp.web.siteGroups.add({
      Title: administratorsGroupName,
      Description: "Administrators of Quality Document Management libraries.",
    });

    administratorsGroupId = groupResult.Id;
  } else {
    administratorsGroupId = groups[0].Id;
  }

  const groupBindings = await list.roleAssignments
    .getById(administratorsGroupId)
    .bindings()
    .catch(() => []);

  const groupHasContribute = groupBindings.some(
    (role: any) => role.Id === contributeRole.Id,
  );

  if (!groupHasContribute) {
    await list.roleAssignments.add(administratorsGroupId, contributeRole.Id);
  }

  const currentAdministrators = administrators;
  const group = sp.web.siteGroups.getById(administratorsGroupId);

  for (const loginName of currentAdministrators) {
    try {
      const user = await sp.web.ensureUser(loginName);

      const members = await group.users
        .filter(`Id eq ${user.Id}`)
        .select("Id")();

      if (members.length === 0) {
        await group.users.add(user.LoginName);
      }
    } catch (error) {
      console.warn(
        `Failed to add ${loginName} to ${administratorsGroupName}`,
        error,
      );
    }
  }

  const removedAdministrators = previousAdministrators.filter(
    (previousAdmin) => !currentAdministrators.includes(previousAdmin),
  );

  for (const loginName of removedAdministrators) {
    try {
      const user = await sp.web.ensureUser(loginName);

      const members = await group.users
        .filter(`Id eq ${user.Id}`)
        .select("Id")();

      if (members.length > 0) {
        await group.users.removeById(user.Id);
      }
    } catch (error) {
      console.warn(
        `Failed to remove ${loginName} from ${administratorsGroupName}`,
        error,
      );
    }
  }

  const siteGroups = await sp.web.siteGroups.select("Id", "Title")();

  const visitorGroup = siteGroups.find((group) =>
    /Visitors$/i.test(group.Title),
  );

  const memberGroup = siteGroups.find((group) => /Members$/i.test(group.Title));

  for (const siteGroup of [visitorGroup, memberGroup]) {
    if (!siteGroup) {
      continue;
    }

    const bindings = await list.roleAssignments
      .getById(siteGroup.Id)
      .bindings()
      .catch(() => []);

    const hasRead = bindings.some((role: any) => role.Id === readRole.Id);

    if (!hasRead) {
      await list.roleAssignments.add(siteGroup.Id, readRole.Id);
    }
  }
};

export const ensureDocumentLibraryConfiguration = async (
  sp: SPFI,
  libraryId: string,
  administrators: string[],
  previousAdministrators: string[],
  libraryName: string,
): Promise<void> => {
  await ensureDocumentLibraryColumns(sp, libraryId);

  await ensureDocumentLibraryVersioning(sp, libraryId);
  await ensureDocumentRelationsList(
    sp,
    libraryName,
    administrators,
    previousAdministrators,
  );

  await ensureDocumentLibraryAdministrators(
    sp,
    libraryId,
    administrators,
    previousAdministrators,
  );
};
