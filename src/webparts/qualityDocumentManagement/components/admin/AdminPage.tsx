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

const AdminPage = ({ activeLibraryId, libraryName }: IAdminPage) => {
  const { categoriesMap } = useCategoryContext();
  const { setError } = useNotification();
  const { sp } = useSharePoint();

  const [searchValue, setSearchvalue] = useState<string>("");

  const [openCategorySetting, setOpenCategorySetting] =
    useState<boolean>(false);

  const [openAddNewDoc, setOpenAddNewDoc] = useState<boolean>(false);

  const [documents, setDocuments] = useState<ILibraryDocument[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const [valueCategoryFilter, setValueCategoryFilter] = useState<string | null>(
    null,
  );

  const [valueTypeFilter, setValueTypeFilter] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);

    try {
      const documents = await getLibraryDocuemnts(sp, activeLibraryId);

      setDocuments(documents);
    } catch (error) {
      console.error("Failed to fetch library documents:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to get Library Docuemnts",
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

  const filteredDocuments = documents.filter((doc) => {
    const searchTerm = searchValue.trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      doc.DocName?.toLowerCase().includes(searchTerm) ||
      doc.DocReference?.toLowerCase().includes(searchTerm) ||
      doc.DocDepartment?.toLowerCase().includes(searchTerm);

    const matchesCategory =
      !valueCategoryFilter || doc.DocCategory === valueCategoryFilter;

    const matchesType = !valueTypeFilter || doc.DocType === valueTypeFilter;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleExportExcel = () => {
    exportDocumentsToExcel(filteredDocuments, libraryName);
  };

  return (
    <section className={styles.adminSection}>
      <div className={styles.toolsDiv}>
        <AppSearchBox
          fullWidth={true}
          value={searchValue}
          placeholder="Search by name, referance, department..."
          onChange={(value) => setSearchvalue(value)}
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
          value={valueCategoryFilter ?? undefined}
          onChange={setValueCategoryFilter}
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
          onChange={setValueTypeFilter}
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
          onClick={() => {
            setValueCategoryFilter(null);
            setValueTypeFilter(null);
          }}
          text="Reset Filters"
        />
      </div>

      {openCategorySetting && (
        <EditCatergoties
          open={openCategorySetting}
          setOpen={setOpenCategorySetting}
        />
      )}

      {openAddNewDoc && (
        <AddNewDoc
          setOpen={setOpenAddNewDoc}
          libraryName={libraryName}
          onRefresh={refreshDocuments}
        />
      )}

      {loading ? (
        <AppLoading />
      ) : (
        <DocumentTable
          documents={filteredDocuments}
          libraryName={libraryName}
          onRefresh={refreshDocuments}
        />
      )}
    </section>
  );
};

export default AdminPage;
