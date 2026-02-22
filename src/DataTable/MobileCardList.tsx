import { ActionIcon, Box, Checkbox, Collapse, Divider, Group, Menu, Pagination, Select, Stack, Text } from "@mantine/core";
import { BaseEntity } from "../Hooks/useApi";
import { Action, Field } from "./DataTableInner";
import React, { useState } from "react";
import { IconChevronDown, IconDotsVertical, IconSortAscending, IconSortDescending } from "@tabler/icons-react";

interface SortConfig {
  field: string;
  direction: "asc" | "desc";
  onSortChange: (field: string, direction: "asc" | "desc") => void;
}

interface MobileCardListProps<T extends BaseEntity> {
  records: T[];
  fields: Field<T>[];
  selection?: boolean;
  selectedRecords?: T[];
  onSelectedRecordsChange?: (records: T[]) => void;
  onRowClick?: (params: { record: T; index: number; event: React.MouseEvent }) => void;
  actions?: Action<T>[];
  pagination?: {
    totalRecords: number;
    recordsPerPage: number;
    page: number;
    onPageChange: (page: number) => void;
    recordsPerPageOptions?: number[];
    onRecordsPerPageChange?: (size: number) => void;
  };
  sort?: SortConfig;
  rowExpansion?: {
    content: (record: T) => React.ReactNode;
  };
}

