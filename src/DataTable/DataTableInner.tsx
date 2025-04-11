import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Menu,
  Modal,
  Skeleton,
  Stack,
  Title,
} from "@mantine/core";
import { BaseEntity, useGetAll } from "../Hooks/useApi";
import React, { useEffect, useState } from "react";
import { CreateModal } from "./CreateModal";
import {
  IconCaretDownFilled,
  IconInfoCircle,
  IconPencil,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import {
  DataTable as MantineDataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { sortBy } from "lodash";
import { DatesRangeValue } from "@mantine/dates";
import { UpdateModal } from "./UpdateModal.tsx";
import { DeleteModal } from "./DeleteModal.tsx";
import { useDataTable } from "../Hooks/useDataTable.ts";
import {usePersistentState} from "../Hooks/usePersitentState.ts";

interface Filter {
  id: string | number;
  type: "query" | "date";
  value?: string | DatesRangeValue;
}

export type FieldType = "text" | "number" | "boolean" | "custom" | "date";

export interface Field<T> {
  id: string;
  defaultValue?: T[keyof T];
  required?: boolean;
  step?: number;
  list: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  type?: FieldType;
  placeholder?: string;
  render?: (
    values: T,
    onChange: (value: T) => void,
    hideButtons: (value: boolean) => void,
    setValues: (values: T) => void,
  ) => React.ReactNode;
  column: DataTableColumn<T>;
}

interface Action<T extends BaseEntity> {
  icon?: React.ReactNode;
  label: string;
  onClick: (records: T[]) => void;
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
}

const PAGE_SIZES = [10, 15, 20, 50, 100];

export function DataTableInner<T extends BaseEntity>({
  title,
  queryKey,
  connectedQueryKeys,
  apiPath,
  buttons,
  fields,
  selection,
  pagination,
  filters,
  actions,
  steps,
  defaultSort,
  createButtonText,
}: DataTableProps<T>) {
  const {
    data: allData,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useGetAll<T>(apiPath, queryKey);
  const [data, setData] = useState<T[]>([]);
  const { queryClient } = useDataTable();

  useEffect(() => {
    if (!allData || !Array.isArray(allData)) return;

    connectedQueryKeys?.forEach((connectedQueryKey) =>
      queryClient.invalidateQueries({ queryKey: connectedQueryKey }),
    );

    if (!filters || filters.length === 0) {
      setData(allData);
      return;
    }

    setData(
      allData.filter((record: T) =>
        filters.every((filter) => {
          const key = filter.id as keyof T;
          if (filter.type === "query" && typeof filter.value === "string") {
            const recordValue = record[key];
            return (
              typeof recordValue === "string" &&
              recordValue.includes(filter.value)
            );
          } else if (filter.type === "date") {
            if (!filter.value) {
              return true;
            }

            const dateValue = filter.value as DatesRangeValue;
            const [from, to] = dateValue;
            if (from && to) {
              const recordDate = record[key];
              if (typeof recordDate === "string") {
                const date = new Date(recordDate);
                return date >= from && date <= to;
              }
            }
            return true;
          }
          return true;
        }),
      ),
    );
  }, [allData, filters]);

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<T>>({
    columnAccessor: defaultSort?.field ?? fields[0].id,
    direction: defaultSort?.direction ?? "desc",
  });
  const [sortedData, setSortedData] = useState<T[]>(() => {
    const entries = sortBy(data, defaultSort?.field ?? fields[0].id) as T[];
    return defaultSort?.direction === "asc" ? entries : entries.reverse();
  });

  useEffect(() => {
    const entries = sortBy(data, sortStatus.columnAccessor) as T[];
    setSortedData(
      sortStatus.direction === "desc" ? entries.reverse() : entries,
    );
  }, [sortStatus, data]);

  // handle pagination
  const [pageSize, setPageSize] = usePersistentState(PAGE_SIZES[1], "mantine-table-page-size");
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<T[]>(
    pagination ? sortedData.slice(0, pageSize) : sortedData,
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (pagination) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      setRecords(sortedData.slice(from, to));
    } else {
      setRecords(sortedData);
    }
  }, [page, sortedData, pagination, pageSize]);

  const [selectedRecords, setSelectedRecords] = useState<T[]>([]);
  useEffect(() => {
    if (!selection) return;
    setSelectedRecords(
      sortedData.filter((record) =>
        selectedRecords.some((selected) => selected.id === record.id),
      ),
    );
  }, [sortedData]);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <>
      <Group gap="xs" justify={title ? "space-between" : "end"} align="center">
        {title &&
          (typeof title === "string" ? (
            <Title order={4}>{title}</Title>
          ) : (
            title
          ))}
        <Group align="center" gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => refetch()}
            aria-label="Neuladen"
          >
            <IconRefresh />
          </ActionIcon>
          {(fields.some((field) => field.update) || selection) && (
            <Menu shadow="md">
              <Menu.Target>
                <Button
                  variant="outline"
                  rightSection={<IconCaretDownFilled size={14} />}
                  disabled={!selectedRecords.length}
                >
                  Aktionen
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {fields.find((field) => field.update) && (
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
                {fields.find((field) => field.delete) && (
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
          )}
          {fields.find((field) => field.create) && (
            <Button onClick={() => setCreateModalOpen(true)} disabled={isLoading}>
              {createButtonText ?? "Erstellen"}
            </Button>
          )}
          {buttons}
        </Group>
      </Group>

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
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        /* @ts-expect-error */
        <MantineDataTable
          my="md"
          striped
          minHeight={150}
          fetching={isError}
          records={records}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
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
          columns={fields.map((field) => field.column)}
          noRecordsText="Keine Einträge gefunden"
        />
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
            apiPath={apiPath}
            id={selectedRecords[0].id}
            onClose={() => {
              setUpdateModalOpen(false);
              setSelectedRecords([]);
            }}
            steps={steps}
          />
        )}
      </Modal>

      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedRecords([]);
        }}
        title={title ?? "Löschen"}
      >
        {selectedRecords.length > 0 && (
          <DeleteModal<T>
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedRecords([]);
            }}
            queryKey={queryKey}
            apiPath={apiPath}
            selectedRecords={selectedRecords}
          />
        )}
      </Modal>

      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
        title={title ?? "Anlegen"}
      >
        <CreateModal<T>
          queryKey={queryKey}
          apiPath={apiPath}
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
