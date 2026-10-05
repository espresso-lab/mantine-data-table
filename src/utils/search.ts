import { getValueAtPath } from "mantine-datatable";

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export function matchesSearch<T>(record: T, query: string, accessors: string[]): boolean {
  const needle = normalize(query.trim());
  if (!needle) return true;
  return accessors.some((accessor) => {
    const value = getValueAtPath(record, accessor);
    return (typeof value === "string" || typeof value === "number") && normalize(String(value)).includes(needle);
  });
}
