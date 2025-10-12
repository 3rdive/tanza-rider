import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const Divider = () => {
  return (
    <View style={styles.divider}>
      <View style={styles.line} />
      <Text style={styles.orText}>or</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  orText: {
    marginHorizontal: 16,
    color: "#666",
    fontSize: 16,
  },
});
