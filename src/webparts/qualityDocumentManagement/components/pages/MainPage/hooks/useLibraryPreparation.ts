import { useCallback, useEffect, useRef, useState } from "react";

import type { IPropertyFieldGroupOrPerson } from "@pnp/spfx-property-controls/lib/PropertyFieldPeoplePicker";

import { IQualityDocumentManagementProps } from "../../../IQualityDocumentManagementProps";

import { useNotification } from "../../../../contexts/NotificationContext";
import { useCategoryContext } from "../../../../contexts/CategoryContext";

import {
  ensureDocumentCategoriesList,
  ensureDocumentLibraryConfiguration,
} from "../../../../services/AdminServices/DocumentLibraryConfiguration";

import { isCurrentUserSiteAdmin } from "../../../../services/AdminServices/AdminService";

type Administrator = IPropertyFieldGroupOrPerson & {
  loginName?: string;
  secondaryText?: string;
};

const getAdministratorLogin = (admin: IPropertyFieldGroupOrPerson): string => {
  const administrator = admin as Administrator;

  return (administrator.loginName ?? administrator.secondaryText ?? "")
    .replace(/^i:0#.f\|membership\|/i, "")
    .toLowerCase();
};

export const useLibraryPreparation = (
  props: IQualityDocumentManagementProps,
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);

  const librariesRef = useRef(props.libraries);

  const previousAdministratorsRef = useRef<Record<string, string[]>>({});

  const lastHandledConfigurationVersionRef = useRef(props.configurationVersion);

  const { setError, clearError } = useNotification();

  const { refreshCategories } = useCategoryContext();

  useEffect(() => {
    librariesRef.current = props.libraries;
  }, [props.libraries]);

  const prepareLibraries = useCallback(async (): Promise<void> => {
    const libraries = librariesRef.current;

    const configuredLibraries = libraries.filter((library) =>
      Boolean(library.id),
    );

    if (configuredLibraries.length === 0) {
      return;
    }

    const results = await Promise.all(
      configuredLibraries.map(async (library) => {
        const administrators = (library.administrators ?? [])
          .map(getAdministratorLogin)
          .filter(Boolean);

        const previousAdministrators =
          previousAdministratorsRef.current[library.id] ?? [];

        await ensureDocumentLibraryConfiguration(
          props.sp,
          library.id,
          administrators,
          previousAdministrators,
          library.title,
        );

        return {
          libraryId: library.id,
          administrators,
        };
      }),
    );

    const previousAllAdministrators = Array.from(
      new Set(Object.values(previousAdministratorsRef.current).flat()),
    );

    results.forEach(({ libraryId, administrators }) => {
      previousAdministratorsRef.current[libraryId] = administrators;
    });

    const allAdministrators = Array.from(
      new Set(
        configuredLibraries.flatMap((library) =>
          (library.administrators ?? [])
            .map(getAdministratorLogin)
            .filter(Boolean),
        ),
      ),
    );

    await ensureDocumentCategoriesList(
      props.sp,
      allAdministrators,
      previousAllAdministrators,
    );
  }, [props.sp]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async (): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        const siteAdmin = await isCurrentUserSiteAdmin(props.sp);

        if (cancelled) {
          return;
        }

        setIsSiteAdmin(siteAdmin);

        await refreshCategories();

        if (cancelled) {
          return;
        }

        setIsPrepared(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to initialize Quality Document Management",
          error,
        );

        setIsPrepared(false);
        setError(error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [props.sp, refreshCategories, clearError, setError]);

  useEffect(() => {
    const currentVersion = props.configurationVersion;

    if (currentVersion <= 0) {
      return;
    }

    if (currentVersion === lastHandledConfigurationVersionRef.current) {
      return;
    }

    let cancelled = false;

    const prepareAfterConfigurationChange = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setIsPrepared(false);
        clearError();

        const siteAdmin = await isCurrentUserSiteAdmin(props.sp);

        if (cancelled) {
          return;
        }

        setIsSiteAdmin(siteAdmin);

        if (!siteAdmin) {
          lastHandledConfigurationVersionRef.current = currentVersion;

          setIsPrepared(true);
          return;
        }

        await prepareLibraries();

        if (cancelled) {
          return;
        }

        await refreshCategories();

        if (cancelled) {
          return;
        }

        lastHandledConfigurationVersionRef.current = currentVersion;

        setIsPrepared(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to prepare document libraries after configuration change",
          error,
        );

        setIsPrepared(false);
        setError(error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void prepareAfterConfigurationChange();

    return () => {
      cancelled = true;
    };
  }, [
    props.configurationVersion,
    props.sp,
    prepareLibraries,
    refreshCategories,
    clearError,
    setError,
  ]);

  return {
    isLoading,
    isPrepared,
    isSiteAdmin,
    getAdministratorLogin,
  };
};
