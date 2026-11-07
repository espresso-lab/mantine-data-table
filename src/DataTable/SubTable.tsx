import { Group, Stack, Text, VisuallyHidden } from "@mantine/core";
import React from "react";
import {
  DataTable as MantineDataTable,
  DataTableColumn,
  DataTableProps as MantineDataTableProps,
  getRecordId,
  getValueAtPath,
  humanize,
} from "mantine-datatable";
import { CardPagination } from "./CardPagination";
import { FieldCard, FieldRow, FooterCard } from "./FieldCard";
import { PageHeader } from "./PageHeader";
import { RowActions, RowActionsMenu, RowActionsProps } from "./RowActions";
import { hasRowActions } from "../utils/rowActions";
import { footerProps, pageOf, PagingOptions, pagingOf, TablePagination } from "../utils/pagination";
import { usePageState } from "../Hooks/usePageState";

export type SubTableColumn<T> = DataTableColumn<T> & {
  hideOnMobile?: (record: T) => boolean;
};

export type SubTableProps<T> = Omit<
  MantineDataTableProps<T>,
  | "columns"
  | "page"
  | "onPageChange"
  | "totalRecords"
  | "recordsPerPage"
  | "recordsPerPageOptions"
  | "onRecordsPerPageChange"
  | "recordsPerPageLabel"
  | "paginationText"
> & {
  mobile: boolean;
  columns: SubTableColumn<T>[];
  rowActions?: (record: T) => RowActionsProps;
  nested?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /**
   * `true` or `PagingOptions` page the given records in the browser. A `TablePagination` shows the page the
   * caller loaded from a server: the records are that page, `totalRecords` counts all of them.
   */
  pagination?: boolean | PagingOptions | TablePagination;
};

const isCallerPage = (pagination: SubTableProps<unknown>["pagination"]): pagination is TablePagination =>
  typeof pagination === "object" && "totalRecords" in pagination;

function CellValue<T>({
  render,
  record,
  index,
}: {
  render: NonNullable<DataTableColumn<T>["render"]>;
  record: T;
  index: number;
}) {
  return <>{render(record, index)}</>;
}

export function SubTable<T>({
  mobile,
  columns,
  rowActions,
  nested = false,
  title,
  description,
  actions,
  pagination,
  ...props
}: SubTableProps<T>) {
  const given = (props.records ?? []) as T[];
  const variant = nested || !props.withTableBorder ? "nested" : "surface";
  const callerPage = isCallerPage(pagination);
  const pageState = usePageState(typeof pagination === "object" && !callerPage ? pagination : {});
  const browserPaging = pagingOf(pageState, given.length);
  const paging = callerPage ? pagination : pagination ? browserPaging : undefined;
  const records = pagination && !callerPage ? pageOf(given, browserPaging) : given;

  const mobileCards = () => (
    <Stack gap="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
      {records.map((record, index) => {
        const rows: FieldRow[] = columns
          .filter((column) => !column.hidden && !column.hideOnMobile?.(record))
          .map((column) => ({
            label: column.title ?? humanize(String(column.accessor)),
            value: column.render ? (
              <CellValue render={column.render} record={record} index={index} />
            ) : (
              (getValueAtPath(record, column.accessor) as React.ReactNode)
            ),
          }));
        const key = props.idAccessor ? (getRecordId(record, props.idAccessor) as React.Key) : index;
        const actions = rowActions?.(record);
        return (
          <FieldCard
            key={key}
            rows={rows}
            variant={variant}
            header={
              actions && hasRowActions(actions) ? (
                <Group px="sm" pt="sm" justify="flex-end">
                  <RowActionsMenu {...actions} />
                </Group>
              ) : undefined
            }
          />
        );
      })}
      <FooterCard columns={columns} variant={variant} />
      {paging && <CardPagination pagination={paging} />}
    </Stack>
  );

  const desktopTable = () => {
    const showsRowActions = !!rowActions && records.some((record) => hasRowActions(rowActions(record)));
    const allColumns: SubTableColumn<T>[] = showsRowActions
      ? [
          ...columns,
          {
            accessor: "__rowActions",
            title: <VisuallyHidden>Aktionen</VisuallyHidden>,
            textAlign: "right",
            noWrap: true,
            render: (record: T) => <RowActions {...rowActions!(record)} />,
          },
        ]
      : columns;

    return (
      // @ts-expect-error - DataTableProps is a discriminated union (columns vs groups) that does not survive Omit + spread
      <MantineDataTable
        columns={allColumns}
        pinLastColumn={showsRowActions}
        {...(nested && { withTableBorder: true, borderRadius: "md", minHeight: 0 })}
        {...props}
        records={records}
        {...(paging && paging.totalRecords > 0 && footerProps(paging))}
      />
    );
  };

  const empty = given.length === 0 && (nested || mobile);
  const content = empty ? (
    <Text size="sm" c="dimmed" {...(!nested && { ta: "center", py: "xl" })}>
      {props.noRecordsText ?? "Keine Einträge"}
    </Text>
  ) : mobile ? (
    mobileCards()
  ) : (
    desktopTable()
  );

  return title != null ? (
    <Stack gap="md">
      <PageHeader title={title} order={4} description={description} actions={actions} />
      {content}
    </Stack>
  ) : (
    content
  );
}
