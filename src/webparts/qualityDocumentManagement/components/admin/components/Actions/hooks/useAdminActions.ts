import { useState } from "react";
import { ILibraryDocument } from "../../../../../types/adminTypes";

type PopupType =
  | "view"
  | "edit"
  | "replace"
  | "versionHistory"
  | "Permissions"
  | null;

const useAdminActions = (
  document: ILibraryDocument,
  libraryName: string,
  onRefresh: () => void,
) => {
  const [popupType, setPopupType] = useState<PopupType>(null);

  const handleClosePopup = () => {
    setPopupType(null);
  };

  return {
    document,
    libraryName,
    onRefresh,
    popupType,
    setPopupType,
    handleClosePopup,
  };
};

export default useAdminActions;
