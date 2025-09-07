import _ from "lodash";

export const sortData = <T>(
  data: T[],
  field: keyof T,
  direction: "asc" | "desc" = "asc",
): T[] => {
  return _.orderBy(
    data,
    [
      (item) => {
        // Handle null, undefined or empty strings
        if (
          item[field] === null ||
          item[field] === undefined ||
          item[field] === ""
        ) {
          // Always at the end for ascending sort, at the beginning for descending
          return direction === "asc"
            ? Number.MIN_SAFE_INTEGER
            : Number.MAX_SAFE_INTEGER;
        }

        const value = item[field];

        // Date detection - if it's a string that looks like an ISO date
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          return new Date(value).getTime(); // Convert to timestamp for correct sorting
        }

        // String comparison - case insensitive
        if (typeof value === "string") {
          return value.toLowerCase();
        }

        // Return the value as is for other types
        return value;
      },
    ],
    [direction],
  );
};
