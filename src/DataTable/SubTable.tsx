import { Stack } from "@mantine/core";
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

export type SubTableColumn<T> = DataTableColumn<T> & {
  hideOnMobile?: (record: T) => boolean;
};

export type SubTableProps<T> = Omit<MantineDataTableProps<T>, "columns"> & {
  mobile: boolean;
  columns: SubTableColumn<T>[];
};

export function SubTable<T>({ mobile, columns, ...props }: SubTableProps<T>) {
  if (mobile) {
    const records = (props.records ?? []) as T[];
    return (
      <Stack gap="sm" style={{ fontVariantNumeric: "tabular-nums" }}>
        {records.map((record, index) => {
          const rows: FieldRow[] = columns
            .filter((column) => !column.hidden && !column.hideOnMobile?.(record))
            .map((column) => ({
              label: column.title ?? humanize(String(column.accessor)),
              value: column.render
                ? column.render(record, index)
                : (getValueAtPath(record, column.accessor) as React.ReactNode),
            }));
          const key = props.idAccessor ? (getRecordId(record, props.idAccessor) as React.Key) : index;
          return <FieldCard key={key} rows={rows} />;
        })}
      </Stack>
    );
  }

  // @ts-expect-error - DataTableProps is a discriminated union (columns vs groups) that does not survive Omit + spread
  return <MantineDataTable columns={columns} {...props} />;
}
