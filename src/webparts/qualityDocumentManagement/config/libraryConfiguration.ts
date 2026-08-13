import { ILibraryConfiguration } from "./types/ILibraryConfiguration";
import { IQualityDocumentManagementWebPartProps } from "../QualityDocumentManagementWebPart";
import { ILibraryOption } from "./types/ILibraryConfiguration";

export const getConfiguredLibraries = (
  properties: IQualityDocumentManagementWebPartProps,
  availableLibraries: ILibraryOption[],
): ILibraryConfiguration[] => {
  const configuredLibraries = [
    {
      id: properties.library1Id,
      tabName: properties.library1TabName,
      administrators: properties.library1Administrators || [],
    },
    {
      id: properties.library2Id,
      tabName: properties.library2TabName,
      administrators: properties.library2Administrators || [],
    },
    {
      id: properties.library3Id,
      tabName: properties.library3TabName,
      administrators: properties.library3Administrators || [],
    },
    {
      id: properties.library4Id,
      tabName: properties.library4TabName,
      administrators: properties.library4Administrators || [],
    },
    {
      id: properties.library5Id,
      tabName: properties.library5TabName,
      administrators: properties.library5Administrators || [],
    },
    {
      id: properties.library6Id,
      tabName: properties.library6TabName,
      administrators: properties.library6Administrators || [],
    },
  ];

  return configuredLibraries
    .filter((library) => !!library.id)
    .map((library) => {
      const selectedLibrary = availableLibraries.find(
        (availableLibrary) => availableLibrary.id === library.id,
      );

      if (!selectedLibrary) {
        return null;
      }

      return {
        id: selectedLibrary.id,
        title: selectedLibrary.title,
        tabName: library.tabName ,
        administrators: library.administrators,
      };
    })
    .filter((library): library is ILibraryConfiguration => library !== null);
};

export const applyLibrariesToProperties = (
  properties: IQualityDocumentManagementWebPartProps,
  libraries: ILibraryConfiguration[],
): void => {
  const normalizedLibraries = libraries.slice(0, 6);

  const getLibrary = (index: number): ILibraryConfiguration => {
    return (
      normalizedLibraries[index] || {
        id: "",
        title: "",
        tabName: "",
        administrators: [],
      }
    );
  };

  const library1 = getLibrary(0);
  const library2 = getLibrary(1);
  const library3 = getLibrary(2);
  const library4 = getLibrary(3);
  const library5 = getLibrary(4);
  const library6 = getLibrary(5);

  properties.library1Id = library1.id;
  properties.library1TabName = library1.tabName;
  properties.library1Administrators = library1.administrators;

  properties.library2Id = library2.id;
  properties.library2TabName = library2.tabName;
  properties.library2Administrators = library2.administrators;

  properties.library3Id = library3.id;
  properties.library3TabName = library3.tabName;
  properties.library3Administrators = library3.administrators;

  properties.library4Id = library4.id;
  properties.library4TabName = library4.tabName;
  properties.library4Administrators = library4.administrators;

  properties.library5Id = library5.id;
  properties.library5TabName = library5.tabName;
  properties.library5Administrators = library5.administrators;

  properties.library6Id = library6.id;
  properties.library6TabName = library6.tabName;
  properties.library6Administrators = library6.administrators;
};

export const isLibrariesConfigurationValid = (
  libraries: ILibraryConfiguration[],
): boolean => {
  if (libraries.length === 0 || libraries.length > 6) {
    return false;
  }

  const hasInvalidLibrary = libraries.some(
    (library) => !library.id || !library.tabName?.trim(),
  );

  if (hasInvalidLibrary) {
    return false;
  }

  const libraryIds = libraries.map((library) => library.id);

  return new Set(libraryIds).size === libraryIds.length;
};
