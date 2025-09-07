import _ from "lodash";

// Helper function to detect the primary data type of a column
const detectColumnType = <T>(
  data: T[],
  field: keyof T,
): "string" | "number" | "date" | "mixed" => {
  const nonNullValues = data
    .map((item) => item[field])
    .filter((value) => value !== null && value !== undefined && value !== "");

  if (nonNullValues.length === 0) return "string";

  // Early exit for better performance - sample first 100 items for large datasets
  const sampleSize = Math.min(100, nonNullValues.length);
  const sample = nonNullValues.slice(0, sampleSize);

  const types = {
    string: 0,
    number: 0,
    date: 0,
  };

  // Improved date regex patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    /^\d{4}-\d{2}-\d{2}$/, // ISO date
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{1,2}\.\d{1,2}\.\d{4}$/, // DD.MM.YYYY
  ];

  sample.forEach((value) => {
    if (typeof value === "number") {
      types.number++;
    } else if (typeof value === "string") {
      // Optimize string number detection
      const trimmed = value.trim();
      if (
        trimmed !== "" &&
        !isNaN(Number(trimmed)) &&
        !isNaN(parseFloat(trimmed))
      ) {
        types.number++;
        return;
      }

      // Check if it's a date string with improved patterns
      if (datePatterns.some((pattern) => pattern.test(trimmed))) {
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
      types.string++; // Fallback to string for objects, etc.
    }
  });

  // Determine the dominant type (>= 60% for more accuracy)
  const total = types.string + types.number + types.date;
  if (types.date / total >= 0.6) return "date";
  if (types.number / total >= 0.6) return "number";
  if (types.string / total >= 0.6) return "string";

  return "mixed";
};

// Cache for column type detection to avoid recalculation
const typeCache = new Map<string, string>();

export const sortData = <T>(
  data: T[],
  field: keyof T,
  direction: "asc" | "desc" = "asc",
): T[] => {
  // Early return for empty data
  if (!data || data.length === 0) return [];

  // Create cache key
  const cacheKey = `${String(field)}_${data.length}`;

  // Get column type from cache or detect it
  let columnType = typeCache.get(cacheKey) as
    | "string"
    | "number"
    | "date"
    | "mixed";
  if (!columnType) {
    columnType = detectColumnType(data, field);
    typeCache.set(cacheKey, columnType);
  }

  return _.orderBy(
    data,
    [
      (item) => {
        const value = item[field];

        // Handle null, undefined or empty strings - always first for ascending
        if (value === null || value === undefined || value === "") {
          return direction === "asc" ? -Infinity : Infinity;
        }

        switch (columnType) {
          case "date":
            if (typeof value === "string") {
              const dateValue = new Date(value.trim());
              return isNaN(dateValue.getTime())
                ? direction === "asc"
                  ? -Infinity
                  : Infinity
                : dateValue.getTime();
            }
            if (value instanceof Date) {
              return value.getTime();
            }
            return direction === "asc" ? -Infinity : Infinity;

          case "number":
            if (typeof value === "number") {
              return value;
            }
            const strValue = String(value).trim();
            const numValue = parseFloat(strValue);
            return isNaN(numValue)
              ? direction === "asc"
                ? -Infinity
                : Infinity
              : numValue;

          case "string":
            // String comparison - case insensitive, with locale support
            const stringValue =
              typeof value === "string" ? value : String(value);
            return stringValue.toLowerCase().trim();

          case "mixed":
          default:
            // For mixed types, convert everything to string for consistent sorting
            const mixedValue = String(value);
            return mixedValue.toLowerCase().trim();
        }
      },
    ],
    [direction],
  );
};
