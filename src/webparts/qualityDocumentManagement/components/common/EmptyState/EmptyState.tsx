import * as React from "react";
import { Icon } from "@fluentui/react";
import styles from "./EmptyState.module.scss";

interface IEmptyStateProps {
  title?: string;
  description?: string;
  iconName?: string;
}

const EmptyState = ({
  title = "No data found",
  description = "There are no items to display.",
  iconName = "SearchIssue",
}: IEmptyStateProps): JSX.Element => {
  return (
    <div className={styles.container}>
      <Icon iconName={iconName} className={styles.icon} />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
};

export default EmptyState;
