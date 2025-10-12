import AuthStack from "@/app/auth-stacks";
import GlobalAlert from "@/components/GlobalAlert";
import { ReduxProvider } from "@/redux/redux-provider";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
import { Text, TextInput } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Set global default font to Poppins and map weights
  useMemo(() => {
    if (!fontsLoaded) return;
    const pickPoppins = (style: any) => {
      const weight =
        (Array.isArray(style)
          ? style.find((s) => s && s.fontWeight)?.fontWeight
          : style?.fontWeight) || "400";
      switch (String(weight)) {
        case "700":
        case "bold":
          return "Poppins_700Bold";
        case "600":
        case "semibold":
          return "Poppins_600SemiBold";
        case "500":
        case "medium":
          return "Poppins_500Medium";
        default:
          return "Poppins_400Regular";
      }
    };

    const override = (Base: any) => {
      const defaultRender = Base.render ? Base.render : Base;
      const Wrapped = function (...args: any[]) {
        const origin = defaultRender.apply(null, args);
        const originStyle = origin.props?.style;
        const fontFamily = pickPoppins(originStyle);
        return React.cloneElement(origin, {
          style: [{ fontFamily }, originStyle],
        });
      };
      // @ts-ignore
      Base.render = Wrapped;
    };

    override(Text);
    override(TextInput);
  }, [fontsLoaded]);

  return (
    <ReduxProvider>
      <StatusBar style="auto" />
      <GlobalAlert />
      <AuthStack>
        <Stack
          screenOptions={{
            headerShown: false,
            headerTintColor: "#fff",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </AuthStack>
    </ReduxProvider>
  );
}
