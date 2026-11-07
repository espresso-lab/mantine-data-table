import { Group, Pagination, Select, Stack, Text } from "@mantine/core";
import { controlLabel, pageRange, TablePagination } from "../utils/pagination";

/** The pagination under a list of cards: the range shown, the pages and, where it can change, the page size. */
export function CardPagination({ pagination }: { readonly pagination: TablePagination }) {
  const { page, totalRecords, recordsPerPage, onPageChange, recordsPerPageOptions, onRecordsPerPageChange } = pagination;
  if (totalRecords <= recordsPerPage) return null;
  return (
    <Stack gap="xs" mt="sm" align="center">
      <Text fz="xs" c="dimmed">
        {pageRange({
          from: (page - 1) * recordsPerPage + 1,
          to: Math.min(page * recordsPerPage, totalRecords),
          totalRecords,
        })}
      </Text>
      <Pagination
        total={Math.ceil(totalRecords / recordsPerPage)}
        value={page}
        onChange={onPageChange}
        size="sm"
        getControlProps={controlLabel}
        getItemProps={(item) => ({ "aria-label": `Seite ${item}` })}
      />
      {recordsPerPageOptions && onRecordsPerPageChange && (
        <Group justify="center" gap="xs">
          <Text fz="xs" c="dimmed">
            Einträge pro Seite:
          </Text>
          <Select
            aria-label="Einträge pro Seite"
            data={recordsPerPageOptions.map((option) => ({ value: String(option), label: String(option) }))}
            value={String(recordsPerPage)}
            onChange={(value) => value && onRecordsPerPageChange(Number(value))}
            allowDeselect={false}
            size="xs"
            w={70}
          />
        </Group>
      )}
    </Stack>
  );
}
