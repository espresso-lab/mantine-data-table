import { ActionIcon, Alert, Box, Button, Group, Menu, Modal, Skeleton, Stack, Tabs, Title } from "@mantine/core";
import { BaseEntity, useGetAll } from "../Hooks/useApi";
import React, { useEffect, useState } from "react";
import { CreateModal } from "./CreateModal";
import { IconCaretDownFilled, IconInfoCircle, IconPencil, IconRefresh, IconTrash } from "@tabler/icons-react";
import { DataTable as MantineDataTable, DataTableColumn, DataTableSortStatus } from "mantine-datatable";
import { UpdateModal } from "./UpdateModal.tsx";
import { DeleteModal } from "./DeleteModal.tsx";
import { useDataTable } from "../Hooks/useDataTable.ts";
import { usePersistentState } from "../Hooks/usePersitentState.ts";
import { sortData } from "../utils/sort";
import { MobileCardList } from "./MobileCardList";

type DatesRangeValue = [string | null, string | null];

interface DateFilter {
  id: string | number;
  type: "date";
  value?: DatesRangeValue;
}

interface StringFilter {
  id: string | number;
  type: "query";
  value?: string | string[];
}

interface BooleanFilter {
  id: string | number;
  type: "boolean";
  value?: boolean;
}

type Filter = DateFilter | StringFilter | BooleanFilter;

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "custom"
  | "date"
  | "textarea";

export interface Field<T> {
  id: string;
  defaultValue?: T[keyof T];
  required?: boolean | ((values: Partial<T>) => boolean);
  step?: number;
  list: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  type?: FieldType;
  placeholder?: string;
  conditional?: (values: Partial<T>) => boolean;
  render?: (
    values: T,
    setValues: (values: Partial<T>) => void,
    hideButtons: (value: boolean) => void,
    validationProps?: {
      error?: string;
      required?: boolean;
    },
  ) => React.ReactNode;
  column: DataTableColumn<T>;
}

interface Action<T extends BaseEntity> {
  icon?: React.ReactNode;
  label: string;
  onClick: (records: T[]) => void;
}

export interface TabOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  queryParams?: Record<string, string | number | boolean | null>;
}

export interface StepConfig {
  label: string;
  description?: string;
}

export interface DataTableProps<T extends BaseEntity> {
  title?: string | React.ReactNode;
  queryKey: (string | number)[];
  connectedQueryKeys?: (string | number)[][];
  apiPath: string;
  mutationApiPath?: string;
  queryParams?: Record<string, string | number | boolean | null>;
  filters?: Filter[];
  buttons?: React.ReactNode[];
  createButtonText?: string;
  actions?: Action<T>[];
  selection?: boolean;
  pagination?: boolean;
  steps?: StepConfig[];
  fields: Field<T>[];
  defaultSort?: {
    field: string;
    direction: "asc" | "desc";
  };
  onSortChange?: (field: string, direction: "asc" | "desc") => void;
  tabs?: TabOption[];
  defaultTab?: string;
  activeTab?: string | null;
  onActiveTabChange?: (tabValue: string | null) => void;
  canUpdate?: (record: T) => boolean;
  canDelete?: (record: T) => boolean;
  showRefresh?: boolean;
  rowExpansion?: {
    allowMultiple?: boolean;
    content: (record: T) => React.ReactNode;
    expanded?: {
      recordIds: string[];
      onRecordIdsChange: (recordIds: string[]) => void;
    };
  };
  onRowClick?: (params: { record: T; index: number; event: React.MouseEvent }) => void;
  mobileCards?: boolean;
}

const PAGE_SIZES = [10, 15, 50, 100, 500];

