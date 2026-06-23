import { ActionIcon, Alert, Box, Button, Flex, Group, HoverCard, Menu, Modal, Skeleton, Stack, Tabs, Text, Title } from "@mantine/core";
import { BaseEntity, useGetAll } from "../Hooks/useApi";
import React, { useEffect, useRef, useState } from "react";
import { CreateModal } from "./CreateModal";
import { IconCaretDownFilled, IconChevronRight, IconInfoCircle, IconPencil, IconRefresh, IconTrash } from "@tabler/icons-react";
import { DataTable as MantineDataTable, DataTableColumn, DataTableSortStatus, getValueAtPath } from "mantine-datatable";
import { UpdateModal } from "./UpdateModal.tsx";
import { DeleteModal } from "./DeleteModal.tsx";
import { usePersistentState } from "../Hooks/usePersistentState.ts";
import { sortData } from "../utils/sort";
import { applyFilters, Filter } from "../utils/filter";
import { MobileCardList } from "./MobileCardList";

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

export interface Action<T extends BaseEntity> {
  icon?: React.ReactNode;
  label: string;
  onClick: (records: T[]) => void;
  disabled?: (records: T[]) => boolean;
}

export interface TabOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  queryParams?: Record<string, string | number | boolean | null>;
  apiPath?: string;
  mutationApiPath?: string;
}

export interface StepConfig {
  label: string;
  description?: string;
}

export interface DataTableProps<T extends BaseEntity> {
  title?: string | React.ReactNode;
  titleHint?: React.ReactNode;
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
  onRefresh?: () => void | Promise<unknown>;
  autoPoll?: number | ((records: T[]) => number | false);
  rowExpansion?: {
    allowMultiple?: boolean;
    expandable?: (record: T) => boolean;
    content: (record: T, isMobile: boolean) => React.ReactNode;
    expanded?: {
      recordIds: unknown[];
      onRecordIdsChange: (recordIds: unknown[]) => void;
    };
  };
  onRowClick?: (params: { record: T; index: number; event: React.MouseEvent }) => void;
  mobileCards?: boolean;
  deleteConfirmMessage?: (records: T[]) => React.ReactNode;
  editRecordId?: string | null;
  onEditRecordIdChange?: (id: string | null) => void;
}

const PAGE_SIZES = [10, 15, 50, 100, 500];

