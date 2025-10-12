import { locationService, ILocationFeature } from "@/lib/api";
import { setSelectedLocation } from "@/redux/slices/locationSearchSlice";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppDispatch } from "@/redux/hooks/hooks";

export default function LocationSearchScreen() {
  const { context } = useLocalSearchParams<{ context?: string }>();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    {
      id: string;
      title: string;
      subtitle: string;
      lat?: number;
      lon?: number;
    }[]
  >([]);
  const debounceRef = useRef<any>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await locationService.search(q.trim());
      const features = (res?.data || []) as ILocationFeature[];
      const mapped = features.map((f) => {
        const p = f.properties || ({} as any);
        const g = f.geometry || ({} as any);
        const parts: string[] = [];
        if (p.street) parts.push(p.street);
        if (p.city) parts.push(p.city);
        if (p.state) parts.push(p.state);
        if (p.country) parts.push(p.country);
        if (p.postcode) parts.push(p.postcode);
        const subtitle = parts.filter(Boolean).join(", ");
        const title = p.name || subtitle || `${p.type || "Location"}`;
        return {
          id: `${p.osm_type || ""}_${
            p.osm_id || Math.random().toString(36).slice(2)
          }`,
          title,
          subtitle,
          lon: g?.coordinates?.[0],
          lat: g?.coordinates?.[1],
        };
      });
      setResults(mapped);
    } catch (_e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (item: {
    title: string;
    subtitle: string;
    lat?: number;
    lon?: number;
  }) => {
    dispatch(
      setSelectedLocation({
        title: item.title || item.subtitle,
        subtitle: item.subtitle,
        lat: item.lat,
        lon: item.lon,
        context: String(context || ""),
      })
    );
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search location</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Type an address, area or place"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoFocus
        />
      </View>

      <View style={styles.results}>
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Searching…</Text>
          </View>
        )}
        {!loading && results.length === 0 && query.trim().length < 2 && (
          <Text style={styles.helper}>
            Start typing to search for a location
          </Text>
        )}
        {!loading && results.length === 0 && query.trim().length >= 2 && (
          <Text style={styles.helper}>No results. Try a different query.</Text>
        )}

        {!loading &&
          results.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.item}
              onPress={() => handleSelect(r)}
            >
              <Text style={styles.itemTitle}>{r.title}</Text>
              {!!r.subtitle && (
                <Text style={styles.itemSubtitle}>{r.subtitle}</Text>
              )}
            </TouchableOpacity>
          ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  cancelText: { color: "#00B624", fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
  searchBar: { padding: 16 },
  searchInput: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  results: { flex: 1, paddingHorizontal: 8 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  loadingText: { color: "#666" },
  helper: { padding: 16, color: "#666" },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#000" },
  itemSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
});
