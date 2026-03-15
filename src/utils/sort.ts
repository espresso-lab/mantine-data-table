type ColumnType = "string" | "number" | "date" | "mixed";

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  /^\d{1,2}\.\d{1,2}\.\d{4}$/,
];

const detectColumnType = <T>(data: T[], field: keyof T): ColumnType => {
  const nonNullValues = data
    .map((item) => item[field])
    .filter((value) => value !== null && value !== undefined && value !== "");

  if (nonNullValues.length === 0) return "string";

  const sample = nonNullValues.slice(0, 100);
  const types = { string: 0, number: 0, date: 0 };

  sample.forEach((value) => {
    if (typeof value === "number") {
      types.number++;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "" && !isNaN(Number(trimmed)) && !isNaN(parseFloat(trimmed))) {
        types.number++;
        return;
      }
      if (DATE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
        const dateValue = new Date(trimmed);
        if (!isNaN(dateValue.getTime())) {
          types.date++;
          return;
        }
      }
      types.string++;
    } else if (value instanceof Date) {
      types.date++;
    } else {
      types.string++;
    }
  });

  const total = types.string + types.number + types.date;
  if (types.date / total >= 0.6) return "date";
  if (types.number / total >= 0.6) return "number";
  if (types.string / total >= 0.6) return "string";
  return "mixed";
};

function toSortValue(value: unknown, columnType: ColumnType): string | number | null {
  switch (columnType) {
    case "date":
      if (typeof value === "string") {
        const d = new Date(value.trim());
        return isNaN(d.getTime()) ? null : d.getTime();
      }
      if (value instanceof Date) return value.getTime();
      return null;
    case "number":
      if (typeof value === "number") return value;
      const num = parseFloat(String(value).trim());
      return isNaN(num) ? null : num;
    case "string":
      return (typeof value === "string" ? value : String(value)).toLowerCase().trim();
    default:
      return String(value).toLowerCase().trim();
  }
}

export const sortData = <T>(
  data: T[],
  field: keyof T,
  direction: "asc" | "desc" = "asc",
): T[] => {
  if (!data || data.length === 0) return [];

  const columnType = detectColumnType(data, field);

  return [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    const aIsNull = aValue === null || aValue === undefined || aValue === "";
    const bIsNull = bValue === null || bValue === undefined || bValue === "";

    if (aIsNull && bIsNull) return 0;
    if (aIsNull) return direction === "asc" ? -1 : 1;
    if (bIsNull) return direction === "asc" ? 1 : -1;

    const aSortValue = toSortValue(aValue, columnType);
    const bSortValue = toSortValue(bValue, columnType);

    if (aSortValue === null && bSortValue === null) return 0;
    if (aSortValue === null) return direction === "asc" ? 1 : -1;
    if (bSortValue === null) return direction === "asc" ? -1 : 1;

    if (aSortValue < bSortValue) return direction === "asc" ? -1 : 1;
    if (aSortValue > bSortValue) return direction === "asc" ? 1 : -1;
    return 0;
  });
};
