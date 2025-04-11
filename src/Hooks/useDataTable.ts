import { useContext } from "react";
import { DataTableContext, State } from "../Context/DataTableContext.tsx";

export function useDataTable(): State {
  const context = useContext(DataTableContext);

  if (context === undefined) {
    throw new Error("useDataTable must be used within a DataTableProvider");
  }

  return context;
}
