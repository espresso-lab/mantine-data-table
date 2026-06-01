import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "mantine-datatable/styles.css";
import { DatePicker } from "@mantine/dates";
import { Badge, Box, Button, Checkbox, Container, Divider, Group, MantineProvider, Stack, Switch, Tabs, Text, TextInput, Title } from "@mantine/core";
import { MobileCardList } from "./DataTable/MobileCardList";
import { SubTable, SubTableColumn } from "./DataTable/SubTable";
import { Field } from "./DataTable/DataTable";
import React, { useState } from "react";
import { sortData } from "./utils/sort";
import { DataTable as MantineDataTable, DataTableSortStatus } from "mantine-datatable";
import { IconSearch, IconUsers, IconShield, IconUserCog, IconPencil, IconMail, IconTrash, IconChevronRight } from "@tabler/icons-react";

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

interface SubEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  debit: number;
  credit: number;
  balance: number;
}

const eur = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);

function subEntries(record: DemoItem): SubEntry[] {
  if (!record.active) return [];
  const raw = [
    { description: "Basislastschrift SEPA", category: "Lastschrift", debit: record.id * 12.6, credit: 0 },
    { description: "Überweisung Eingang", category: "Gutschrift", debit: 0, credit: record.id * 8.4 },
    { description: "Kontoführungsgebühr", category: "Lastschrift", debit: record.id * 2.5, credit: 0 },
    { description: "Erstattung", category: "Gutschrift", debit: 0, credit: record.id * 3.1 },
  ];
  let balance = 0;
  return raw.map((entry, index) => {
    balance += entry.debit - entry.credit;
    return {
      id: `${record.id}-${index}`,
      date: `2026-04-0${index + 1}`,
      ...entry,
      debit: Math.round(entry.debit * 100) / 100,
      credit: Math.round(entry.credit * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    };
  });
}

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
  const [enableSubFilter, setEnableSubFilter] = useState(false);
  const [subCategoryFilter, setSubCategoryFilter] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<unknown[]>([]);

  const toggleExpanded = (id: number) =>
    setExpandedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

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
    {
      id: "name",
      list: true,
      create: false,
      update: false,
      delete: false,
      column: {
        accessor: "name",
        title: "Name",
        render: (record) => {
          if (!enableRowExpansion) return <Text fz="sm">{record.name}</Text>;
          const expandable = !enableConditionalExpansion || subEntries(record).length > 0;
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
                      transform: expandedIds.includes(record.id) ? "rotate(90deg)" : undefined,
                      transition: "transform 200ms ease",
                    }}
                  />
                </Box>
              ) : (
                <Box w={16} style={{ flexShrink: 0 }} />
              )}
              <Text fz="sm">{record.name}</Text>
            </Group>
          );
        },
      },
    },
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

  const expansionContent = (record: DemoItem, isMobile = false) => {
    const all = subEntries(record);
    const entries = enableSubFilter && subCategoryFilter.length
      ? all.filter((e) => subCategoryFilter.includes(e.category))
      : all;
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    const finalBalance = entries.length ? entries[entries.length - 1].balance : 0;

    const columns: SubTableColumn<SubEntry>[] = [
      {
        accessor: "date",
        title: "Datum",
        render: (e) => new Date(e.date).toLocaleDateString("de-DE"),
        footer: <Text fw={600} fz="sm">Summe</Text>,
      },
      {
        accessor: "description",
        title: "Beschreibung",
        hideOnMobile: (e) => !e.description,
      },
      {
        accessor: "category",
        title: "Kategorie",
        render: (e) => <Badge size="xs" variant="light">{e.category}</Badge>,
        ...(enableSubFilter && {
          filter: ({ close }: { close: () => void }) => (
            <Stack>
              <Checkbox.Group value={subCategoryFilter} onChange={setSubCategoryFilter}>
                <Stack gap="xs">
                  <Checkbox value="Lastschrift" label="Lastschrift" />
                  <Checkbox value="Gutschrift" label="Gutschrift" />
                </Stack>
              </Checkbox.Group>
              <Button variant="light" disabled={!subCategoryFilter.length} onClick={() => { setSubCategoryFilter([]); close(); }}>
                Zurücksetzen
              </Button>
            </Stack>
          ),
          filtering: subCategoryFilter.length > 0,
        }),
      },
      {
        accessor: "debit",
        title: "Soll",
        textAlign: "right",
        render: (e) => (e.debit ? eur(e.debit) : "–"),
        hideOnMobile: (e) => !e.debit,
        footer: <Text fw={600} fz="sm">{eur(totalDebit)}</Text>,
      },
      {
        accessor: "credit",
        title: "Haben",
        textAlign: "right",
        render: (e) => (e.credit ? eur(e.credit) : "–"),
        hideOnMobile: (e) => !e.credit,
        footer: <Text fw={600} fz="sm">{eur(totalCredit)}</Text>,
      },
      {
        accessor: "balance",
        title: "Saldo",
        textAlign: "right",
        render: (e) => eur(e.balance),
        footer: <Text fw={600} fz="sm">{eur(finalBalance)}</Text>,
      },
    ];

    return (
      <SubTable
        mobile={isMobile}
        columns={columns}
        records={entries}
        idAccessor="id"
        withTableBorder={false}
        verticalSpacing="xs"
        minHeight={0}
        noRecordsText="Keine Buchungen"
      />
    );
  };

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
      rowExpansion: {
        content: expansionContent,
        expanded: { recordIds: expandedIds, onRecordIdsChange: setExpandedIds },
        ...(enableConditionalExpansion && {
          expandable: (record: DemoItem) => subEntries(record).length > 0,
        }),
      },
    }),
  };

  return (
    <MantineProvider>
      <Container size="sm" py="xl">
        <Title order={3} mb="md">MobileCardList & SubTable Demo</Title>

        <Group gap="lg" mb="md" wrap="wrap">
          <Switch label="mobileCards" checked={enableMobileCards} onChange={(e) => setEnableMobileCards(e.currentTarget.checked)} />
          <Switch label="Selection (Desktop)" checked={enableSelection} onChange={(e) => setEnableSelection(e.currentTarget.checked)} />
          <Switch label="Sort" checked={enableSort} onChange={(e) => setEnableSort(e.currentTarget.checked)} />
          <Switch label="Pagination" checked={enablePagination} onChange={(e) => setEnablePagination(e.currentTarget.checked)} />
          <Switch label="Tabs" checked={enableTabs} onChange={(e) => setEnableTabs(e.currentTarget.checked)} />
          <Switch label="Filter (Suche)" checked={enableFilter} onChange={(e) => setEnableFilter(e.currentTarget.checked)} />
          <Switch label="Column Filter" checked={enableColumnFilter} onChange={(e) => setEnableColumnFilter(e.currentTarget.checked)} />
          <Switch label="Row Expansion (SubTable)" checked={enableRowExpansion} onChange={(e) => setEnableRowExpansion(e.currentTarget.checked)} />
          <Switch label="SubTable Filter (Kategorie)" checked={enableSubFilter} onChange={(e) => setEnableSubFilter(e.currentTarget.checked)} />
          <Switch label="Conditional Expansion (nur Zeilen mit Buchungen)" checked={enableConditionalExpansion} onChange={(e) => setEnableConditionalExpansion(e.currentTarget.checked)} />
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
                  allowMultiple: true,
                  trigger: enableOnRowClick ? "never" : "click",
                  content: ({ record }: { record: DemoItem }) => expansionContent(record),
                  expanded: { recordIds: expandedIds, onRecordIdsChange: setExpandedIds },
                  ...(enableConditionalExpansion && {
                    expandable: ({ record }: { record: DemoItem }) => subEntries(record).length > 0,
                  }),
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