function getNestedValue(record: Record<string, unknown>, accessor: string): unknown {
  return accessor.split(".").reduce<unknown>((obj, key) => {
    if (obj && typeof obj === "object" && key in (obj as Record<string, unknown>)) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
}

function renderFieldValue<T extends BaseEntity>(record: T, field: Field<T>): React.ReactNode {
  const column = field.column;

  if (column.render) {
    return column.render(record, 0);
  }

  const accessor = (column.accessor ?? field.id) as string;
  const value = getNestedValue(record as unknown as Record<string, unknown>, accessor);

  if (value === null || value === undefined) {
    return <Text c="dimmed">–</Text>;
  }

  if (typeof value === "boolean") {
    return <Text fz="sm">{value ? "Ja" : "Nein"}</Text>;
  }

  return <Text fz="sm">{String(value)}</Text>;
}

function MobileCardRow<T extends BaseEntity>({ field, record }: { field: Field<T>; record: T }) {
  return (
    <Group wrap="nowrap" justify="space-between" align="center" py="xs" px="sm">
      <Text fw={700} fz="sm">
        {(field.column.title as string) ?? field.id}
      </Text>
      <Box ta="right" fz="sm">
        {renderFieldValue(record, field)}
      </Box>
    </Group>
  );
}

export function MobileCardList<T extends BaseEntity>({
  records,
  fields,
  selection,
  selectedRecords = [],
  onSelectedRecordsChange,
  onRowClick,
  actions,
  pagination,
  sort,
  rowExpansion,
}: MobileCardListProps<T>) {
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set());

  const toggleExpansion = (id: string | number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const listFields = fields.filter((f) => f.list && f.column);

  const sortOptions = listFields
    .filter((f) => f.column.sortable !== false)
    .reduce<{ value: string; label: string }[]>((acc, f) => {
      const value = (f.column.accessor ?? f.id) as string;
      if (!acc.some((o) => o.value === value)) {
        acc.push({ value, label: (f.column.title as string) ?? f.id });
      }
      return acc;
    }, []);

  const isSelected = (record: T) =>
    selectedRecords.some((r) => r.id === record.id);

  const toggleSelection = (record: T) => {
    if (!onSelectedRecordsChange) return;
    if (isSelected(record)) {
      onSelectedRecordsChange(selectedRecords.filter((r) => r.id !== record.id));
    } else {
      onSelectedRecordsChange([...selectedRecords, record]);
    }
  };

  const handleCardClick = (record: T, index: number, event: React.MouseEvent) => {
    if (onRowClick) {
      onRowClick({ record, index, event });
    } else if (selection) {
      toggleSelection(record);
    }
  };

  if (records.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Keine Einträge gefunden
      </Text>
    );
  }

  return (
    <Stack gap="sm" my="md">
      {sort && sortOptions.length > 0 && (
        <Group gap="xs" wrap="nowrap">
          <Select
            data={sortOptions}
            value={sort.field}
            onChange={(value) => value && sort.onSortChange(value, sort.direction)}
            allowDeselect={false}
            style={{ flex: 1 }}
          />
          <ActionIcon
            variant="filled"
            size="input-sm"
            onClick={() => sort.onSortChange(sort.field, sort.direction === "asc" ? "desc" : "asc")}
          >
            {sort.direction === "asc" ? <IconSortAscending size={18} /> : <IconSortDescending size={18} />}
          </ActionIcon>
        </Group>
      )}

      {records.map((record, index) => {
        const selected = isSelected(record);
        const clickable = !!onRowClick || !!selection;

        const recordKey = record.id ?? index;
        const expanded = expandedIds.has(recordKey);

        return (
          <React.Fragment key={recordKey}>
            <Box
              bg={selected ? "var(--mantine-primary-color-light)" : index % 2 === 0 ? "var(--mantine-color-gray-0)" : "white"}
              bd={!selected ? "1px solid var(--mantine-color-gray-2)" : undefined}
              style={{
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
              }}
            >
              <Box
                w="100%"
                style={{ cursor: clickable || rowExpansion ? "pointer" : "default" }}
                onClick={(e: React.MouseEvent) => {
                  if (rowExpansion && !onRowClick) {
                    toggleExpansion(recordKey);
                  } else {
                    handleCardClick(record, index, e);
                  }
                }}
              >
                {(selection || rowExpansion || (actions && actions.length > 0)) && (
                  <Group px="sm" pt="sm" justify="space-between">
                    <Group gap="xs">
                      {rowExpansion && (
                        <Box
                          c="var(--mantine-primary-color-filled)"
                          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleExpansion(recordKey); }}
                        >
                          <IconChevronDown
                            size={16}
                            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 200ms" }}
                          />
                        </Box>
                      )}
                      {selection && (
                        <Checkbox
                          checked={selected}
                          onChange={() => toggleSelection(record)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </Group>
                    {actions && actions.length > 0 && (
                      <Menu shadow="md" position="bottom-end">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {actions.map((action, actionIndex) => (
                            <Menu.Item
                              key={`card_action_${actionIndex}`}
                              leftSection={action.icon}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                action.onClick([record]);
                              }}
                            >
                              {action.label}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                )}
                {listFields.map((field, fieldIndex) => (
                  <React.Fragment key={field.id}>
                    {fieldIndex > 0 && <Divider />}
                    <MobileCardRow field={field} record={record} />
                  </React.Fragment>
                ))}
              </Box>
              {rowExpansion && (
                <Collapse in={expanded}>
                  <Divider />
                  <Box px="sm" py="sm">
                    {rowExpansion.content(record)}
                  </Box>
                </Collapse>
              )}
            </Box>
          </React.Fragment>
        );
      })}

      {pagination && pagination.totalRecords > pagination.recordsPerPage && (
        <Stack gap="xs" mt="sm">
          <Group justify="center">
            <Pagination
              total={Math.ceil(pagination.totalRecords / pagination.recordsPerPage)}
              value={pagination.page}
              onChange={pagination.onPageChange}
              size="sm"
            />
          </Group>
          {pagination.recordsPerPageOptions && pagination.onRecordsPerPageChange && (
            <Group justify="center" gap="xs">
              <Text fz="xs" c="dimmed">Einträge pro Seite:</Text>
              <Select
                data={pagination.recordsPerPageOptions.map((o) => ({ value: String(o), label: String(o) }))}
                value={String(pagination.recordsPerPage)}
                onChange={(v) => v && pagination.onRecordsPerPageChange!(Number(v))}
                allowDeselect={false}
                size="xs"
                w={70}
              />
            </Group>
          )}
        </Stack>
      )}
    </Stack>
  );
}
