export const normalizeSearchText = (value) => {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map(normalizeSearchText).join(" ");
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return Object.values(value).map(normalizeSearchText).join(" ");
  }

  return String(value).toLowerCase().replace(/[_-]/g, " ").trim();
};

export const matchesSearch = (query, values) => {
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = normalizeSearchText(values);
  return tokens.every((token) => haystack.includes(token));
};
