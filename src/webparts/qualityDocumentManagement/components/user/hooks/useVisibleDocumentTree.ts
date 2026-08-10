import { useMemo } from "react";
import { IUserDocumentTreeNode } from "../../../types/userTypes";

export const useVisibleDocumentTree = (
  tree: IUserDocumentTreeNode[],
): IUserDocumentTreeNode[] => {
  return useMemo(() => {
    const compress = (node: IUserDocumentTreeNode): IUserDocumentTreeNode[] => {
      const visibleChildren = node.children.flatMap(compress);

      const isApproved =
        (node.OData__ModerationStatus === undefined &&
          visibleChildren.length > 0) ||
        node.OData__ModerationStatus === 0;

      if (isApproved) {
        return [
          {
            ...node,
            children: visibleChildren,
          },
        ];
      }

      return visibleChildren;
    };

    return tree.flatMap(compress);
  }, [tree]);
};
