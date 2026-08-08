import * as React from "react";
import { Spinner, SpinnerSize } from "@fluentui/react";
import styles from "./AppLoading.module.scss";

interface IAppLoadingProps {
  label?: string;
  fullScreen?: boolean;
}

const AppLoading = ({
  label = "Loading...",
  fullScreen = false,
}: IAppLoadingProps): JSX.Element => {
  return (
    <div
      className={`${styles.container} ${fullScreen ? styles.fullScreen : ""}`}
    >
      <Spinner
        size={SpinnerSize.large}
        label={label}
        styles={{
          circle: {
            borderTopColor: "var(--color-primary)",
          },
          label: {
            color: "var(--color-primary)",
          },
        }}
      />
    </div>
  );
};

export default AppLoading;
