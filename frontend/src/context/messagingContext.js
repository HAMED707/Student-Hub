import { createContext, useContext } from "react";

export const MessagingContext = createContext(null);

export function useGlobalMessaging() {
  const context = useContext(MessagingContext);

  if (!context) {
    throw new Error("useGlobalMessaging must be used inside MessagingProvider");
  }

  return context;
}
