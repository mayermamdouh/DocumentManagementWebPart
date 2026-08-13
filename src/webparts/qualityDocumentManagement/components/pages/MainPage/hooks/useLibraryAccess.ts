import { useMemo } from "react";
import { IQualityDocumentManagementProps } from "../../../IQualityDocumentManagementProps";


type GetAdministratorLogin = (
  admin: NonNullable<
    IQualityDocumentManagementProps["libraries"][number]["administrators"]
  >[number],
) => string;

export const useLibraryAccess = (
  props: IQualityDocumentManagementProps,
  isSiteAdmin: boolean,
  getAdministratorLogin: GetAdministratorLogin,
) => {
  const currentUserLogin = useMemo(() => {
    return props.context.pageContext.user.loginName
      .replace(/^i:0#.f\|membership\|/i, "")
      .toLowerCase();
  }, [props.context.pageContext.user.loginName]);

  const isLibraryAdministrator = useMemo(() => {
    return props.libraries.some((library) =>
      (library.administrators ?? []).some(
        (admin) => getAdministratorLogin(admin) === currentUserLogin,
      ),
    );
  }, [
    props.libraries,
    currentUserLogin,
    getAdministratorLogin,
  ]);

  const visibleLibraries = useMemo(() => {
    if (isSiteAdmin) {
      return props.libraries;
    }

    if (!isLibraryAdministrator) {
      return props.libraries;
    }

    return props.libraries.filter((library) =>
      (library.administrators ?? []).some(
        (admin) =>
          getAdministratorLogin(admin) === currentUserLogin,
      ),
    );
  }, [
    props.libraries,
    isSiteAdmin,
    isLibraryAdministrator,
    currentUserLogin,
    getAdministratorLogin,
  ]);

  return {
    currentUserLogin,
    isLibraryAdministrator,
    visibleLibraries,
  };
};
