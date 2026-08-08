export const DOCUMENT_COLUMNS = {
  DOCUMENT_REFERENCE: "DocReference",
  DOCUMENT_NAME: "DocName",
  DOCUMENT_TYPE: "DocType",
  PARENT_DOCUMENT: "DocParent",
  CATEGORY: "DocCategory",
  DEPARTMENT: "DocDepartment",
  KEYWORDS: "DocKeywords",
  OWNER: "DocOwner",
} as const;

export const DOCUMENTCATEGORIESNAME = "DocumentCategories" as const;

export const DOCUMENT_RELATION_COLUMNS = {
  DOCUMENT_ID: "DocumentId",
  PARENT_DOCUMENT_ID: "ParentDocumentId",
} as const;

export const FILE_FIELDS = {
  ID: "ID",
  VERSION_LABEL: "VersionLabel",
  CREATED: "Created",
  IS_CURRENT_VERSION: "IsCurrentVersion",
  CREATED_BY_TITLE: "CreatedBy/Title",
  NAME: "Name",
  TIME_LAST_MODIFIED: "TimeLastModified",
  MAJOR_VERSION: "MajorVersion",
  MINOR_VERSION: "MinorVersion",
  MODIFIED_BY_TITLE: "ModifiedBy/Title",
} as const;