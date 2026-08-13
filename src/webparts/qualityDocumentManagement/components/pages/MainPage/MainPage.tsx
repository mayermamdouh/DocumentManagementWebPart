import React, { useState } from "react";
import styles from "./MainPage.module.scss";
import type { IQualityDocumentManagementProps } from "../../IQualityDocumentManagementProps";
import { useNotification } from "../../../contexts/NotificationContext";

import AppButton from "../../common/AppButton/AppButton";
import UserPage from "../../user/UserPage";
import AdminPage from "../../admin/AdminPage";
import AppToast from "../../common/AppToast/AppToast";
import AppLoading from "../../common/AppLoading/Apploading";

import { useLibraryPreparation } from "./hooks/useLibraryPreparation";
import { useLibraryAccess } from "./hooks/useLibraryAccess";
import { useActiveLibrary } from "./hooks/useActiveLibrary";

import ConfigurationRequired from "../../common/ConfigurationRequired/ConfigurationRequired";
import { useDocumentSession } from "../../../hooks/useDocumentSession";

const MainPage = (props: IQualityDocumentManagementProps) => {
  const { isLoading, isPrepared, isSiteAdmin, getAdministratorLogin } =
    useLibraryPreparation(props);

  const { currentUserLogin, visibleLibraries } = useLibraryAccess(
    props,
    isSiteAdmin,
    getAdministratorLogin,
  );
  const { activeLibraryId, updateValue ,activePage } = useDocumentSession();
  const { currentLibrary } = useActiveLibrary(visibleLibraries);

  const { message, clearMessage, error, clearError } = useNotification();
  const hasLibraries = props.libraries.some((library) => Boolean(library.id));

  if (!hasLibraries) {
    return <ConfigurationRequired hasLibraries={false} />;
  }

  if (isLoading) {
    return (
      <AppLoading label="Checking document libraries and preparing required fields..." />
    );
  }

  if (!isPrepared) {
    return <ConfigurationRequired hasLibraries={true} />;
  }

  const isCurrentLibraryAdministrator =
    isSiteAdmin ||
    (currentLibrary?.administrators ?? []).some(
      (admin) => getAdministratorLogin(admin) === currentUserLogin,
    );

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
          onClick={() => updateValue({ activePage: "UserPage" })}
        />

        {isCurrentLibraryAdministrator && (
          <AppButton
            text="Admin"
            fullWidth={true}
            iconName="PlayerSettings"
            variant={activePage === "AdminPage" ? "primary" : "secondary"}
            size="md"
            onClick={() => updateValue({ activePage: "AdminPage" })}
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
            onClick={() => updateValue({ activeLibraryId: library.id })}
            title={library.title}
          >
            {library.tabName || library.title}
          </button>
        ))}
      </section>

      {message && (
        <AppToast message={message} type="success" onClose={clearMessage} />
      )}

      {error && <AppToast message={error} type="error" onClose={clearError} />}

      <div className={styles.pageContent}>
        {activePage === "UserPage" ? (
          <UserPage
            // activeLibraryId={activeLibraryId}
            libraryName={currentLibrary?.title ?? ""}
          />
        ) : (
          isCurrentLibraryAdministrator && (
            <AdminPage
              // activeLibraryId={activeLibraryId}
              libraryName={currentLibrary?.title ?? ""}
            />
          )
        )}
      </div>
    </div>
  );
};

export default MainPage;
