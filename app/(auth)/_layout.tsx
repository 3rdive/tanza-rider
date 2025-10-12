import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="mobile-entry" />
      <Stack.Screen name="completion" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="otp-verification" />
    </Stack>
  );
}
