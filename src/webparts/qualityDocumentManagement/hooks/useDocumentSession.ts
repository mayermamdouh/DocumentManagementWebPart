import { useCallback, useState } from "react";

export interface IAdminSessionValues {
  valueTypeFilter: string | null;
  selectedCategory: string | null;
  searchTerm: string;
}

export interface IUserSessionValues {
  selectedCategory: string | null;
  searchTerm: string;
}

interface ISessionValues {
  activeLibraryId: string | null;
  activePage: "UserPage" | "AdminPage";
  admin: IAdminSessionValues;
  user: IUserSessionValues;
}

const defaultValues: ISessionValues = {
  activeLibraryId: null,
  activePage: "UserPage",
  admin: {
    valueTypeFilter: null,
    selectedCategory: null,
    searchTerm: "",
  },
  user: {
    selectedCategory: null,
    searchTerm: "",
  },
};

export const useDocumentSession = () => {
  const [values, setValues] = useState<ISessionValues>(() => {
    try {
      const stored = sessionStorage.getItem("documentSession");

      if (!stored) {
        return defaultValues;
      }

      const parsed = JSON.parse(stored);
      return {
        ...defaultValues,
        ...parsed,
        admin: {
          ...defaultValues.admin,
          ...parsed.admin,
        },
        user: {
          ...defaultValues.user,
          ...parsed.user,
        },
      };
    } catch {
      return defaultValues;
    }
  });

  const updateValue = useCallback((value: Partial<ISessionValues>) => {
    setValues((prev) => {
      const updated = {
        ...prev,
        ...value,
      };

      sessionStorage.setItem("documentSession", JSON.stringify(updated));

      return updated;
    });
  }, []);

  const updateAdminValue = useCallback(
    <K extends keyof IAdminSessionValues>(
      key: K,
      value: IAdminSessionValues[K],
    ) => {
      setValues((prev) => {
        const updated = {
          ...prev,
          admin: {
            ...prev.admin,
            [key]: value,
          },
        };

        sessionStorage.setItem("documentSession", JSON.stringify(updated));

        return updated;
      });
    },
    [],
  );

  const updateUserValue = useCallback(
    <K extends keyof IUserSessionValues>(
      key: K,
      value: IUserSessionValues[K],
    ) => {
      setValues((prev) => {
        const updated = {
          ...prev,
          user: {
            ...prev.user,
            [key]: value,
          },
        };

        sessionStorage.setItem("documentSession", JSON.stringify(updated));

        return updated;
      });
    },
    [],
  );

  const clearAdminFilters = useCallback(() => {
    setValues((prev) => {
      const updated = {
        ...prev,
        admin: {
          ...prev.admin,
          valueTypeFilter: null,
          selectedCategory: null,
          searchTerm: "",
        },
      };

      sessionStorage.setItem("documentSession", JSON.stringify(updated));

      return updated;
    });
  }, []);

  const clearUserFilters = useCallback(() => {
    setValues((prev) => {
      const updated = {
        ...prev,
        user: {
          ...prev.user,
          selectedCategory: null,
          searchTerm: "",
        },
      };

      sessionStorage.setItem("documentSession", JSON.stringify(updated));

      return updated;
    });
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("documentSession");
    setValues(defaultValues);
  }, []);

  return {
    activeLibraryId: values.activeLibraryId,
    activePage: values.activePage,
    admin: values.admin,
    user: values.user,
    updateValue,
    updateAdminValue,
    updateUserValue,
    clearAdminFilters,
    clearUserFilters,
    clearSession,
  };
};
