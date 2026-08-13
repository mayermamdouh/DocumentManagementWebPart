import { IPropertyFieldGroupOrPerson } from "@pnp/spfx-property-controls/lib/PropertyFieldPeoplePicker";

export interface ILibraryOption {
  id: string;
  title: string;
}

export interface ILibraryConfiguration {
  id: string;
  title: string;
  tabName: string;
  administrators: IPropertyFieldGroupOrPerson[];
}
