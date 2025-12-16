import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";

export type RootStackParamList = {
  Root: undefined;
  Modal: undefined;
  TripDetails: { tripId: string };
  CreateTrip: undefined;
  EditTrip: { tripId: string };
  ActivityDetails: { activityId: string; tripId: string };
  ExpenseDetails: { expenseId: string; tripId: string };
  Profile: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Trips: undefined;
  Profile: undefined;
  Explore: undefined;
};

export type TripStackParamList = {
  TripsList: undefined;
  TripDetails: { tripId: string };
  CreateTrip: undefined;
  EditTrip: { tripId: string };
  TripActivities: { tripId: string };
  TripExpenses: { tripId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  EditProfile: undefined;
  Favorites: undefined;
  TripHistory: undefined;
};

export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;

export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

export type TripStackNavigationProp = StackNavigationProp<TripStackParamList>;

export type ProfileStackNavigationProp =
  StackNavigationProp<ProfileStackParamList>;

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  StackNavigationProp<RootStackParamList>
>;

export type TripsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Trips">,
  StackNavigationProp<TripStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  StackNavigationProp<ProfileStackParamList>
>;
