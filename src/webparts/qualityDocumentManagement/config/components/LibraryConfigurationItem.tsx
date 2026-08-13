import * as React from "react";

import styles from "./LibraryConfigurationItem.module.scss";

import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";

import {
  ILibraryConfiguration,
  ILibraryOption,
} from "../../config/types/ILibraryConfiguration";

import AppInput from "../../components/common/AppInput/AppInput";
import AppButton from "../../components/common/AppButton/AppButton";
import { IPropertyFieldGroupOrPerson } from "@pnp/spfx-property-controls";

interface ILibraryConfigurationItemProps {
  library: ILibraryConfiguration;
  index: number;
  availableLibraries: ILibraryOption[];
  selectedLibraries: ILibraryConfiguration[];
  context: any;
  onChange: (index: number, library: ILibraryConfiguration) => void;
  onRemove: (index: number) => void;
}

const LibraryConfigurationItem = ({
  library,
  index,
  availableLibraries,
  selectedLibraries,
  context,
  onChange,
  onRemove,
}: ILibraryConfigurationItemProps) => {
  const selectedLibraryIds = selectedLibraries
    .filter((_, libraryIndex) => libraryIndex !== index)
    .map((item) => item.id);

  const options = availableLibraries.filter(
    (option) =>
      option.id === library.id || !selectedLibraryIds.includes(option.id),
  );

  const handleLibraryChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    const selectedLibrary = availableLibraries.find(
      (option) => option.id === event.target.value,
    );

    if (!selectedLibrary) {
      return;
    }

    onChange(index, {
      ...library,
      id: selectedLibrary.id,
      title: selectedLibrary.title,
    });
  };

  const handleTabNameChange = (value: string): void => {
    onChange(index, {
      ...library,
      tabName: value,
    });
  };

  const handleAdministratorsChange = (users: any[]): void => {
    onChange(index, {
      ...library,
      administrators: users,
    });
  };

  return (
    <div className={styles.libraryItem}>
      <div className={styles.header}>
        <h3 className={styles.title}>Library {index + 1}</h3>
      </div>

      <div className={styles.fields}>
        <div className={styles.firstRow}>
          <div className={styles.tabField}>
            <AppInput
              label="Tab Name"
              value={library.tabName}
              placeholder="Enter tab name"
              onChange={handleTabNameChange}
            />
          </div>
          <div className={styles.libraryField}>
            <label className={styles.label}>Document Library</label>

            <select
              className={styles.select}
              value={library.id}
              onChange={handleLibraryChange}
            >
              <option value="">Select document library</option>

              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.secondRow}>
          <div className={styles.administratorsField}>
            <label className={styles.label}>Administrators</label>

            <PeoplePicker
              context={context as any}
              webAbsoluteUrl={context.pageContext.web.absoluteUrl}
              titleText=""
              showtooltip={true}
              required={false}
              disabled={false}
              ensureUser={true}
              resolveDelay={200}
              principalTypes={[
                PrincipalType.User,
                PrincipalType.SharePointGroup,
                PrincipalType.SecurityGroup,
                PrincipalType.DistributionList,
              ]}
              defaultSelectedUsers={library.administrators
                .map((administrator) => {
                  const admin = administrator as IPropertyFieldGroupOrPerson & {
                    loginName?: string;
                    secondaryText?: string;
                  };

                  return admin.secondaryText || admin.loginName || "";
                })
                .filter(Boolean)}
              onChange={handleAdministratorsChange}
            />
          </div>

          <AppButton
            text="Remove"
            variant="danger"
            size="sm"
            iconName="Delete"
            onClick={() => onRemove(index)}
            disabled={selectedLibraries.length === 1}
          />
        </div>
      </div>
    </div>
  );
};

export default LibraryConfigurationItem;
