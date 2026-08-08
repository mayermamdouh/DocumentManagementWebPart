import React from "react";
import { IEditCatergoties } from "../../../../types/adminTypes";
import { useCategoryContext } from "../../../../contexts/CategoryContext";
import AppPopup from "../../../common/AppPopup/AppPopup";
import styles from "./EditCatergoties.module.scss";
import AppInput from "../../../common/AppInput/AppInput";
import AppButton from "../../../common/AppButton/AppButton";
import { useSharePoint } from "../../../../contexts/SharePointContext";
import { useNotification } from "../../../../contexts/NotificationContext";
import { ICategory } from "../../../../types/commonTypes";
import { useEditCategories } from "./hooks/useEditCategories";

const EditCatergoties = ({ open, setOpen }: IEditCatergoties) => {
  const { sp } = useSharePoint();
  const { setError, setMessage } = useNotification();
  const { categoriesMap, refreshCategories } = useCategoryContext();

  const oldCategories: ICategory[] = Object.values(categoriesMap).map(
    (category) => ({
      Id: category.Id,
      Title: category.Title,
    }),
  );

  const {
    newCategory,
    handleNewCategoryChange,
    categoryError,
    visibleCategories,
    pendingRemoveCategory,
    librariesContentCategory,
    isSaveDisabled,
    handleAddNewCategory,
    handleRemoveCategory,
    confirmRemoveCategory,
    cancelRemoveCategory,
    handleSaveCategories,
  } = useEditCategories({
    sp,
    oldCategories,
    onSuccess: refreshCategories,
    onClose: () => setOpen(false),
    setError,
    setMessage,
  });

  if (!open) {
    return null;
  }

  return (
    <>
      <AppPopup Title="Edit Categories values" onClose={() => setOpen(false)}>
        <section className={styles.editSection}>
          <ul className={styles.categoriesUl}>
            {visibleCategories.map((category) => (
              <li key={category.Id} className={styles.categoryItem}>
                {category.Title}

                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => handleRemoveCategory(category)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.addCatSection}>
            <div className={styles.addCategoryDiv}>
              <AppInput
                label="Add New Category"
                value={newCategory}
                onChange={handleNewCategoryChange}
                errorMessage={categoryError ? categoryError : undefined}
              />

              <AppButton
                text="Add"
                variant="success"
                onClick={handleAddNewCategory}
              />
            </div>
          </div>

          <div className={styles.editButtons}>
            <AppButton
              fullWidth
              text="Save"
              onClick={handleSaveCategories}
              disabled={isSaveDisabled}
            />

            <AppButton
              fullWidth
              text="Cancel"
              variant="secondary"
              onClick={() => setOpen(false)}
            />
          </div>
        </section>
      </AppPopup>

      {pendingRemoveCategory && (
        <AppPopup Title="Remove Category" onClose={cancelRemoveCategory}>
          <section className={styles.confirmRemoveSection}>
            {librariesContentCategory.length > 0 && (
              <div>
                This category is used in the following libraries:
                <ul>
                  {librariesContentCategory.map((library) => (
                    <li key={library}>{library}</li>
                  ))}
                </ul>
              </div>
            )}

            <p>
              Removing it will clear the category value from those documents. Do
              you want to continue?
            </p>

            <div className={styles.editButtons}>
              <AppButton
                fullWidth
                text="Yes"
                variant="success"
                onClick={confirmRemoveCategory}
              />

              <AppButton
                fullWidth
                text="Cancel"
                variant="secondary"
                onClick={cancelRemoveCategory}
              />
            </div>
          </section>
        </AppPopup>
      )}
    </>
  );
};

export default EditCatergoties;
