import * as XLSX from "xlsx";
import { ILibraryDocument } from "../../../types/adminTypes";

export const exportDocumentsToExcel = (
  documents: ILibraryDocument[],
  libraryName: string,
): void => {
  const rows = documents.map((doc) => ({
    "Document Name": doc.DocName,
    "Document Reference": doc.DocReference,
    "Document Type": doc.DocType,
    "Parent Document": doc.DocParentName ?? "",
    Category: doc.DocCategory,
    Department: doc.DocDepartment,
    Keywords: doc.DocKeywords,
    Owner: doc.DocOwner?.Title ?? "",
    "Owner Email": doc.DocOwner?.EMail ?? "",
    Status: doc.ApprovalStatus,
    "Created By": doc.Author?.Title ?? "",
    "Creator Email": doc.Author?.EMail ?? "",
    Created: new Date(doc.Created).toLocaleString(),
    "File Name": doc.File.Name,
    "File URL": doc.File.ServerRelativeUrl,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 22 },
    { wch: 25 },
    { wch: 60 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");

  XLSX.writeFile(workbook, `${libraryName}-Documents.xlsx`);
};
