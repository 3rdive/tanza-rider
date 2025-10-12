import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import NotificationItem from "../../components/notification-item";
import { poppinsFonts } from "../../theme/fonts";
import { router } from "expo-router";

const todayData = [
  {
    id: "t1",
    title: "Payment confirm",
    body: "Lorem ipsum dolor sit amet consectetur. Ultrici es tincidunt eleifend vitae",
    time: "15 min ago",
    highlighted: true,
  },
  {
    id: "t2",
    title: "Payment confirm",
    body: "Lorem ipsum dolor sit amet consectetur. Ultrici es tincidunt eleifend vitae",
    time: "25 min ago",
  },
];

const yesterdayData = [
  {
    id: "y1",
    title: "Payment confirm",
    body: "Lorem ipsum dolor sit amet consectetur. Ultrici es tincidunt eleifend vitae",
    time: "15 min ago",
    highlighted: true,
  },
  {
    id: "y2",
    title: "Payment confirm",
    body: "Lorem ipsum dolor sit amet consectetur. Ultrici es tincidunt eleifend vitae",
    time: "25 min ago",
  },
  {
    id: "y3",
    title: "Payment confirm",
    body: "Lorem ipsum dolor sit amet consectetur. Ultrici es tincidunt eleifend vitae",
    time: "25 min ago",
  },
  {
    id: "y4",
    title: "Payment confirm",
    body: "Lorem ipsum dolor sit amet consectetur. Ultrici es tincidunt eleifend vitae",
    time: "15 min ago",
    highlighted: true,
  },
];

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const NotificationsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router?.back()}>
          <Text style={styles.back}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 48 }} />
      </View>

      <FlatList
        data={[{ key: "today" }]}
        keyExtractor={(i) => i.key}
        renderItem={() => (
          <View style={styles.content}>
            <SectionHeader title="Today" />
            {todayData.map((n) => (
              <NotificationItem
                key={n.id}
                title={n.title}
                body={n.body}
                time={n.time}
                highlighted={!!n.highlighted}
              />
            ))}

            <SectionHeader title="Yesterday" />
            {yesterdayData.map((n) => (
              <NotificationItem
                key={n.id}
                title={n.title}
                body={n.body}
                time={n.time}
                highlighted={!!n.highlighted}
              />
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF" },
  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomColor: "transparent",
  },
  back: {
    fontFamily: poppinsFonts.regular,
    fontSize: 16,
    color: "#222",
  },
  headerTitle: {
    fontFamily: poppinsFonts.semiBold,
    fontSize: 18,
    color: "#111",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontFamily: poppinsFonts.semiBold,
    fontSize: 16,
    color: "#111",
    marginBottom: 12,
  },
});

export default NotificationsScreen;
