import { useState } from "react";
import { usePersistentState } from "./usePersistentState.ts";
import { initialPageSize, PAGE_SIZES, PageState, PagingOptions } from "../utils/pagination.ts";

/**
 * Page and page size of a list; the size a user picks holds for every table that offers it. The page belongs to the
 * `scope` it was chosen in — the filters of the list — and is page 1 again as soon as they change.
 */
export function usePageState(options: PagingOptions = {}, scope = ""): PageState {
  const pageSizes = options.pageSizes ?? PAGE_SIZES;
  const fallback = initialPageSize(options);
  const [picked, setPicked] = usePersistentState(fallback, "mantine-table-page-size");
  const [own, setOwn] = useState({ page: 1, scope });

  const setPage = (page: number) => {
    if (options.page === undefined) setOwn({ page, scope });
    options.onPageChange?.(page);
  };

  return {
    page: options.page ?? (own.scope === scope ? own.page : 1),
    recordsPerPage: pageSizes.includes(picked) ? picked : fallback,
    pageSizes,
    setPage,
    changeRecordsPerPage: (size: number) => {
      setPicked(size);
      setPage(1);
    },
  };
}
