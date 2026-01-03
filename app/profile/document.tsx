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
  ScrollView,
  Linking,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { storageService } from "@/lib/api";
import { useRider } from "@/hooks/rider.hook";
import { useVehicleTypes } from "@/hooks/useVehicleTypes";
import type { IRequiredDocument, IDocumentUpload } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import { useToast } from "@/hooks/useToast";

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
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 380;

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

  const { vehicleTypes, loading: loadingVehicleTypes } = useVehicleTypes();

  const [vehicleType, setVehicleType] = useState(rider?.vehicleType || "bike");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [requiredDocs, setRequiredDocs] = useState<IRequiredDocument[]>([]);
  const [documentData, setDocumentData] = useState<
    Record<string, DocumentData>
  >({});
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const toast = useToast();

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
      if (!vehicleType) return;

      try {
        const docs = await getRequiredDocuments(vehicleType);
        setRequiredDocs(docs);
      } catch (error) {
        console.error("Error loading required documents:", error);
        toast.error("Error", "Failed to load required documents");
      }
    };

    loadRequiredDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType]);

  // Populate document data from existing documents and required documents
  useEffect(() => {
    // Clear previous documents when a vehicle type has no required documents
    if (requiredDocs.length === 0) {
      setDocumentData((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }

    setDocumentData((prev) => {
      const next = { ...prev };
      let hasChanges = false;

      // Remove documents that are no longer required
      Object.keys(next).forEach((key) => {
        if (!requiredDocs.find((d) => d.docName === key)) {
          delete next[key];
          hasChanges = true;
        }
      });

      requiredDocs.forEach((reqDoc) => {
        // Find if this document already exists in rider's documents
        const existingDoc = existingDocuments?.find(
          (d) => d.docName === reqDoc.docName,
        );

        const prevDoc = prev[reqDoc.docName];

        if (!prevDoc) {
          // New document data
          next[reqDoc.docName] = {
            docName: reqDoc.docName,
            docUrl: existingDoc?.docUrl || "",
            expirationDate: existingDoc?.expirationDate || undefined,
            requiresExpiration: reqDoc.requiresExpiration,
            documentId: existingDoc?.id,
            documentStatus: existingDoc?.documentStatus,
            rejectionReason: existingDoc?.rejectionReason,
          };
          hasChanges = true;
        } else {
          // Update existing document data if server status changed
          // We preserve local edits (docUrl, expirationDate) by spreading prevDoc
          const statusChanged =
            prevDoc.documentStatus !== existingDoc?.documentStatus ||
            prevDoc.rejectionReason !== existingDoc?.rejectionReason ||
            prevDoc.documentId !== existingDoc?.id;

          if (statusChanged) {
            next[reqDoc.docName] = {
              ...prevDoc,
              documentId: existingDoc?.id,
              documentStatus: existingDoc?.documentStatus,
              rejectionReason: existingDoc?.rejectionReason,
            };
            hasChanges = true;
          }
        }
      });

      return hasChanges ? next : prev;
    });
  }, [requiredDocs, existingDocuments]);

  // Initialize vehicle type from rider data or defaults
  useEffect(() => {
    if (rider?.vehicleType) {
      if (rider.vehicleType !== vehicleType) {
        setVehicleType(rider.vehicleType);
      }
    } else if (vehicleTypes.length > 0) {
      // Default to first active vehicle type if "bike" is not in the list
      const bikeType = vehicleTypes.find((type) => type.name === "bike");
      const defaultType = bikeType ? "bike" : vehicleTypes[0].name;

      if (vehicleType !== defaultType) {
        setVehicleType(defaultType);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider, vehicleTypes]);

  const pickImage = async (docName: string) => {
    if (!isEditable) {
      toast.info(
        "Not Editable",
        "Documents cannot be modified when status is not INITIAL or REJECTED.",
      );
      return;
    }

    try {
      // Use DocumentPicker to open file picker instead of image gallery
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      // Check if user cancelled
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const uri = file.uri;
      if (!uri) return;

      // Validate file size (optional: 10MB limit)
      if (file.size && file.size > 10 * 1024 * 1024) {
        toast.error("File Too Large", "Please select a file smaller than 10MB");
        return;
      }

      // Upload to server
      setUploadingDoc(docName);
      try {
        // Determine file type from mimeType or name
        const mimeType = file.mimeType || "image/jpeg";
        const fileName = file.name || `${docName}-${Date.now()}.jpg`;

        const uploadRes = await storageService.upload({
          uri,
          name: fileName,
          type: mimeType,
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

        toast.success("Uploaded", `${docName} uploaded successfully.`);
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Upload Failed", "Could not upload the image.");
      } finally {
        setUploadingDoc(null);
      }
    } catch (err) {
      console.warn(err);
      toast.error("Error", "Could not pick the image.");
    }
  };

  const openCamera = async (docName: string) => {
    if (!isEditable) {
      toast.info(
        "Not Editable",
        "Documents cannot be modified when status is not INITIAL or REJECTED.",
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
              ],
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

      setUploadingDoc(docName);
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

        toast.success("Uploaded", `${docName} uploaded successfully.`);
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Upload Failed", "Could not upload the image.");
      } finally {
        setUploadingDoc(null);
      }
    } catch (err) {
      console.warn(err);
      toast.error("Error", "Could not open the camera.");
    }
  };

  const handleVehicleTypeChange = async (newVehicleType: string) => {
    // Only allow vehicle type change when documentStatus is INITIAL
    if (documentStatus !== "INITIAL" && documentStatus !== "") {
      toast.info(
        "Not Allowed",
        "Vehicle type can only be changed when documents have not been submitted yet.",
      );
      return;
    }

    setVehicleType(newVehicleType);

    // Update rider vehicle type
    try {
      await updateRider({ vehicleType: newVehicleType }).unwrap();
    } catch (err: any) {
      console.error("Error updating vehicle type:", err);
      toast.error("Error", "Failed to update vehicle type");
    }
  };

  useEffect(() => {
    const ensureDefaultVehicle = async () => {
      if (
        !rider?.vehicleType &&
        (documentStatus === "INITIAL" || documentStatus === "") &&
        vehicleTypes.length > 0
      ) {
        try {
          // Use "bike" if available, otherwise use first vehicle type
          const defaultType = vehicleTypes.find((type) => type.name === "bike")
            ? "bike"
            : vehicleTypes[0].name;
          await updateRider({ vehicleType: defaultType }).unwrap();
        } catch (error) {
          console.error("Error setting default vehicle type:", error);
        }
      }
    };

    ensureDefaultVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleTypes]);

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (
    docName: string,
    event: any,
    selectedDate?: Date,
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
      toast.error(
        "Missing Documents",
        `Please upload: ${missingDocs.map((d) => d.docName).join(", ")}`,
      );
      return;
    }

    // Validate expiration dates for documents that require them
    const invalidExpirations = requiredDocs.filter((reqDoc) => {
      const docData = documentData[reqDoc.docName];
      return reqDoc.requiresExpiration && !docData?.expirationDate;
    });

    if (invalidExpirations.length > 0) {
      toast.error(
        "Missing Expiration Dates",
        `Please provide expiration dates for: ${invalidExpirations
          .map((d) => d.docName)
          .join(", ")}`,
      );
      return;
    }

    try {
      // Build documents array
      const documentsToUpload: IDocumentUpload[] = Object.values(
        documentData,
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
          "Could not submit documents.",
      );
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    title: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: "700",
      padding: isSmallScreen ? 12 : 16,
      color: colors.text,
      flex: 1,
    },
    statusBox: {
      padding: isSmallScreen ? 12 : 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    statusLabel: {
      color: colors.textSecondary,
      marginBottom: 8,
      fontSize: isSmallScreen ? 13 : 14,
    },
    statusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
    statusPill: {
      paddingVertical: 6,
      paddingHorizontal: isSmallScreen ? 10 : 12,
      borderRadius: 16,
      color: "#fff",
      fontWeight: "600",
      fontSize: isSmallScreen ? 13 : 14,
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

    section: { padding: isSmallScreen ? 12 : 16 },
    label: {
      color: colors.text,
      marginBottom: 8,
      fontWeight: "600",
      fontSize: isSmallScreen ? 14 : 15,
    },
    dropdownRow: {
      flexDirection: "row",
      gap: isSmallScreen ? 6 : 8,
      flexWrap: "wrap",
    },
    typeBtn: {
      paddingVertical: isSmallScreen ? 8 : 10,
      paddingHorizontal: isSmallScreen ? 12 : 14,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    typeBtnActive: { backgroundColor: colors.primary },
    typeText: { color: colors.text, fontSize: isSmallScreen ? 13 : 14 },
    typeTextActive: {
      color: colors.surface,
      fontWeight: "700",
      fontSize: isSmallScreen ? 13 : 14,
    },

    docRow: {
      flexDirection: isSmallScreen ? "column" : "row",
      alignItems: isSmallScreen ? "stretch" : "center",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: isSmallScreen ? 12 : 0,
    },
    docLabel: {
      fontWeight: "600",
      color: colors.text,
      fontSize: isSmallScreen ? 14 : 15,
    },
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
      paddingVertical: isSmallScreen ? 10 : 12,
      paddingHorizontal: isSmallScreen ? 12 : 14,
      fontSize: isSmallScreen ? 14 : 15,
      color: colors.text,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      minHeight: 44, // Minimum touch target
    },
    datePickerText: {
      fontSize: isSmallScreen ? 14 : 15,
      color: colors.text,
      flex: 1,
    },
    datePickerModalBg: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    datePickerContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: Platform.OS === "ios" ? 20 : 16,
      maxHeight: "50%",
    },
    datePickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: isSmallScreen ? 10 : 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    datePickerCancel: {
      fontSize: isSmallScreen ? 15 : 16,
      color: colors.textSecondary,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    datePickerDone: {
      fontSize: isSmallScreen ? 15 : 16,
      color: colors.primary,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    iconBtn: {
      width: isSmallScreen ? 44 : 40,
      height: isSmallScreen ? 44 : 40,
      borderRadius: 8,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: isSmallScreen ? 0 : 8,
    },
    secondaryBtn: {
      paddingHorizontal: isSmallScreen ? 14 : 12,
      paddingVertical: isSmallScreen ? 10 : 9,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginRight: isSmallScreen ? 0 : 6,
      minHeight: 44, // Minimum touch target
      justifyContent: "center",
      alignItems: "center",
      flex: isSmallScreen ? 1 : 0,
    },
    secondaryText: {
      color: colors.text,
      fontSize: isSmallScreen ? 13 : 14,
    },

    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: isSmallScreen ? 14 : 12,
      borderRadius: 10,
      alignItems: "center",
      minHeight: 48, // Good touch target
    },
    primaryText: {
      color: colors.surface,
      fontWeight: "700",
      fontSize: isSmallScreen ? 15 : 16,
    },

    modalBg: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: isSmallScreen ? "95%" : "92%",
      height: isSmallScreen ? "85%" : "78%",
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
      padding: isSmallScreen ? 12 : 10,
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
      fontSize: isSmallScreen ? 11 : 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: isSmallScreen ? 8 : 12,
    },
    backBtn: { padding: 6, marginRight: isSmallScreen ? 4 : 8 },
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
    const isUploadingThis = uploadingDoc === docName;

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
            {isUploadingThis
              ? "Uploading..."
              : isUploaded
                ? "Uploaded"
                : "Not uploaded"}
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

        <View
          style={{
            flexDirection: "row",
            gap: isSmallScreen ? 8 : 8,
            flexWrap: isSmallScreen ? "wrap" : "nowrap",
          }}
        >
          {!isSmallScreen && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() =>
                isUploaded ? setPreviewUri(docUrl) : pickImage(docName)
              }
              disabled={(!isEditable && !isUploaded) || isUploadingThis}
            >
              {isUploadingThis ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={isUploaded ? "eye" : "cloud-upload"}
                  size={20}
                  color={
                    isEditable || isUploaded
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              (!isEditable || isUploadingThis) && {
                backgroundColor: colors.border,
              },
            ]}
            onPress={() => pickImage(docName)}
            disabled={!isEditable || isUploadingThis}
          >
            {isUploadingThis ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                {isSmallScreen && (
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={isEditable ? colors.text : "#999"}
                  />
                )}
                <Text
                  style={[
                    styles.secondaryText,
                    !isEditable && { color: "#999" },
                  ]}
                >
                  {isUploaded ? "Replace" : "Upload"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              (!isEditable || isUploadingThis) && {
                backgroundColor: colors.border,
              },
            ]}
            onPress={() => openCamera(docName)}
            disabled={!isEditable || isUploadingThis}
          >
            {isUploadingThis ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                {isSmallScreen && (
                  <Ionicons
                    name="camera-outline"
                    size={18}
                    color={isEditable ? colors.text : "#999"}
                  />
                )}
                <Text
                  style={[
                    styles.secondaryText,
                    !isEditable && { color: "#999" },
                  ]}
                >
                  {isUploaded ? "Replace" : "Camera"}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {isSmallScreen && isUploaded && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setPreviewUri(docUrl)}
              disabled={!isUploaded}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="eye-outline" size={18} color={colors.text} />
                <Text style={styles.secondaryText}>View</Text>
              </View>
            </TouchableOpacity>
          )}
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
          {loadingVehicleTypes ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.dropdownRow}>
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeBtn,
                    vehicleType === type.name && styles.typeBtnActive,
                    documentStatus !== "INITIAL" &&
                      documentStatus !== "" && { opacity: 0.5 },
                  ]}
                  onPress={() =>
                    (documentStatus === "INITIAL" || documentStatus === "") &&
                    handleVehicleTypeChange(type.name)
                  }
                  disabled={
                    documentStatus !== "INITIAL" && documentStatus !== ""
                  }
                >
                  <Text
                    style={
                      vehicleType === type.name
                        ? styles.typeTextActive
                        : styles.typeText
                    }
                  >
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          {loadingRequiredDocs ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            Object.values(documentData).map((docData) => renderDocRow(docData))
          )}
        </View>

        <View style={{ padding: isSmallScreen ? 12 : 16 }}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (!isEditable ||
                uploadingDoc ||
                updating ||
                uploadingDocuments) && {
                opacity: 0.5,
              },
            ]}
            onPress={handleSubmitDocuments}
            disabled={
              !isEditable || !!uploadingDoc || updating || uploadingDocuments
            }
          >
            {uploadingDoc || updating || uploadingDocuments ? (
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
