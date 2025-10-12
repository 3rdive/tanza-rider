import React, { useState } from "react";
import {
 Modal,
 View,
 Text,
 TouchableOpacity,
 StyleSheet,
 Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

type AlertButton = {
 text: string;
 onPress?: () => void;
 style?: "default" | "cancel" | "destructive";
};

type CustomAlertState = {
 visible: boolean;
 title: string;
 message: string;
 icon: keyof typeof Ionicons.glyphMap;
 buttons: AlertButton[];
 error: boolean,
};

let updateAlert: (state: Partial<CustomAlertState>) => void;

const CustomAlert = () => {
 const [state, setState] = useState<CustomAlertState>({
	visible: false,
	title: "",
	message: "",
	icon: "alert-circle-outline",
	buttons: [],
	error: false,
 });

 updateAlert = (newState) => setState((prev) => ({ ...prev, ...newState }));

 const handleClose = () => updateAlert({ visible: false });

 return (
	 <Modal
		 transparent
		 visible={state.visible}
		 animationType="fade"
		 onRequestClose={handleClose}
	 >
		<View style={styles.overlay}>
		 <View style={styles.alertBox}>
			<Ionicons
				name={state.icon}
				size={48}
				color={state.error ? "red" : "#FF6B6B" }
				style={styles.icon}
			/>

			<Text style={styles.title}>{state.title}</Text>
			<Text style={styles.message}>{state.message}</Text>

			<View style={styles.actions}>
			 {state.buttons.map((btn, idx) => {
				const isCancel = btn.style === "cancel";
				const isDestructive = btn.style === "destructive";

				return (
					<TouchableOpacity
						key={idx}
						style={[
						 styles.button,
						 isCancel && styles.cancelBtn,
						 isDestructive && styles.destructiveBtn,
						]}
						onPress={() => {
						 handleClose();
						 btn.onPress?.();
						}}
					>
					 <Text
						 style={[
							styles.buttonText,
							isCancel && styles.cancelText,
							isDestructive && styles.destructiveText,
						 ]}
					 >
						{btn.text}
					 </Text>
					</TouchableOpacity>
				);
			 })}
			</View>
		 </View>
		</View>
	 </Modal>
 );
};

// Static API like Alert.alert
CustomAlert.alert = (
	title: string,
	message: string,
	buttons: AlertButton[] = [{ text: "OK" }],
	icon: keyof typeof Ionicons.glyphMap = "alert-circle-outline",
	error: boolean = false,
) => {
 updateAlert({ visible: true, title, message, buttons, icon, error });
};

export default CustomAlert;

const styles = StyleSheet.create({
 overlay: {
	flex: 1,
	backgroundColor: "rgba(0,0,0,0.5)",
	alignItems: "center",
	justifyContent: "center",
 },
 alertBox: {
	width: width * 0.8,
	backgroundColor: "#fff",
	borderRadius: 20,
	padding: 20,
	alignItems: "center",
	elevation: 5,
 },
 icon: {
	marginBottom: 12,
 },
 title: {
	fontSize: 20,
	fontWeight: "700",
	marginBottom: 8,
	textAlign: "center",
 },
 message: {
	fontSize: 16,
	color: "#444",
	textAlign: "center",
	marginBottom: 20,
 },
 actions: {
	flexDirection: "row",
	justifyContent: "flex-end",
	flexWrap: "wrap",
	width: "100%",
	marginTop: 10,
 },
 button: {
	paddingVertical: 10,
	paddingHorizontal: 16,
	marginLeft: 10,
	borderRadius: 12,
	backgroundColor: "#4CAF50",
 },
 cancelBtn: {
	backgroundColor: "#E0E0E0",
 },
 destructiveBtn: {
	backgroundColor: "#FF6B6B",
 },
 buttonText: {
	fontWeight: "600",
	color: "#fff",
 },
 cancelText: {
	color: "#333",
 },
 destructiveText: {
	color: "#fff",
 },
});