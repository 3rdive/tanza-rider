import { StorageKeys, StorageMechanics } from "@/lib/storage-mechanics";
import { useUser } from "@/redux/hooks/hooks";
import {
  Poppins_100Thin,
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82;
const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

const { width } = Dimensions.get("window");

export default function AnimatedSplashScreen() {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const { isAuthenticated } = useUser();

  const [fontsLoaded] = useFonts({
    Poppins_100Thin,
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    // Start animations
    Animated.parallel([
      // Progress bar animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }),
      // Fade in brand text
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Scale up brand text
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Navigate after animation
    const timer = setTimeout(() => {
      handleAuthenticate();
    }, 2500);

    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  const handleAuthenticate = async () => {
    const hasOnboarded = await StorageMechanics.get(
      StorageKeys.HAS_ONBOARDING_COMPLETED
    );
    if (!fontsLoaded) return;
	 StatusBar.setHidden(false, "fade");


	 // router.replace("/(tabs)");
    if (isAuthenticated) {
      router.replace("/(tabs)");
    } else {
      if (hasOnboarded) {
        router.replace("/(auth)/sign-in");
      } else {
        router.replace("/(auth)");
      }
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.brandText,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              fontFamily: "Poppins_600SemiBold",
            },
          ]}
        >
          Tanza
        </Animated.Text>
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: fadeAnim, fontFamily: "Poppins_700Bold" },
          ]}
        >
          Logistics Made Simple
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#00B624",
  },
  progressContainer: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    width: "100%",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 1.5,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  brandText: {
    fontSize: rs(80),
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: -2,
    marginBottom: 2,
  },
  tagline: {
    fontSize: rs(16),
    color: "#ffffff",
    fontWeight: "500",
    letterSpacing: 0.5,
    wordWrap: "nowrap",
  },
});
