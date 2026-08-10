export interface IConfigurationRequiredProps {
  hasLibraries?: boolean;
}

export interface ICategory {
  Id: number;
  Title: string;
}

export interface ICategoryIdMap {
  [key: number]: ICategory;
}
