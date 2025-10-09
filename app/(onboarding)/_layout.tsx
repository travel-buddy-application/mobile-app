import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent going back during onboarding
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="emergency-contacts" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}