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
      title="Users"
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

### Fields

A field describes both a table column and a form input.

| Key | Description |
| --- | --- |
| `id` | Unique key; used as the form field name and column accessor fallback. |
| `list` / `create` / `update` / `delete` | Whether the field shows in the table, the create form, the edit form, and is editable. |
| `type` | `text` (default), `number`, `date`, `boolean`, `textarea` or `custom`. |
| `required` | `boolean` or `(values) => boolean`. |
| `column` | A [mantine-datatable column](https://icflorescu.github.io/mantine-datatable/) — `accessor`, `title`, `render`, `sortable`, `textAlign`, `filter`, `footer`, `hidden`. |
| `render` | For `type: "custom"` — render your own input. |
| `defaultValue`, `placeholder`, `step`, `conditional` | Optional. |

### Common props

| Prop | Description |
| --- | --- |
| `selection` | Row checkboxes with bulk actions. |
| `pagination` | Client-side pagination. |
| `mobileCards` | Render a card list instead of the table below the `sm` breakpoint. |
| `tabs` | Switch between datasets, each with its own query params and api path. |
| `actions` | Custom bulk actions on the selected rows. |
| `rowExpansion` | Expandable rows (see below). |
| `defaultSort`, `queryParams`, `onRowClick`, `canUpdate`, `canDelete` | Optional. |

## Row expansion

Set `rowExpansion` to render content under a row. A chevron is added to the first column
automatically; `expandable` controls which rows can open.

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
        mobile={isMobile}
        records={account.entries}
        idAccessor="id"
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

`SubTable` uses one set of columns for both layouts: a full mantine-datatable on desktop (sorting,
column filters, footer totals) and a labelled card list on mobile. Add `hideOnMobile: (record) => boolean`
to a column to drop low-value cells from the mobile cards.

## License

MIT
