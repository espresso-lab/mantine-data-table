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

export function FieldCard({ rows }: { readonly rows: readonly FieldRow[] }) {
  return (
    <Box
      bg="var(--mantine-color-gray-light)"
      style={{ borderRadius: "var(--mantine-radius-md)", overflow: "hidden" }}
    >
      <FieldCardRows rows={rows} />
    </Box>
  );
}
