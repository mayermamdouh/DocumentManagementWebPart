import * as React from "react";
import * as ReactDom from "react-dom";

import { Version } from "@microsoft/sp-core-library";
import { IPropertyPaneConfiguration } from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";

import { SPFI, spfi, SPFx } from "@pnp/sp";

import * as strings from "QualityDocumentManagementWebPartStrings";

import QualityDocumentManagement from "./components/QualityDocumentManagement";
import { IQualityDocumentManagementProps } from "./components/IQualityDocumentManagementProps";

import {
  ILibraryConfiguration,
  ILibraryOption,
} from "./config/types/ILibraryConfiguration";

import {
  getConfiguredLibraries,
  applyLibrariesToProperties,
  isLibrariesConfigurationValid,
} from "./config/libraryConfiguration";

import { getPropertyPaneConfiguration } from "./config/propertyPaneConfiguration";

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import "@pnp/sp/fields";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/site-groups";
import "@pnp/sp/security";
import "@pnp/sp/files";
import "@pnp/sp/folders";

export interface IQualityDocumentManagementWebPartProps {
  appTitle: string;

  library1Id: string;
  library1TabName: string;
  library1Administrators: any[];

  library2Id: string;
  library2TabName: string;
  library2Administrators: any[];

  library3Id: string;
  library3TabName: string;
  library3Administrators: any[];

  library4Id: string;
  library4TabName: string;
  library4Administrators: any[];

  library5Id: string;
  library5TabName: string;
  library5Administrators: any[];

  library6Id: string;
  library6TabName: string;
  library6Administrators: any[];

  configurationVersion: number;
}

export default class QualityDocumentManagementWebPart extends BaseClientSideWebPart<IQualityDocumentManagementWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = "";
  private _sp!: SPFI;

  private _availableLibraries: ILibraryOption[] = [];

  /**
   * Controls whether the React configuration popup is visible.
   */
  private _isConfigurationPopupOpen: boolean = false;

  public render(): void {
    const libraries: ILibraryConfiguration[] = getConfiguredLibraries(
      this.properties,
      this._availableLibraries,
    );

    const element: React.ReactElement<IQualityDocumentManagementProps> =
      React.createElement(QualityDocumentManagement, {
        appTitle: this.properties.appTitle,

        libraries,

        availableLibraries: this._availableLibraries,

        isDarkTheme: this._isDarkTheme,

        configurationVersion: this.properties.configurationVersion || 0,

        environmentMessage: this._environmentMessage,

        hasTeamsContext: !!this.context.sdks.microsoftTeams,

        userDisplayName: this.context.pageContext.user.displayName,

        userDisplayEmail: this.context.pageContext.user.email,

        user: this.context.pageContext.user,

        context: this.context,

        sp: this._sp,

        isConfigurationPopupOpen: this._isConfigurationPopupOpen,

        onOpenConfiguration: this._openConfigurationPopup,

        onCloseConfiguration: this._closeConfigurationPopup,

        onSaveConfiguration: this._saveConfiguration,
      });

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();

    this._sp = spfi().using(SPFx(this.context));

    this._environmentMessage = await this._getEnvironmentMessage();

    await this._loadLibraries();
  }

  /**
   * Load all available document libraries
   * from the current SharePoint web.
   */
  private async _loadLibraries(): Promise<void> {
    try {
      const libraries = await this._sp.web.lists
        .filter("BaseTemplate eq 101 and Hidden eq false")
        .select("Id", "Title")();

      this._availableLibraries = libraries.map((library) => ({
        id: library.Id,
        title: library.Title,
      }));
    } catch (error) {
      console.error("Failed to load document libraries", error);

      this._availableLibraries = [];
    }
  }

  private _openConfigurationPopup = (): void => {
    this._isConfigurationPopupOpen = true;

    this.render();
  };

  private _closeConfigurationPopup = (): void => {
    this._isConfigurationPopupOpen = false;

    this.render();
  };

  private _saveConfiguration = (libraries: ILibraryConfiguration[]): void => {
    if (!isLibrariesConfigurationValid(libraries)) {
      return;
    }

    applyLibrariesToProperties(this.properties, libraries);

    // Make sure configurationVersion always changes
    this.properties.configurationVersion =
      (this.properties.configurationVersion ?? 0) + 1;

    this._isConfigurationPopupOpen = false;
    this.context.propertyPane.refresh();

    this.render();
  };

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app
        .getContext()
        .then((context) => {
          let environmentMessage: string = "";

          switch (context.app.host.name) {
            case "Office":
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOffice
                : strings.AppOfficeEnvironment;
              break;

            case "Outlook":
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOutlook
                : strings.AppOutlookEnvironment;
              break;

            case "Teams":
            case "TeamsModern":
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentTeams
                : strings.AppTeamsTabEnvironment;
              break;

            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(
      this.context.isServedFromLocalhost
        ? strings.AppLocalEnvironmentSharePoint
        : strings.AppSharePointEnvironment,
    );
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;

    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty(
        "--bodyText",
        semanticColors.bodyText || "",
      );

      this.domElement.style.setProperty("--link", semanticColors.link || "");

      this.domElement.style.setProperty(
        "--linkHovered",
        semanticColors.linkHovered || "",
      );
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return getPropertyPaneConfiguration({
      properties: this.properties,

      onConfigureLibraries: this._openConfigurationPopup,
    });
  }
}
