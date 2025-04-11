import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, ReactNode } from "react";

export interface State {
  baseUrl: string;
  queryClient: QueryClient;
}

interface DataTableContextProps {
  baseUrl: string;
  queryClient: QueryClient;
  children: ReactNode | ReactNode[];
}

export const DataTableContext = createContext<State | undefined>(undefined);

export function DataTableProvider({
  children,
  baseUrl,
  queryClient,
}: DataTableContextProps) {
  return (
    <DataTableContext.Provider value={{ baseUrl, queryClient }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DataTableContext.Provider>
  );
}
