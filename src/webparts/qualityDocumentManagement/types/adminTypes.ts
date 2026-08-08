import { AdminActionType } from "../components/admin/components/Actions/AdminActions";

export interface IEditCatergoties {
  open: boolean;
  setOpen: (value: boolean) => void;
}

export interface IAdminPage {
  activeLibraryId: string;
  libraryName: string;
}

export interface IAddNewDoc {
  setOpen: (value: boolean) => void;
  libraryName: string;
  onRefresh: () => Promise<void>;
}

export interface IDocumentForm {
  onCancel: () => void;
  libraryName: string;
  onDocumentCreated: (itemId: number) => void;
}

export interface IQualityDocumentForm {
  file: File | null;
  docReference: string;
  docName: string;
  docType: "Parent" | "Child";
  docParent?: number;
  docCategory: string;
  docDepartment: string;
  docKeywords: string;
  docOwnerId?: number;
  docOwnerLoginName?: string;
}

export interface ISearchParent {
  Id: number;
  DocName: string;
}

export interface ILibraryDocument {
  Id: number;
  FileLeafRef: string;
  FileRef: string;
  File: {
    Name: string;
    ServerRelativeUrl: string;
  };

  Created: string;

  Author?: {
    Id: number;
    Title: string;
    EMail: string;
  };

  OData__ModerationStatus: number;
  DocReference: string;
  DocName: string;
  DocType: "Parent" | "Child";
  DocParent?: number;
  DocParentName?: string;
  DocCategory: string;
  DocDepartment: string;
  DocKeywords: string;
  ApprovalStatus: string;

  DocOwner?: {
    Id: number;
    Title: string;
    EMail: string;
  };
}

export interface IDocumentParent {
  Id: number;
  DocParent: number | null;
}

export interface IDocumentTableProps {
  documents: ILibraryDocument[];
  libraryName: string;
  onRefresh: () => Promise<void>;
}

export interface IAdminActions {
  document: ILibraryDocument;
  libraryName: string;
  onRefresh: () => Promise<void>;
}

export interface IAdminActionsProps {
  document: ILibraryDocument;
  onAction: (action: AdminActionType) => void;
}

export interface IViewAndEditDoc {
  document: ILibraryDocument;
  mode: "view" | "edit";
  onClose: () => void;
}

export interface IEditAndViewDocumentFormProps {
  onRefresh: () => Promise<void>;
  document: ILibraryDocument;
  mode: "view" | "edit";
  onClose: () => void;
  libraryName: string;
}

export interface IReplaceFormProps {
  document: ILibraryDocument;
  onClose: () => void;
  libraryName: string;
  onRefresh: () => Promise<void>;
}

export interface IEditDocumentFormData {
  docName: string;
  docReference: string;
  docType: "Parent" | "Child";
  docParent?: number;
  docCategory: string;
  docDepartment: string;
  docKeywords: string;
  docOwnerId?: number;
}

export interface IFileVersion {
  ID: number;
  VersionLabel: string;
  Created: string;
  ModifiedBy?: {
    Title?: string;
  };
  IsCurrentVersion?: boolean;
  IsApprovalVersion?: boolean;
}

export interface ICurrentFile {
  Name: string;
  TimeLastModified: string;
  MajorVersion: number;
  MinorVersion: number;
  ModifiedBy?: {
    Title?: string;
    Email?: string;
  };
}

export interface IDocumentVersionsProps {
  serverRelativeUrl: string;
  onRefreshDocuments: () => Promise<void>;
  isRejected: boolean;
}

export interface IDocumentPermissionProps {
  documentId: number;
  libraryName: string;
  onClose: () => void;
}
export interface IDocumentDeleteProps {
  documentId: number;
  libraryName: string;
  onClose: () => void;
  onRefreshDocuments: () => Promise<void>;
}

export interface IDocumentVersionsActions {
  selectedVersion: IFileVersion | null;
  serverRelativeUrl: string;
  versions: IFileVersion[];
  onRefresh: () => Promise<void>;
  onRefreshDocuments: () => Promise<void>;
  isRejected: boolean;
}

export interface IPermissionEntry {
  id: number;
  title: string;
  loginName: string;
  principalType: string;
  permissions: string[];
}

export interface IDocumentChildrenInfo {
  childrenCount: number;
  children: {
    id: number;
    name: string;
  }[];
}