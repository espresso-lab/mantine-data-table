import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, ReactNode } from "react";

export type GetHeaders = () => Promise<HeadersInit>;

export interface State {
  baseUrl: string;
  queryClient: QueryClient;
  getHeaders: GetHeaders;
}

interface DataTableContextProps {
  baseUrl: string;
  queryClient: QueryClient;
  getHeaders: GetHeaders;
  children: ReactNode | ReactNode[];
}

export const DataTableContext = createContext<State | undefined>(undefined);

const defaultGetHeaders: GetHeaders = async () => ({
  "Content-Type": "application/json",
});

export function DataTableProvider({
  children,
  baseUrl,
  queryClient,
  getHeaders = defaultGetHeaders,
}: DataTableContextProps) {
  return (
    <DataTableContext.Provider value={{ baseUrl, queryClient, getHeaders }}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </DataTableContext.Provider>
  );
}
