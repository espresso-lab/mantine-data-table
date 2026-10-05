import { Box, Divider, Group, Text } from "@mantine/core";
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
