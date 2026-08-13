import {
  IPropertyPaneConfiguration,
  PropertyPaneButton,
  PropertyPaneButtonType,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";

import { IQualityDocumentManagementWebPartProps } from "../QualityDocumentManagementWebPart";

interface IPropertyPaneConfigurationProps {
  properties: IQualityDocumentManagementWebPartProps;
  onConfigureLibraries: () => void;
}

export const getPropertyPaneConfiguration = ({
  properties,
  onConfigureLibraries,
}: IPropertyPaneConfigurationProps): IPropertyPaneConfiguration => {
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
            groupName: "Document Libraries",
            groupFields: [
              PropertyPaneButton("configureLibraries", {
                text: "Configure Document Libraries",
                buttonType: PropertyPaneButtonType.Primary,
                onClick: onConfigureLibraries,
              }),
            ],
          },
        ],
      },
    ],
  };
};
