import { Group, Stack, VisuallyHidden } from "@mantine/core";
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
import { RowActions, RowActionsMenu, RowActionsProps } from "./RowActions";
import { hasRowActions } from "../utils/rowActions";

export type SubTableColumn<T> = DataTableColumn<T> & {
  hideOnMobile?: (record: T) => boolean;
};

export type SubTableProps<T> = Omit<MantineDataTableProps<T>, "columns"> & {
  mobile: boolean;
  columns: SubTableColumn<T>[];
  rowActions?: (record: T) => RowActionsProps;
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

export function SubTable<T>({ mobile, columns, rowActions, ...props }: SubTableProps<T>) {
  if (mobile) {
    const records = (props.records ?? []) as T[];
    return (
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
              variant={props.withTableBorder ? "surface" : "nested"}
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
      </Stack>
    );
  }

  const allColumns: SubTableColumn<T>[] = rowActions
    ? [
        ...columns,
        {
          accessor: "__rowActions",
          title: <VisuallyHidden>Aktionen</VisuallyHidden>,
          textAlign: "right",
          noWrap: true,
          render: (record: T) => <RowActions {...rowActions(record)} />,
        },
      ]
    : columns;

  // @ts-expect-error - DataTableProps is a discriminated union (columns vs groups) that does not survive Omit + spread
  return <MantineDataTable columns={allColumns} pinLastColumn={!!rowActions} {...props} />;
}
