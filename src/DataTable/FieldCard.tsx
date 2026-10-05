import { Box, Divider, Group, Text } from "@mantine/core";
import { DataTableColumn, humanize } from "mantine-datatable";
import React from "react";

export interface FieldRow {
  label: React.ReactNode;
  value: React.ReactNode;
}

export function FieldCardRows({ rows }: { readonly rows: readonly FieldRow[] }) {
  return (
    <>
      {rows.map((row, index) => (
        <Box key={typeof row.label === "string" ? row.label : index}>
          {index > 0 && <Divider />}
          <Group wrap="nowrap" justify="space-between" align="flex-start" gap="md" py="xs" px="sm">
            <Text fw={700} fz="sm" style={{ flexShrink: 0 }}>
              {row.label}
            </Text>
            <Box ta="right" fz="sm" style={{ minWidth: 0 }}>
              {row.value}
            </Box>
          </Group>
        </Box>
      ))}
    </>
  );
}

export function FieldCard({
  rows,
  header,
  variant = "nested",
}: {
  readonly rows: readonly FieldRow[];
  readonly header?: React.ReactNode;
  readonly variant?: "nested" | "surface";
}) {
  return (
    <Box
      bg={variant === "surface" ? "var(--mantine-color-body)" : "var(--mantine-color-gray-light)"}
      bd={variant === "surface" ? "1px solid var(--mantine-color-default-border)" : undefined}
      style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
    >
      {header}
      <FieldCardRows rows={rows} />
    </Box>
  );
}

export function FooterCard<T>({
  columns,
  variant,
}: {
  readonly columns: readonly DataTableColumn<T>[];
  readonly variant: "surface" | "nested";
}) {
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
          <Text component="div" fw={700} fz="sm" px="sm" pt="sm">
            {first.footer}
          </Text>
        ) : undefined
      }
    />
  );
}
