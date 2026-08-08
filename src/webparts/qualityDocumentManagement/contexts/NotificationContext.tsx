import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface INotificationContextValue {
  error: string | null;
  message: string | null;

  setError: (error: unknown) => void;
  setMessage: (message: string) => void;

  clearError: () => void;
  clearMessage: () => void;
}

const NotificationContext = createContext<
  INotificationContextValue | undefined
>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [error, setErrorState] = useState<string | null>(null);
  const [message, setMessageState] = useState<string | null>(null);

  const setError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setErrorState(error.message);
      return;
    }

    if (typeof error === "string") {
      setErrorState(error);
      return;
    }

    if (error && typeof error === "object" && "message" in error) {
      const errorMessage = (error as { message?: unknown }).message;

      if (typeof errorMessage === "string") {
        setErrorState(errorMessage);
        return;
      }
    }

    setErrorState("An unexpected error occurred.");
  }, []);

  const setMessage = useCallback((message: string) => {
    setMessageState(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const clearMessage = useCallback(() => {
    setMessageState(null);
  }, []);

  const value = useMemo(
    () => ({
      error,
      message,
      setError,
      setMessage,
      clearError,
      clearMessage,
    }),
    [error, message, setError, setMessage, clearError, clearMessage],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): INotificationContextValue => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used inside NotificationProvider");
  }

  return context;
};
