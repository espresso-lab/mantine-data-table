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

  // Create a custom sort function that handles null values properly
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    // Handle null/undefined/empty values
    const aIsNull = aValue === null || aValue === undefined || aValue === "";
    const bIsNull = bValue === null || bValue === undefined || bValue === "";

    // If both are null, they're equal
    if (aIsNull && bIsNull) return 0;
    
    // If only a is null, it should come first for asc, last for desc
    if (aIsNull) return direction === "asc" ? -1 : 1;
    
    // If only b is null, it should come first for asc, last for desc
    if (bIsNull) return direction === "asc" ? 1 : -1;

    // Both values are not null, proceed with normal sorting
    let aSortValue: any;
    let bSortValue: any;

    switch (columnType) {
      case "date":
        if (typeof aValue === "string") {
          const aDateValue = new Date(aValue.trim());
          aSortValue = isNaN(aDateValue.getTime()) ? null : aDateValue.getTime();
        } else if (aValue instanceof Date) {
          aSortValue = aValue.getTime();
        } else {
          aSortValue = null;
        }

        if (typeof bValue === "string") {
          const bDateValue = new Date(bValue.trim());
          bSortValue = isNaN(bDateValue.getTime()) ? null : bDateValue.getTime();
        } else if (bValue instanceof Date) {
          bSortValue = bValue.getTime();
        } else {
          bSortValue = null;
        }
        break;

      case "number":
        if (typeof aValue === "number") {
          aSortValue = aValue;
        } else {
          const aStrValue = String(aValue).trim();
          const aNumValue = parseFloat(aStrValue);
          aSortValue = isNaN(aNumValue) ? null : aNumValue;
        }

        if (typeof bValue === "number") {
          bSortValue = bValue;
        } else {
          const bStrValue = String(bValue).trim();
          const bNumValue = parseFloat(bStrValue);
          bSortValue = isNaN(bNumValue) ? null : bNumValue;
        }
        break;

      case "string":
        const aStringValue = typeof aValue === "string" ? aValue : String(aValue);
        const bStringValue = typeof bValue === "string" ? bValue : String(bValue);
        aSortValue = aStringValue.toLowerCase().trim();
        bSortValue = bStringValue.toLowerCase().trim();
        break;

      case "mixed":
      default:
        const aMixedValue = String(aValue);
        const bMixedValue = String(bValue);
        aSortValue = aMixedValue.toLowerCase().trim();
        bSortValue = bMixedValue.toLowerCase().trim();
        break;
    }

    // Handle null sort values (invalid dates, non-numeric strings, etc.)
    if (aSortValue === null && bSortValue === null) return 0;
    if (aSortValue === null) return direction === "asc" ? 1 : -1;
    if (bSortValue === null) return direction === "asc" ? -1 : 1;

    // Compare the sort values
    if (aSortValue < bSortValue) return direction === "asc" ? -1 : 1;
    if (aSortValue > bSortValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sortedData;
};
