/**
 * Validation utility functions for the Travel Buddy app
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number validation (basic international format)
const PHONE_REGEX = /^\+?[\d\s\-\(\)]+$/;

// URL validation regex
const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\s/g, "");
  return PHONE_REGEX.test(cleanPhone) && cleanPhone.length >= 10;
};

/**
 * Validate URL
 */
export const isValidUrl = (url: string): boolean => {
  return URL_REGEX.test(url);
};

/**
 * Validate password strength
 */
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
} => {
  const errors: string[] = [];
  let score = 0;

  // Check length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else {
    score += 1;
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    score += 1;
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    score += 1;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    score += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  } else {
    score += 1;
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" = "weak";
  if (score >= 4) {
    strength = "strong";
  } else if (score >= 3) {
    strength = "medium";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

/**
 * Validate required field
 */
export const isRequired = (value: any): boolean => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== "";
};

/**
 * Validate minimum length
 */
export const minLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

/**
 * Validate maximum length
 */
export const maxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

/**
 * Validate number range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate budget amount
 */
export const isValidBudget = (budget: string | number): boolean => {
  const numBudget = typeof budget === "string" ? parseFloat(budget) : budget;
  return !isNaN(numBudget) && numBudget > 0 && numBudget <= 1000000; // Max budget of 1M
};

/**
 * Validate trip title
 */
export const isValidTripTitle = (title: string): boolean => {
  const trimmed = title.trim();
  return trimmed.length >= 3 && trimmed.length <= 100;
};

/**
 * Validate destination name
 */
export const isValidDestination = (destination: string): boolean => {
  const trimmed = destination.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

/**
 * Validate date range (start date should be before end date)
 */
export const isValidDateRange = (
  startDate: string,
  endDate: string
): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
};

/**
 * Validate file type
 */
export const isValidFileType = (
  fileName: string,
  allowedTypes: string[]
): boolean => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

/**
 * Validate file size
 */
export const isValidFileSize = (
  fileSize: number,
  maxSizeInMB: number
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return fileSize <= maxSizeInBytes;
};

/**
 * Generic form validation function
 */
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ((value: any) => string | null)[]>
): {
  isValid: boolean;
  errors: Record<keyof T, string[]>;
} => {
  const errors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
  let isValid = true;

  for (const field in rules) {
    const fieldRules = rules[field];
    const fieldErrors: string[] = [];

    for (const rule of fieldRules) {
      const error = rule(data[field]);
      if (error) {
        fieldErrors.push(error);
        isValid = false;
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return { isValid, errors };
};

/**
 * Common validation rules
 */
export const validationRules = {
  required:
    (fieldName: string) =>
    (value: any): string | null => {
      return isRequired(value) ? null : `${fieldName} is required`;
    },

  email: (value: string): string | null => {
    return isValidEmail(value) ? null : "Please enter a valid email address";
  },

  minLength:
    (min: number) =>
    (value: string): string | null => {
      return minLength(value, min)
        ? null
        : `Must be at least ${min} characters`;
    },

  maxLength:
    (max: number) =>
    (value: string): string | null => {
      return maxLength(value, max)
        ? null
        : `Must be no more than ${max} characters`;
    },

  budget: (value: string | number): string | null => {
    return isValidBudget(value) ? null : "Please enter a valid budget amount";
  },

  dateRange:
    (startDate: string) =>
    (endDate: string): string | null => {
      return isValidDateRange(startDate, endDate)
        ? null
        : "End date must be after start date";
    },
};
