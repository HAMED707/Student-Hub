import { createContext, useContext } from "react";

export const CommunityContext = createContext(null);

export function useCommunity() {
  const context = useContext(CommunityContext);

  if (!context) {
    throw new Error("useCommunity must be used inside CommunityProvider");
  }

  return context;
}
