import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./MainPage.module.scss";
import type { IQualityDocumentManagementProps } from "../../IQualityDocumentManagementProps";

import {
  ensureDocumentCategoriesList,
  ensureDocumentLibraryConfiguration,
} from "../../../services/AdminServices/DocumentLibraryConfiguration";

import ConfigurationRequired from "../../common/ConfigurationRequired/ConfigurationRequired";
import AppLoading from "../../common/AppLoading/Apploading";

import { useNotification } from "../../../contexts/NotificationContext";

import AppButton from "../../common/AppButton/AppButton";
import UserPage from "../../user/UserPage";
import AdminPage from "../../admin/AdminPage";
import AppToast from "../../common/AppToast/AppToast";
import { isCurrentUserSiteAdmin } from "../../../services/AdminServices/AdminService";

const MainPage = (props: IQualityDocumentManagementProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrepared, setIsPrepared] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>("UserPage");
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);

  const { error, setError, clearError, message, clearMessage } =
    useNotification();

  const librariesRef = useRef(props.libraries);
  const previousAdministratorsRef = useRef<Record<string, string[]>>({});
  const [activeLibraryId, setActiveLibraryId] = useState<string>(
    props.libraries[0]?.id ?? "",
  );

  const hasLibraries = props.libraries.length > 0;

  useEffect(() => {
    librariesRef.current = props.libraries;
  }, [props.libraries]);

  const prepareLibraries = useCallback(async (): Promise<void> => {
    const libraries = librariesRef.current;

    const results = await Promise.all(
      libraries.map(async (library) => {
        const administratorsIds = (library.administrators ?? [])
          .map((item) => item.id)
          .filter((id): id is string => id !== undefined);

        const previousAdministrators =
          previousAdministratorsRef.current[library.id] ?? [];

        await ensureDocumentLibraryConfiguration(
          props.sp,
          library.id,
          administratorsIds,
          previousAdministrators,
          library.title,
        );

        return {
          libraryId: library.id,
          administratorsIds,
        };
      }),
    );
    const previousAllAdministrators = Array.from(
      new Set(Object.values(previousAdministratorsRef.current).flat()),
    );

    results.forEach(({ libraryId, administratorsIds }) => {
      previousAdministratorsRef.current[libraryId] = administratorsIds;
    });

    const allAdministrators = Array.from(
      new Set(
        libraries.flatMap((library) =>
          (library.administrators ?? [])
            .map((admin) => admin.id)
            .filter((id): id is string => id !== undefined),
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
    if (props.libraries.length > 0 && !activeLibraryId) {
      setActiveLibraryId(props.libraries[0].id);
    }
  }, [props.libraries, activeLibraryId]);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      if (props.configurationVersion === 0) {
        setIsPrepared(false);
        return;
      }

      if (!hasLibraries) {
        setIsPrepared(false);
        return;
      }

      try {
        clearError();
        setIsLoading(true);

        const siteOwner = await isCurrentUserSiteAdmin(props.sp);
        setIsSiteAdmin(siteOwner);

        if (siteOwner) {
          await prepareLibraries();
        }

        setIsPrepared(true);
      } catch (error) {
        setIsPrepared(false);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, [
    props.configurationVersion,
    props.context.pageContext.user.loginName,
    props.libraries,
    props.sp,
    hasLibraries,
    prepareLibraries,
    clearError,
    setError,
  ]);

  const currentUserLogin =
    props.context.pageContext.user.loginName.toLowerCase();

  const isLibraryAdministrator = props.libraries.some((library) =>
    (library.administrators ?? []).some(
      (admin) => admin.login?.toLowerCase() === currentUserLogin,
    ),
  );

  const visibleLibraries = isSiteAdmin
    ? props.libraries
    : isLibraryAdministrator
      ? props.libraries.filter((library) =>
          (library.administrators ?? []).some(
            (admin) => admin.login?.toLowerCase() === currentUserLogin,
          ),
        )
      : props.libraries;

  useEffect(() => {
    if (visibleLibraries.length === 0) {
      setActiveLibraryId("");
      return;
    }

    const activeLibraryExists = visibleLibraries.some(
      (library) => library.id === activeLibraryId,
    );

    if (!activeLibraryExists) {
      setActiveLibraryId(visibleLibraries[0].id);
    }
  }, [visibleLibraries, activeLibraryId]);

  const currentLibrary = visibleLibraries.find(
    (library) => library.id === activeLibraryId,
  );

  const isCurrentLibraryAdministrator =
    isSiteAdmin ||
    (currentLibrary?.administrators ?? []).some(
      (admin) => admin.login?.toLowerCase() === currentUserLogin,
    );

  if (!hasLibraries) {
    return <ConfigurationRequired hasLibraries={false} />;
  }

  if (!isPrepared && !isLoading) {
    return <ConfigurationRequired hasLibraries={true} />;
  }

  if (isLoading) {
    return (
      <AppLoading label="Checking document libraries and preparing required fields..." />
    );
  }

  return (
    <div className={styles.main}>
      {props.appTitle && <h1 className={styles.appTitle}>{props.appTitle}</h1>}

      <div className={styles.pageSelector}>
        <AppButton
          text="User"
          fullWidth={true}
          iconName="People"
          variant={activePage === "UserPage" ? "primary" : "secondary"}
          size="md"
          onClick={() => setActivePage("UserPage")}
        />

        {isCurrentLibraryAdministrator && (
          <AppButton
            text="Admin"
            fullWidth={true}
            iconName="PlayerSettings"
            variant={activePage === "AdminPage" ? "primary" : "secondary"}
            size="md"
            onClick={() => setActivePage("AdminPage")}
          />
        )}
      </div>

      <section className={styles.librariesBar}>
        {visibleLibraries.map((library) => (
          <button
            key={library.id}
            type="button"
            className={`${styles.libraryButton} ${
              activeLibraryId === library.id ? styles.activeLibrary : ""
            }`}
            onClick={() => setActiveLibraryId(library.id)}
            title={library.title}
          >
            {library.title}
          </button>
        ))}
      </section>
      {error && <AppToast message={error} type="error" onClose={clearError} />}

      {message && (
        <AppToast message={message} type="success" onClose={clearMessage} />
      )}
      <div className={styles.pageContent}>
        {activePage === "UserPage" ? (
          <UserPage
            activeLibraryId={activeLibraryId}
            libraryName={currentLibrary?.title ?? ""}
          />
        ) : (
          isCurrentLibraryAdministrator && (
            <AdminPage
              activeLibraryId={activeLibraryId}
              libraryName={currentLibrary?.title ?? ""}
            />
          )
        )}
      </div>
    </div>
  );
};

export default MainPage;
