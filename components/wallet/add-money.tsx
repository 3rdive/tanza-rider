import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export const AddMoneyButton = ({
  onPress,
}: {
  onPress: (prop?: any) => void;
}) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>Add Withdrawal Option</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // width: 130,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: "#3E9C68",
    borderRadius: 7,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-end",
    margin: 16,
    marginRight: 25,
  },
  buttonText: {
    color: "#3E9C68",
    fontSize: 18,
    fontWeight: "600",
  },
});
