export const PAGE_SIZES = [10, 15, 50, 100, 500];

const DEFAULT_PAGE_SIZE = 15;

/** Where a paged list stands and how to move on; the records a table shows are the current page. */
export interface TablePagination {
  page: number;
  totalRecords: number;
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  recordsPerPageOptions?: number[];
  onRecordsPerPageChange?: (size: number) => void;
}

/** A page of records as a server answers it. */
export interface Page<T> {
  items: T[];
  total: number;
}

/** How a table pages: the sizes a user can pick, the size before they pick one and, if the caller keeps it, the page. */
export interface PagingOptions {
  /** One size or none hides the choice. Default 10, 15, 50, 100 and 500. */
  pageSizes?: number[];
  /** Default 15, or the first of `pageSizes`; a size the user picked before wins while it is one of `pageSizes`. */
  pageSize?: number;
  /** The page, when the caller keeps it (URL, state); without it the table keeps its own. */
  page?: number;
  onPageChange?: (page: number) => void;
}

/** What a table asks a server for. */
export interface PageRequest {
  /** Counted from 1. */
  page: number;
  size: number;
  sort: string;
  direction: "asc" | "desc";
  search?: string;
}

/** How a server pages: the query parameters of a request and how to read the answer. */
export interface ServerPaging<T> {
  /** Default `page` (from 1), `size`, `sort`, `direction` and `search`. */
  query?: (request: PageRequest) => Record<string, string | number | undefined>;
  /** Default: the answer is `{ items, total }`. */
  read?: (body: unknown) => Page<T>;
}

export interface DataTablePagination<T> extends PagingOptions {
  /** Ask `apiPath` for one page at a time; `true` speaks the default contract of `ServerPaging`. */
  server?: boolean | ServerPaging<T>;
}

export const defaultQuery = ({ page, size, sort, direction, search }: PageRequest) => ({
  page,
  size,
  sort,
  direction,
  search,
});

export const defaultRead = <T>(body: unknown) => body as Page<T>;

/** The page a list shows and the page size; the size a user picks holds for every table. */
export interface PageState {
  page: number;
  recordsPerPage: number;
  pageSizes: number[];
  setPage: (page: number) => void;
  changeRecordsPerPage: (size: number) => void;
}

export function initialPageSize({ pageSizes = PAGE_SIZES, pageSize }: PagingOptions): number {
  return pageSize ?? (pageSizes.includes(DEFAULT_PAGE_SIZE) ? DEFAULT_PAGE_SIZE : (pageSizes[0] ?? DEFAULT_PAGE_SIZE));
}

/** The pagination of a list of `totalRecords`, on a page that still exists. */
export function pagingOf(state: PageState, totalRecords: number): TablePagination {
  return {
    page: Math.min(state.page, Math.max(1, Math.ceil(totalRecords / state.recordsPerPage))),
    totalRecords,
    recordsPerPage: state.recordsPerPage,
    onPageChange: state.setPage,
    ...(state.pageSizes.length > 1 && {
      recordsPerPageOptions: state.pageSizes,
      onRecordsPerPageChange: state.changeRecordsPerPage,
    }),
  };
}

/** The records of the current page, when the browser pages. */
export function pageOf<T>(records: T[], pagination: TablePagination): T[] {
  const start = (pagination.page - 1) * pagination.recordsPerPage;
  return records.slice(start, start + pagination.recordsPerPage);
}

/** „1–15 von 120“ */
export function pageRange({ from, to, totalRecords }: { from: number; to: number; totalRecords: number }): string {
  return `${from}–${to} von ${totalRecords}`;
}

const CONTROL_LABELS = {
  first: "Erste Seite",
  previous: "Vorherige Seite",
  next: "Nächste Seite",
  last: "Letzte Seite",
} as const;

export function controlLabel(control: keyof typeof CONTROL_LABELS) {
  return { "aria-label": CONTROL_LABELS[control] };
}

/** The pagination footer of mantine-datatable, in German and with the page size only where it can change. */
export function footerProps(pagination: TablePagination) {
  return {
    page: pagination.page,
    onPageChange: pagination.onPageChange,
    totalRecords: pagination.totalRecords,
    recordsPerPage: pagination.recordsPerPage,
    paginationText: pageRange,
    getPaginationControlProps: controlLabel,
    loadingText: "Wird geladen …",
    ...(pagination.recordsPerPageOptions &&
      pagination.onRecordsPerPageChange && {
        recordsPerPageOptions: pagination.recordsPerPageOptions,
        onRecordsPerPageChange: pagination.onRecordsPerPageChange,
        recordsPerPageLabel: "Einträge pro Seite",
      }),
  };
}
