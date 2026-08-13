import {
  ILibraryConfiguration,
  ILibraryOption,
} from "./ILibraryConfiguration";

export interface IQualityDocumentManagementProps {
  appTitle: string;

  libraries: ILibraryConfiguration[];

  availableLibraries: ILibraryOption[];

  isDarkTheme: boolean;

  configurationVersion: number;

  environmentMessage: string;

  hasTeamsContext: boolean;

  userDisplayName: string;

  userDisplayEmail: string;

  user: any;

  context: any;

  sp: any;

  isConfigurationPopupOpen: boolean;

  onOpenConfiguration: () => void;

  onCloseConfiguration: () => void;

  onSaveConfiguration: (
    libraries: ILibraryConfiguration[],
  ) => void;
}
