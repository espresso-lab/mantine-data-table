import { useContext } from "react";
import { DataTableContext } from "../Context/DataTableContext.tsx";

export function useDataTable() {
  const context = useContext(DataTableContext);

  if (context === undefined) {
    throw new Error("useDataTable must be used within a DataTableProvider");
  }

  return context;
}
