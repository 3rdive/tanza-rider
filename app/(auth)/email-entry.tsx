// EmailEntryScreen.tsx
import { authService } from "@/lib/api";
import { useAuthFlow } from "@/redux/hooks/hooks";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RFValue } from "react-native-responsive-fontsize";

const UI_SCALE = 0.82;
const rs = (n: number) => RFValue((n - 1) * UI_SCALE);

export default function EmailEntryScreen() {
  // const [email, setEmail] = useState("");
  // const [checking, setChecking] = useState(false);
  // const [emailExists, setEmailExists] = useState<boolean | null>(null);
  // const { setEmail: setAuthEmail, mobile, clearState } = useAuthFlow();
  //
  // const validateEmail = (email: string) => {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   return emailRegex.test(email);
  // };
  //
  // const handleNext = () => {
  //   if (!validateEmail(email)) {
  //     Alert.alert("Invalid Email", "Please enter a valid email address");
  //     return;
  //   }
  //   setAuthEmail(email);
  //   router.push("/completion");
  // };
  //
  // // When email changes and is valid, check if it already exists
  // useEffect(() => {
  //   if (!validateEmail(email)) {
  //     setEmailExists(null);
  //     return;
  //   }
  //   let cancelled = false;
  //   setChecking(true);
  //   const timer = setTimeout(async () => {
  //     try {
  //       const exists = await authService.userExistsByEmail(email);
  //       if (!cancelled) setEmailExists(exists);
  //     } catch (e) {
  //       if (!cancelled) setEmailExists(null);
  //     } finally {
  //       if (!cancelled) setChecking(false);
  //     }
  //   }, 400);
  //   return () => {
  //     cancelled = true;
  //     clearTimeout(timer);
  //   };
  // }, [email]);
  //
  // useEffect(() => {
  //   if (!mobile) {
  //     clearState();
  //     router.replace("/(auth)/mobile-entry");
  //   }
  // }, [mobile]);
  //
  // return (
  //   <SafeAreaView style={styles.container}>
  //     <View style={styles.content}>
  //       <Text style={styles.title}>Enter your email address</Text>
  //       <Text style={styles.subtitle}>
  //         Add your email to aid in account recovery
  //       </Text>
  //
  //       <View style={styles.inputContainer}>
  //         <Text style={styles.label}>Email</Text>
  //         <TextInput
  //           style={styles.emailInput}
  //           placeholder="name@example.com"
  //           value={email}
  //           onChangeText={setEmail}
  //           keyboardType="email-address"
  //           autoCapitalize="none"
  //           autoCorrect={false}
  //         />
  //         {emailExists === true && (
  //           <Text style={styles.errorText}>
  //             This email is already registered. Please use a different email.
  //           </Text>
  //         )}
  //       </View>
  //
  //       <TouchableOpacity
  //         style={[
  //           styles.nextButton,
  //           (!validateEmail(email) || emailExists === true || checking) &&
  //             styles.disabledButton,
  //         ]}
  //         onPress={handleNext}
  //         disabled={!validateEmail(email) || emailExists === true || checking}
  //       >
  //         <Text
  //           style={[
  //             styles.nextText,
  //             (!validateEmail(email) || emailExists === true || checking) &&
  //               styles.disabledText,
  //           ]}
  //         >
  //           {checking ? "Checking…" : "Next →"}
  //         </Text>
  //       </TouchableOpacity>
  //     </View>
  //   </SafeAreaView>
  // );

  return <View>Email Entry Screen</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: rs(24),
    paddingTop: rs(20),
  },
  backButton: {
    width: rs(40),
    height: rs(40),
    justifyContent: "center",
    marginBottom: rs(20),
  },
  backArrow: {
    fontSize: rs(24),
    color: "#000",
  },
  title: {
    fontSize: rs(28),
    fontWeight: "bold",
    color: "#000",
    marginBottom: rs(8),
  },
  subtitle: {
    fontSize: rs(16),
    color: "#666",
    marginBottom: rs(40),
    lineHeight: rs(22),
  },
  inputContainer: {
    marginBottom: rs(40),
  },
  label: {
    fontSize: rs(16),
    color: "#000",
    marginBottom: rs(8),
    fontWeight: "500",
  },
  emailInput: {
    borderWidth: rs(2),
    borderColor: "#e0e0e0",
    borderRadius: rs(12),
    paddingHorizontal: rs(16),
    paddingVertical: rs(16),
    fontSize: rs(16),
    backgroundColor: "#fff",
  },
  nextButton: {
    position: "absolute",
    bottom: rs(40),
    right: rs(24),
    backgroundColor: "#000",
    paddingHorizontal: rs(24),
    paddingVertical: rs(12),
    borderRadius: rs(25),
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  nextText: {
    color: "#fff",
    fontSize: rs(16),
    fontWeight: "600",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: rs(12),
    marginTop: rs(8),
  },
  disabledText: {
    color: "#999",
  },
});
