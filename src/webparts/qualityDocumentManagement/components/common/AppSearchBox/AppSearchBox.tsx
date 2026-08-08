import * as React from "react";
import { Icon } from "@fluentui/react";
import styles from "./AppSearchBox.module.scss";

interface IAppSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

const AppSearchBox = ({
  value,
  onChange,
  placeholder = "Search...",
  fullWidth = true,
  disabled = false,
}: IAppSearchBoxProps): React.ReactElement => {
  return (
    <div className={`${styles.container} ${fullWidth ? styles.fullWidth : ""}`}>
      <Icon iconName="Search" className={styles.icon} />

      <input
        className={styles.input}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default AppSearchBox;
