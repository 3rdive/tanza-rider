import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import TransactionItem from "../../components/wallet/TransactionItem";
import WeekFilterModal from "../../components/wallet/WeekFilterModal";
import { useWalletData } from "../../hooks/useWalletData";
import { useTransactions } from "../../hooks/useTransactions";
import {
  WeekFilterOption,
  WEEK_FILTER_OPTIONS,
} from "../../lib/walletConstants";
import WalletBalanceCard from "@/components/fund_account/WalletBalanceCard";
import { useTheme } from "../../context/ThemeContext";

const RiderWalletScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    walletData,
    isLoading: isLoadingWallet,
    error: walletError,
    refetch: refetchWallet,
  } = useWalletData();
  const {
    transactions,
    isLoading: isLoadingTransactions,
    isLoadingMore,
    isRefreshing,
    error: transactionsError,
    loadMore,
    refresh,
  } = useTransactions();

  const [selectedWeekOption, setSelectedWeekOption] =
    useState<WeekFilterOption>(WEEK_FILTER_OPTIONS.this_week);
  const [showWeekFilterModal, setShowWeekFilterModal] =
    useState<boolean>(false);

  // Build filtered transactions based on selectedWeekOption
  const filteredTransactions = useMemo(() => {
    if (!transactions || selectedWeekOption === WEEK_FILTER_OPTIONS.all)
      return transactions;

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // helper to get days ago
    const daysAgo = (n: number) => {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - n);
      return d;
    };

    let fromDate: Date;
    switch (selectedWeekOption) {
      case WEEK_FILTER_OPTIONS.this_week:
        // start from most recent monday
        const day = todayStart.getDay();
        const diff = (day + 6) % 7; // monday=0
        fromDate = daysAgo(diff);
        break;
      case WEEK_FILTER_OPTIONS.last_week:
        // start from monday last week
        const day2 = todayStart.getDay();
        const diff2 = (day2 + 6) % 7; // days since monday
        fromDate = daysAgo(diff2 + 7);
        break;
      case WEEK_FILTER_OPTIONS.last_2_weeks:
        const day3 = todayStart.getDay();
        const diff3 = (day3 + 6) % 7;
        fromDate = daysAgo(diff3 + 14);
        break;
      case WEEK_FILTER_OPTIONS.last_4_weeks:
        const day4 = todayStart.getDay();
        const diff4 = (day4 + 6) % 7;
        fromDate = daysAgo(diff4 + 28);
        break;
      default:
        return transactions;
    }

    // filter by date >= fromDate
    return transactions.filter((t) => {
      const td = new Date(t.date);
      return td >= fromDate && td <= now;
    });
  }, [transactions, selectedWeekOption]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    balanceCard: {
      backgroundColor: colors.success,
      margin: 20,
      padding: 24,
      borderRadius: 16,
      alignItems: "center",
    },
    balanceLabel: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      marginBottom: 8,
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: "bold",
      color: colors.background,
      marginBottom: 20,
    },
    balanceActions: {
      flexDirection: "row",
    },
    withdrawButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    withdrawButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "600",
    },
    summaryCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 20,
      borderRadius: 12,
    },
    summaryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    periodToggle: {
      flexDirection: "row",
      backgroundColor: colors.border,
      borderRadius: 8,
      padding: 2,
    },
    periodButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
    },
    periodButtonActive: {
      backgroundColor: colors.success,
    },
    periodButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    periodButtonTextActive: {
      color: colors.background,
      fontWeight: "600",
    },
    summaryStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.success,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    transactionSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 12,
      padding: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    viewAllText: {
      fontSize: 14,
      color: colors.success,
      fontWeight: "600",
    },
    transactionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 4,
    },
    transactionDate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    transactionRight: {
      alignItems: "flex-end",
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "500",
      textTransform: "capitalize",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 40,
    },
    addMethodModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    addMethodModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      minHeight: "80%",
      maxHeight: "90%",
      paddingBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    addMethodModalBody: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    modalBody: {
      padding: 20,
    },
    availableBalance: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    amountInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    enhancedInput: {
      flex: 1,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
    },
    methodHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    addMethodButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    addMethodText: {
      fontSize: 14,
      color: colors.success,
      fontWeight: "600",
    },
    methodsList: {
      maxHeight: 200,
    },
    methodItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginBottom: 8,
    },
    methodItemSelected: {
      borderColor: colors.success,
      backgroundColor: colors.surface,
    },
    methodInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    methodIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    methodDetails: {
      flex: 1,
    },
    methodName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    methodSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    removeButton: {
      padding: 8,
    },
    confirmButton: {
      backgroundColor: colors.success,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 20,
    },
    confirmButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "600",
    },
    methodTypeSection: {
      padding: 20,
      paddingBottom: 0,
    },
    methodTypeGrid: {
      flexDirection: "row",
      gap: 12,
    },
    methodTypeCard: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
    },
    methodTypeCardActive: {
      borderColor: colors.success,
      backgroundColor: colors.surface,
    },
    methodTypeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    methodTypeIconActive: {
      backgroundColor: colors.success,
    },
    methodTypeTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    methodTypeTitleActive: {
      color: colors.success,
    },
    methodTypeSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
    },
    methodTypeSubtitleActive: {
      color: colors.success,
    },
    formSection: {
      padding: 20,
    },
    previewSection: {
      marginTop: 20,
    },
    previewTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    previewCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    previewDetails: {
      flex: 1,
    },
    previewName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    previewSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    addMethodConfirmButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success,
      padding: 18,
      borderRadius: 12,
      marginHorizontal: 20,
      marginTop: 24,
      gap: 8,
    },
    addMethodConfirmButtonDisabled: {
      backgroundColor: colors.border,
    },
    addMethodConfirmButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "600",
    },
    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    filterButtonText: {
      color: colors.success,
      fontSize: 14,
      fontWeight: "600",
      marginRight: 4,
    },
    weekModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 20,
      maxHeight: "50%",
    },
    weekOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    weekOptionSelected: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    weekOptionText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "600",
    },
    loadingCard: {
      backgroundColor: colors.surface,
      margin: 20,
      padding: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorCard: {
      backgroundColor: colors.surface,
      margin: 20,
      padding: 32,
      borderRadius: 16,
      alignItems: "center",
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.success,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    retryButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "600",
    },
    transactionsLoading: {
      paddingVertical: 40,
      alignItems: "center",
    },
    transactionsError: {
      paddingVertical: 32,
      alignItems: "center",
    },
    retryButtonSmall: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      gap: 6,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.success,
    },
    retryButtonTextSmall: {
      color: colors.success,
      fontSize: 14,
      fontWeight: "600",
    },
    emptyState: {
      paddingVertical: 48,
      alignItems: "center",
    },
    emptyStateText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    footerLoading: {
      paddingVertical: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    footerLoadingText: {
      marginTop: 8,
      fontSize: 14,
      color: colors.textSecondary,
    },
    transactionSectionHeader: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 0,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    flatListContent: {
      flexGrow: 1,
    },
  });

  // Render footer for loading more
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={colors.success} />
        <Text style={styles.footerLoadingText}>Loading more...</Text>
      </View>
    );
  };

  // Render list header
  const renderListHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => router.push("/profile/notification")}>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <View>
        {/* Wallet Balance Summary */}
        {isLoadingWallet ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.success} />
            <Text style={styles.loadingText}>Loading wallet...</Text>
          </View>
        ) : walletError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Failed to Load Wallet</Text>
            <Text style={styles.errorMessage}>{walletError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refetchWallet}
            >
              <Ionicons name="refresh" size={20} color={colors.background} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            <WalletBalanceCard balance={walletData?.walletBalance || 0} />
          </View>
        )}
      </View>

      {/* Transaction Section Header */}
      <View style={styles.transactionSectionHeader}>
        <Text style={styles.sectionTitle}>Break Down</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowWeekFilterModal(true)}
        >
          <Text style={styles.filterButtonText}>
            {selectedWeekOption === WEEK_FILTER_OPTIONS.this_week
              ? "This Week"
              : selectedWeekOption === WEEK_FILTER_OPTIONS.last_week
              ? "Last Week"
              : selectedWeekOption === WEEK_FILTER_OPTIONS.last_2_weeks
              ? "Last 2 Weeks"
              : selectedWeekOption === WEEK_FILTER_OPTIONS.last_4_weeks
              ? "Last 4 Weeks"
              : "All"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.success} />
        </TouchableOpacity>
      </View>
    </>
  );

  // Render empty component
  const renderEmptyComponent = () => {
    if (isLoadingTransactions) {
      return (
        <View style={styles.transactionsLoading}>
          <ActivityIndicator size="large" color={colors.success} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      );
    }

    if (transactionsError) {
      return (
        <View style={styles.transactionsError}>
          <Ionicons name="alert-circle" size={32} color={colors.error} />
          <Text style={styles.errorMessage}>{transactionsError}</Text>
          <TouchableOpacity
            style={styles.retryButtonSmall}
            onPress={() => refresh()}
          >
            <Ionicons name="refresh" size={16} color={colors.success} />
            <Text style={styles.retryButtonTextSmall}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="document-text-outline"
          size={48}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyStateText}>No transactions found</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredTransactions}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[colors.success]}
            tintColor={colors.success}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
      <WeekFilterModal
        visible={showWeekFilterModal}
        selectedOption={selectedWeekOption}
        onSelectOption={setSelectedWeekOption}
        onClose={() => setShowWeekFilterModal(false)}
      />
    </SafeAreaView>
  );
};

export default RiderWalletScreen;
