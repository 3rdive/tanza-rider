import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { storageService } from "@/lib/api";
import { useRider } from "@/hooks/rider.hook";

type DocKey = "license" | "insurance" | "vehicle";

export default function DocumentVerification() {
  const navigation = useNavigation();
  const {
    rider,
    documentStatus,
    isEditable,
    updating,
    fetchRider,
    updateRider,
  } = useRider();

  const [vehicleType, setVehicleType] = useState(rider?.vehicleType || "bike");
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Partial<Record<DocKey, string>>>(
    {}
  );
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  // Normalize status for display
  const status = documentStatus.toUpperCase() as
    | "INITIAL"
    | "PENDING"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED";

  // On mount: fetch latest rider data if not present
  useEffect(() => {
    if (!rider) {
      fetchRider();
    }
  }, [rider, fetchRider]);

  // Populate initial vehicleType and documents from rider data
  useEffect(() => {
    if (rider) {
      if (rider.vehicleType) {
        setVehicleType(rider.vehicleType);
      }
      // Populate uploaded documents
      const newDocs: Partial<Record<DocKey, string>> = {};
      if (rider.driverLicense) newDocs.license = rider.driverLicense;
      // For insurance and vehicle, use vehiclePapers if it's an array
      if (rider.vehiclePapers && Array.isArray(rider.vehiclePapers)) {
        // Map first item to insurance, rest to vehicle (or handle as needed)
        if (rider.vehiclePapers[0]) newDocs.insurance = rider.vehiclePapers[0];
        if (rider.vehiclePapers[1]) newDocs.vehicle = rider.vehiclePapers[1];
      }
      setDocuments(newDocs);
    }
  }, [rider]);

  const pickImage = async (key: DocKey) => {
    if (!isEditable) {
      Alert.alert(
        "Not Editable",
        "Documents cannot be modified when status is not INITIAL or REJECTED."
      );
      return;
    }

    try {
      // ask permissions
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "Permission to access media library is required."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        // Upload to server
        setUploading(true);
        try {
          const uploadRes = await storageService.upload({
            uri,
            name: `${key}-${Date.now()}.jpg`,
            type: "image/jpeg",
          });
          const uploadedUrl = uploadRes.data.url;
          setDocuments((d) => ({ ...d, [key]: uploadedUrl }));
          Alert.alert("Uploaded", `${key} uploaded successfully.`);
        } catch (err) {
          console.error("Upload error:", err);
          Alert.alert("Upload Failed", "Could not upload the image.");
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Could not pick the image.");
    }
  };

  const openCamera = async (key: DocKey) => {
    if (!isEditable) {
      Alert.alert(
        "Not Editable",
        "Documents cannot be modified when status is not INITIAL or REJECTED."
      );
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Permission to access camera is required."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUploading(true);
        try {
          const uploadRes = await storageService.upload({
            uri,
            name: `${key}-${Date.now()}.jpg`,
            type: "image/jpeg",
          });
          const uploadedUrl = uploadRes.data.url;
          setDocuments((d) => ({ ...d, [key]: uploadedUrl }));
          Alert.alert("Uploaded", `${key} uploaded successfully.`);
        } catch (err) {
          console.error("Upload error:", err);
          Alert.alert("Upload Failed", "Could not upload the image.");
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Could not open the camera.");
    }
  };

  const renderDocRow = (label: string, key: DocKey) => {
    const uri = documents[key];
    return (
      <View style={styles.docRow} key={key}>
        <View style={{ flex: 1 }}>
          <Text style={styles.docLabel}>{label}</Text>
          <Text style={styles.docSub}>{uri ? "Uploaded" : "Not uploaded"}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => (uri ? setPreviewUri(uri) : pickImage(key))}
            disabled={!isEditable}
          >
            <Ionicons
              name={uri ? "eye" : "cloud-upload"}
              size={20}
              color={isEditable ? "#00AA66" : "#999"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              !isEditable && { backgroundColor: "#ddd" },
            ]}
            onPress={() => pickImage(key)}
            disabled={!isEditable}
          >
            <Text
              style={[styles.secondaryText, !isEditable && { color: "#999" }]}
            >
              {uri ? "Replace" : "Upload"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              !isEditable && { backgroundColor: "#ddd" },
            ]}
            onPress={() => openCamera(key)}
            disabled={!isEditable}
          >
            <Text
              style={[styles.secondaryText, !isEditable && { color: "#999" }]}
            >
              Camera
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleSubmitDocuments = async () => {
    if (!isEditable) {
      Alert.alert("Not Editable", "Documents have already been submitted.");
      return;
    }

    // Validate all documents are uploaded
    if (!documents.license || !documents.insurance || !documents.vehicle) {
      Alert.alert(
        "Missing Documents",
        "Please upload all required documents before submitting."
      );
      return;
    }

    try {
      // Build vehiclePapers array from insurance and vehicle
      const vehiclePapers = [documents.insurance, documents.vehicle].filter(
        Boolean
      ) as string[];

      const payload = {
        vehicleType,
        vehiclePhoto: null, // Set to null or upload separately if needed
        driverLicense: documents.license,
        vehiclePapers,
        documentStatus: "PENDING",
      };

      await updateRider(payload).unwrap();
      Alert.alert("Success", "Your documents have been submitted for review.");
      // Optionally navigate back
      (navigation as any).goBack();
    } catch (err: any) {
      console.error("Submit error:", err);
      Alert.alert(
        "Submission Failed",
        err?.message || "Could not submit documents."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (navigation as any).goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Documents Approval Status</Text>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusPill,
              status === "APPROVED"
                ? styles.approved
                : status === "REJECTED"
                ? styles.rejected
                : styles.pending,
            ]}
          >
            {status}
          </Text>
        </View>

        {status !== "APPROVED" && (
          <View
            style={[
              styles.warningRow,
              status === "REJECTED" && { backgroundColor: "#f44336" },
            ]}
          >
            <View
              style={[
                styles.warningIcon,
                status === "REJECTED" && { backgroundColor: "red" },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color="#fff" />
            </View>
            <Text
              style={[
                styles.warningText,
                status === "REJECTED" && { color: "white" },
              ]}
            >
              {status === "REJECTED"
                ? rider?.rejectionReason ??
                  "Documents Rejected. Please re-upload."
                : "IMPORTANT: UPLOAD YOUR DOCUMENTS NOW — YOU CANNOT RECEIVE ORDERS UNTIL THEY ARE SUBMITTED AND APPROVED."}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.dropdownRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              vehicleType === "bike" && styles.typeBtnActive,
              !isEditable && { opacity: 0.5 },
            ]}
            onPress={() => isEditable && setVehicleType("bike")}
            disabled={!isEditable}
          >
            <Text
              style={
                vehicleType === "bike" ? styles.typeTextActive : styles.typeText
              }
            >
              Bike
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              vehicleType === "bicycle" && styles.typeBtnActive,
              !isEditable && { opacity: 0.5 },
            ]}
            onPress={() => isEditable && setVehicleType("bicycle")}
            disabled={!isEditable}
          >
            <Text
              style={
                vehicleType === "bicycle"
                  ? styles.typeTextActive
                  : styles.typeText
              }
            >
              Bicycle
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              vehicleType === "van" && styles.typeBtnActive,
              !isEditable && { opacity: 0.5 },
            ]}
            onPress={() => isEditable && setVehicleType("van")}
            disabled={!isEditable}
          >
            <Text
              style={
                vehicleType === "van" ? styles.typeTextActive : styles.typeText
              }
            >
              Van
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        {renderDocRow("Driver's License", "license")}
        {renderDocRow("Insurance", "insurance")}
        {renderDocRow("Vehicle Papers", "vehicle")}
      </View>

      <View style={{ padding: 16 }}>
        <TouchableOpacity
          style={[
            styles.primaryBtn,
            (!isEditable || uploading || updating) && {
              opacity: 0.5,
            },
          ]}
          onPress={handleSubmitDocuments}
          disabled={!isEditable || uploading || updating}
        >
          {uploading || updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Submit Documents</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={!!previewUri} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPreviewUri(null)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "700", padding: 16 },
  statusBox: {
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  statusLabel: { color: "#666", marginBottom: 8 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    color: "#fff",
    fontWeight: "600",
  },
  approved: { backgroundColor: "#00AA66" },
  pending: { backgroundColor: "#ff9800" },
  rejected: { backgroundColor: "#d32f2f" },
  note: { marginTop: 10, color: "#444" },

  section: { padding: 16 },
  label: { color: "#333", marginBottom: 8, fontWeight: "600" },
  dropdownRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#f3f3f3",
  },
  typeBtnActive: { backgroundColor: "#00AA66" },
  typeText: { color: "#333" },
  typeTextActive: { color: "#fff", fontWeight: "700" },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  docLabel: { fontWeight: "600", color: "#222" },
  docSub: { color: "#666", fontSize: 12, marginTop: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f7f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  secondaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#eee",
    borderRadius: 8,
    marginRight: 6,
  },
  secondaryText: { color: "#333" },

  primaryBtn: {
    backgroundColor: "#00AA66",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "92%",
    height: "78%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
  },
  closeBtn: { position: "absolute", top: 12, right: 12, zIndex: 10 },
  previewImage: { width: "100%", height: "100%" },
  warningRow: {
    marginTop: 12,
    backgroundColor: "#fff3e0",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  warningIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff9800",
    alignItems: "center",
    justifyContent: "center",
  },
  warningText: {
    flex: 1,
    color: "#a94400",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  backBtn: { padding: 6, marginRight: 8 },
});
