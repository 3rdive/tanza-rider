import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type User = {
  name: string;
  avatar?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit?: (payload: { rating: number; comments: string[] }) => void;
  onCancel?: () => void;
};

const POSITIVE = [
  "Polite",
  "On time",
  "Good communication",
  "Package intact",
  "Friendly",
  "Fast",
];

const NEGATIVE = [
  "Rude",
  "Late",
  "No communication",
  "Damaged package",
  "Unhelpful",
];

export default function ReviewBottomSheet({
  visible,
  onClose,
  user,
  onSubmit,
  onCancel,
}: Props) {
  const [rating, setRating] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) {
      setRating(0);
      setSelected([]);
    }
  }, [visible]);

  const toggleComment = (c: string) => {
    setSelected((prev) =>
      prev.includes(c) ? prev.filter((p) => p !== c) : [...prev, c]
    );
  };

  const submit = () => {
    onSubmit && onSubmit({ rating, comments: selected });
  };

  const isSubmitDisabled = rating === 0 || selected.length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerRow}>
              <Image
                source={{
                  uri:
                    user?.avatar ||
                    "https://randomuser.me/api/portraits/lego/1.jpg",
                }}
                style={styles.avatar}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.title}>{user?.name || "Unknown"}</Text>
                <Text style={styles.subtitle}>Rate your experience</Text>
              </View>
            </View>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={i <= rating ? "star" : "star-outline"}
                    size={34}
                    color="#FFD64D"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Suggested comments</Text>
            <View style={styles.chipsRow}>
              {POSITIVE.map((s) => {
                const active = selected.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleComment(s)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
              Problems / Issues
            </Text>
            <View style={styles.chipsRow}>
              {NEGATIVE.map((s) => {
                const active = selected.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, active && styles.chipNegative]}
                    onPress={() => toggleComment(s)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextNegative,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitDisabled && styles.submitBtnDisabled,
              ]}
              onPress={submit}
              activeOpacity={0.8}
              disabled={isSubmitDisabled}
            >
              <Text
                style={[
                  styles.submitText,
                  isSubmitDisabled && styles.submitTextDisabled,
                ]}
              >
                Submit review
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onCancel ? onCancel : onClose}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 12,
    maxHeight: "76%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  content: { paddingHorizontal: 18, paddingBottom: 30 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  title: { fontSize: 16, fontWeight: "700", color: "#222" },
  subtitle: { fontSize: 12, color: "#666" },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
  },
  starBtn: { paddingHorizontal: 6 },
  sectionLabel: {
    fontSize: 13,
    color: "#444",
    marginBottom: 8,
    fontWeight: "600",
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: { backgroundColor: "#E6F7F0" },
  chipText: { color: "#333", fontSize: 13 },
  chipTextActive: { color: "#007B55", fontWeight: "600" },
  chipNegative: { backgroundColor: "#fdecea" },
  chipTextNegative: { color: "#b00020", fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#00AA66",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  submitBtnDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  submitText: { color: "#fff", fontWeight: "700" },
  submitTextDisabled: {
    color: "#999",
  },
  closeBtn: { alignItems: "center", marginTop: 10 },
  closeText: { color: "#666" },
});
