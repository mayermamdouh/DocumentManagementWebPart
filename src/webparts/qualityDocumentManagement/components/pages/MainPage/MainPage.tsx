import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./MainPage.module.scss";
import type { IQualityDocumentManagementProps } from "../../IQualityDocumentManagementProps";

import { ensureDocumentLibraryConfiguration } from "../../../services/AdminServices/DocumentLibraryConfiguration";

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
    await Promise.all(
      librariesRef.current.map(async (library) => {
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

        previousAdministratorsRef.current[library.id] = administratorsIds;
      }),
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

        const currentUserLogin =
          props.context.pageContext.user.loginName.toLowerCase();

        const isLibraryAdministrator = props.libraries.some((library) =>
          (library.administrators ?? []).some(
            (admin) => admin.id?.toLowerCase() === currentUserLogin,
          ),
        );

        const isAdmin = siteOwner || isLibraryAdministrator;

        if (isAdmin) {
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

  const currentLibrary = props.libraries.find(
    (library) => library.id === activeLibraryId,
  );

  const isLibraryAdministrator =
    currentLibrary?.administrators?.some(
      (admin) => admin.login === props.context.pageContext.user.loginName,
    ) ?? false;

  const isAdmin = isSiteAdmin || isLibraryAdministrator;

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

        {isAdmin && (
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
        {props.libraries.map((library) => (
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
            libraryName={
              props.libraries.find((item) => item.id === activeLibraryId)
                ?.title ?? ""
            }
          />
        ) : (
          isAdmin && (
            <AdminPage
              activeLibraryId={activeLibraryId}
              libraryName={
                props.libraries.find((item) => item.id === activeLibraryId)
                  ?.title ?? ""
              }
            />
          )
        )}
      </div>
    </div>
  );
};

export default MainPage;
