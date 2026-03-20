/**
 * Search utility to handle parsing and stringifying search queries that include
 * both a keyword and advanced parameters (e.g., "nguyen van a isActive=false").
 */

export interface SearchState {
  keyword: string;
  params: Record<string, string>;
}

/**
 * Parses a search string into a keyword and a record of parameters.
 * Format: "keyword key1=value1 key2=(value with spaces)"
 *
 * @param searchString The string from the search input
 * @returns An object containing the keyword and params
 */
export function parseSearchString(searchString: string): SearchState {
  const params: Record<string, string> = {};
  let keywordString = searchString;

  // Regex to match key=value or key=(value)
  // Group 1: key
  // Group 2: (value) or value
  const paramRegex = /(\w+)=((?:\([^)]+\))|[^\s]+)/g;
  let match: RegExpExecArray | null;

  // Extract all params
  while ((match = paramRegex.exec(searchString)) !== null) {
    const key = match[1];
    let value = match[2];

    // Remove parentheses if present
    if (value.startsWith("(") && value.endsWith(")")) {
      value = value.substring(1, value.length - 1);
    }

    params[key] = value;
    // Replace the param in the keyword string with space to extract the rest later
    keywordString = keywordString.replace(match[0], " ");
  }

  // Clean up keyword: remove extra spaces and trim
  const keyword = keywordString.replace(/\s+/g, " ").trim();

  return { keyword, params };
}

/**
 * Serializes a keyword and params object into a search string.
 * Format: "keyword key1=value1 key2=(value2)"
 *
 * @param keyword The search keyword
 * @param params The advanced filter parameters
 * @param excludeKeys Keys to exclude from the string (e.g., pagination, order)
 * @returns The formatted search string
 */
export function stringifySearchQuery(
  keyword: string,
  params: Record<string, unknown>,
  excludeKeys: string[] = ["page", "pageSize", "limit", "offset", "order", "orderBy", "orderCol", "orderDir"]
): string {

  const result: string[] = [];

  if (keyword.trim()) {
    result.push(keyword.trim());
  }

  Object.entries(params).forEach(([key, value]) => {
    // Skip excluded keys and null/undefined values
    if (excludeKeys.includes(key) || value == null || value === "") {
      return;
    }




    // Skip empty arrays
    if (Array.isArray(value) && value.length === 0) {
      return;
    }

    let valStr: string;
    if (Array.isArray(value)) {
      valStr = value.join(",");
    } else {
      valStr = String(value);
    }

    // Wrap in parentheses if it contains spaces
    if (valStr.includes(" ")) {
      result.push(`${key}=(${valStr})`);
    } else {
      result.push(`${key}=${valStr}`);
    }
  });

  return result.join(" ");
}
