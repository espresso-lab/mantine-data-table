import { BaseEntity } from "../Hooks/useApi.ts";
import { DataTableInner, DataTableProps } from "./DataTableInner.tsx";
import { QueryClientProvider } from "@tanstack/react-query";
import { useDataTable } from "../Hooks/useDataTable.ts";

export function DataTable<T extends BaseEntity>(props: DataTableProps<T>) {
  const { queryClient } = useDataTable();
  return (
    <QueryClientProvider client={queryClient}>
      <DataTableInner<T> {...props} />
    </QueryClientProvider>
  );
}
