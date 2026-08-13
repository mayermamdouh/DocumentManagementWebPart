import * as React from "react";
import styles from "./LibraryConfigurationItem.module.scss";
import LibraryConfigurationItem from "./LibraryConfigurationItem";

import {
  ILibraryConfiguration,
  ILibraryOption,
} from "../../config/types/ILibraryConfiguration";

import AppPopup from "../../components/common/AppPopup/AppPopup";
import AppButton from "../../components/common/AppButton/AppButton";

interface ILibraryConfigurationPopupProps {
  libraries: ILibraryConfiguration[];
  availableLibraries: ILibraryOption[];
  context: any;
  onSave: (libraries: ILibraryConfiguration[]) => void;
  onClose: () => void;
}

const LibraryConfigurationPopup = ({
  libraries,
  availableLibraries,
  context,
  onSave,
  onClose,
}: ILibraryConfigurationPopupProps) => {
  const [draftLibraries, setDraftLibraries] =
    React.useState<ILibraryConfiguration[]>(libraries);

  const handleLibraryChange = (
    index: number,
    updatedLibrary: ILibraryConfiguration,
  ): void => {
    setDraftLibraries((currentLibraries) =>
      currentLibraries.map((library, libraryIndex) =>
        libraryIndex === index ? updatedLibrary : library,
      ),
    );
  };

  const handleRemoveLibrary = (index: number): void => {
    setDraftLibraries((currentLibraries) =>
      currentLibraries.filter((_, libraryIndex) => libraryIndex !== index),
    );
  };

  const handleAddLibrary = (): void => {
    if (draftLibraries.length >= 6) {
      return;
    }

    setDraftLibraries((currentLibraries) => [
      ...currentLibraries,
      {
        id: "",
        title: "",
        tabName: "",
        administrators: [],
      },
    ]);
  };

  const handleSave = (): void => {
    onSave(draftLibraries);
  };

  const isSaveDisabled =
    draftLibraries.length === 0 ||
    draftLibraries.some(
      (library) => !library.id || !library.tabName.trim() || !library.title,
    );

  return (
    <AppPopup Title="Configure Document Libraries" onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.librariesScroll}>
          {draftLibraries.map((library, index) => (
            <LibraryConfigurationItem
              key={`${library.id || "new"}-${index}`}
              library={library}
              index={index}
              availableLibraries={availableLibraries}
              selectedLibraries={draftLibraries}
              context={context}
              onChange={handleLibraryChange}
              onRemove={handleRemoveLibrary}
            />
          ))}
        </div>

        <div className={styles.actions}>
          {draftLibraries.length < 6 && (
            <div className={styles.addLibrary}>
              <AppButton
                text="Add Library"
                iconName="Add"
                variant="secondary"
                size="md"
                onClick={handleAddLibrary}
              />
            </div>
          )}

          <div className={styles.footer}>
            <AppButton
              text="Save"
              fullWidth={true}
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={isSaveDisabled}
            />

            <AppButton
              text="Cancel"
              variant="secondary"
              size="md"
              fullWidth={true}
              onClick={onClose}
            />
          </div>
        </div>
      </div>
    </AppPopup>
  );
};

export default LibraryConfigurationPopup;
