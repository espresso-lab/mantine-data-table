import React, { createContext, useContext } from "react";

export interface Crumb {
  label: React.ReactNode;
  onClick?: () => void;
}

export const BreadcrumbContext = createContext<Crumb[]>([]);

export function useBreadcrumbTrail(): Crumb[] {
  return useContext(BreadcrumbContext);
}
