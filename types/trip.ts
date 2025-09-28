// Trip related types
export interface Trip {
  id: string;
  title: string;
  destination: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  budget: number;
  imageUrl: string;
  activities: string[];
  isFavorite: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TripCreateInput {
  title: string;
  destination: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  activities: string[];
  imageUrl?: string;
}

export interface TripUpdateInput {
  title?: string;
  destination?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  activities?: string[];
  imageUrl?: string;
  isFavorite?: boolean;
  isCompleted?: boolean;
}

// Activity types
export interface Activity {
  id: string;
  tripId: string;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  location?: string;
  cost?: number;
  isCompleted: boolean;
  category: ActivityCategory;
}

export enum ActivityCategory {
  SIGHTSEEING = "sightseeing",
  DINING = "dining",
  ADVENTURE = "adventure",
  RELAXATION = "relaxation",
  SHOPPING = "shopping",
  TRANSPORTATION = "transportation",
  ACCOMMODATION = "accommodation",
  OTHER = "other",
}

// Expense types
export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  description?: string;
  imageUrl?: string;
}

export enum ExpenseCategory {
  ACCOMMODATION = "accommodation",
  TRANSPORTATION = "transportation",
  FOOD = "food",
  ACTIVITIES = "activities",
  SHOPPING = "shopping",
  OTHER = "other",
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  currency: string;
  dateFormat: string;
  notifications: {
    tripReminders: boolean;
    budgetAlerts: boolean;
    activityReminders: boolean;
  };
  privacy: {
    shareTrips: boolean;
    showProfile: boolean;
  };
}

// Location types
export interface Location {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  description?: string;
  averageRating?: number;
  popularActivities: string[];
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Weather types
export interface WeatherInfo {
  location: string;
  date: string;
  temperature: {
    min: number;
    max: number;
    unit: "celsius" | "fahrenheit";
  };
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

// Search and filter types
export interface TripFilters {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  isCompleted?: boolean;
  isFavorite?: boolean;
  sortBy?: "date" | "budget" | "title" | "created";
  sortOrder?: "asc" | "desc";
}

export interface SearchResult {
  trips: Trip[];
  locations: Location[];
  totalResults: number;
  hasMore: boolean;
}
