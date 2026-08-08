import * as React from "react";
import { SPFI } from "@pnp/sp";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IConfiguredLibrary {
  id: string;
  title: string;
  tabName: string;
}

interface ISharePointContext {
  sp: SPFI;
  context: WebPartContext;
  libraries: IConfiguredLibrary[];
}

export const SharePointContext = React.createContext<
  ISharePointContext | undefined
>(undefined);

interface ISharePointProviderProps {
  sp: SPFI;
  context: WebPartContext;
  libraries: IConfiguredLibrary[];
  children: React.ReactNode;
}

export const SharePointProvider = ({
  sp,
  context,
  libraries,
  children,
}: ISharePointProviderProps): JSX.Element => {
  return (
    <SharePointContext.Provider
      value={{
        sp,
        context,
        libraries,
      }}
    >
      {children}
    </SharePointContext.Provider>
  );
};

export const useSharePoint = (): ISharePointContext => {
  const context = React.useContext(SharePointContext);

  if (!context) {
    throw new Error("useSharePoint must be used inside SharePointProvider");
  }

  return context;
};