export function DataTable<T extends BaseEntity>({
  title,
  titleHint,
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
  onRefresh,
  autoPoll,
  rowExpansion,
  onRowClick,
  mobileCards = false,
  deleteConfirmMessage,
  editRecordId,
  onEditRecordIdChange,
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

  const currentTab = tabs?.find((tab) => tab.value === activeTab);
  const currentTabParams = currentTab?.queryParams || {};
  const effectiveApiPath = currentTab?.apiPath ?? apiPath;
  const effectiveMutationApiPath = currentTab?.mutationApiPath ?? mutationApiPath ?? effectiveApiPath;
  const allQueryParams = { ...queryParams, ...currentTabParams };

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
  } = useGetAll<T>(effectiveApiPath + queryString, effectiveQueryKey);

  const filteredData = applyFilters(Array.isArray(allData) ? allData : [], filters);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshRef = useRef<() => void | Promise<unknown>>(() => {});
  useEffect(() => {
    refreshRef.current = onRefresh ?? (() => refetch());
  });
  const pollInterval =
    typeof autoPoll === "function"
      ? autoPoll(Array.isArray(allData) ? allData : [])
      : (autoPoll ?? false);
  useEffect(() => {
    if (!pollInterval) return;
    const id = setInterval(() => {
      Promise.resolve(refreshRef.current()).catch(() => {});
    }, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval]);

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

  const sortedData = sortData(
    filteredData,
    sortStatus.columnAccessor as keyof T,
    sortStatus.direction,
  );

  const [pageSize, setPageSize] = usePersistentState(
    PAGE_SIZES[1],
    "mantine-table-page-size",
  );
  const [page, setPage] = useState(1);

  const records = pagination ? sortedData.slice((page - 1) * pageSize, page * pageSize) : sortedData;

  const [internalExpandedIds, setInternalExpandedIds] = useState<unknown[]>([]);
  const expandedRecordIds = rowExpansion?.expanded?.recordIds ?? internalExpandedIds;
  const handleExpandedRecordIdsChange = rowExpansion?.expanded?.onRecordIdsChange ?? setInternalExpandedIds;

  const toggleExpanded = (id: unknown) => {
    if (expandedRecordIds.includes(id)) {
      handleExpandedRecordIdsChange(expandedRecordIds.filter((x) => x !== id));
    } else {
      handleExpandedRecordIdsChange(rowExpansion?.allowMultiple ? [...expandedRecordIds, id] : [id]);
    }
  };

  const firstColumnIndex = fields.findIndex((field) => field.list && field.column && !field.column.hidden);
  const expansionFields: Field<T>[] =
    rowExpansion && firstColumnIndex >= 0
      ? fields.map((field, index) => {
          if (index !== firstColumnIndex) return field;
          const originalRender = field.column.render;
          return {
            ...field,
            column: {
              ...field.column,
              render: (record: T, recordIndex: number) => {
                const expandable = rowExpansion.expandable ? rowExpansion.expandable(record) : true;
                return (
                  <Group gap="xs" wrap="nowrap" align="center">
                    {expandable ? (
                      <Box
                        component="span"
                        aria-label="Aufklappen"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          toggleExpanded(record.id);
                        }}
                        style={{ display: "inline-flex", flexShrink: 0, cursor: "pointer" }}
                      >
                        <IconChevronRight
                          size={16}
                          style={{
                            color: "var(--mantine-primary-color-filled)",
                            transform: expandedRecordIds.includes(record.id) ? "rotate(90deg)" : undefined,
                            transition: "transform 200ms ease",
                          }}
                        />
                      </Box>
                    ) : (
                      <Box w={16} style={{ flexShrink: 0 }} />
                    )}
                    {originalRender
                      ? originalRender(record, recordIndex)
                      : String(getValueAtPath(record, field.column.accessor) ?? "")}
                  </Group>
                );
              },
            },
          };
        })
      : fields;

  const [selectedRecords, setSelectedRecords] = useState<T[]>([]);

  useEffect(() => {
    setSelectedRecords([]);
  }, [activeTab]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handledEditRecordId = useRef<string | null>(null);

  useEffect(() => {
    if (!editRecordId) {
      handledEditRecordId.current = null;
      return;
    }
    if (handledEditRecordId.current === editRecordId) return;
    const record = sortedData.find((r) => r.id === editRecordId);
    if (!record) return;
    handledEditRecordId.current = editRecordId;
    setSelectedRecords([record]);
    setUpdateModalOpen(true);
    onEditRecordIdChange?.(null);
  }, [editRecordId, sortedData]);

  const hasUpdateField = fields.some((field) => field.update);
  const hasDeleteField = fields.some((field) => field.delete);

  const mobileActions: Action<T>[] = [];
  if (hasUpdateField) {
    mobileActions.push({
      icon: <IconPencil size={14} />,
      label: "Bearbeiten",
      onClick: (records: T[]) => {
        setSelectedRecords(records);
        setUpdateModalOpen(true);
      },
    });
  }
  if (actions) {
    mobileActions.push(...actions);
  }
  if (hasDeleteField) {
    mobileActions.push({
      icon: <IconTrash size={14} />,
      label: "Löschen",
      onClick: (records: T[]) => {
        setSelectedRecords(records);
        setDeleteModalOpen(true);
      },
    });
  }

  return (
    <>
      <Flex
        gap="xs"
        align={{ base: "stretch", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        justify={title ? "space-between" : "flex-end"}
        wrap="wrap"
      >
        {title && (
          <Group gap={6} align="center" wrap="nowrap">
            {typeof title === "string" ? <Title order={4}>{title}</Title> : title}
            {titleHint != null && (
              <HoverCard
                width={340}
                shadow="md"
                withArrow
                openDelay={120}
                closeDelay={160}
                position="top-start"
              >
                <HoverCard.Target>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    radius="xl"
                    aria-label="Mehr Informationen"
                  >
                    <IconInfoCircle size={16} />
                  </ActionIcon>
                </HoverCard.Target>
                <HoverCard.Dropdown>
                  <Text component="div" size="sm" c="dimmed">
                    {titleHint}
                  </Text>
                </HoverCard.Dropdown>
              </HoverCard>
            )}
          </Group>
        )}
        <Flex
          align={{ base: "stretch", sm: "center" }}
          direction={{ base: "column", sm: "row" }}
          gap="xs"
          wrap="wrap"
          justify={{ base: "flex-start", sm: "flex-end" }}
          ml={{ base: 0, sm: "auto" }}
        >
          {showRefresh && (
            <ActionIcon
              variant="subtle"
              loading={isRefreshing}
              onClick={async () => {
                if (onRefresh) {
                  setIsRefreshing(true);
                  try {
                    await onRefresh();
                  } finally {
                    setIsRefreshing(false);
                  }
                } else {
                  refetch();
                }
              }}
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
              <Box {...(mobileCards ? { visibleFrom: "sm" } : {})}>
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
                      disabled={action.disabled?.(selectedRecords) ?? false}
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
              </Box>
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
        </Flex>
      </Flex>

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
            {/* @ts-expect-error - conditional pagination spread not compatible with strict prop types */}
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
                  trigger: onRowClick ? "never" : "click",
                  content: ({ record }: { record: T }) => rowExpansion.content(record, false),
                  expanded: { recordIds: expandedRecordIds, onRecordIdsChange: handleExpandedRecordIdsChange },
                  ...(rowExpansion.expandable && {
                    expandable: ({ record }: { record: T }) => rowExpansion.expandable!(record),
                  }),
                },
              })}
              columns={expansionFields.map((field) => field.column)}
              noRecordsText="Keine Einträge gefunden"
              onRowClick={onRowClick}
              {...(onRowClick && { style: { cursor: "pointer" } })}
            />
          </Box>

          {mobileCards && (
            <Box hiddenFrom="sm">
              <MobileCardList
                records={records}
                fields={expansionFields}
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
                  rowExpansion: {
                    content: rowExpansion.content,
                    expanded: { recordIds: expandedRecordIds, onRecordIdsChange: handleExpandedRecordIdsChange },
                    ...(rowExpansion.expandable && { expandable: rowExpansion.expandable }),
                  },
                })}
                {...(mobileActions.length > 0 && {
                  actions: mobileActions,
                  canUpdate,
                  canDelete,
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
            connectedQueryKeys={connectedQueryKeys}
            apiPath={effectiveMutationApiPath}
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
            connectedQueryKeys={connectedQueryKeys}
            apiPath={effectiveMutationApiPath}
            selectedRecords={selectedRecords}
            confirmMessage={deleteConfirmMessage}
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
          connectedQueryKeys={connectedQueryKeys}
          apiPath={effectiveMutationApiPath}
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
