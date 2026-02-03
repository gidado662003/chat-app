/**
 * Formats a date into a clean, readable string.
 * Supports Date objects, ISO strings, and Timestamps.
 */
export function formatDate(
  dateData: Date | string | number | undefined | null
) {
  if (!dateData) return "N/A";

  const date = new Date(dateData);

  // Check if the date is actually valid
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  // Production-ready formatting (e.g., "Oct 24, 2023, 10:30 AM")
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}
