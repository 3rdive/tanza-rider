import { router } from "expo-router";
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  SafeAreaView,
  StyleSheet,
} from "react-native";

const Onboarding = () => {
  console.log("Onboarding rendered");
  const SpotifyIcon = () => (
    <View style={styles.spotifyIconContainer}>
      <View style={styles.spotifyIconContent}>
        <View style={[styles.spotifyLine, { width: 28 }]} />
        <View style={[styles.spotifyLine, { width: 22 }]} />
        <View style={[styles.spotifyLine, { width: 16 }]} />
      </View>
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="black" />
      {/* Album Grid */}
      <View style={styles.albumGridContainer}>
        <Image
          source={require("@/assets/images/auth/rider.jpg")}
          style={styles.albumImage}
          resizeMode="cover"
        />
      </View>

      {/* Bottom Content */}
      <View style={styles.bottomContent}>
        <SpotifyIcon />

        <Text style={styles.mainTitle}>Join Other Rider.</Text>
        <Text style={styles.subtitle}>Earn On TanzaGo.</Text>

        {/* Sign up free button */}
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => router.push("/mobile-entry")}
        >
          <Text style={styles.signUpButtonText}>Sign up free</Text>
        </TouchableOpacity>

        {/* Log in */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/sign-in")}
        >
          <Text style={styles.loginButtonText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollViewContent: {
    minHeight: "100%",
  },
  albumGridContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  albumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  albumCover: {
    width: "30%",
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  albumImage: {
    width: "100%",
    height: "100%",
  },
  albumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  bottomContent: {
    paddingTop: 3,
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: "center",
  },
  spotifyIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: "black",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  spotifyIconContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  spotifyLine: {
    height: 4,
    backgroundColor: "white",
    borderRadius: 2,
    marginBottom: 3,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    marginBottom: 48,
    lineHeight: 36,
  },
  signUpButton: {
    backgroundColor: "#1DB954",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 13,
    marginBottom: 16,
    alignItems: "center",
  },
  signUpButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  socialButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#333",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "500",
  },
  googleIcon: {
    width: 20,
    height: 20,
    backgroundColor: "black",
    borderRadius: 10,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4285f4",
  },
  facebookIcon: {
    width: 20,
    height: 20,
    backgroundColor: "#1877f2",
    borderRadius: 10,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  facebookIconText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  appleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  appleIconText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginButton: {
    marginTop: 16,
  },
  loginButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
  footer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  footerSpotifyIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#1DB954",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  footerSpotifyContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  footerSpotifyLine: {
    height: 1.5,
    backgroundColor: "black",
    borderRadius: 1,
    marginBottom: 1,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  footerTextRight: {
    color: "#666",
    fontSize: 14,
    marginLeft: "auto",
    marginRight: 4,
  },
  footerBrand: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Onboarding;
