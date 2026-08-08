import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPFI } from "@pnp/sp";
import { ILibraryConfiguration } from "../QualityDocumentManagementWebPart";

export interface IQualityDocumentManagementProps {
  appTitle: string;
  libraries: ILibraryConfiguration[];

  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  userDisplayEmail: string;
  user: any;
  context: WebPartContext;
  sp: SPFI;
  configurationVersion: number;
}
