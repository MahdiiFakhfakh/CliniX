export function formatShortDate(value) {
    return new Date(value).toLocaleDateString();
}
export function formatShortTime(value) {
    return new Date(value).toLocaleTimeString();
}
