import { Accordion, ActionIcon, Box, Collapse, Divider, Group, Indicator, Menu, Pagination, Popover, Select, Stack, Text } from "@mantine/core";
import { BaseEntity } from "../Hooks/useApi";
import { Action, Field } from "./DataTable";
import React, { useState } from "react";
import { IconDotsVertical, IconFilter, IconSortAscending, IconSortDescending } from "@tabler/icons-react";
import { FieldCardRows, FieldRow } from "./FieldCard";

interface SortConfig {
  field: string;
  direction: "asc" | "desc";
  onSortChange: (field: string, direction: "asc" | "desc") => void;
}

interface MobileCardListProps<T extends BaseEntity> {
  records: T[];
  fields: Field<T>[];
  onRowClick?: (params: { record: T; index: number; event: React.MouseEvent }) => void;
  actions?: Action<T>[];
  canUpdate?: (record: T) => boolean;
  canDelete?: (record: T) => boolean;
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
    expandable?: (record: T) => boolean;
    content: (record: T, isMobile: boolean) => React.ReactNode;
    expanded?: {
      recordIds: unknown[];
      onRecordIdsChange: (recordIds: unknown[]) => void;
    };
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

export function MobileCardList<T extends BaseEntity>({
  records,
  fields,
  onRowClick,
  actions,
  canUpdate,
  canDelete,
  pagination,
  sort,
  rowExpansion,
}: MobileCardListProps<T>) {
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string | number>>(new Set());
  const controlledExpansion = rowExpansion?.expanded;

  const isExpanded = (id: string | number) =>
    controlledExpansion ? controlledExpansion.recordIds.includes(id) : internalExpandedIds.has(id);

  const toggleExpansion = (id: string | number) => {
    if (controlledExpansion) {
      const { recordIds, onRecordIdsChange } = controlledExpansion;
      onRecordIdsChange(
        recordIds.includes(id) ? recordIds.filter((r) => r !== id) : [...recordIds, id],
      );
    } else {
      setInternalExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };
  const listFields = fields.filter((f) => f.list && f.column && !f.column.hidden);

  const filterFields = fields.filter((f) => f.column && f.column.filter != null);
  const activeFilterIds = filterFields.filter((f) => f.column.filtering).map((f) => f.id);
  const hasActiveFilter = activeFilterIds.length > 0;
  const defaultOpenFilters = hasActiveFilter ? activeFilterIds : filterFields.slice(0, 1).map((f) => f.id);
  const [filterOpen, setFilterOpen] = useState(false);

  const sortOptions = listFields
    .filter((f) => f.column.sortable !== false)
    .reduce<{ value: string; label: string }[]>((acc, f) => {
      const value = (f.column.accessor ?? f.id) as string;
      if (!acc.some((o) => o.value === value)) {
        acc.push({ value, label: (f.column.title as string) ?? f.id });
      }
      return acc;
    }, []);

  const handleCardClick = (record: T, index: number, event: React.MouseEvent) => {
    onRowClick?.({ record, index, event });
  };

  return (
    <Stack gap="sm" my="md">
      {((sort && sortOptions.length > 0) || filterFields.length > 0) && (
        <Group gap="xs" wrap="nowrap" justify="flex-end">
          {sort && sortOptions.length > 0 && (
            <>
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
            </>
          )}
          {filterFields.length > 0 && (
            <Popover opened={filterOpen} onChange={setFilterOpen} position="bottom-end" withArrow shadow="md" trapFocus>
              <Popover.Target>
                <Indicator inline disabled={!hasActiveFilter} color="green" withBorder>
                  <ActionIcon
                    variant={hasActiveFilter ? "filled" : "default"}
                    size="input-sm"
                    onClick={() => setFilterOpen((o) => !o)}
                    aria-label="Filter"
                  >
                    <IconFilter size={18} />
                  </ActionIcon>
                </Indicator>
              </Popover.Target>
              <Popover.Dropdown p={0}>
                <Accordion multiple defaultValue={defaultOpenFilters} style={{ minWidth: 260, maxWidth: 320 }}>
                  {filterFields.map((f) => (
                    <Accordion.Item key={f.id} value={f.id}>
                      <Accordion.Control>
                        <Group gap="xs">
                          <Text fw={600} fz="sm">{(f.column.title as string) ?? f.id}</Text>
                          {f.column.filtering && (
                            <Box w={8} h={8} bg="green" style={{ borderRadius: "50%" }} />
                          )}
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        {typeof f.column.filter === "function"
                          ? f.column.filter({ close: () => setFilterOpen(false) })
                          : f.column.filter}
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Popover.Dropdown>
            </Popover>
          )}
        </Group>
      )}

      {records.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          Keine Einträge gefunden
        </Text>
      )}

      {records.map((record, index) => {
        const recordKey = record.id ?? index;
        const canExpand = !!rowExpansion && (!rowExpansion.expandable || rowExpansion.expandable(record));
        const expanded = canExpand && isExpanded(recordKey);

        return (
          <React.Fragment key={recordKey}>
            <Box
              bg="var(--mantine-color-body)"
              bd="1px solid var(--mantine-color-default-border)"
              style={{
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
              }}
            >
              <Box
                w="100%"
                style={{ cursor: onRowClick || canExpand ? "pointer" : "default" }}
                onClick={(e: React.MouseEvent) => {
                  if (canExpand && !onRowClick) {
                    toggleExpansion(recordKey);
                  } else {
                    handleCardClick(record, index, e);
                  }
                }}
              >
                {actions && actions.length > 0 && (
                  <Group px="sm" pt="sm" justify="flex-end">
                    {(() => {
                      const filteredActions = actions.filter((action) => {
                        if (action.label === "Bearbeiten" && canUpdate && !canUpdate(record)) return false;
                        if (action.label === "Löschen" && canDelete && !canDelete(record)) return false;
                        return true;
                      });
                      if (filteredActions.length === 0) return null;
                      return (
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
                          {filteredActions.map((action, actionIndex) => (
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
                      );
                    })()}
                  </Group>
                )}
                <FieldCardRows
                  rows={listFields.map<FieldRow>((field) => ({
                    label: (field.column.title as React.ReactNode) ?? field.id,
                    value: renderFieldValue(record, field),
                  }))}
                />
              </Box>
              {canExpand && (
                <Collapse expanded={expanded}>
                  <Divider />
                  <Box px="sm" py="sm">
                    {rowExpansion!.content(record, true)}
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
