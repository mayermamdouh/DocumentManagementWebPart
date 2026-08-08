import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown,
  IPropertyPaneDropdownOption,
  PropertyPaneHorizontalRule,
  PropertyPaneButton,
  PropertyPaneButtonType,
} from "@microsoft/sp-property-pane";
import {
  PropertyFieldPeoplePicker,
  PrincipalType,
  IPropertyFieldGroupOrPerson,
} from "@pnp/spfx-property-controls/lib/PropertyFieldPeoplePicker";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";
import { SPFI, spfi, SPFx } from "@pnp/sp";
import * as strings from "QualityDocumentManagementWebPartStrings";
import QualityDocumentManagement from "./components/QualityDocumentManagement";
import { IQualityDocumentManagementProps } from "./components/IQualityDocumentManagementProps";

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/site-groups/web";
import "@pnp/sp/site-groups";
import "@pnp/sp/security";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/items";

export interface ILibraryConfiguration {
  id: string;
  title: string;
  tabName: string;
  administrators: IPropertyFieldGroupOrPerson[];
}

export interface IQualityDocumentManagementWebPartProps {
  appTitle: string;

  library1Id: string;
  library1TabName: string;
  library1Administrators: IPropertyFieldGroupOrPerson[];

  library2Id: string;
  library2TabName: string;
  library2Administrators: IPropertyFieldGroupOrPerson[];

  library3Id: string;
  library3TabName: string;
  library3Administrators: IPropertyFieldGroupOrPerson[];

  library4Id: string;
  library4TabName: string;
  library4Administrators: IPropertyFieldGroupOrPerson[];

  library5Id: string;
  library5TabName: string;
  library5Administrators: IPropertyFieldGroupOrPerson[];

  library6Id: string;
  library6TabName: string;
  library6Administrators: IPropertyFieldGroupOrPerson[];

  configurationVersion: number;
}

interface ILibraryOption {
  id: string;
  title: string;
}