export function DataTableInner<T extends BaseEntity>({
  title,
  queryKey,
  connectedQueryKeys,
  apiPath,
  mutationApiPath,
  buttons,
  fields,
  selection,
  pagination,
  filters,
  actions,
  steps,
  defaultSort,
  onSortChange,
  createButtonText,
  queryParams,
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  canUpdate,
  canDelete,
  showRefresh = true,
  rowExpansion,
  onRowClick,
  mobileCards = false,
}: DataTableProps<T>) {
  const [internalActiveTab, setInternalActiveTab] = useState<string | null>(
    defaultTab || (tabs && tabs.length > 0 ? tabs[0].value : null),
  );

  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabChange = (value: string | null) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(value);
    }
    if (onActiveTabChange) {
      onActiveTabChange(value);
    }
  };

  const currentTabParams =
    tabs?.find((tab) => tab.value === activeTab)?.queryParams || {};
  const allQueryParams = { ...queryParams, ...currentTabParams };

  // Build query string like ?id=1&name=test
  const queryString: string = allQueryParams
    ? "?" +
      Object.entries(allQueryParams)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key}=${encodeURIComponent(value ?? "")}`)
        .join("&")
    : "";

  const effectiveQueryKey = activeTab ? [...queryKey, activeTab] : queryKey;

  const {
    data: allData,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useGetAll<T>(apiPath + queryString, effectiveQueryKey);

  const { queryClient } = useDataTable();

  useEffect(() => {
    if (!allData || !Array.isArray(allData)) return;

    connectedQueryKeys?.forEach((connectedQueryKey) =>
      queryClient.invalidateQueries({ queryKey: connectedQueryKey }),
    );
  }, [allData, connectedQueryKeys, queryClient]);

    // Filter data
    const filteredData =
        (!allData || !Array.isArray(allData))
            ? []
            : (!filters || filters.length === 0)
                ? allData
                : allData.filter((record: T) => filters.every((filter) => {
                if (filter.value === undefined) return true;

                const key = filter.id as keyof T;
                if (filter.type === "query") {
                    const recordValue = record[key];
                    if (Array.isArray(filter.value)) {
                        if (Array.isArray(recordValue)) {
                            return recordValue.some((item: any) => {
                                if (typeof item === "string" || typeof item === "number") {
                                    return filter.value!.includes(String(item));
                                }
                                if (item && typeof item === "object") {
                                    if ("id" in item && filter.value!.includes(item.id)) {
                                        return true;
                                    }
                                    for (const prop in item) {
                                        const propValue = item[prop];
                                        if (
                                            typeof propValue === "string" &&
                                            filter.value!.includes(propValue)
                                        ) {
                                            return true;
                                        }
                                        if (
                                            propValue &&
                                            typeof propValue === "object" &&
                                            "id" in propValue
                                        ) {
                                            if (filter.value!.includes(propValue.id)) {
                                                return true;
                                            }
                                        }
                                    }
                                }
                                return false;
                            });
                        }
                        if (
                            recordValue &&
                            typeof recordValue === "object" &&
                            "id" in recordValue
                        ) {
                            return filter.value.includes((recordValue as any).id);
                        }
                        return false;
                    }
                    return (
                        typeof recordValue === "string" &&
                        recordValue.includes(filter.value)
                    );
                } else if (filter.type === "date") {
                    const dateValue = filter.value as DatesRangeValue;
                    if (!dateValue) return true;

                    const [from, to] = dateValue;
                    if (!from && !to) return true;
                    const recordDate = record[key];
                    if (typeof recordDate === "string") {
                        const recordDateStr = recordDate.split(" ")[0];
                        if (from && to) {
                            return recordDateStr >= from && recordDateStr <= to;
                        } else if (from && !to) {
                            return recordDateStr >= from;
                        } else if (!from && to) {
                            return recordDateStr <= to;
                        }
                    }
                    return true;
                } else if (filter.type === "boolean") {
                    const recordValue = record[key];
                    return recordValue === filter.value;
                }
                return true;
            }));

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<T>>({
    columnAccessor: defaultSort?.field ?? fields[0].id,
    direction: defaultSort?.direction ?? "desc",
  });
  
  const handleSortChange = (newSortStatus: DataTableSortStatus<T>) => {
    setSortStatus(newSortStatus);
    if (onSortChange) {
      onSortChange(String(newSortStatus.columnAccessor), newSortStatus.direction);
    }
  };

  // Sort data
  const sortedData = sortData(
    filteredData,
    sortStatus.columnAccessor as keyof T,
    sortStatus.direction,
  );

  // Handle pagination
  const [pageSize, setPageSize] = usePersistentState(
    PAGE_SIZES[1],
    "mantine-table-page-size",
  );
  const [page, setPage] = useState(1);

  const records = pagination ? sortedData.slice((page - 1) * pageSize, page * pageSize) : sortedData;

  const [selectedRecords, setSelectedRecords] = useState<T[]>([]);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedRecords([]);
  }, [activeTab]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <>
      <Group gap="xs" justify={title ? "space-between" : "end"} align="center" wrap="wrap">
        {title &&
          (typeof title === "string" ? (
            <Title order={4}>{title}</Title>
          ) : (
            title
          ))}
        <Group align="center" gap="xs" wrap="wrap" justify="end" style={{ marginLeft: "auto" }}>
          {showRefresh && (
            <ActionIcon
              variant="subtle"
              onClick={() => refetch()}
              aria-label="Neuladen"
            >
              <IconRefresh />
            </ActionIcon>
          )}
          {(fields.some((field) => field.update) || selection) && (() => {
            const hasUpdateAction = fields.find((field) => field.update) && 
              (!canUpdate || (selectedRecords.length > 0 && canUpdate(selectedRecords[0])));
            const hasDeleteAction = fields.find((field) => field.delete) && 
              (!canDelete || (selectedRecords.length > 0 && canDelete(selectedRecords[0])));
            const hasCustomActions = (actions ?? []).length > 0;
            const hasAnyAction = hasUpdateAction || hasDeleteAction || hasCustomActions;

            return (
              <Menu shadow="md">
                <Menu.Target>
                  <Button
                    variant="outline"
                    rightSection={<IconCaretDownFilled size={14} />}
                    disabled={!selectedRecords.length || !hasAnyAction}
                  >
                    Aktionen
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {hasUpdateAction && (
                    <Menu.Item
                      leftSection={<IconPencil size={14} />}
                      onClick={() => setUpdateModalOpen(true)}
                      disabled={selectedRecords.length !== 1}
                    >
                      Bearbeiten
                    </Menu.Item>
                  )}
                  {(actions ?? []).map((action, index) => (
                    <Menu.Item
                      {...(action.icon && { leftSection: action.icon })}
                      key={`custom_action_${index}`}
                      onClick={() => action.onClick(selectedRecords)}
                    >
                      {action.label}
                    </Menu.Item>
                  ))}
                  {hasDeleteAction && (
                    <Menu.Item
                      leftSection={<IconTrash size={14} />}
                      onClick={() => setDeleteModalOpen(true)}
                      color="red"
                    >
                      Löschen
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            );
          })()}
          {fields.find((field) => field.create) && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              disabled={isLoading}
            >
              {createButtonText ?? "Erstellen"}
            </Button>
          )}
          {buttons}
        </Group>
      </Group>

      {tabs && tabs.length > 0 && (
        <Tabs value={activeTab} onChange={handleTabChange} mt="md">
          <Tabs.List>
            {tabs.map((tab) => (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                leftSection={tab.icon}
              >
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      )}

      {isError && (
        <Alert
          mt="md"
          variant="light"
          color="red"
          title="Es ist ein Fehler aufgetreten."
          icon={<IconInfoCircle />}
        >
          Bitte versuche es später erneut oder sende eine Nachricht an unseren
          Support.
        </Alert>
      )}

      {(isLoading || isRefetching) && (
        <Stack my="md">
          <Skeleton height={40} />
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={`skeleton-${index}`} height={35} />
            ))}
        </Stack>
      )}

      {!isLoading && !isRefetching && (
        <>
          <Box {...(mobileCards ? { visibleFrom: "sm" } : {})}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-expect-error */}
            <MantineDataTable
              my="md"
              striped
              highlightOnHover
              minHeight={150}
              fetching={isError}
              records={records}
              sortStatus={sortStatus}
              onSortStatusChange={handleSortChange}
              {...(selection && {
                selectedRecords,
                onSelectedRecordsChange: setSelectedRecords,
              })}
              {...(pagination &&
                records.length && {
                  totalRecords: sortedData.length,
                  recordsPerPage: pageSize,
                  onPageChange: setPage,
                  page,
                  recordsPerPageOptions: PAGE_SIZES,
                  onRecordsPerPageChange: setPageSize,
                  recordsPerPageLabel: "Einträge pro Seite",
                })}
              {...(rowExpansion && {
                rowExpansion: {
                  allowMultiple: rowExpansion.allowMultiple ?? false,
                  content: ({ record }: { record: T }) => rowExpansion.content(record),
                  ...(rowExpansion.expanded && {
                    expanded: rowExpansion.expanded,
                  }),
                },
              })}
              columns={fields.map((field) => field.column)}
              noRecordsText="Keine Einträge gefunden"
              onRowClick={onRowClick}
              {...(onRowClick && { style: { cursor: "pointer" } })}
            />
          </Box>

          {mobileCards && (
            <Box hiddenFrom="sm">
              <MobileCardList
                records={records}
                fields={fields}
                selection={selection}
                selectedRecords={selectedRecords}
                onSelectedRecordsChange={setSelectedRecords}
                onRowClick={onRowClick}
                sort={{
                  field: String(sortStatus.columnAccessor),
                  direction: sortStatus.direction,
                  onSortChange: (field, direction) => {
                    handleSortChange({ columnAccessor: field as keyof T, direction });
                  },
                }}
                {...(pagination && records.length && {
                  pagination: {
                    totalRecords: sortedData.length,
                    recordsPerPage: pageSize,
                    page,
                    onPageChange: setPage,
                    recordsPerPageOptions: PAGE_SIZES,
                    onRecordsPerPageChange: (size: number) => { setPageSize(size); setPage(1); },
                  },
                })}
                {...(rowExpansion && {
                  rowExpansion: { content: rowExpansion.content },
                })}
              />
            </Box>
          )}
        </>
      )}

      <Modal
        opened={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedRecords([]);
        }}
        title={title ?? "Bearbeiten"}
      >
        {selectedRecords.length > 0 && (
          <UpdateModal<T>
            fields={fields.filter((field) => field.update)}
            queryKey={queryKey}
            apiPath={mutationApiPath ?? apiPath}
            id={selectedRecords[0].id}
            onClose={() => {
              setUpdateModalOpen(false);
              setSelectedRecords([]);
            }}
            steps={steps}
          />
        )}
      </Modal>

      {selectedRecords.length > 0 && (
        <Modal
          opened={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedRecords([]);
          }}
          title={title ?? "Löschen"}
        >
          <DeleteModal<T>
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedRecords([]);
            }}
            queryKey={queryKey}
            apiPath={mutationApiPath ?? apiPath}
            selectedRecords={selectedRecords}
          />
        </Modal>
      )}

      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
        title={title ?? "Anlegen"}
      >
        <CreateModal<T>
          queryKey={queryKey}
          apiPath={mutationApiPath ?? apiPath}
          onClose={() => {
            setCreateModalOpen(false);
          }}
          fields={fields.filter((field) => field.create)}
          steps={steps}
        />
      </Modal>
    </>
  );
}
