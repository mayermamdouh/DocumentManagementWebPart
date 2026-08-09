import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ICategoryIdMap } from "../types/commonTypes";
import { getLibrariesCategories } from "../services/AdminServices/CategoryService";
import { useNotification } from "./NotificationContext";
import { useSharePoint } from "./SharePointContext";

interface ICategoryContext {
  categoriesMap: ICategoryIdMap;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<ICategoryContext | undefined>(undefined);

interface ICategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider = ({ children }: ICategoryProviderProps) => {
  const { sp } = useSharePoint();
  const { setError } = useNotification();
  const [categoriesMap, setCategoriesMap] = useState<ICategoryIdMap>({});

  const loadCategories = useCallback(async () => {
    try {
      const categories = await getLibrariesCategories(sp);

      const categoryMap: ICategoryIdMap = {};

      categories.forEach((category) => {
        categoryMap[category.Id] = category;
      });

      setCategoriesMap(categoryMap);
    } catch (error) {
      console.error("Failed to load categories", error);
      setError(
        error instanceof Error ? error.message : "Failed to load categories",
      );
    }
  }, [sp, setError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categoriesMap,
        refreshCategories: loadCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error("useCategoryContext must be used inside CategoryProvider");
  }

  return context;
};
