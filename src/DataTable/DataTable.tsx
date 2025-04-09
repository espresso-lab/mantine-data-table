import { BaseEntity } from "../Hooks/useApi.ts";
import { DataTableInner, DataTableProps } from "./DataTableInner.tsx";
import { QueryClientProvider } from "@tanstack/react-query";

export function DataTable<T extends BaseEntity>(props: DataTableProps<T>) {
  return (
    <QueryClientProvider client={props.queryClient}>
      <DataTableInner<T> {...props} />
    </QueryClientProvider>
  );
}
