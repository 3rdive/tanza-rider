import React, { useState, useEffect, useRef } from "react";
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
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { storageService } from "@/lib/api";
import { useRider } from "@/hooks/rider.hook";
import type { IRequiredDocument, IDocumentUpload } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";

interface DocumentData {
  docName: string;
  docUrl: string;
  expirationDate?: string;
  requiresExpiration: boolean;
  documentId?: string; // Existing document ID if already uploaded
  documentStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

export default function DocumentVerification() {
  const { colors } = useTheme();
  const {
    rider,
    documentStatus,
    isEditable,
    updating,
    fetchRider,
    updateRider,
    getRequiredDocuments,
    uploadDocuments,
    loadingRequiredDocs,
    uploadingDocuments,
    documents: existingDocuments,
  } = useRider();

  const [vehicleType, setVehicleType] = useState(rider?.vehicleType || "bike");
  const [uploading, setUploading] = useState(false);
  const [requiredDocs, setRequiredDocs] = useState<IRequiredDocument[]>([]);
  const [documentData, setDocumentData] = useState<
    Record<string, DocumentData>
  >({});
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const initializedRef = useRef(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch required documents when vehicle type changes
  useEffect(() => {
    const loadRequiredDocs = async () => {
      try {
        const docs = await getRequiredDocuments(vehicleType);
        setRequiredDocs(docs);
      } catch (error) {
        console.error("Error loading required documents:", error);
        Alert.alert("Error", "Failed to load required documents");
      }
    };

    if (vehicleType) {
      loadRequiredDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType]);

  // Populate document data from existing documents and required documents
  useEffect(() => {
    if (requiredDocs.length > 0 && !initializedRef.current) {
      const newDocData: Record<string, DocumentData> = {};

      requiredDocs.forEach((reqDoc) => {
        // Find if this document already exists in rider's documents
        const existingDoc = existingDocuments?.find(
          (d) => d.docName === reqDoc.docName
        );

        newDocData[reqDoc.docName] = {
          docName: reqDoc.docName,
          docUrl: existingDoc?.docUrl || "",
          expirationDate: existingDoc?.expirationDate || undefined,
          requiresExpiration: reqDoc.requiresExpiration,
          documentId: existingDoc?.id,
          documentStatus: existingDoc?.documentStatus,
          rejectionReason: existingDoc?.rejectionReason,
        };
      });

      setDocumentData(newDocData);
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredDocs]);

  // Update vehicle type in rider data
  useEffect(() => {
    if (rider?.vehicleType && rider.vehicleType !== vehicleType) {
      setVehicleType(rider.vehicleType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider]);

  const pickImage = async (docName: string) => {
    if (!isEditable) {
      Alert.alert(
        "Not Editable",
        "Documents cannot be modified when status is not INITIAL or REJECTED."
      );
      return;
    }

    try {
      // On web, permissions are not required the same way; skip checks there
      if (Platform.OS !== "web") {
        // Check current permission status first to avoid unnecessary prompts
        const currentPerm = await ImagePicker.getMediaLibraryPermissionsAsync();
        const currentGranted =
          typeof (currentPerm as any)?.granted === "boolean"
            ? (currentPerm as any).granted
            : (currentPerm as any)?.status === "granted";

        if (!currentGranted) {
          // Request permission
          const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
          const granted =
            typeof (req as any)?.granted === "boolean"
              ? (req as any).granted
              : (req as any)?.status === "granted";

          if (!granted) {
            Alert.alert(
              "Permission Required",
              "Please grant access to your photo library in your device settings to upload documents. Go to Settings > Tanza Go > Photos and enable access.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => {
                    if (Platform.OS === "ios") {
                      Linking.openURL("app-settings:");
                    } else {
                      Linking.openSettings();
                    }
                  },
                },
              ]
            );
            return;
          }
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      // Support both new and old result shapes and cancellation flags
      const wasCancelled =
        (result as any).canceled ?? (result as any).cancelled ?? false;
      if (wasCancelled) return;

      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (!uri) return;

      // Upload to server
      setUploading(true);
      try {
        const uploadRes = await storageService.upload({
          uri,
          name: `${docName}-${Date.now()}.jpg`,
          type: "image/jpeg",
        });
        const uploadedUrl =
          uploadRes.data?.url ?? (uploadRes as any)?.data?.url;

        // Update document data - preserve all existing fields
        setDocumentData((prev) => {
          const existing = prev[docName];
          if (!existing) return prev;

          return {
            ...prev,
            [docName]: {
              ...existing,
              docUrl: uploadedUrl,
            },
          };
        });

        Alert.alert("Uploaded", `${docName} uploaded successfully.`);
      } catch (err) {
        console.error("Upload error:", err);
        Alert.alert("Upload Failed", "Could not upload the image.");
      } finally {
        setUploading(false);
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Could not pick the image.");
    }
  };

  const openCamera = async (docName: string) => {
    if (!isEditable) {
      Alert.alert(
        "Not Editable",
        "Documents cannot be modified when status is not INITIAL or REJECTED."
      );
      return;
    }

    try {
      // On web, camera access typically doesn't follow the same permission API; skip checks there
      if (Platform.OS !== "web") {
        // Check camera permission first
        const currentPerm = await ImagePicker.getCameraPermissionsAsync();
        const currentGranted =
          typeof (currentPerm as any)?.granted === "boolean"
            ? (currentPerm as any).granted
            : (currentPerm as any)?.status === "granted";

        if (!currentGranted) {
          const req = await ImagePicker.requestCameraPermissionsAsync();
          const granted =
            typeof (req as any)?.granted === "boolean"
              ? (req as any).granted
              : (req as any)?.status === "granted";

          if (!granted) {
            Alert.alert(
              "Permission Required",
              "Please grant camera access in your device settings to take photos of your documents. Go to Settings > Tanza Go > Camera and enable access.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => {
                    if (Platform.OS === "ios") {
                      Linking.openURL("app-settings:");
                    } else {
                      Linking.openSettings();
                    }
                  },
                },
              ]
            );
            return;
          }
        }
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

      // Support both new and old result shapes and cancellation flags
      const wasCancelled =
        (result as any).canceled ?? (result as any).cancelled ?? false;
      if (wasCancelled) return;

      const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
      if (!uri) return;

      setUploading(true);
      try {
        const uploadRes = await storageService.upload({
          uri,
          name: `${docName}-${Date.now()}.jpg`,
          type: "image/jpeg",
        });
        const uploadedUrl =
          uploadRes.data?.url ?? (uploadRes as any)?.data?.url;

        // Update document data - preserve all existing fields
        setDocumentData((prev) => {
          const existing = prev[docName];
          if (!existing) return prev;

          return {
            ...prev,
            [docName]: {
              ...existing,
              docUrl: uploadedUrl,
            },
          };
        });

        Alert.alert("Uploaded", `${docName} uploaded successfully.`);
      } catch (err) {
        console.error("Upload error:", err);
        Alert.alert("Upload Failed", "Could not upload the image.");
      } finally {
        setUploading(false);
      }
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Could not open the camera.");
    }
  };

  const handleVehicleTypeChange = async (newVehicleType: string) => {
    // Only allow vehicle type change when documentStatus is INITIAL
    if (documentStatus !== "INITIAL" && documentStatus !== "") {
      Alert.alert(
        "Not Allowed",
        "Vehicle type can only be changed when documents have not been submitted yet."
      );
      return;
    }

    setVehicleType(newVehicleType);

    // Update rider vehicle type
    try {
      await updateRider({ vehicleType: newVehicleType }).unwrap();
    } catch (err: any) {
      console.error("Error updating vehicle type:", err);
      Alert.alert("Error", "Failed to update vehicle type");
    }
  };

  useEffect(() => {
    const ensureDefaultVehicle = async () => {
      if (
        !rider?.vehicleType &&
        (documentStatus === "INITIAL" || documentStatus === "")
      ) {
        try {
          await updateRider({ vehicleType: "bike" }).unwrap();
        } catch (error) {
          console.error("Error setting default vehicle type:", error);
        }
      }
    };

    ensureDefaultVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (
    docName: string,
    event: any,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(null);
    }

    if (selectedDate) {
      setTempDate(selectedDate);
      const formattedDate = formatDateToYYYYMMDD(selectedDate);
      setDocumentData((prev) => {
        const existing = prev[docName];
        if (!existing) return prev;

        return {
          ...prev,
          [docName]: {
            ...existing,
            expirationDate: formattedDate,
          },
        };
      });

      if (Platform.OS === "ios") {
        // For iOS, we'll close the picker when user taps outside or confirms
        // The modal will handle this
      }
    } else if (Platform.OS === "android") {
      // User cancelled the picker on Android
      setShowDatePicker(null);
    }
  };

  const openDatePicker = (docName: string, currentDate?: string) => {
    if (!isEditable) return;

    const initialDate = currentDate ? new Date(currentDate) : new Date();
    setTempDate(initialDate);
    setShowDatePicker(docName);
  };

  const handleSubmitDocuments = async () => {
    if (!isEditable) {
      Alert.alert("Not Editable", "Documents have already been submitted.");
      return;
    }

    // Validate all required documents are uploaded
    const missingDocs = requiredDocs.filter((reqDoc) => {
      const docData = documentData[reqDoc.docName];
      return !docData?.docUrl;
    });

    if (missingDocs.length > 0) {
      Alert.alert(
        "Missing Documents",
        `Please upload: ${missingDocs.map((d) => d.docName).join(", ")}`
      );
      return;
    }

    // Validate expiration dates for documents that require them
    const invalidExpirations = requiredDocs.filter((reqDoc) => {
      const docData = documentData[reqDoc.docName];
      return reqDoc.requiresExpiration && !docData?.expirationDate;
    });

    if (invalidExpirations.length > 0) {
      Alert.alert(
        "Missing Expiration Dates",
        `Please provide expiration dates for: ${invalidExpirations
          .map((d) => d.docName)
          .join(", ")}`
      );
      return;
    }

    try {
      // Build documents array
      const documentsToUpload: IDocumentUpload[] = Object.values(
        documentData
      ).map((doc) => ({
        docName: doc.docName,
        docUrl: doc.docUrl,
        expirationDate: doc.expirationDate,
      }));

      // First, upload the documents
      await uploadDocuments(documentsToUpload);

      // Then, update the rider status to PENDING
      await updateRider({ documentStatus: "PENDING" }).unwrap();

      Alert.alert("Success", "Your documents have been submitted for review.");
      // Optionally navigate back
      // (navigation as any).goBack();
      router.back();
    } catch (err: any) {
      console.error("Submit error:", err);
      Alert.alert(
        "Submission Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Could not submit documents."
      );
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    title: { fontSize: 18, fontWeight: "700", padding: 16, color: colors.text },
    statusBox: {
      padding: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    statusLabel: { color: colors.textSecondary, marginBottom: 8 },
    statusRow: { flexDirection: "row", alignItems: "center" },
    statusPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      color: "#fff",
      fontWeight: "600",
    },
    miniStatusPill: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    miniStatusText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },
    approved: { backgroundColor: "#00AA66" },
    pending: { backgroundColor: "#ff9800" },
    rejected: { backgroundColor: "#d32f2f" },
    note: { marginTop: 10, color: colors.textSecondary },

    section: { padding: 16 },
    label: { color: colors.text, marginBottom: 8, fontWeight: "600" },
    dropdownRow: { flexDirection: "row", gap: 8 },
    typeBtn: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    typeBtnActive: { backgroundColor: colors.primary },
    typeText: { color: colors.text },
    typeTextActive: { color: colors.surface, fontWeight: "700" },

    docRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    docLabel: { fontWeight: "600", color: colors.text },
    docSub: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
    rejectionText: {
      color: "#d32f2f",
      fontSize: 11,
      marginTop: 4,
      fontStyle: "italic",
    },
    expirationLabel: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 4,
      fontWeight: "500",
    },
    expirationInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      fontSize: 14,
      color: colors.text,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
    },
    datePickerText: {
      fontSize: 14,
      color: colors.text,
    },
    datePickerModalBg: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    datePickerContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingBottom: 20,
    },
    datePickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    datePickerCancel: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    datePickerDone: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: "600",
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    secondaryBtn: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginRight: 6,
    },
    secondaryText: { color: colors.text },

    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    },
    primaryText: { color: colors.surface, fontWeight: "700" },

    modalBg: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "92%",
      height: "78%",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
    },
    closeBtn: { position: "absolute", top: 12, right: 12, zIndex: 10 },
    previewImage: { width: "100%", height: "100%" },
    warningRow: {
      marginTop: 12,
      backgroundColor: colors.tabBackground,
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

  const renderDocRow = (docData: DocumentData) => {
    const {
      docName,
      docUrl,
      requiresExpiration,
      documentStatus: docStatus,
      rejectionReason: docRejectionReason,
    } = docData;
    const isUploaded = !!docUrl;

    return (
      <View style={styles.docRow} key={docName}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.docLabel}>{docName}</Text>
            {docStatus === "APPROVED" && (
              <View style={[styles.miniStatusPill, styles.approved]}>
                <Text style={styles.miniStatusText}>✓</Text>
              </View>
            )}
            {docStatus === "REJECTED" && (
              <View style={[styles.miniStatusPill, styles.rejected]}>
                <Text style={styles.miniStatusText}>✗</Text>
              </View>
            )}
            {docStatus === "PENDING" && (
              <View style={[styles.miniStatusPill, styles.pending]}>
                <Text style={styles.miniStatusText}>⋯</Text>
              </View>
            )}
          </View>
          <Text style={styles.docSub}>
            {isUploaded ? "Uploaded" : "Not uploaded"}
          </Text>
          {docRejectionReason && (
            <Text style={styles.rejectionText}>
              Reason: {docRejectionReason}
            </Text>
          )}

          {requiresExpiration && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.expirationLabel}>Expiration Date</Text>
              <TouchableOpacity
                style={[
                  styles.expirationInput,
                  !isEditable && { backgroundColor: colors.background },
                ]}
                onPress={() => openDatePicker(docName, docData.expirationDate)}
                disabled={!isEditable}
              >
                <Text
                  style={[
                    styles.datePickerText,
                    !docData.expirationDate && { color: colors.textSecondary },
                  ]}
                >
                  {docData.expirationDate || "YYYY-MM-DD"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              isUploaded ? setPreviewUri(docUrl) : pickImage(docName)
            }
            disabled={!isEditable && !isUploaded}
          >
            <Ionicons
              name={isUploaded ? "eye" : "cloud-upload"}
              size={20}
              color={
                isEditable || isUploaded ? colors.primary : colors.textSecondary
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              !isEditable && { backgroundColor: colors.border },
            ]}
            onPress={() => pickImage(docName)}
            disabled={!isEditable}
          >
            <Text
              style={[styles.secondaryText, !isEditable && { color: "#999" }]}
            >
              {isUploaded ? "Replace" : "Upload"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              !isEditable && { backgroundColor: colors.border },
            ]}
            onPress={() => openCamera(docName)}
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
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
                  ? rider?.rejectionReason ||
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
                documentStatus !== "INITIAL" &&
                  documentStatus !== "" && { opacity: 0.5 },
              ]}
              onPress={() =>
                (documentStatus === "INITIAL" || documentStatus === "") &&
                handleVehicleTypeChange("bike")
              }
              disabled={documentStatus !== "INITIAL" && documentStatus !== ""}
            >
              <Text
                style={
                  vehicleType === "bike"
                    ? styles.typeTextActive
                    : styles.typeText
                }
              >
                Bike
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                vehicleType === "bicycle" && styles.typeBtnActive,
                documentStatus !== "INITIAL" &&
                  documentStatus !== "" && { opacity: 0.5 },
              ]}
              onPress={() =>
                (documentStatus === "INITIAL" || documentStatus === "") &&
                handleVehicleTypeChange("bicycle")
              }
              disabled={documentStatus !== "INITIAL" && documentStatus !== ""}
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
                documentStatus !== "INITIAL" &&
                  documentStatus !== "" && { opacity: 0.5 },
              ]}
              onPress={() =>
                (documentStatus === "INITIAL" || documentStatus === "") &&
                handleVehicleTypeChange("van")
              }
              disabled={documentStatus !== "INITIAL" && documentStatus !== ""}
            >
              <Text
                style={
                  vehicleType === "van"
                    ? styles.typeTextActive
                    : styles.typeText
                }
              >
                Van
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          {loadingRequiredDocs ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            Object.values(documentData).map((docData) => renderDocRow(docData))
          )}
        </View>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!isEditable || uploading || updating || uploadingDocuments) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleSubmitDocuments}
            disabled={
              !isEditable || uploading || updating || uploadingDocuments
            }
          >
            {uploading || updating || uploadingDocuments ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryText}>Submit Documents</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={!!previewUri} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPreviewUri(null)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
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

      {/* Date Picker Modal for iOS */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.datePickerModalBg}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(event, date) =>
                  handleDateChange(showDatePicker, event, date)
                }
                textColor={colors.text}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(event, date) =>
            handleDateChange(showDatePicker, event, date)
          }
        />
      )}
    </SafeAreaView>
  );
}
