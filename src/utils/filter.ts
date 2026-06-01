type DatesRangeValue = [string | null, string | null];

interface DateFilter {
  id: string | number;
  type: "date";
  value?: DatesRangeValue;
}

interface StringFilter {
  id: string | number;
  type: "query";
  value?: string | string[];
}

interface BooleanFilter {
  id: string | number;
  type: "boolean";
  value?: boolean;
}

export type Filter = DateFilter | StringFilter | BooleanFilter;

function hasId(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && "id" in value;
}

function arrayItemMatches(item: unknown, filterValue: string[]): boolean {
  if (typeof item === "string" || typeof item === "number") {
    return filterValue.includes(String(item));
  }
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    if (hasId(obj) && filterValue.includes(obj.id as string)) return true;
    return Object.values(obj).some(
      (prop) =>
        (typeof prop === "string" && filterValue.includes(prop)) ||
        (hasId(prop) && filterValue.includes(prop.id as string)),
    );
  }
  return false;
}

function matchesQuery(value: unknown, filterValue: string | string[]): boolean {
  if (Array.isArray(filterValue)) {
    if (Array.isArray(value)) return value.some((item) => arrayItemMatches(item, filterValue));
    if (hasId(value)) return filterValue.includes(value.id as string);
    return false;
  }
  return typeof value === "string" && value.includes(filterValue);
}

function matchesDate(value: unknown, [from, to]: DatesRangeValue): boolean {
  if (!from && !to) return true;
  if (typeof value !== "string") return true;
  const date = value.split(" ")[0];
  if (from && to) return date >= from && date <= to;
  if (from) return date >= from;
  return date <= to!;
}

function matchesFilter<T>(record: T, filter: Filter): boolean {
  if (filter.value === undefined) return true;
  const value = (record as Record<string, unknown>)[filter.id as string];
  switch (filter.type) {
    case "query":
      return matchesQuery(value, filter.value);
    case "date":
      return matchesDate(value, filter.value);
    case "boolean":
      return value === filter.value;
  }
}

export function applyFilters<T>(data: T[], filters?: Filter[]): T[] {
  if (!filters || filters.length === 0) return data;
  return data.filter((record) => filters.every((filter) => matchesFilter(record, filter)));
}
