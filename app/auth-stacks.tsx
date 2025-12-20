// StorageMechanics previously referenced; removed to consolidate alert behavior
import { StorageMechanics } from "@/lib/storage-mechanics";
import { useUser } from "@/redux/hooks/hooks";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

// Define props so that children must be a <Stack> element from expo-router
type AuthStackProps = {
  children: React.ReactElement<React.ComponentProps<typeof Stack>>;
};

export default function AuthStack({ children }: AuthStackProps) {
  const { isAuthenticated } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // StorageMechanics.clear()
    // Wait for the root navigation to be ready to avoid race conditions
    if (!rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inHomeGroup = segments[0] === "(tabs)";

    // If user is on home but not authenticated -> go to auth
    if (!isAuthenticated && inHomeGroup) {
      router.replace("/(auth)/sign-in");
      return;
    }

    // If user is on auth but authenticated -> go to home
    if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }
  }, [segments, isAuthenticated, rootNavigationState?.key, router]);

  // Always register both groups with the stack; navigation is controlled via redirects above
  return children;
}
