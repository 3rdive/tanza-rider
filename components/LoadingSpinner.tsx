import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export const LoadingSpinner = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#008B8B" />
      <Text style={styles.loadingText}>Loading transactions...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
});
