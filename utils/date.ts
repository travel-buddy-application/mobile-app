/**
 * Date utility functions for the Travel Buddy app
 */

export const DATE_FORMATS = {
  ISO: "YYYY-MM-DD",
  DISPLAY: "MMM DD, YYYY",
  FULL: "MMMM DD, YYYY",
  SHORT: "MM/DD/YY",
  TIME: "HH:mm",
  DATETIME: "MMM DD, YYYY HH:mm",
} as const;


export const formatDate = (
  date: string | Date,
  format: keyof typeof DATE_FORMATS = "DISPLAY"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case "ISO":
      return dateObj.toISOString().split("T")[0];
    case "DISPLAY":
      options.month = "short";
      options.day = "2-digit";
      options.year = "numeric";
      break;
    case "FULL":
      options.month = "long";
      options.day = "2-digit";
      options.year = "numeric";
      break;
    case "SHORT":
      options.month = "2-digit";
      options.day = "2-digit";
      options.year = "2-digit";
      break;
    case "TIME":
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.hour12 = false;
      break;
    case "DATETIME":
      options.month = "short";
      options.day = "2-digit";
      options.year = "numeric";
      options.hour = "2-digit";
      options.minute = "2-digit";
      break;
    default:
      options.month = "short";
      options.day = "2-digit";
      options.year = "numeric";
  }

  return dateObj.toLocaleDateString("en-US", options);
};

export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffInDays) === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Tomorrow";
  } else if (diffInDays === -1) {
    return "Yesterday";
  } else if (diffInDays > 1 && diffInDays <= 7) {
    return `In ${diffInDays} days`;
  } else if (diffInDays < -1 && diffInDays >= -7) {
    return `${Math.abs(diffInDays)} days ago`;
  } else if (diffInDays > 7) {
    const weeks = Math.floor(diffInDays / 7);
    return `In ${weeks} week${weeks > 1 ? "s" : ""}`;
  } else {
    const weeks = Math.floor(Math.abs(diffInDays) / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
};

export const calculateDuration = (
  startDate: string | Date,
  endDate: string | Date
): {
  days: number;
  nights: number;
  formatted: string;
} => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const diffInMs = end.getTime() - start.getTime();
  const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  const nights = Math.max(0, days - 1);

  let formatted = "";
  if (days === 1) {
    formatted = "1 day";
  } else if (days > 1) {
    formatted = `${days} days`;
    if (nights > 0) {
      formatted += `, ${nights} night${nights > 1 ? "s" : ""}`;
    }
  }

  return { days, nights, formatted };
};


export const isPastDate = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj < today;
};


export const isFutureDate = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dateObj > today;
};


export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const today = new Date();

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};


export const getDateRange = (
  startDate: string | Date,
  days: number
): {
  start: Date;
  end: Date;
} => {
  const start =
    typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);

  return { start, end };
};


export const isValidDateString = (dateString: string): boolean => {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return (
    !isNaN(date.getTime()) && date.toISOString().split("T")[0] === dateString
  );
};


export const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};


export const addDays = (date: string | Date, days: number): Date => {
  const dateObj = typeof date === "string" ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
};


export const subtractDays = (date: string | Date, days: number): Date => {
  return addDays(date, -days);
};


export const minDate = (date1: string | Date, date2: string | Date): Date => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  return d1 < d2 ? d1 : d2;
};


export const maxDate = (date1: string | Date, date2: string | Date): Date => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  return d1 > d2 ? d1 : d2;
};


export const dateRangesOverlap = (
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date
): boolean => {
  const s1 = typeof start1 === "string" ? new Date(start1) : start1;
  const e1 = typeof end1 === "string" ? new Date(end1) : end1;
  const s2 = typeof start2 === "string" ? new Date(start2) : start2;
  const e2 = typeof end2 === "string" ? new Date(end2) : end2;

  return s1 <= e2 && s2 <= e1;
};
