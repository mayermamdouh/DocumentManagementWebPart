import { SPFI } from "@pnp/sp";
import {
  ILibraryDocument,
  IQualityDocumentForm,
} from "../../../../../types/adminTypes";
import {
  AddNewDocument,
  PublishDocument,
} from "../../../../../services/AdminServices/DocumentService";

interface IUseDocumentActionsProps {
  sp: SPFI;
  libraryName: string;
  setDocuments: React.Dispatch<React.SetStateAction<ILibraryDocument[]>>;
}

export const useAddDocumentActions = ({
  sp,
  libraryName,
  setDocuments,
}: IUseDocumentActionsProps) => {
  const saveDraft = async (formData: IQualityDocumentForm) => {
    const document = await AddNewDocument(sp, libraryName, formData);

    setDocuments((prev) => [...prev, document]);
    return document;
  };

  const saveAndPublish = async (formData: IQualityDocumentForm) => {
    const document = await AddNewDocument(sp, libraryName, formData);

    await PublishDocument(sp, libraryName, document.Id);

    const publishedDocument: ILibraryDocument = {
      ...document,
      OData__ModerationStatus: 0,
      ApprovalStatus: "Approved",
    };

    setDocuments((prev) => [...prev, publishedDocument]);

    return publishedDocument;
  };

  return {
    saveDraft,
    saveAndPublish,
  };
};