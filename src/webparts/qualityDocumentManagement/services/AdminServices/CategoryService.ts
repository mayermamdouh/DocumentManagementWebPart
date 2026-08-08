import { SPFI } from "@pnp/sp";
import { ICategory } from "../../types/commonTypes";
import { DOCUMENTCATEGORIESNAME } from "../../constants/columns";
import { IConfiguredLibrary } from "../../contexts/SharePointContext";

export const getLibrariesCategories = async (
  sp: SPFI,
): Promise<ICategory[]> => {
  const categories = await sp.web.lists
    .getByTitle(DOCUMENTCATEGORIESNAME)
    .items.select("Id", "Title")();

  return categories;
};

export const GetCategoryUsage = async (
  sp: SPFI,
  libraryNames: string[],
  categoryName: string,
): Promise<string[]> => {
  const safeCategoryName = categoryName.trim().replace(/'/g, "''");

  const results = await Promise.all(
    libraryNames.map(async (libraryName) => {
      const items = await sp.web.lists
        .getByTitle(libraryName)
        .items.select("Id")
        .filter(`DocCategory eq '${safeCategoryName}'`)
        .top(1)();

      return items.length > 0 ? libraryName : null;
    }),
  );

  return results.filter(
    (libraryTitle): libraryTitle is string => libraryTitle !== null,
  );
};

export const ClearCategoryFromLibraries = async (
  sp: SPFI,
  libraries: IConfiguredLibrary[],
  categoryName: string,
): Promise<void> => {
  const safeCategoryName = categoryName.trim().replace(/'/g, "''");

  for (const library of libraries) {
    const items = await sp.web.lists
      .getById(library.id)
      .items.select("Id")
      .filter(`DocCategory eq '${safeCategoryName}'`)();

    if (items.length === 0) {
      continue;
    }

    await Promise.all(
      items.map((item) =>
        sp.web.lists.getById(library.id).items.getById(item.Id).update({
          DocCategory: null,
        }),
      ),
    );
  }
};

export const UpdateCategories = async (
  sp: SPFI,
  libraries: IConfiguredLibrary[],
  oldCategories: ICategory[],
  addedCategories: ICategory[],
  removedCategoryIds: number[],
) => {
  const categoriesList = sp.web.lists.getByTitle(DOCUMENTCATEGORIESNAME);

  if (addedCategories.length !== 0) {
    await Promise.all(
      addedCategories.map((category) =>
        categoriesList.items.add({
          Title: category.Title,
        }),
      ),
    );
  }

  if (removedCategoryIds.length > 0) {
    for (const categoryId of removedCategoryIds) {
      const category = oldCategories.find(
        (category) => category.Id === categoryId,
      );

      if (!category) {
        continue;
      }

      await ClearCategoryFromLibraries(sp, libraries, category.Title);
      await categoriesList.items.getById(categoryId).delete();
    }
  }
};
