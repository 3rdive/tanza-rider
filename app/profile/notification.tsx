import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NotificationItem from "../../components/notification-item";
import { poppinsFonts } from "../../theme/fonts";
import { router } from "expo-router";
import { INotificationItem } from "../../lib/api";
import { useNotifications } from "../../hooks/useNotifications";
import { safeNavigate } from "../../lib/navigation";

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return date.toLocaleString();
}

const NotificationsScreen: React.FC = () => {
  const {
    items,
    loading,
    error,
    loadingMore,
    refreshing,
    onEndReached,
    onRefresh,
  } = useNotifications();

  const renderItem = useCallback(
    ({ item }: { item: INotificationItem }) => (
      <NotificationItem
        title={item.title}
        body={item.text}
        time={formatTimeAgo(item.created_at)}
        highlighted={!item.hasSeen}
        onPress={() => {
          if (item.redirect_to) {
            safeNavigate(item.redirect_to);
          }
        }}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: INotificationItem) => item.id, []);

  const listEmpty = useMemo(() => {
    if (loading) return null;
    if (error)
      return (
        <View style={styles.stateWrap}>
          <Text style={styles.stateTitle}>Failed to load</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateTitle}>No notifications yet</Text>
        <Text style={styles.stateText}>
          We&#39;ll let you know when something arrives.
        </Text>
      </View>
    );
  }, [loading, error, onRefresh]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router?.back()}>
          <Text style={styles.back}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading && items.length === 0 ? (
        <View style={[styles.content, styles.loadingWrap]}>
          <ActivityIndicator size="small" color="#0B4A34" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={styles.content}
          onEndReachedThreshold={0.3}
          onEndReached={onEndReached}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#0B4A34" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  stateTitle: {
    fontFamily: poppinsFonts.semiBold,
    fontSize: 16,
    color: "#111",
    marginBottom: 6,
  },
  stateText: {
    fontFamily: poppinsFonts.regular,
    fontSize: 13,
    color: "#6B6B6B",
    marginBottom: 12,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#0B4A34",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: "#fff",
    fontFamily: poppinsFonts.semiBold,
  },
});

export default NotificationsScreen;
