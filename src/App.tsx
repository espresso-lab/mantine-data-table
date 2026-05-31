import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "mantine-datatable/styles.css";
import { DatePicker } from "@mantine/dates";
import { Badge, Box, Button, Checkbox, Container, Divider, Group, MantineProvider, Stack, Switch, Tabs, Text, TextInput, Title } from "@mantine/core";
import { MobileCardList } from "./DataTable/MobileCardList";
import { Field } from "./DataTable/DataTableInner";
import { useState } from "react";
import { sortData } from "./utils/sort";
import { DataTable as MantineDataTable, DataTableSortStatus } from "mantine-datatable";
import { IconSearch, IconUsers, IconShield, IconUserCog, IconPencil, IconMail, IconTrash } from "@tabler/icons-react";

interface DemoItem {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  date: string;
}

const demoData: DemoItem[] = [
  { id: 1, name: "Max Mustermann", email: "max@example.com", role: "Admin", active: true, date: "2026-03-08" },
  { id: 2, name: "Erika Musterfrau", email: "erika@example.com", role: "User", active: true, date: "2026-03-22" },
  { id: 3, name: "Hans Schmidt", email: "hans@example.com", role: "Manager", active: false, date: "2026-04-14" },
  { id: 4, name: "Anna Müller", email: "anna@example.com", role: "User", active: true, date: "2026-04-30" },
  { id: 5, name: "Peter Weber", email: "peter@example.com", role: "Admin", active: true, date: "2026-05-06" },
  { id: 6, name: "Lisa Fischer", email: "lisa@example.com", role: "User", active: false, date: "2026-05-14" },
  { id: 7, name: "Tom Braun", email: "tom@example.com", role: "Manager", active: true, date: "2026-05-22" },
  { id: 8, name: "Julia Schwarz", email: "julia@example.com", role: "User", active: true, date: "2026-05-29" },
  { id: 9, name: "Markus Wolf", email: "markus@example.com", role: "Admin", active: false, date: "2026-06-03" },
  { id: 10, name: "Sarah Klein", email: "sarah@example.com", role: "User", active: true, date: "2026-06-18" },
  { id: 11, name: "Daniel Bauer", email: "daniel@example.com", role: "Manager", active: true, date: "2026-07-02" },
  { id: 12, name: "Laura Richter", email: "laura@example.com", role: "User", active: false, date: "2026-07-24" },
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
  const [enableColumnFilter, setEnableColumnFilter] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [enableRowExpansion, setEnableRowExpansion] = useState(false);
  const [enableCardActions, setEnableCardActions] = useState(true);
  const [enableConditionalExpansion, setEnableConditionalExpansion] = useState(false);

  const demoActions = enableCardActions ? [
    { icon: <IconPencil size={14} />, label: "Bearbeiten", onClick: (records: DemoItem[]) => alert(`Bearbeiten: ${records[0].name}`) },
    { icon: <IconMail size={14} />, label: "E-Mail senden", onClick: (records: DemoItem[]) => alert(`E-Mail an: ${records[0].email}`) },
    { icon: <IconTrash size={14} />, label: "Löschen", onClick: (records: DemoItem[]) => alert(`Löschen: ${records[0].name}`) },
  ] : undefined;

  const [selectedRecords, setSelectedRecords] = useState<DemoItem[]>([]);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fields: Field<DemoItem>[] = [
    { id: "name", list: true, create: false, update: false, delete: false, column: { accessor: "name", title: "Name" } },
    { id: "email", list: true, create: false, update: false, delete: false, column: { accessor: "email", title: "E-Mail" } },
    {
      id: "role",
      list: true,
      create: false,
      update: false,
      delete: false,
      column: {
        accessor: "role",
        title: "Rolle",
        render: (record) => <Badge variant="light" size="sm">{record.role}</Badge>,
        ...(enableColumnFilter && {
          filter: ({ close }: { close: () => void }) => (
            <Stack>
              <Checkbox.Group value={roleFilter} onChange={setRoleFilter}>
                <Stack gap="xs">
                  <Checkbox value="Admin" label="Admin" />
                  <Checkbox value="Manager" label="Manager" />
                  <Checkbox value="User" label="User" />
                </Stack>
              </Checkbox.Group>
              <Button variant="light" disabled={!roleFilter.length} onClick={() => { setRoleFilter([]); close(); }}>
                Zurücksetzen
              </Button>
            </Stack>
          ),
          filtering: roleFilter.length > 0,
        }),
      },
    },
    {
      id: "date",
      list: true,
      create: false,
      update: false,
      delete: false,
      column: {
        accessor: "date",
        title: "Datum",
        render: (record) => <Text fz="sm">{new Date(record.date).toLocaleDateString("de-DE")}</Text>,
        ...(enableColumnFilter && {
          filter: ({ close }: { close: () => void }) => (
            <Stack>
              <DatePicker type="range" value={dateRange} onChange={setDateRange} allowSingleDateInRange />
              <Button variant="light" disabled={!dateRange[0] && !dateRange[1]} onClick={() => { setDateRange([null, null]); close(); }}>
                Zurücksetzen
              </Button>
            </Stack>
          ),
          filtering: !!(dateRange[0] || dateRange[1]),
        }),
      },
    },
    { id: "active", list: true, create: false, update: false, delete: false, type: "boolean", column: { accessor: "active", title: "Aktiv" } },
  ];

  const tabFiltered = enableTabs && activeTab && activeTab !== "all"
    ? demoData.filter((r) => r.role === activeTab)
    : demoData;

  const roleFiltered = enableColumnFilter && roleFilter.length > 0
    ? tabFiltered.filter((r) => roleFilter.includes(r.role))
    : tabFiltered;

  const dateFiltered = enableColumnFilter && (dateRange[0] || dateRange[1])
    ? roleFiltered.filter((r) => (!dateRange[0] || r.date >= dateRange[0]) && (!dateRange[1] || r.date <= dateRange[1]))
    : roleFiltered;

  const filtered = enableFilter && searchQuery
    ? dateFiltered.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : dateFiltered;

  const sorted = enableSort ? sortData(filtered, sortField as keyof DemoItem, sortDirection) : filtered;
  const records = enablePagination ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  const expansionContent = (record: DemoItem, isMobile = false) => (
    <Stack gap={4}>
      <Badge variant="light" size="xs" color={isMobile ? "grape" : "blue"}>
        {isMobile ? "Mobile-Layout" : "Desktop-Layout"}
      </Badge>
      <Text fz="sm"><Text span fw={600}>ID:</Text> {record.id}</Text>
      <Text fz="sm"><Text span fw={600}>E-Mail:</Text> {record.email}</Text>
      <Text fz="sm"><Text span fw={600}>Status:</Text> {record.active ? "Aktiv" : "Inaktiv"}</Text>
    </Stack>
  );

  const sharedProps = {
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
          <Switch label="Selection (Desktop)" checked={enableSelection} onChange={(e) => setEnableSelection(e.currentTarget.checked)} />
          <Switch label="Sort" checked={enableSort} onChange={(e) => setEnableSort(e.currentTarget.checked)} />
          <Switch label="Pagination" checked={enablePagination} onChange={(e) => setEnablePagination(e.currentTarget.checked)} />
          <Switch label="Tabs" checked={enableTabs} onChange={(e) => setEnableTabs(e.currentTarget.checked)} />
          <Switch label="Filter (Suche)" checked={enableFilter} onChange={(e) => setEnableFilter(e.currentTarget.checked)} />
          <Switch label="Column Filter" checked={enableColumnFilter} onChange={(e) => setEnableColumnFilter(e.currentTarget.checked)} />
          <Switch label="Row Expansion" checked={enableRowExpansion} onChange={(e) => setEnableRowExpansion(e.currentTarget.checked)} />
          <Switch label="Conditional Expansion (nur Admin-Tab)" checked={enableConditionalExpansion} onChange={(e) => setEnableConditionalExpansion(e.currentTarget.checked)} />
          <Switch label="Card Actions" checked={enableCardActions} onChange={(e) => setEnableCardActions(e.currentTarget.checked)} />
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
            {...(demoActions && { actions: demoActions })}
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
              {...(enableConditionalExpansion && activeTab === "Admin" && {
                rowExpansion: {
                  allowMultiple: true,
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
