import React from "react";
import styles from "./UserPage.module.scss";
import AppSearchBox from "../common/AppSearchBox/AppSearchBox";
import AppDropdown from "../common/AppDropdown/AppDropdown";
import AppButton from "../common/AppButton/AppButton";
import AppLoading from "../common/AppLoading/Apploading";
import { useCategoryContext } from "../../contexts/CategoryContext";
import { useUserDocuments } from "./hooks/useUserDocuments";
import UserDocumentTree from "./components/UserDocumentTree";
import { IUserPage } from "../../types/userTypes";

const UserPage = ({ activeLibraryId, libraryName }: IUserPage) => {
  const { categoriesMap } = useCategoryContext();

  const {
    searchValue,
    setSearchValue,
    categoryFilter,
    setCategoryFilter,
    documents,
    loading,
    hasSearched,
    searchDocuments,
    resetSearch,
  } = useUserDocuments({
    libraryName,
    activeLibraryId,
  });

  const categoryOptions = Object.keys(categoriesMap).map((key) => {
    const category = categoriesMap[Number(key)];

    return {
      key: category.Id,
      text: category.Title,
    };
  });

  return (
    <section className={styles.userSection}>
      <div className={styles.toolsDiv}>
        <div className={styles.flexRow}>
          <AppSearchBox
            value={searchValue}
            fullWidth={true}
            placeholder="Search by name, reference, department..."
            onChange={setSearchValue}
          />

          <AppDropdown
            placeholder="Filter by category..."
            value={categoryFilter ?? undefined}
            onChange={setCategoryFilter}
            options={categoryOptions}
          />
        </div>
        <div className={styles.flexRow}>
          <AppButton fullWidth={true} text="Search" onClick={searchDocuments} />

          <AppButton
            fullWidth={true}
            variant="secondary"
            text="Reset"
            onClick={resetSearch}
          />
        </div>
      </div>

      <div className={styles.resultsDiv}>
        {loading && <AppLoading />}

        {!loading && !hasSearched && (
          <div className={styles.emptyState}>
            <h3>Search for a quality document</h3>

            <p>
              Enter a document name, reference, or department to find a
              document.
            </p>
          </div>
        )}

        {!loading && hasSearched && documents.length === 0 && (
          <div className={styles.emptyState}>
            <h3>No documents found</h3>

            <p>No approved documents matched your search criteria.</p>
          </div>
        )}

        {!loading && documents.length > 0 && (
          <UserDocumentTree
            documents={documents}
            activeLibraryId={activeLibraryId}
          />
        )}
      </div>
    </section>
  );
};

export default UserPage;
