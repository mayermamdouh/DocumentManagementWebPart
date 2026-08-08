import { SPFI } from "@pnp/sp";
import { IQualityDocumentForm } from "../../../../../types/adminTypes";
import {
  AddNewDocument,
  PublishDocument,
} from "../../../../../services/AdminServices/DocumentService";

interface IUseDocumentActionsProps {
  sp: SPFI;
  libraryName: string;
}

export const useAddDocumentActions = ({
  sp,
  libraryName,
}: IUseDocumentActionsProps) => {

  const saveDraft = (formData: IQualityDocumentForm) => {
    return AddNewDocument(sp, libraryName, formData);
  };

  const saveAndPublish = async (formData: IQualityDocumentForm) => {
    const itemId = await AddNewDocument(sp, libraryName, formData);

    await PublishDocument(sp, libraryName, itemId);

    return itemId;
  };

  return {
    saveDraft,
    saveAndPublish,
  };
};
