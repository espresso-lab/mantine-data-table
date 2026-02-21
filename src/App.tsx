import "@mantine/core/styles.css";
import "mantine-datatable/styles.css";
import { Badge, Box, Container, Divider, Group, MantineProvider, Stack, Switch, Tabs, Text, TextInput, Title } from "@mantine/core";
import { MobileCardList } from "./DataTable/MobileCardList";
import { Field } from "./DataTable/DataTableInner";
import { useState } from "react";
import { sortData } from "./utils/sort";
import { DataTable as MantineDataTable, DataTableSortStatus } from "mantine-datatable";
import { IconSearch, IconUsers, IconShield, IconUserCog } from "@tabler/icons-react";

interface DemoItem {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const demoData: DemoItem[] = [
  { id: 1, name: "Max Mustermann", email: "max@example.com", role: "Admin", active: true },
  { id: 2, name: "Erika Musterfrau", email: "erika@example.com", role: "User", active: true },
  { id: 3, name: "Hans Schmidt", email: "hans@example.com", role: "Manager", active: false },
  { id: 4, name: "Anna Müller", email: "anna@example.com", role: "User", active: true },
  { id: 5, name: "Peter Weber", email: "peter@example.com", role: "Admin", active: true },
  { id: 6, name: "Lisa Fischer", email: "lisa@example.com", role: "User", active: false },
  { id: 7, name: "Tom Braun", email: "tom@example.com", role: "Manager", active: true },
  { id: 8, name: "Julia Schwarz", email: "julia@example.com", role: "User", active: true },
  { id: 9, name: "Markus Wolf", email: "markus@example.com", role: "Admin", active: false },
  { id: 10, name: "Sarah Klein", email: "sarah@example.com", role: "User", active: true },
  { id: 11, name: "Daniel Bauer", email: "daniel@example.com", role: "Manager", active: true },
  { id: 12, name: "Laura Richter", email: "laura@example.com", role: "User", active: false },
];

const fields: Field<DemoItem>[] = [
  { id: "name", list: true, create: false, update: false, delete: false, column: { accessor: "name", title: "Name" } },
  { id: "email", list: true, create: false, update: false, delete: false, column: { accessor: "email", title: "E-Mail" } },
  { id: "role", list: true, create: false, update: false, delete: false, column: { accessor: "role", title: "Rolle", render: (record) => <Badge variant="light" size="sm">{record.role}</Badge> } },
  { id: "active", list: true, create: false, update: false, delete: false, type: "boolean", column: { accessor: "active", title: "Aktiv" } },
];

const PAGE_SIZES = [3, 5, 10];

export default function App() {
  const [enableSelection, setEnableSelection] = useState(true);
  const [enableSort, setEnableSort] = useState(true);
  const [enablePagination, setEnablePagination] = useState(true);
  const [enableOnRowClick, setEnableOnRowClick] = useState(false);
  const [enableMobileCards, setEnableMobileCards] = useState(false);
  const [enableTabs, setEnableTabs] = useState(false);
  const [enableFilter, setEnableFilter] = useState(false);
  const [enableRowExpansion, setEnableRowExpansion] = useState(false);

  const [selectedRecords, setSelectedRecords] = useState<DemoItem[]>([]);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Tab filter
  const tabFiltered = enableTabs && activeTab && activeTab !== "all"
    ? demoData.filter((r) => r.role === activeTab)
    : demoData;

  // Search filter
  const filtered = enableFilter && searchQuery
    ? tabFiltered.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : tabFiltered;

  const sorted = enableSort ? sortData(filtered, sortField as keyof DemoItem, sortDirection) : filtered;
  const records = enablePagination ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const expansionContent = (record: DemoItem) => (
    <Stack gap={4}>
      <Text fz="sm"><Text span fw={600}>ID:</Text> {record.id}</Text>
      <Text fz="sm"><Text span fw={600}>E-Mail:</Text> {record.email}</Text>
      <Text fz="sm"><Text span fw={600}>Status:</Text> {record.active ? "Aktiv" : "Inaktiv"}</Text>
    </Stack>
  );

  const sharedProps = {
    ...(enableSelection && {
      selection: true as const,
      selectedRecords,
      onSelectedRecordsChange: setSelectedRecords,
    }),
    ...(enableSort && {
      sort: {
        field: sortField,
        direction: sortDirection,
        onSortChange: (field: string, direction: "asc" | "desc") => {
          setSortField(field);
          setSortDirection(direction);
          setPage(1);
        },
      },
    }),
    ...(enablePagination && {
      pagination: {
        totalRecords: sorted.length,
        recordsPerPage: pageSize,
        page,
        onPageChange: setPage,
        recordsPerPageOptions: PAGE_SIZES,
        onRecordsPerPageChange: (size: number) => { setPageSize(size); setPage(1); },
      },
    }),
    ...(enableOnRowClick && {
      onRowClick: ({ record }: { record: DemoItem }) => alert(`Clicked: ${record.name}`),
    }),
    ...(enableRowExpansion && {
      rowExpansion: { content: expansionContent },
    }),
  };

  return (
    <MantineProvider>
      <Container size="sm" py="xl">
        <Title order={3} mb="md">MobileCardList Demo</Title>

        <Group gap="lg" mb="md" wrap="wrap">
          <Switch label="mobileCards" checked={enableMobileCards} onChange={(e) => setEnableMobileCards(e.currentTarget.checked)} />
          <Switch label="Selection" checked={enableSelection} onChange={(e) => setEnableSelection(e.currentTarget.checked)} />
          <Switch label="Sort" checked={enableSort} onChange={(e) => setEnableSort(e.currentTarget.checked)} />
          <Switch label="Pagination" checked={enablePagination} onChange={(e) => setEnablePagination(e.currentTarget.checked)} />
          <Switch label="Tabs" checked={enableTabs} onChange={(e) => setEnableTabs(e.currentTarget.checked)} />
          <Switch label="Filter" checked={enableFilter} onChange={(e) => setEnableFilter(e.currentTarget.checked)} />
          <Switch label="Row Expansion" checked={enableRowExpansion} onChange={(e) => setEnableRowExpansion(e.currentTarget.checked)} />
          <Switch label="onRowClick" checked={enableOnRowClick} onChange={(e) => setEnableOnRowClick(e.currentTarget.checked)} />
        </Group>

        <Divider mb="md" />

        {enableTabs && (
          <Tabs value={activeTab} onChange={(v) => { setActiveTab(v); setPage(1); setSelectedRecords([]); }} mb="md">
            <Tabs.List>
              <Tabs.Tab value="all" leftSection={<IconUsers size={14} />}>Alle</Tabs.Tab>
              <Tabs.Tab value="Admin" leftSection={<IconShield size={14} />}>Admin</Tabs.Tab>
              <Tabs.Tab value="Manager" leftSection={<IconUserCog size={14} />}>Manager</Tabs.Tab>
              <Tabs.Tab value="User" leftSection={<IconUsers size={14} />}>User</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        )}

        {enableFilter && (
          <TextInput
            placeholder="Name oder E-Mail suchen..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.currentTarget.value); setPage(1); }}
            mb="md"
          />
        )}

        {enableMobileCards ? (
          <MobileCardList
            records={records}
            fields={fields}
            {...sharedProps}
          />
        ) : (
          <Box my="md">
            {/* @ts-expect-error */}
            <MantineDataTable
              striped
              highlightOnHover
              minHeight={150}
              records={records}
              columns={fields.map((f) => f.column)}
              noRecordsText="Keine Einträge gefunden"
              {...(enableSelection && {
                selectedRecords,
                onSelectedRecordsChange: setSelectedRecords,
              })}
              {...(enableSort && {
                sortStatus: { columnAccessor: sortField, direction: sortDirection } as DataTableSortStatus<DemoItem>,
                onSortStatusChange: (s: DataTableSortStatus<DemoItem>) => {
                  setSortField(String(s.columnAccessor));
                  setSortDirection(s.direction);
                  setPage(1);
                },
              })}
              {...(enablePagination && {
                totalRecords: sorted.length,
                recordsPerPage: pageSize,
                page,
                onPageChange: setPage,
                recordsPerPageOptions: PAGE_SIZES,
                onRecordsPerPageChange: (size: number) => { setPageSize(size); setPage(1); },
                recordsPerPageLabel: "Einträge pro Seite",
              })}
              {...(enableRowExpansion && {
                rowExpansion: {
                  content: ({ record }: { record: DemoItem }) => expansionContent(record),
                },
              })}
              {...(enableOnRowClick && {
                onRowClick: ({ record }: { record: DemoItem }) => alert(`Clicked: ${record.name}`),
                style: { cursor: "pointer" },
              })}
            />
          </Box>
        )}
      </Container>
    </MantineProvider>
  );
}
