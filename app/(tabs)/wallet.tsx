import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BalanceSummary } from "../../components/wallet/balance-summary";
import { AddMoneyButton } from "../../components/wallet/add-money";
import TransactionItem from "../../components/wallet/TransactionItem";
import WeekFilterModal from "../../components/wallet/WeekFilterModal";
import { useWalletData } from "../../hooks/useWalletData";
import { useTransactions } from "../../hooks/useTransactions";
import {
  WeekFilterOption,
  WEEK_FILTER_OPTIONS,
  WALLET_COLORS,
} from "../../lib/walletConstants";
import WalletBalanceCard from "@/components/fund_account/WalletBalanceCard";

const RiderWalletScreen: React.FC = () => {
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
      now.getDate(),
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

  // Render footer for loading more
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#00B624" />
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
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View>

        {/* Wallet Balance Summary */}
        {isLoadingWallet ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#00B624" />
            <Text style={styles.loadingText}>Loading wallet...</Text>
          </View>
        ) : walletError ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Failed to Load Wallet</Text>
            <Text style={styles.errorMessage}>{walletError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refetchWallet}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
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
          <Ionicons name="chevron-down" size={16} color="#00B624" />
        </TouchableOpacity>
      </View>
    </>
  );

  // Render empty component
  const renderEmptyComponent = () => {
    if (isLoadingTransactions) {
      return (
        <View style={styles.transactionsLoading}>
          <ActivityIndicator size="large" color="#00B624" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      );
    }

    if (transactionsError) {
      return (
        <View style={styles.transactionsError}>
          <Ionicons name="alert-circle" size={32} color="#ef4444" />
          <Text style={styles.errorMessage}>{transactionsError}</Text>
          <TouchableOpacity
            style={styles.retryButtonSmall}
            onPress={() => refresh()}
          >
            <Ionicons name="refresh" size={16} color="#00B624" />
            <Text style={styles.retryButtonTextSmall}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
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
            colors={[WALLET_COLORS.primary]}
            tintColor={WALLET_COLORS.primary}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  balanceCard: {
    backgroundColor: "#00B624",
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
    color: "#fff",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: "#fff",
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
    color: "#000",
  },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: "#00B624",
  },
  periodButtonText: {
    fontSize: 14,
    color: "#64748b",
  },
  periodButtonTextActive: {
    color: "#fff",
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
    color: "#00B624",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  transactionSection: {
    backgroundColor: "#fff",
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
    color: "#000",
  },
  viewAllText: {
    fontSize: 14,
    color: "#00B624",
    fontWeight: "600",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
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
    color: "#000",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: "#64748b",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  modalBody: {
    padding: 20,
  },
  availableBalance: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  enhancedInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#000",
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
    color: "#00B624",
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
    borderColor: "#e2e8f0",
    borderRadius: 8,
    marginBottom: 8,
  },
  methodItemSelected: {
    borderColor: "#00B624",
    backgroundColor: "#f0fdf4",
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
    backgroundColor: "#f8fafc",
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
    color: "#000",
    marginBottom: 2,
  },
  methodSubtext: {
    fontSize: 14,
    color: "#64748b",
  },
  removeButton: {
    padding: 8,
  },
  confirmButton: {
    backgroundColor: "#00B624",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  confirmButtonText: {
    color: "#fff",
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
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  methodTypeCardActive: {
    borderColor: "#00B624",
    backgroundColor: "#f0fdf4",
  },
  methodTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  methodTypeIconActive: {
    backgroundColor: "#00B624",
  },
  methodTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  methodTypeTitleActive: {
    color: "#00B624",
  },
  methodTypeSubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  methodTypeSubtitleActive: {
    color: "#00B624",
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
    color: "#000",
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
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
    color: "#000",
    marginBottom: 2,
  },
  previewSubtext: {
    fontSize: 14,
    color: "#64748b",
  },
  addMethodConfirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00B624",
    padding: 18,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 24,
    gap: 8,
  },
  addMethodConfirmButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  addMethodConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterButtonText: {
    color: "#00B624",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  weekModalContent: {
    backgroundColor: "#fff",
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
    borderColor: "#e6eef1",
    marginBottom: 12,
  },
  weekOptionSelected: {
    backgroundColor: "#00B624",
    borderColor: "#00B624",
  },
  weekOptionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  loadingCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  errorCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00B624",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
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
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#00B624",
  },
  retryButtonTextSmall: {
    color: "#00B624",
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
    color: "#94a3b8",
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
  },
  transactionSectionHeader: {
    backgroundColor: "#fff",
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

export default RiderWalletScreen;
