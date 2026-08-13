import { useEffect, useState } from "react";
import { useDocumentSession } from "../../../../hooks/useDocumentSession";

export const useActiveLibrary = <T extends { id: string }>(libraries: T[]) => {
  const { activeLibraryId, updateValue } = useDocumentSession();

  useEffect(() => {
    if (libraries.length === 0) {
      updateValue({ activeLibraryId: null });
      return;
    }

    const activeLibraryExists = libraries.some(
      (library) => library.id === activeLibraryId,
    );

    if (!activeLibraryExists) {
      updateValue({ activeLibraryId: libraries[0].id });
    }
  }, [libraries, activeLibraryId, updateValue]);

  const currentLibrary = libraries.find(
    (library) => library.id === activeLibraryId,
  );

  return {
    currentLibrary,
  };
};
