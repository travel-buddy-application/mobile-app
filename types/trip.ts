// Safety Trip related types
export interface Trip {
  id: string;
  userId: string;
  title?: string;
  origin: {
    lat: number;
    lng: number;
    address?: string;
  };
  destination: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: "idle" | "active" | "ended" | "sos";
  startAt: string; // ISO date string
  endAt?: string; // ISO date string
  contacts: string[]; // Contact IDs
  createdAt: string;
  updatedAt: string;
}

export interface TripCreateInput {
  title?: string;
  origin: {
    lat: number;
    lng: number;
    address?: string;
  };
  destination: {
    lat: number;
    lng: number;
    address?: string;
  };
  contacts: string[]; // Contact IDs
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

// Contact types
export interface Contact {
  id: string;
  displayName: string;
  phone: string;
  pushToken?: string;
  sharingPolicy: "location" | "alerts" | "all";
  createdAt: string;
  updatedAt: string;
}

export interface ContactCreateInput {
  displayName: string;
  phone: string;
  pushToken?: string;
  sharingPolicy: "location" | "alerts" | "all";
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

export interface LocationSample {
  id: string;
  tripId: string;
  timestamp: number;
  lat: number;
  lng: number;
  speed?: number;
  accuracy: number;
  source: "gps" | "network" | "passive";
  createdAt: string;
}

export interface LocationState {
  currentLocation: LocationSample | null;
  isTracking: boolean;
  accuracy: number;
  serviceStatus: "stopped" | "starting" | "running" | "error";
  lastUpdate: number;
  permissionStatus: "granted" | "denied" | "undetermined";
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

// Risk Engine types
export interface RuleState {
  lastOkPromptAt: number;
  missedOkCount: number;
  inactivitySince?: number;
  deviationFlag: boolean;
  escalationLevel: "none" | "warning" | "countdown" | "sos";
  lastCheckIn: number;
  nextCheckInDue: number;
}

export interface RiskSettings {
  checkInInterval: number; // minutes
  inactivityThreshold: number; // minutes
  deviationRadius: number; // meters
  maxMissedCheckIns: number;
  countdownDuration: number; // seconds
}

// Outbound Event Queue types
export interface OutboundEvent {
  id: string;
  type: "push" | "sms";
  payload: any;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "sending" | "sent" | "failed";
  createdAt: string;
  lastAttemptAt?: string;
  scheduledFor?: string;
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
