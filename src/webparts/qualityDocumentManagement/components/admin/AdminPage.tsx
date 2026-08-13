import React, { useCallback, useEffect, useState } from "react";
import styles from "./AdminPage.module.scss";

import { useCategoryContext } from "../../contexts/CategoryContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useSharePoint } from "../../contexts/SharePointContext";

import AppSearchBox from "../common/AppSearchBox/AppSearchBox";
import AppDropdown from "../common/AppDropdown/AppDropdown";
import AppButton from "../common/AppButton/AppButton";
import AppLoading from "../common/AppLoading/Apploading";

import EditCatergoties from "./components/EditCatergoties/EditCatergoties";
import AddNewDoc from "./components/AddNewDocument/AddNewDoc";
import DocumentTable from "./components/DocumentTable/DocumentTable";

import { IAdminPage, ILibraryDocument } from "../../types/adminTypes";

import { getLibraryDocuemnts } from "../../services/AdminServices/DocumentService";
import { exportDocumentsToExcel } from "./service/ExportExcelService";
import { useAdminDocumentFilter } from "./hooks/useAdminDocumentFilter";
import { useDocumentSession } from "../../hooks/useDocumentSession";

const AdminPage = ({ libraryName }: IAdminPage) => {
  const { activeLibraryId, admin, updateAdminValue, clearAdminFilters } =
    useDocumentSession();

  const { valueTypeFilter, selectedCategory, searchTerm } = admin;

  const { categoriesMap } = useCategoryContext();
  const { setError } = useNotification();
  const { sp } = useSharePoint();

  const [openCategorySetting, setOpenCategorySetting] =
    useState<boolean>(false);
  const [openAddNewDoc, setOpenAddNewDoc] = useState<boolean>(false);
  const [documents, setDocuments] = useState<ILibraryDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDocuments = useCallback(async () => {
    if (!activeLibraryId) {
      setDocuments([]);
      return;
    }

    setLoading(true);

    try {
      const documents = await getLibraryDocuemnts(sp, activeLibraryId);
      setDocuments(documents);
      console.log("fetch get library documents");
    } catch (error) {
      console.error("Failed to fetch library documents:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to get Library Documents",
      );
    } finally {
      setLoading(false);
    }
  }, [sp, activeLibraryId, setError]);

  const refreshDocuments = async () => {
    await fetchDocuments();
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = useAdminDocumentFilter({
    documents,
    searchValue: searchTerm,
    categoryFilter: selectedCategory,
    typeFilter: valueTypeFilter,
  });

  const handleExportExcel = () => {
    exportDocumentsToExcel(filteredDocuments, libraryName);
  };

  // const handleDocumentAdded = useCallback((document: ILibraryDocument) => {
  //   setDocuments((prev) => [...prev, document]);
  // }, []);

  // const handleDocumentUpdated = useCallback(
  //   (updatedDocument: ILibraryDocument) => {
  //     setDocuments((prev) =>
  //       prev.map((document) =>
  //         document.Id === updatedDocument.Id ? updatedDocument : document,
  //       ),
  //     );
  //   },
  //   [],
  // );

  // const handleDocumentDeleted = useCallback((documentId: number) => {
  //   setDocuments((prev) =>
  //     prev.filter((document) => document.Id !== documentId),
  //   );
  // }, []);

  return (
    <section className={styles.adminSection}>
      <div className={styles.toolsDiv}>
        <AppSearchBox
          fullWidth={true}
          value={searchTerm}
          placeholder="Search by name, referance, department..."
          onChange={(value) => updateAdminValue("searchTerm", value)}
        />

        <AppButton
          variant="secondary"
          iconName="Edit"
          onClick={() => setOpenCategorySetting(true)}
          text="Category Setting"
        />

        <AppButton
          variant="success"
          iconName="ExcelDocument"
          text="Export Excel"
          onClick={handleExportExcel}
        />

        <AppButton
          iconName="Add"
          text="Add New Document"
          onClick={() => setOpenAddNewDoc(true)}
        />
      </div>

      <div className={styles.filtersDiv}>
        <AppDropdown
          placeholder="Filter by category..."
          value={selectedCategory ?? undefined}
          onChange={(value) => updateAdminValue("selectedCategory", value)}
          options={Object.keys(categoriesMap).map((key) => {
            const category = categoriesMap[Number(key)];

            return {
              key: category.Id,
              text: category.Title,
            };
          })}
        />

        <AppDropdown
          placeholder="Filter by type..."
          value={valueTypeFilter ?? undefined}
          onChange={(value) => updateAdminValue("valueTypeFilter", value)}
          options={[
            {
              key: "Parent",
              text: "Parent",
            },
            {
              key: "Child",
              text: "Child",
            },
          ]}
        />

        <AppButton
          variant="secondary"
          onClick={clearAdminFilters}
          text="Reset Filters"
        />
      </div>

      {openCategorySetting && (
        <EditCatergoties
          open={openCategorySetting}
          setOpen={setOpenCategorySetting}
          onRefresh={refreshDocuments}
        />
      )}

      {openAddNewDoc && (
        <AddNewDoc
          setOpen={setOpenAddNewDoc}
          libraryName={libraryName}
          setDocuments={setDocuments}
        />
      )}

      {loading ? (
        <AppLoading />
      ) : (
        <DocumentTable
          documents={filteredDocuments}
          valueTypeFilter={valueTypeFilter}
          libraryName={libraryName}
          setDocuments={setDocuments}
        />
      )}
    </section>
  );
};

export default AdminPage;
