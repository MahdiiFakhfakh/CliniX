export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function formatShortTime(value: string): string {
  return new Date(value).toLocaleTimeString();
}
