# Mantine Data Table

A config-driven wrapper around [mantine-datatable](https://icflorescu.github.io/mantine-datatable/).
Describe a table once as a list of fields and get sorting, pagination, filtering, CRUD modals,
row expansion and a responsive mobile card layout — backed by [TanStack Query](https://tanstack.com/query).

[![License](https://img.shields.io/badge/License-MIT-blue)](#license)
[![NPM Version](https://img.shields.io/npm/v/@espresso-lab/mantine-data-table.svg?style=flat)](https://www.npmjs.com/package/@espresso-lab/mantine-data-table)
[![NPM Downloads](https://img.shields.io/npm/d18m/@espresso-lab/mantine-data-table.svg?style=flat)](https://www.npmjs.com/package/@espresso-lab/mantine-data-table)

## Installation

```bash
npm i @espresso-lab/mantine-data-table
```

Peer dependencies you need to install: `@mantine/core`, `@mantine/dates`, `@mantine/form`,
`@mantine/hooks`, `@tabler/icons-react`, `react` and `react-dom`.
(`mantine-datatable` and `@tanstack/react-query` come bundled.)

## Setup

Wrap your app in `DataTableProvider`. It provides the base URL, a TanStack Query client and the
headers sent with every request.

```tsx
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "mantine-datatable/styles.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient } from "@tanstack/react-query";
import { DataTableProvider } from "@espresso-lab/mantine-data-table";

const queryClient = new QueryClient();

export function Root() {
  return (
    <MantineProvider>
      <DataTableProvider
        baseUrl="https://api.example.com"
        queryClient={queryClient}
        getHeaders={async () => ({ Authorization: `Bearer ${await getToken()}` })}
      >
        <App />
      </DataTableProvider>
    </MantineProvider>
  );
}
```

## Usage

A table is described by a `queryKey`, an `apiPath` and a list of `fields`. The component fetches
`GET {apiPath}`, renders the rows and wires create/update/delete against the same path.

```tsx
import { DataTable, Field } from "@espresso-lab/mantine-data-table";

interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

const fields: Field<User>[] = [
  {
    id: "name",
    list: true, create: true, update: true, delete: true,
    required: true,
    column: { accessor: "name", title: "Name", sortable: true },
  },
  {
    id: "email",
    list: true, create: true, update: true, delete: true,
    column: { accessor: "email", title: "Email" },
  },
  {
    id: "active",
    list: true, create: true, update: true, delete: true,
    type: "boolean",
    column: { accessor: "active", title: "Active" },
  },
];

export function Users() {
  return (
    <DataTable<User>
      title="Benutzer"
      titleOrder={2}
      description="12 Benutzer · 2 eingeladen"
      entityName="Benutzer"
      recordLabel={(user) => user.name}
      search={{ placeholder: "Name oder E-Mail suchen" }}
      queryKey={["users"]}
      apiPath="/users"
      fields={fields}
      selection
      pagination
      mobileCards
    />
  );
}
```

The table renders the whole list scaffold: the header (title, description, refresh, your `buttons`,
the bulk menu once rows are selected, and the create button „Benutzer anlegen" at the right end), a
toolbar with the search field and your `toolbar` controls, and the table. Every row ends with its
actions — further `rowActions`, then *Bearbeiten*, then *Löschen* (red, always last); on phones they
move into the card's ⋯ menu. A table whose rows have no action at all gets no actions column. The
actions column stays pinned to the right edge while a wide table
scrolls sideways, and an expanded row is as wide as the visible part of the table and stays in place.
Column footers (sums) appear as a last card on phones. A failed request shows an alert with „Erneut laden" instead of the table. Deleting always asks first
and names the record.

### Fields

A field describes both a table column and a form input.

| Key | Description |
| --- | --- |
| `id` | Unique key; used as the form field name and column accessor fallback. |
| `list` / `create` / `update` / `delete` | Whether the field shows in the table, the create form, the edit form, and is editable. |
| `type` | `text` (default), `number`, `date`, `boolean`, `textarea` or `custom`. |
| `required` | `boolean` or `(values) => boolean`. The form checks it on submit — „Pflichtfeld" at the field, the first one focused, no browser bubble; `0` counts as a value, a `boolean` field must be ticked, a multi-step form checks only the current step. |
| `column` | A [mantine-datatable column](https://icflorescu.github.io/mantine-datatable/) — `accessor`, `title`, `render`, `sortable`, `textAlign`, `filter`, `footer`, `hidden`. |
| `render` | For `type: "custom"` — render your own input from `(values, setValues, hideButtons, { error, required, errors })`; show `error` at it. A render with several inputs (an address) reads their messages from `errors` and declares each required key as a field of its own with `render: () => null`. |
| `defaultValue`, `placeholder`, `step`, `conditional` | Optional. |

### Common props

| Prop | Description |
| --- | --- |
| `title`, `titleOrder` | Heading of the table; `titleOrder={2}` when the table is the page (default `4`, a section). |
| `description` | Dimmed line under the title — a figure such as „7 Objekte · 110 Einheiten". |
| `breadcrumbs`, `crumb` | Ancestors shown above a page-level title (`titleOrder` ≤ 2) and the current page's label when the title is no plain string (see *Breadcrumbs*). |
| `titleHint` | Hover card behind an info icon next to the title. |
| `entityName` | Singular noun of a record („Einheit"); names the create button („Einheit anlegen") and the dialogs („Einheit bearbeiten", „Einheit löschen?"). |
| `recordLabel` | `(record) => string`; names the record in the delete confirmation and the row actions' labels. |
| `search` | `true` or `{ placeholder, accessors, match }` filters the rows client-side; with `{ value, onChange }` the search is yours (server side). |
| `toolbar` | Filter controls rendered after the search field (object select, segmented filter, switches). |
| `buttons` | Secondary header buttons, left of the create button. |
| `createButtonText` | Overrides „‹entityName› anlegen". |
| `nested` | The table is a list inside an open record (an expanded row, a dialog): the create button becomes the light „‹entityName› hinzufügen", its dialog says „hinzufügen" too, the refresh icon and the phone sort control are left out, phone cards are tinted and an empty list is one dimmed line. |
| `editAction` | `(record) => ({ label, icon })` — relabels *Bearbeiten* per row. A value typed in over a calculated one shows it here: `IconPencilCheck` with „Manuell überschrieben – bearbeiten". |
| `onUpdate` | `(values, record) => Promise` — saves the edit dialog yourself instead of `PUT apiPath/{id}`; the dialog starts from the row instead of fetching the record. |
| `rowActions` | `(record) => RowAction[]` — further row actions, shown before *Bearbeiten*/*Löschen* (more than two collapse into a ⋯ menu). `variant: "light"` with a role `color` turns one into a status that opens the record (a green check, a red cross). |
| `selection` | Row checkboxes; once rows are selected, „n ausgewählt" opens the bulk menu with your `actions` and *Löschen*. |
| `actions` | Bulk actions on the selected rows; on phones they also appear in each card's menu. |
| `pagination` | Client-side pagination. |
| `mobileCards` | Render a card list instead of the table below the `sm` breakpoint. |
| `tabs` | Switch between datasets, each with its own query params and api path. |
| `rowExpansion` | Expandable rows (see below). |
| `noRecordsText` | Empty-table text; a search without hits says so on its own. |
| `defaultSort`, `queryParams`, `onRowClick`, `canUpdate`, `canDelete`, `deleteConfirmMessage` | Optional. |

## Building blocks

The pieces the table is made of are exported, so a page without a table looks the same:

```tsx
import { PageHeader, RowActions, SearchInput, ViewSwitch } from "@espresso-lab/mantine-data-table";

<PageHeader
  title="Eigentümerversammlungen"
  description="4 Versammlungen · 1 läuft gerade"
  breadcrumbs={[{ label: "WEG Musterstraße 1", onClick: openObject }]}
  badge={<Badge color="teal">Läuft</Badge>}
  actions={<Button leftSection={<IconPlus size={16} />}>Versammlung anlegen</Button>}
/>;

<SearchInput value={query} onChange={setQuery} placeholder="Einheit oder Eigentümer suchen" />;

<RowActions
  name={unit.name}
  actions={[{ label: "Herunterladen", icon: <IconDownload size={16} />, onClick: download }]}
  onEdit={() => edit(unit)}
  onDelete={() => confirmDelete(unit)}
/>;
```

- `PageHeader` — the breadcrumb trail, the title (`order`, default `2`), badge and info `hint`
  after it, the dimmed `description` below, `actions` on the right, wrapping under the title on a phone.
- `SearchInput` — search icon, a clear button while there is text, full width on a phone.
- `ViewSwitch` — switches the views of one area (`value`, `onChange`, `data` of `{ value, label }`,
  `label` as its accessible name): a `SegmentedControl` from the `sm` breakpoint, a full-width
  `Select` with the same entries below it, where three German labels no longer fit side by side.
- `RowActions` — the row's action icons with tooltips: further actions (more than two in a ⋯ menu),
  *Bearbeiten*, *Löschen*. It stops the click from reaching a clickable row.

## Breadcrumbs

Every page-level header (`PageHeader`, or a `DataTable` with `titleOrder={2}`) shows a breadcrumb
trail ending in its own title. The app supplies the root once with `BreadcrumbProvider`; providers
nest, so a section can add its own level for everything below it:

```tsx
import { BreadcrumbProvider } from "@espresso-lab/mantine-data-table";

<BreadcrumbProvider trail={[{ label: "Übersicht", onClick: () => navigate({ to: "/" }) }]}>
  <Outlet />
</BreadcrumbProvider>;
```

A page passes only the ancestors between the root and itself in `breadcrumbs`. Below the `sm`
breakpoint a trail of more than two crumbs keeps to one line: the earlier levels move into a ⋯ menu
and long labels are truncated.

## Row expansion

Set `rowExpansion` to render content under a row. A chevron is added to the first column
automatically; `expandable` controls which rows can open. The expansion insets its content itself —
`md` on desktop, the card's own inset on a phone — so the content brings no padding of its own.

A list in the expanded row is `nested`: a `SubTable` when its rows are already loaded, a `DataTable` when
it is edited with its own requests. Both then render the same section — a header with `title` (order 4),
an optional `description` and actions on the right, a bordered table on desktop and tinted cards on a
phone, column footers as a last card on a phone, and a dimmed one-liner (`noRecordsText`) instead of an
empty table.

```tsx
import { SubTable } from "@espresso-lab/mantine-data-table";

<DataTable<Account>
  title="Accounts"
  queryKey={["accounts"]}
  apiPath="/accounts"
  fields={fields}
  mobileCards
  rowExpansion={{
    expandable: (account) => account.entries.length > 0,
    content: (account, isMobile) => (
      <SubTable
        nested
        title="Buchungen"
        mobile={isMobile}
        records={account.entries}
        idAccessor="id"
        noRecordsText="Keine Buchungen"
        columns={[
          { accessor: "date", title: "Date", render: (e) => formatDate(e.date) },
          {
            accessor: "amount",
            title: "Amount",
            textAlign: "right",
            render: (e) => formatAmount(e.amount),
            footer: formatAmount(account.total),
          },
        ]}
      />
    ),
  }}
/>;
```

A list in the expanded row that is edited on its own — entries added, changed and deleted with
their own requests — is a `DataTable` with `nested` instead, so it brings its dialogs along:

```tsx
rowExpansion={{
  content: (tenancy) => (
    <DataTable<RentStep>
      nested
      title="Mietstaffelung"
      entityName="Mietstaffel"
      apiPath={`/tenancies/${tenancy.id}/rent-steps`}
      queryKey={["tenancies", tenancy.id, "rent-steps"]}
      fields={rentStepFields}
      mobileCards
    />
  ),
}}
```

`SubTable` uses one set of columns for both layouts: a full mantine-datatable on desktop (sorting,
column filters, footer totals) and a labelled card list on mobile. Add `hideOnMobile: (record) => boolean`
to a column to drop low-value cells from the mobile cards. Pass `rowActions={(record) => ({ name, onEdit,
onDelete, actions })}` instead of building an action column: desktop gets the same right-aligned
`RowActions` as `DataTable`, pinned while the table scrolls sideways, phones a ⋯ menu in each card. A
table of its own (`withTableBorder`) shows white bordered cards like a `DataTable`'s, a `nested` one
tinted sub-cards.

## License

MIT
