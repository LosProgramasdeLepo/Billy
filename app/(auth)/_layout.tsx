import React from "react";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack initialRouteName="start">
      <Stack.Screen name="start" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot_password" options={{ headerShown: false }} />
    </Stack>
  );
}
