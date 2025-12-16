
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profileImageUrl?: string;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
  updatedAt: string;
  fcmToken: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: "family" | "friend" | "colleague" | "other";
  isPrimary: boolean;
  createdAt: string;
}

export interface UserCreateInput {
  name: string;
  phone: string;
  email: string;
}

export interface EmergencyContactCreateInput {
  name: string;
  phone: string;
  relationship: "family" | "friend" | "colleague" | "other";
  isPrimary?: boolean;
}

export interface OnboardingStep {
  step: number;
  title: string;
  isCompleted: boolean;
}

export type OnboardingSteps =
  | "profile"
  | "otp-verification"
  | "contacts"
  | "permissions"
  | "completed";

export interface OnboardingState {
  currentStep: OnboardingSteps;
  completedSteps: OnboardingSteps[];
  isOnboardingComplete: boolean;
}
