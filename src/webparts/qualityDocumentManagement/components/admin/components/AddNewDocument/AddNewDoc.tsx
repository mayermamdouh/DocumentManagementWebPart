import React, { useState } from "react";
import { IAddNewDoc } from "../../../../types/adminTypes";
import AppPopup from "../../../common/AppPopup/AppPopup";
import styles from "./AddNewDoc.module.scss";
import AddDocumentForm from "../forms/AddDocumentForm";
import DocumentPermission from "../Actions/DocumentPermissions/DocumentPermission";

const AddNewDoc = ({ setOpen, libraryName, setDocuments }: IAddNewDoc) => {
  const [permissionItemId, setPermissionItemId] = useState<number | null>(null);

  const handleDocumentCreated = (itemId: number) => {
    setPermissionItemId(itemId);
  };

  const handleClosePermissions = async () => {
    setOpen(false);
    setPermissionItemId(null);
  };

  return (
    <>
      {permissionItemId === null ? (
        <AppPopup
          Title="Add New Document"
          onClose={() => setOpen(false)}
          scrollable={false}
        >
          <section className={styles.addNewDocSection}>
            <AddDocumentForm
              onCancel={() => setOpen(false)}
              libraryName={libraryName}
              onDocumentCreated={handleDocumentCreated}
              setDocuments={setDocuments}
            />
          </section>
        </AppPopup>
      ) : (
        <AppPopup Title="Document Permissions" onClose={handleClosePermissions}>
          <DocumentPermission
            documentId={permissionItemId}
            libraryName={libraryName}
            onClose={handleClosePermissions}
          />
        </AppPopup>
      )}
    </>
  );
};

export default AddNewDoc;
