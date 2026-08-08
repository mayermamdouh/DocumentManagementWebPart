import { useState } from "react";

import { SPFI } from "@pnp/sp";
import { ICategory } from "../../../../../types/commonTypes";
import {
  GetCategoryUsage,
  UpdateCategories,
} from "../../../../../services/AdminServices/CategoryService";
import { useSharePoint } from "../../../../../contexts/SharePointContext";

interface IUseEditCategoriesProps {
  sp: SPFI;
  oldCategories: ICategory[];
  onSuccess: () => Promise<void>;
  onClose: () => void;
  setError: (message: string) => void;
  setMessage: (message: string) => void;
}

export const useEditCategories = ({
  sp,
  oldCategories,
  onSuccess,
  onClose,
  setError,
  setMessage,
}: IUseEditCategoriesProps) => {
  const { libraries } = useSharePoint();
  const [categoryError, setCategoryError] = useState("");
  const [librariesContentCategory, setLibrariesContentCategory] = useState<
    string[]
  >([]);

  const [newCategory, setNewCategory] = useState("");
  const [addedCategories, setAddedCategories] = useState<ICategory[]>([]);
  const [removedCategoryIds, setRemovedCategoryIds] = useState<number[]>([]);
  const [pendingRemoveCategory, setPendingRemoveCategory] =
    useState<ICategory | null>(null);

  const visibleCategories = [...oldCategories, ...addedCategories].filter(
    (category) => !removedCategoryIds.includes(category.Id),
  );
  const remainingCategoriesCount = visibleCategories.length;

  const handleAddNewCategory = () => {
    const categoryName = newCategory.trim();
    setCategoryError("");

    if (!categoryName) {
      setCategoryError("Category name is required.");
      return;
    }

    const normalizedCategoryName = categoryName.toLowerCase();
    const existsInOldCategories = oldCategories.some(
      (category) =>
        !removedCategoryIds.includes(category.Id) &&
        category.Title.trim().toLowerCase() === normalizedCategoryName,
    );

    const existsInAddedCategories = addedCategories.some(
      (category) =>
        category.Title.trim().toLowerCase() === normalizedCategoryName,
    );

    if (existsInOldCategories || existsInAddedCategories) {
      setCategoryError(`The category "${categoryName}" already exists.`);
      return;
    }

    const newItem: ICategory = {
      Id: Date.now(),
      Title: categoryName,
    };

    setAddedCategories((prev) => [...prev, newItem]);
    setNewCategory("");
    setCategoryError("");
  };

  const handleNewCategoryChange = (value: string) => {
    setNewCategory(value);

    if (categoryError) {
      setCategoryError("");
    }
  };

  const removeAddedCategory = (categoryId: number) => {
    setAddedCategories((prev) =>
      prev.filter((category) => category.Id !== categoryId),
    );

    setCategoryError("");
  };

  const markCategoryAsRemoved = (categoryId: number) => {
    setRemovedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev : [...prev, categoryId],
    );
  };

  const handleRemoveCategory = async (category: ICategory) => {
    setCategoryError("");

    if (remainingCategoriesCount <= 1) {
      setCategoryError(
        "At least one category must remain. You cannot remove all categories.",
      );
      return;
    }

    const isOldCategory = oldCategories.some(
      (oldCategory) => oldCategory.Id === category.Id,
    );

    if (!isOldCategory) {
      removeAddedCategory(category.Id);
      return;
    }

    try {
      const results = await GetCategoryUsage(
        sp,
        libraries.map((item) => item.title),
        category.Title,
      );

      if (results.length > 0) {
        setLibrariesContentCategory(results);
        setPendingRemoveCategory(category);
        return;
      }

      markCategoryAsRemoved(category.Id);
    } catch (error) {
      console.error("Failed to check category usage:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to check if the category is in use.",
      );
    }
  };

  const confirmRemoveCategory = () => {
    if (!pendingRemoveCategory) {
      return;
    }

    markCategoryAsRemoved(pendingRemoveCategory.Id);

    setPendingRemoveCategory(null);
    setLibrariesContentCategory([]);
  };

  const cancelRemoveCategory = () => {
    setPendingRemoveCategory(null);
    setLibrariesContentCategory([]);
  };

  const handleSaveCategories = async () => {
    try {
      await UpdateCategories(
        sp,
        libraries,
        oldCategories,
        addedCategories,
        removedCategoryIds,
      );
      await onSuccess();
      onClose();
      setMessage("Categories have been updated successfully.");
    } catch (error) {
      console.error("Failed to update categories:", error);

      setError(
        error instanceof Error ? error.message : "Failed to update categories.",
      );
    }
  };

  const isSaveDisabled =
    addedCategories.length === 0 && removedCategoryIds.length === 0;

  return {
    newCategory,
    setNewCategory,
    handleNewCategoryChange,
    categoryError,
    visibleCategories,
    pendingRemoveCategory,
    librariesContentCategory,
    isSaveDisabled,
    handleAddNewCategory,
    handleRemoveCategory,
    confirmRemoveCategory,
    cancelRemoveCategory,
    handleSaveCategories,
  };
};
