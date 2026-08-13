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
import { useDocumentSession } from "../../hooks/useDocumentSession";

const UserPage = ({ libraryName }: IUserPage) => {
  const { user, updateUserValue, clearUserFilters } = useDocumentSession();

  const { categoriesMap } = useCategoryContext();

  const { documents, loading, hasSearched, searchDocuments, resetSearch } =
    useUserDocuments({
      libraryName,
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
            value={user.searchTerm}
            fullWidth={true}
            placeholder="Search by name, reference, department..."
            onChange={(value) => updateUserValue("searchTerm", value)}
          />

          <AppDropdown
            placeholder="Filter by category..."
            value={user.selectedCategory ?? undefined}
            onChange={(value) => updateUserValue("selectedCategory", value)}
            options={categoryOptions}
          />
        </div>

        <div className={styles.flexRow}>
          <AppButton fullWidth={true} text="Search" onClick={searchDocuments} />

          <AppButton
            fullWidth={true}
            variant="secondary"
            text="Reset"
            onClick={()=> {
                clearUserFilters();
                resetSearch();
            }}
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
          <UserDocumentTree documents={documents} />
        )}
      </div>
    </section>
  );
};

export default UserPage;
