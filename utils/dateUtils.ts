// Format a date as a readable string
export const formatDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Invalid date";
  }

  // Format as: "Jan 5, 2023 at 2:30 PM"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Get current date for receipts
export const getCurrentDate = (): string => {
  const now = new Date();
  return formatDate(now);
};

// Get a simplified date for file names
export const getDateForFileName = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};