export default class QualityDocumentManagementWebPart extends BaseClientSideWebPart<IQualityDocumentManagementWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = "";
  private _sp!: SPFI;
  private _availableLibraries: ILibraryOption[] = [];

  public render(): void {
    const libraries: ILibraryConfiguration[] = this._getConfiguredLibraries();

    const element: React.ReactElement<IQualityDocumentManagementProps> =
      React.createElement(QualityDocumentManagement, {
        appTitle: this.properties.appTitle,
        libraries,
        isDarkTheme: this._isDarkTheme,
        configurationVersion: this.properties.configurationVersion || 0,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        userDisplayEmail: this.context.pageContext.user.email,
        user: this.context.pageContext.user,
        context: this.context,
        sp: this._sp,
      });

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    this._sp = spfi().using(SPFx(this.context));
    this._environmentMessage = await this._getEnvironmentMessage();

    await this._loadLibraries();
  }

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

  private _getLibraryOptions(): IPropertyPaneDropdownOption[] {
    return this._availableLibraries.map((library) => ({
      key: library.id,
      text: library.title,
    }));
  }

  private _getConfiguredLibraries(): ILibraryConfiguration[] {
    const libraries: ILibraryConfiguration[] = [];

    const configuredLibraries = [
      {
        id: this.properties.library1Id,
        tabName: this.properties.library1TabName,
        administrators: this.properties.library1Administrators || [],
      },
      {
        id: this.properties.library2Id,
        tabName: this.properties.library2TabName,
        administrators: this.properties.library2Administrators || [],
      },
      {
        id: this.properties.library3Id,
        tabName: this.properties.library3TabName,
        administrators: this.properties.library3Administrators || [],
      },
      {
        id: this.properties.library4Id,
        tabName: this.properties.library4TabName,
        administrators: this.properties.library4Administrators || [],
      },
      {
        id: this.properties.library5Id,
        tabName: this.properties.library5TabName,
        administrators: this.properties.library5Administrators || [],
      },
      {
        id: this.properties.library6Id,
        tabName: this.properties.library6TabName,
        administrators: this.properties.library6Administrators || [],
      },
    ];

    configuredLibraries.forEach((library) => {
      if (!library.id) {
        return;
      }

      const selectedLibrary = this._availableLibraries.find(
        (availableLibrary) => availableLibrary.id === library.id,
      );

      if (!selectedLibrary) {
        return;
      }

      libraries.push({
        id: selectedLibrary.id,
        title: selectedLibrary.title,
        tabName: library.tabName || selectedLibrary.title,
        administrators: library.administrators,
      });
    });

    return libraries;
  }

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

  private _handleSaveConfiguration = (): void => {
    this.properties.configurationVersion =
      (this.properties.configurationVersion || 0) + 1;
  };
  

  private _isLibrariesConfigurationValid(): boolean {
    const libraries = [
      {
        id: this.properties.library1Id,
        tabName: this.properties.library1TabName,
      },
      {
        id: this.properties.library2Id,
        tabName: this.properties.library2TabName,
      },
      {
        id: this.properties.library3Id,
        tabName: this.properties.library3TabName,
      },
      {
        id: this.properties.library4Id,
        tabName: this.properties.library4TabName,
      },
      {
        id: this.properties.library5Id,
        tabName: this.properties.library5TabName,
      },
      {
        id: this.properties.library6Id,
        tabName: this.properties.library6TabName,
      },
    ];

    // At least one library must be selected
    const hasAtLeastOneLibrary = libraries.some((library) => !!library.id);

    if (!hasAtLeastOneLibrary) {
      return false;
    }

    // Every selected library must have a tab name
    const isValid = libraries.every((library) => {
      // Library slot is not used
      if (!library.id) {
        return true;
      }

      // Library is selected, so Tab Name is required
      return !!library.tabName?.trim();
    });

    return isValid;
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const libraryOptions = this._getLibraryOptions();
    const selectedLibraryIds = [
      this.properties.library1Id,
      this.properties.library2Id,
      this.properties.library3Id,
      this.properties.library4Id,
      this.properties.library5Id,
      this.properties.library6Id,
    ].filter(Boolean);

    const getLibraryOptions = (
      currentLibraryId?: string,
    ): IPropertyPaneDropdownOption[] => {
      return libraryOptions.filter(
        (option) =>
          option.key === currentLibraryId ||
          selectedLibraryIds.indexOf(option.key.toString()) === -1,
      );
    };

    return {
      pages: [
        {
          header: {
            description: "Configure Quality Documents",
          },
          groups: [
            {
              groupName: "General",
              groupFields: [
                PropertyPaneTextField("appTitle", {
                  label: "App Title",
                  placeholder: "Enter app title",
                  description: "Leave blank to hide the title.",
                }),
              ],
            },
            {
              groupName: "Document Libraries (max 6)",
              groupFields: [
                PropertyPaneTextField("library1TabName", {
                  label: "Library 1 - Tab Name",
                  placeholder: "Enter tab name",
                }),

                PropertyPaneDropdown("library1Id", {
                  label: "Library 1 - Document Library",
                  options: getLibraryOptions(this.properties.library1Id),
                  disabled: libraryOptions.length === 0,
                }),
                PropertyFieldPeoplePicker("library1Administrators", {
                  label: "Library 1 - Administrators",
                  initialData: this.properties.library1Administrators || [],
                  allowDuplicate: false,
                  multiSelect: true,
                  principalType: [
                    PrincipalType.Users,
                    PrincipalType.SharePoint,
                    PrincipalType.Security,
                  ],
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  context: this.context,
                  properties: this.properties,
                  deferredValidationTime: 0,
                  key: "library1AdministratorsFieldId",
                  searchTextLimit: 1,
                }),

                ...(this.properties.library1Id &&
                this.properties.library1TabName
                  ? [
                      PropertyPaneHorizontalRule(),
                      PropertyPaneTextField("library2TabName", {
                        label: "Library 2 - Tab Name",
                        placeholder: "Enter tab name",
                      }),

                      PropertyPaneDropdown("library2Id", {
                        label: "Library 2 - Document Library",
                        options: getLibraryOptions(this.properties.library2Id),
                        disabled: libraryOptions.length === 0,
                      }),
                      PropertyFieldPeoplePicker("library2Administrators", {
                        label: "Library 2 - Administrators",
                        initialData:
                          this.properties.library2Administrators || [],
                        allowDuplicate: false,
                        multiSelect: true,
                        principalType: [
                          PrincipalType.Users,
                          PrincipalType.SharePoint,
                          PrincipalType.Security,
                        ],
                        onPropertyChange: this.onPropertyPaneFieldChanged,
                        context: this.context,
                        properties: this.properties,
                        deferredValidationTime: 0,
                        key: "library2AdministratorsFieldId",
                        searchTextLimit: 1,
                      }),
                    ]
                  : []),
                ...(this.properties.library2Id &&
                this.properties.library2TabName
                  ? [
                      PropertyPaneHorizontalRule(),
                      PropertyPaneTextField("library3TabName", {
                        label: "Library 3 - Tab Name",
                        placeholder: "Enter tab name",
                      }),

                      PropertyPaneDropdown("library3Id", {
                        label: "Library 3 - Document Library",
                        options: getLibraryOptions(this.properties.library3Id),
                        disabled: libraryOptions.length === 0,
                      }),
                      PropertyFieldPeoplePicker("library3Administrators", {
                        label: "Library 3 - Administrators",
                        initialData:
                          this.properties.library3Administrators || [],
                        allowDuplicate: false,
                        multiSelect: true,
                        principalType: [
                          PrincipalType.Users,
                          PrincipalType.SharePoint,
                          PrincipalType.Security,
                        ],
                        onPropertyChange: this.onPropertyPaneFieldChanged,
                        context: this.context,
                        properties: this.properties,
                        deferredValidationTime: 0,
                        key: "library3AdministratorsFieldId",
                        searchTextLimit: 1,
                      }),
                    ]
                  : []),
                ...(this.properties.library3Id &&
                this.properties.library3TabName
                  ? [
                      PropertyPaneHorizontalRule(),
                      PropertyPaneTextField("library4TabName", {
                        label: "Library 4 - Tab Name",
                        placeholder: "Enter tab name",
                      }),

                      PropertyPaneDropdown("library4Id", {
                        label: "Library 4 - Document Library",
                        options: getLibraryOptions(this.properties.library4Id),
                        disabled: libraryOptions.length === 0,
                      }),
                      PropertyFieldPeoplePicker("library4Administrators", {
                        label: "Library 4 - Administrators",
                        initialData:
                          this.properties.library4Administrators || [],
                        allowDuplicate: false,
                        multiSelect: true,
                        principalType: [
                          PrincipalType.Users,
                          PrincipalType.SharePoint,
                          PrincipalType.Security,
                        ],
                        onPropertyChange: this.onPropertyPaneFieldChanged,
                        context: this.context,
                        properties: this.properties,
                        deferredValidationTime: 0,
                        key: "library4AdministratorsFieldId",
                        searchTextLimit: 1,
                      }),
                    ]
                  : []),
                ...(this.properties.library4Id &&
                this.properties.library4TabName
                  ? [
                      PropertyPaneHorizontalRule(),
                      PropertyPaneTextField("library5TabName", {
                        label: "Library 5 - Tab Name",
                        placeholder: "Enter tab name",
                      }),

                      PropertyPaneDropdown("library5Id", {
                        label: "Library 5 - Document Library",
                        options: getLibraryOptions(this.properties.library5Id),
                        disabled: libraryOptions.length === 0,
                      }),
                      PropertyFieldPeoplePicker("library5Administrators", {
                        label: "Library 5 - Administrators",
                        initialData:
                          this.properties.library5Administrators || [],
                        allowDuplicate: false,
                        multiSelect: true,
                        principalType: [
                          PrincipalType.Users,
                          PrincipalType.SharePoint,
                          PrincipalType.Security,
                        ],
                        onPropertyChange: this.onPropertyPaneFieldChanged,
                        context: this.context,
                        properties: this.properties,
                        deferredValidationTime: 0,
                        key: "library5AdministratorsFieldId",
                        searchTextLimit: 1,
                      }),
                    ]
                  : []),
                ...(this.properties.library5Id &&
                this.properties.library5TabName
                  ? [
                      PropertyPaneHorizontalRule(),
                      PropertyPaneTextField("library6TabName", {
                        label: "Library 6 - Tab Name",
                        placeholder: "Enter tab name",
                      }),

                      PropertyPaneDropdown("library6Id", {
                        label: "Library 6 - Document Library",
                        options: getLibraryOptions(this.properties.library6Id),
                        disabled: libraryOptions.length === 0,
                      }),
                      PropertyFieldPeoplePicker("library6Administrators", {
                        label: "Library 6 - Administrators",
                        initialData:
                          this.properties.library6Administrators || [],
                        allowDuplicate: false,
                        multiSelect: true,
                        principalType: [
                          PrincipalType.Users,
                          PrincipalType.SharePoint,
                          PrincipalType.Security,
                        ],
                        onPropertyChange: this.onPropertyPaneFieldChanged,
                        context: this.context,
                        properties: this.properties,
                        deferredValidationTime: 0,
                        key: "library6AdministratorsFieldId",
                        searchTextLimit: 1,
                      }),
                    ]
                  : []),
              ],
            },
            {
              groupFields: [
                PropertyPaneButton("prepareLibraries", {
                  text: "Prepare Document Libraries",
                  buttonType: PropertyPaneButtonType.Primary,
                  onClick: this._handleSaveConfiguration,
                  disabled: !this._isLibrariesConfigurationValid(),
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
