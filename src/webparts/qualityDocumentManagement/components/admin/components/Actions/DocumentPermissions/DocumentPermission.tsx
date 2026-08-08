import React from "react";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import AppButton from "../../../../common/AppButton/AppButton";
import { IDocumentPermissionProps } from "../../../../../types/adminTypes";
import { useSharePoint } from "../../../../../contexts/SharePointContext";
import styles from "./DocumentPermission.module.scss";
import { useDocumentPermissions } from "../hooks/useDocumentPermissions";
import AppLoading from "../../../../common/AppLoading/Apploading";

const DocumentPermission = ({
  documentId,
  libraryName,
  onClose,
}: IDocumentPermissionProps) => {
  const { sp, context } = useSharePoint();

  const {
    selectedPeople,
    permissions,
    isLoading,
    isSaveDisabled,
    handlePeopleChange,
    handleAdd,
    handleRemove,
    handleSave,
  } = useDocumentPermissions({
    sp,
    documentId,
    libraryName,
  });

  return (
    <div className={styles.container}>
      <div className={styles.addRow}>
        <div className={styles.peoplePicker}>
          <PeoplePicker
            context={context as any}
            webAbsoluteUrl={context.pageContext.web.absoluteUrl}
            titleText="User or Group"
            personSelectionLimit={1}
            defaultSelectedUsers={selectedPeople}
            showtooltip={true}
            required={true}
            ensureUser={true}
            resolveDelay={200}
            principalTypes={[
              PrincipalType.User,
              PrincipalType.SharePointGroup,
              PrincipalType.SecurityGroup,
              PrincipalType.DistributionList,
            ]}
            onChange={handlePeopleChange}
          />
        </div>

        <div className={styles.addButton}>
          <AppButton
            text="Add"
            fullWidth={true}
            size="sm"
            variant="primary"
            onClick={handleAdd}
            disabled={!selectedPeople.length || isLoading}
          />
        </div>
      </div>

      <div className={styles.permissionsSection}>
        <h3 className={styles.title}>People and Groups with access</h3>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Permission</th>
                <th className={styles.actionHeader}>Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>
                    <AppLoading />
                  </td>
                </tr>
              ) : permissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    No users or groups have been added.
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.loginName}>
                    <td>{permission.title}</td>

                    <td>{permission.principalType}</td>

                    <td>{permission.permissions.join(", ")}</td>

                    <td className={styles.actionCell}>
                      <AppButton
                        text="Remove"
                        size="sm"
                        variant="danger"
                        disabled={
                          permission.permissions.join(", ") === "Full Control"
                        }
                        onClick={() => handleRemove(permission.loginName)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footer}>
        <AppButton
          text="Save"
          variant="primary"
          onClick={handleSave}
          fullWidth={true}
          disabled={isSaveDisabled || isLoading}
        />

        <AppButton
          text="Cancel"
          variant="secondary"
          onClick={onClose}
          fullWidth={true}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default DocumentPermission;
