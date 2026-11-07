import { useState } from "react";
import { usePersistentState } from "./usePersistentState.ts";
import { initialPageSize, PAGE_SIZES, PageState, PagingOptions } from "../utils/pagination.ts";

/** Page and page size of a list; the size a user picks holds for every table that offers it. */
export function usePageState(options: PagingOptions = {}): PageState {
  const pageSizes = options.pageSizes ?? PAGE_SIZES;
  const fallback = initialPageSize(options);
  const [picked, setPicked] = usePersistentState(fallback, "mantine-table-page-size");
  const [ownPage, setOwnPage] = useState(1);

  const setPage = (page: number) => {
    if (options.page === undefined) setOwnPage(page);
    options.onPageChange?.(page);
  };

  return {
    page: options.page ?? ownPage,
    recordsPerPage: pageSizes.includes(picked) ? picked : fallback,
    pageSizes,
    setPage,
    changeRecordsPerPage: (size: number) => {
      setPicked(size);
      setPage(1);
    },
  };
}
