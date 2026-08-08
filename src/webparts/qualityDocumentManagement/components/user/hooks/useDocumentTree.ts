import { useMemo } from "react";
import {
  IUserDocumentTreeNode,
  IUserLibraryDocument,
} from "../../../types/userTypes";

export const useDocumentTree = (
  documents: IUserLibraryDocument[],
): IUserDocumentTreeNode[] => {
  return useMemo(() => {
    const documentMap = new Map<number, IUserLibraryDocument>();

    documents.forEach((document) => {
      documentMap.set(document.Id, document);
    });

    const documentNodeMap = new Map<number, IUserDocumentTreeNode>();

    documents.forEach((document) => {
      documentNodeMap.set(document.Id, {
        ...document,
        children: [],
      });
    });

    const rootNodes: IUserDocumentTreeNode[] = [];

    documents.forEach((document) => {
      const currentNode = documentNodeMap.get(document.Id);

      if (!currentNode) {
        return;
      }

      let parentId = document.DocParent;
      const visitedIds = new Set<number>();
      let visibleParent: IUserDocumentTreeNode | undefined;

      while (parentId !== null && parentId !== undefined) {
        if (visitedIds.has(parentId)) {
          break;
        }

        visitedIds.add(parentId);

        const parentNode = documentNodeMap.get(parentId);

        if (parentNode) {
          visibleParent = parentNode;
          break;
        }

        const hiddenParent = documentMap.get(parentId);

        if (!hiddenParent) {
          break;
        }

        parentId = hiddenParent.DocParent;
      }

      if (visibleParent) {
        visibleParent.children.push(currentNode);
      } else {
        rootNodes.push(currentNode);
      }
    });

    return rootNodes;
  }, [documents]);
};
