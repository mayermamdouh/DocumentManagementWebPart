import * as React from "react";
import { Icon } from "@fluentui/react";
import styles from "./NoPermission.module.scss";

interface INoPermissionProps {
  title?: string;
  description?: string;
}

const NoPermission = ({
  title = "Access Denied",
  description = "You don't have permission to access this page.",
}: INoPermissionProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <Icon iconName="Blocked2" className={styles.icon} />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
};

export default NoPermission;
