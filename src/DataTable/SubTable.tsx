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
import { FieldCard, FieldRow } from "./FieldCard";
import { PageHeader } from "./PageHeader";
import { RowActions, RowActionsMenu, RowActionsProps } from "./RowActions";
import { hasRowActions } from "../utils/rowActions";

export type SubTableColumn<T> = DataTableColumn<T> & {
  hideOnMobile?: (record: T) => boolean;
};

export type SubTableProps<T> = Omit<MantineDataTableProps<T>, "columns"> & {
  mobile: boolean;
  columns: SubTableColumn<T>[];
  rowActions?: (record: T) => RowActionsProps;
  nested?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
};

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

function FooterCard<T>({ columns, variant }: { columns: SubTableColumn<T>[]; variant: "surface" | "nested" }) {
  const [first, ...rest] = columns.filter((column) => !column.hidden);
  const rows: FieldRow[] = rest
    .filter((column) => column.footer != null)
    .map((column) => ({ label: column.title ?? humanize(String(column.accessor)), value: column.footer }));
  if (rows.length === 0) return null;
  return (
    <FieldCard
      rows={rows}
      variant={variant}
      header={
        first?.footer != null ? (
          <Text fw={700} fz="sm" px="sm" pt="sm">
            {first.footer}
          </Text>
        ) : undefined
      }
    />
  );
}

export function SubTable<T>({
  mobile,
  columns,
  rowActions,
  nested = false,
  title,
  description,
  actions,
  ...props
}: SubTableProps<T>) {
  const records = (props.records ?? []) as T[];
  const variant = nested || !props.withTableBorder ? "nested" : "surface";

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
      />
    );
  };

  const content =
    nested && records.length === 0 ? (
      <Text size="sm" c="dimmed">
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
