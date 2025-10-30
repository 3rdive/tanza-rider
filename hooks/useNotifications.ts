import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INotificationItem, INotificationListResponse, notificationService } from "../lib/api";

const PAGE_SIZE = 12;

export function useNotifications() {
  const [items, setItems] = useState<INotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const unseenQueueRef = useRef<Set<string>>(new Set());
  const markingRef = useRef(false);

  const fetchPage = useCallback(
    async (pageToLoad: number, opts?: { replace?: boolean }) => {
      try {
        if (pageToLoad === 1 && !opts?.replace) setLoading(true);
        setError(null);
        const res: INotificationListResponse = await notificationService.list({
          page: pageToLoad,
          limit: PAGE_SIZE,
        });
        const list = res.data || [];
        setTotalPages(res.pagination?.totalPages || 1);
        setPage(res.pagination?.page || pageToLoad);

        setItems((prev) => {
          const merged = opts?.replace || pageToLoad === 1 ? list : [...prev, ...list];
          // queue unseen ids for marking
          merged.forEach((n) => {
            if (!n.hasSeen) unseenQueueRef.current.add(n.id);
          });
          return merged;
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Mark queued unseen notifications as seen (batched)
  const flushMarkAsSeen = useCallback(async () => {
    if (markingRef.current) return;
    const ids = Array.from(unseenQueueRef.current);
    if (ids.length === 0) return;
    markingRef.current = true;
    try {
      await notificationService.markAsSeen({ notificationIds: ids });
      // On success, clear queue and update local hasSeen state
      unseenQueueRef.current.clear();
      setItems((prev) => prev.map((n) => ({ ...n, hasSeen: true })));
    } catch (e) {
      // swallow; will retry on next flush when more items load/refresh
    } finally {
      markingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // slight delay to allow batching
    const t = setTimeout(() => {
      flushMarkAsSeen();
    }, 800);
    return () => clearTimeout(t);
  }, [items, flushMarkAsSeen]);

  const hasMore = page < totalPages;

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || refreshing) return;
    if (!hasMore) return;
    setLoadingMore(true);
    fetchPage(page + 1);
  }, [loading, loadingMore, refreshing, hasMore, page, fetchPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPage(1, { replace: true });
  }, [fetchPage]);

  return {
    items,
    page,
    totalPages,
    hasMore,
    loading,
    error,
    loadingMore,
    refreshing,
    fetchPage,
    onEndReached,
    onRefresh,
  } as const;
}

export default useNotifications;
