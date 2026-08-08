export interface IUserLibraryDocument {
  Id: number;
  hasAccess: boolean;
  File?: {
    Name: string;
    ServerRelativeUrl: string;
  };
  FileLeafRef?: string;
  FileRef?: string;
  Created?: string;
  Author?: {
    Id: number;
    Title: string;
    EMail: string;
  };

  OData__ModerationStatus?: number;
  DocReference: string;
  DocName: string;
  DocType?: "Parent" | "Child";
  DocParent?: number | null;
  DocParentName?: string;
  DocCategory: string;
  DocDepartment: string;
  DocKeywords?: string;
  ApprovalStatus?: string;

  DocOwner?: {
    Id: number;
    Title: string;
    EMail: string;
  };
}

export interface IUserPage {
  activeLibraryId: string;
  libraryName: string;
}

export interface IUseUserDocumentsProps {
  libraryName: string;
  activeLibraryId: string;
}

export interface IUserDocumentTreeNode extends IUserLibraryDocument {
  children: IUserDocumentTreeNode[];
}

export interface IUserDocumentTreeNodeProps {
  document: IUserDocumentTreeNode;
}

export interface IUserDocumentTreeProps {
  documents: IUserLibraryDocument[];
  activeLibraryId: string;
}
