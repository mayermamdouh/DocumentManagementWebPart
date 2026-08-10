import { useCallback, useEffect, useState } from "react";
import { SPFI } from "@pnp/sp";
import { IPermissionEntry } from "../../../../../types/adminTypes";
import {
  getDocumentPermissions,
  getPrincipalType,
  getPrincipalTypeName,
  updateDocumentPermissions,
} from "../../../../../services/AdminServices/DocumentPermissions";
import { useNotification } from "../../../../../contexts/NotificationContext";

interface IUseDocumentPermissionsProps {
  sp: SPFI;
  documentId: number;
  libraryName: string;
  onClose: () => void;
}

export const useDocumentPermissions = ({
  sp,
  documentId,
  libraryName,
  onClose,
}: IUseDocumentPermissionsProps) => {
  const { setError, setMessage } = useNotification();
  const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<IPermissionEntry[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<
    IPermissionEntry[]
  >([]);
  const [addedPermissions, setAddedPermissions] = useState<IPermissionEntry[]>(
    [],
  );
  const [removedPermissions, setRemovedPermissions] = useState<
    IPermissionEntry[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const isSaveDisabled =
    addedPermissions.length === 0 && removedPermissions.length === 0;

  const handlePeopleChange = useCallback((items: any[]) => {
    setSelectedPeople(items);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!selectedPeople.length) return;

    const newPermissions: IPermissionEntry[] = [];

    for (const person of selectedPeople) {
      const alreadyExists = permissions.some(
        (permission) => permission.loginName === person.loginName,
      );

      if (alreadyExists) continue;

      const principalType = await getPrincipalType(sp, person.loginName);

      newPermissions.push({
        id: person.id,
        title: person.text,
        loginName: person.loginName,
        principalType: getPrincipalTypeName(principalType ?? 0),
        permissions: ["Read"],
      });
    }

    if (!newPermissions.length) {
      setSelectedPeople([]);
      return;
    }

    setPermissions((prev) => [...prev, ...newPermissions]);

    setAddedPermissions((prev) => {
      const updatedAdded = [...prev];

      for (const newPermission of newPermissions) {
        const alreadyAdded = updatedAdded.some(
          (permission) => permission.loginName === newPermission.loginName,
        );

        if (!alreadyAdded) {
          updatedAdded.push(newPermission);
        }
      }

      return updatedAdded;
    });

    setRemovedPermissions((prev) =>
      prev.filter(
        (removedPermission) =>
          !newPermissions.some(
            (newPermission) =>
              newPermission.loginName === removedPermission.loginName,
          ),
      ),
    );

    setSelectedPeople([]);
  }, [selectedPeople, permissions, sp]);

  const handleRemove = useCallback(
    (loginName: string) => {
      setPermissions((prev) =>
        prev.filter((permission) => permission.loginName !== loginName),
      );

      const isOriginalPermission = originalPermissions.some(
        (permission) => permission.loginName === loginName,
      );

      if (isOriginalPermission) {
        const permissionToRemove = originalPermissions.find(
          (permission) => permission.loginName === loginName,
        );

        if (!permissionToRemove) return;

        setRemovedPermissions((prev) => {
          const alreadyRemoved = prev.some(
            (permission) => permission.loginName === loginName,
          );

          if (alreadyRemoved) {
            return prev;
          }

          return [...prev, permissionToRemove];
        });
      } else {
        setAddedPermissions((prev) =>
          prev.filter((permission) => permission.loginName !== loginName),
        );
      }
    },
    [originalPermissions],
  );

  const loadPermissions = useCallback(async () => {
    try {
      setIsLoading(true);

      const permissionsData = await getDocumentPermissions(
        sp,
        libraryName,
        documentId,
      );

      setPermissions(permissionsData);
      setOriginalPermissions(permissionsData);
      setAddedPermissions([]);
      setRemovedPermissions([]);
      setSelectedPeople([]);
    } catch (error) {
      console.error("Failed to load document permissions:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load document permissions",
      );
    } finally {
      setIsLoading(false);
    }
  }, [sp, libraryName, documentId, setError]);

  const handleSave = useCallback(async () => {
    if (isSaveDisabled) return;

    try {
      setIsLoading(true);

      await updateDocumentPermissions(
        sp,
        libraryName,
        documentId,
        addedPermissions,
        removedPermissions,
      );

      setMessage("Document permissions updated successfully.");
      onClose();
    } catch (error) {
      console.error("Failed to save document permissions:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save document permissions",
      );
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    isSaveDisabled,
    addedPermissions,
    removedPermissions,
    loadPermissions,
    setError,
  ]);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  return {
    selectedPeople,
    permissions,
    isLoading,
    isSaveDisabled,
    handlePeopleChange,
    handleAdd,
    handleRemove,
    handleSave,
  };
};
