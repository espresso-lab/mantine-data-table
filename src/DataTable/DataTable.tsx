import { BaseEntity } from "../Hooks/useApi.ts";
import { DataTableInner, DataTableProps } from "./DataTableInner.tsx";

export function DataTable<T extends BaseEntity>(props: DataTableProps<T>) {
  return <DataTableInner<T> {...props} />;
}
