import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Skeleton,
  Stack,
  Tabs,
  TitleOrder,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { BaseEntity, useGetAll } from "../Hooks/useApi";
import React, { useEffect, useRef, useState } from "react";
import { CreateModal } from "./CreateModal";
import { IconChevronDown, IconChevronRight, IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react";
import { DataTable as MantineDataTable, DataTableColumn, DataTableSortStatus, getValueAtPath } from "mantine-datatable";
import { UpdateModal } from "./UpdateModal.tsx";
import { DeleteModal } from "./DeleteModal.tsx";
import { usePersistentState } from "../Hooks/usePersistentState.ts";
import { sortData } from "../utils/sort";
import { applyFilters, Filter } from "../utils/filter";
import { matchesSearch } from "../utils/search";
import { isOwnEscape } from "../utils/escape";
import { MobileCardList } from "./MobileCardList";
import { PageHeader } from "./PageHeader";
import { Crumb } from "./breadcrumbContext";
import { RowAction, RowActions } from "./RowActions";
import { SearchInput } from "./SearchInput";
import { hasRowActions } from "../utils/rowActions";

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

export interface SearchConfig<T> {
  placeholder?: string;
  accessors?: string[];
  match?: (record: T, query: string) => boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export interface DataTableProps<T extends BaseEntity> {
  title?: string | React.ReactNode;
  titleOrder?: TitleOrder;
  titleHint?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  crumb?: React.ReactNode;
  entityName?: string;
  recordLabel?: (record: T) => string;
  queryKey: (string | number)[];
  connectedQueryKeys?: (string | number)[][];
  apiPath: string;
  mutationApiPath?: string;
  queryParams?: Record<string, string | number | boolean | null>;
  filters?: Filter[];
  search?: boolean | SearchConfig<T>;
  toolbar?: React.ReactNode;
  buttons?: React.ReactNode[];
  topContent?: React.ReactNode;
  createButtonText?: string;
  actions?: Action<T>[];
  rowActions?: (record: T) => RowAction[];
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
  noRecordsText?: string;
  deleteConfirmMessage?: (records: T[]) => React.ReactNode;
  editRecordId?: string | null;
  onEditRecordIdChange?: (id: string | null) => void;
}

const PAGE_SIZES = [10, 15, 50, 100, 500];


export function DataTable<T extends BaseEntity>({
  title,
  titleOrder = 4,
  titleHint,
  description,
  breadcrumbs,
  crumb,
  entityName,
  recordLabel,
  queryKey,
  connectedQueryKeys,
  apiPath,
  mutationApiPath,
  buttons,
  topContent,
  fields,
  selection,
  pagination,
  filters,
  search,
  toolbar,
  actions,
  rowActions,
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
  noRecordsText,
  deleteConfirmMessage,
  editRecordId,
  onEditRecordIdChange,
}: DataTableProps<T>) {
  const isMobile = useMediaQuery("(max-width: 48em)");
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

  const searchConfig: SearchConfig<T> | undefined = search === true ? {} : search || undefined;
  const [internalQuery, setInternalQuery] = useState("");
  const query = searchConfig?.value ?? internalQuery;
  const searchesLocally = !!searchConfig && !searchConfig.onChange;
  const searchAccessors =
    searchConfig?.accessors ??
    fields.filter((field) => field.list && field.column && !field.column.hidden).map((field) => String(field.column.accessor));

  const filteredData = applyFilters(Array.isArray(allData) ? allData : [], filters).filter(
    (record) =>
      !searchesLocally ||
      (searchConfig.match ? !query.trim() || searchConfig.match(record, query) : matchesSearch(record, query, searchAccessors)),
  );

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

  const refresh = async () => {
    if (!onRefresh) {
      refetch();
      return;
    }
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const handleRecordsPerPageChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleQueryChange = (value: string) => {
    if (searchConfig?.onChange) {
      searchConfig.onChange(value);
    } else {
      setInternalQuery(value);
    }
    setPage(1);
  };

  const records = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const [selectedRecords, setSelectedRecords] = useState<T[]>([]);
  const [selectionTab, setSelectionTab] = useState(activeTab);
  const [editRecord, setEditRecord] = useState<T | null>(null);
  const [deleteRecords, setDeleteRecords] = useState<T[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  if (selectionTab !== activeTab) {
    setSelectionTab(activeTab);
    setSelectedRecords([]);
  }

  const hasCreateField = fields.some((field) => field.create);
  const hasUpdateField = fields.some((field) => field.update);
  const hasDeleteField = fields.some((field) => field.delete);

  const canEditRecord = (record: T) => hasUpdateField && (canUpdate ? canUpdate(record) : true);
  const canDeleteRecord = (record: T) => hasDeleteField && (canDelete ? canDelete(record) : true);

  const singular = entityName ?? "Eintrag";


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
                const expanded = expandedRecordIds.includes(record.id);
                return (
                  <Group gap="xs" wrap="nowrap" align="center">
                    {expandable ? (
                      <UnstyledButton
                        aria-label={expanded ? "Zuklappen" : "Aufklappen"}
                        aria-expanded={expanded}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          toggleExpanded(record.id);
                        }}
                        style={{
                          display: "inline-flex",
                          flexShrink: 0,
                          padding: 4,
                          margin: -4,
                          borderRadius: "var(--mantine-radius-sm)",
                        }}
                      >
                        <IconChevronRight
                          size={16}
                          style={{
                            color: "var(--mantine-primary-color-filled)",
                            transform: expanded ? "rotate(90deg)" : undefined,
                            transition: "transform 200ms ease",
                          }}
                        />
                      </UnstyledButton>
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

  const [handledEditRecordId, setHandledEditRecordId] = useState<string | null>(null);

  if (!editRecordId && handledEditRecordId !== null) {
    setHandledEditRecordId(null);
  } else if (editRecordId && editRecordId !== handledEditRecordId) {
    const record = sortedData.find((r) => r.id === editRecordId);
    if (record) {
      setHandledEditRecordId(editRecordId);
      setEditRecord(record);
    }
  }

  useEffect(() => {
    if (editRecordId && editRecordId === handledEditRecordId) onEditRecordIdChange?.(null);
  }, [editRecordId, handledEditRecordId, onEditRecordIdChange]);

  const rowActionsOf = (record: T) => ({
    actions: rowActions?.(record) ?? [],
    onEdit: canEditRecord(record) ? () => setEditRecord(record) : undefined,
    onDelete: canDeleteRecord(record) ? () => setDeleteRecords([record]) : undefined,
  });

  const showsRowActions = (Array.isArray(allData) ? allData : []).some((record) => hasRowActions(rowActionsOf(record)));
  const rowActionsColumn: DataTableColumn<T> = {
    accessor: "__rowActions",
    title: <VisuallyHidden>Aktionen</VisuallyHidden>,
    textAlign: "right",
    noWrap: true,
    render: (record: T) => <RowActions name={recordLabel?.(record)} {...rowActionsOf(record)} />,
  };
  const columns = [
    ...expansionFields.map((field) => field.column),
    ...(showsRowActions ? [rowActionsColumn] : []),
  ];

  const cardActionsOf = (record: T) => {
    const own = rowActionsOf(record);
    const bulk: RowAction[] = (actions ?? []).map((action) => ({
      label: action.label,
      icon: action.icon,
      onClick: () => action.onClick([record]),
      disabled: action.disabled?.([record]) ?? false,
    }));
    return {
      ...own,
      onEdit: hasUpdateField && canEditRecord(record) ? () => setEditRecord(record) : undefined,
      actions: [...own.actions, ...bulk],
    };
  };

  const bulkDeletable = hasDeleteField && selectedRecords.length > 0 && selectedRecords.every(canDeleteRecord);
  const showsBulkMenu = !!selection && selectedRecords.length > 0 && ((actions ?? []).length > 0 || bulkDeletable);

  const headerActions = (
    <>
      {showRefresh && (
        <Tooltip label="Aktualisieren">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="input-sm"
            loading={isRefreshing}
            onClick={refresh}
            aria-label="Aktualisieren"
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Tooltip>
      )}
      {buttons}
      {showsBulkMenu && (
        <Box {...(mobileCards ? { visibleFrom: "sm" } : {})}>
          <Menu>
            <Menu.Target>
              <Button variant="default" rightSection={<IconChevronDown size={16} />}>
                {selectedRecords.length} ausgewählt
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              {(actions ?? []).map((action) => (
                <Menu.Item
                  key={action.label}
                  leftSection={action.icon}
                  onClick={() => action.onClick(selectedRecords)}
                  disabled={action.disabled?.(selectedRecords) ?? false}
                >
                  {action.label}
                </Menu.Item>
              ))}
              {bulkDeletable && (actions ?? []).length > 0 && <Menu.Divider />}
              {bulkDeletable && (
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => setDeleteRecords(selectedRecords)}
                >
                  Löschen
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Box>
      )}
      {hasCreateField && (
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpen(true)} disabled={isLoading}>
          {createButtonText ?? (entityName ? `${entityName} anlegen` : "Anlegen")}
        </Button>
      )}
    </>
  );

  const closeEdit = () => setEditRecord(null);
  const closeDelete = () => {
    setDeleteRecords([]);
    setSelectedRecords([]);
  };

  const emptyText = noRecordsText ?? (query.trim() ? `Keine Treffer für „${query.trim()}“` : "Keine Einträge gefunden");

  return (
    <Stack gap="md">
      {title ? (
        <PageHeader
          title={title}
          order={titleOrder}
          description={description}
          breadcrumbs={breadcrumbs}
          crumb={crumb}
          hint={titleHint}
          actions={headerActions}
        />
      ) : (
        <Group justify="flex-end" gap="xs" wrap="wrap">
          {headerActions}
        </Group>
      )}

      {topContent}

      {tabs && tabs.length > 0 && (
        <Tabs value={activeTab} onChange={handleTabChange}>
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

      {(searchConfig || toolbar) && (
        <Group gap="xs" wrap="wrap" align="flex-end">
          {searchConfig && (
            <SearchInput value={query} onChange={handleQueryChange} placeholder={searchConfig.placeholder} />
          )}
          {toolbar}
        </Group>
      )}

      {isError && (
        <Alert color="red" title={typeof title === "string" ? `${title} nicht geladen` : "Einträge nicht geladen"}>
          <Button variant="default" size="xs" leftSection={<IconRefresh size={14} />} onClick={() => refetch()}>
            Erneut laden
          </Button>
        </Alert>
      )}

      {(isLoading || isRefetching) && (
        <Stack>
          <Skeleton height={40} />
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Skeleton key={`skeleton-${index}`} height={35} />
            ))}
        </Stack>
      )}

      {!isLoading && !isRefetching && (!isError || allData !== undefined) && (
        <>
          <Box {...(mobileCards ? { visibleFrom: "sm" } : {})}>
            {/* @ts-expect-error - conditional pagination spread not compatible with strict prop types */}
            <MantineDataTable
              withTableBorder
              borderRadius="md"
              highlightOnHover
              verticalSpacing="sm"
              horizontalSpacing="md"
              minHeight={150}
              pinLastColumn={showsRowActions}
              records={records}
              sortStatus={sortStatus}
              onSortStatusChange={handleSortChange}
              {...(selection && {
                selectedRecords,
                onSelectedRecordsChange: setSelectedRecords,
              })}
              {...(pagination &&
                sortedData.length && {
                  totalRecords: sortedData.length,
                  recordsPerPage: pageSize,
                  onPageChange: setPage,
                  page: currentPage,
                  recordsPerPageOptions: PAGE_SIZES,
                  onRecordsPerPageChange: handleRecordsPerPageChange,
                  recordsPerPageLabel: "Einträge pro Seite",
                })}
              {...(rowExpansion && {
                rowExpansion: {
                  allowMultiple: rowExpansion.allowMultiple ?? false,
                  trigger: onRowClick ? "never" : "click",
                  content: ({ record }: { record: T }) => (
                    <Box bg="var(--mantine-color-body)" pos="sticky" left={0} w="100cqw" style={{ zIndex: 1 }}>
                      {rowExpansion.content(record, false)}
                    </Box>
                  ),
                  expanded: { recordIds: expandedRecordIds, onRecordIdsChange: handleExpandedRecordIdsChange },
                  ...(rowExpansion.expandable && {
                    expandable: ({ record }: { record: T }) => rowExpansion.expandable!(record),
                  }),
                },
              })}
              columns={columns}
              noRecordsText={emptyText}
              onRowClick={onRowClick}
              style={{ containerType: "inline-size", ...(onRowClick && { cursor: "pointer" }) }}
            />
          </Box>

          {mobileCards && (
            <Box hiddenFrom="sm">
              <MobileCardList
                records={records}
                fields={expansionFields}
                onRowClick={onRowClick}
                noRecordsText={emptyText}
                sort={{
                  field: String(sortStatus.columnAccessor),
                  direction: sortStatus.direction,
                  onSortChange: (field, direction) => {
                    handleSortChange({ columnAccessor: field as keyof T, direction });
                  },
                }}
                {...(pagination && sortedData.length && {
                  pagination: {
                    totalRecords: sortedData.length,
                    recordsPerPage: pageSize,
                    page: currentPage,
                    onPageChange: setPage,
                    recordsPerPageOptions: PAGE_SIZES,
                    onRecordsPerPageChange: handleRecordsPerPageChange,
                  },
                })}
                {...(rowExpansion && {
                  rowExpansion: {
                    content: rowExpansion.content,
                    expanded: { recordIds: expandedRecordIds, onRecordIdsChange: handleExpandedRecordIdsChange },
                    ...(rowExpansion.expandable && { expandable: rowExpansion.expandable }),
                  },
                })}
                cardActions={cardActionsOf}
              />
            </Box>
          )}
        </>
      )}

      <Modal
        opened={editRecord !== null}
        onClose={closeEdit}
        closeOnEscape={false}
        onKeyDown={(event) => isOwnEscape(event) && closeEdit()}
        title={`${singular} bearbeiten`}
        fullScreen={isMobile}
      >
        {editRecord && (
          <UpdateModal<T>
            fields={fields.filter((field) => field.update)}
            queryKey={queryKey}
            connectedQueryKeys={connectedQueryKeys}
            apiPath={effectiveMutationApiPath}
            id={editRecord.id}
            onClose={closeEdit}
            steps={steps}
          />
        )}
      </Modal>

      <Modal
        opened={deleteRecords.length > 0}
        onClose={closeDelete}
        title={deleteRecords.length > 1 ? `${deleteRecords.length} Einträge löschen?` : `${singular} löschen?`}
        centered
      >
        {deleteRecords.length > 0 && (
          <DeleteModal<T>
            onClose={closeDelete}
            queryKey={queryKey}
            connectedQueryKeys={connectedQueryKeys}
            apiPath={effectiveMutationApiPath}
            selectedRecords={deleteRecords}
            confirmMessage={deleteConfirmMessage}
            recordLabel={recordLabel}
          />
        )}
      </Modal>

      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
        closeOnEscape={false}
        onKeyDown={(event) => isOwnEscape(event) && setCreateModalOpen(false)}
        title={`${singular} anlegen`}
        fullScreen={isMobile}
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
    </Stack>
  );
}
