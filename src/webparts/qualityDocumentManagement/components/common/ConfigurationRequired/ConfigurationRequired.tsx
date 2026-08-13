import * as React from "react";
import { IConfigurationRequiredProps } from "../../../types/commonTypes";
import styles from "./ConfigurationRequired.module.scss";

const ConfigurationRequired = ({
  hasLibraries,
}: IConfigurationRequiredProps) => {
  const getMessage = (): string => {
    if (!hasLibraries) {
      return "Please configure at least one document library in the property pane.";
    }

    return "Please click the Save button to continue.";
  };

  return (
    <div className={styles.configurationRequired}>
      <div className={styles.content}>
        <h2 className={styles.title}>Configuration Required</h2>
        <p className={styles.message}>{getMessage()}</p>
      </div>
    </div>
  );
};

export default ConfigurationRequired;
