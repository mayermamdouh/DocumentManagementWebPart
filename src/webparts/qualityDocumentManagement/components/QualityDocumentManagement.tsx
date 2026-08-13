import React from "react";

import styles from "./QualityDocumentManagement.module.scss";

import type { IQualityDocumentManagementProps } from "./IQualityDocumentManagementProps";

import MainPage from "./pages/MainPage/MainPage";


import { NotificationProvider } from "../contexts/NotificationContext";
import { SharePointProvider } from "../contexts/SharePointContext";
import { CategoryProvider } from "../contexts/CategoryContext";

import "../styles/colors.scss";
import LibraryConfigurationPopup from "../config/components/LibraryConfigurationPopup";

const QualityDocumentManagement = (
  props: IQualityDocumentManagementProps,
): JSX.Element => {
  return (
    <NotificationProvider>
      <SharePointProvider
        sp={props.sp}
        context={props.context}
        libraries={props.libraries}
      >
        <CategoryProvider>
          <section className={styles.qualityDocumentManagement}>
            <MainPage {...props} />

            {props.isConfigurationPopupOpen && (
              <LibraryConfigurationPopup
                libraries={props.libraries}
                availableLibraries={props.availableLibraries}
                context={props.context}
                onSave={props.onSaveConfiguration}
                onClose={props.onCloseConfiguration}
              />
            )}
          </section>
        </CategoryProvider>
      </SharePointProvider>
    </NotificationProvider>
  );
};

export default QualityDocumentManagement;
