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

export const ensureSiteMembersRead = async (sp: SPFI): Promise<void> => {
  const membersGroup = await sp.web.associatedMemberGroup();
  const roleAssignments = sp.web.roleAssignments;
  const roleAssignment = roleAssignments.getById(membersGroup.Id);
  const bindings = await roleAssignment.bindings().catch(() => []);
  const editRole = await sp.web.roleDefinitions.getByName("Edit")();
  const readRole = await sp.web.roleDefinitions.getByName("Read")();
  const hasEdit = bindings.some((role: any) => role.Id === editRole.Id);
  const hasRead = bindings.some((role: any) => role.Id === readRole.Id);

  if (hasEdit) {
    await roleAssignments.remove(membersGroup.Id, editRole.Id);
  }

  if (!hasRead) {
    await roleAssignments.add(membersGroup.Id, readRole.Id);
  }
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

  const fullControlRole =
    await sp.web.roleDefinitions.getByName("Full Control")();

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

  const exists =
    (await sp.web.lists.filter(`Title eq '${listTitle}'`).select("Id")())
      .length > 0;

  if (!exists) {
    await sp.web.lists.add(listTitle);

    const list = sp.web.lists.getByTitle(listTitle);

    await Promise.all([
      list.fields.addText(DOCUMENT_COLUMNS.DOCUMENT_REFERENCE, {
        MaxLength: 255,
      }),

      list.fields.addText(DOCUMENT_COLUMNS.DOCUMENT_NAME, {
        MaxLength: 255,
      }),

      list.fields.addText(DOCUMENT_COLUMNS.CATEGORY, {
        MaxLength: 255,
      }),

      list.fields.addText(DOCUMENT_COLUMNS.DEPARTMENT, {
        MaxLength: 255,
      }),

      list.fields.addNumber(DOCUMENT_RELATION_COLUMNS.DOCUMENT_ID),

      list.fields.addNumber(DOCUMENT_RELATION_COLUMNS.PARENT_DOCUMENT_ID),
    ]);
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

  const contributeRole = await sp.web.roleDefinitions.getByName("Contribute")();

  for (const loginName of administrators) {
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
  }

  const removedAdministrators = previousAdministrators.filter(
    (previousAdmin) => !administrators.includes(previousAdmin),
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

  const contributeRole = await sp.web.roleDefinitions.getByName("Contribute")();

  for (const loginName of administrators) {
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
  }

  const removedAdministrators = previousAdministrators.filter(
    (previousAdmin) => !administrators.includes(previousAdmin),
  );

  for (const loginName of removedAdministrators) {
    try {
      const user = await sp.web.ensureUser(loginName);
      await list.roleAssignments.remove(user.Id, contributeRole.Id);
    } catch (error) {
      console.warn(
        `Failed to remove category permissions for ${loginName}`,
        error,
      );
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
