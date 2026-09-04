import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { useT } from "@/lib/i18n/locale-context";
import { useOnlineStatus } from "@/lib/sync/online";
import { useSyncState } from "@/lib/sync/sync-service";

const BACK_ONLINE_MS = 2500;

export function OfflineBanner() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const online = useOnlineStatus();
  const { pending, syncing, flush } = useSyncState();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowBackOnline(false);
      return;
    }
    if (!wasOffline) return;
    setShowBackOnline(true);
    const id = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS);
    return () => clearTimeout(id);
  }, [online, wasOffline]);

  if (online && !showBackOnline) return null;

  const message = online
    ? pending > 0
      ? t.pwa.backOnlineSyncing(pending)
      : t.pwa.backOnline
    : `${t.pwa.offlineTitle} ${pending > 0 ? t.pwa.pendingChanges(pending) : t.pwa.offlineNoPending}`;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: insets.top, backgroundColor: online ? "#22c55e" : "#f59e0b" }]}>
      <View style={styles.row}>
        <Text style={styles.text}>{message}</Text>
        {!online && pending > 0 ? (
          <Pressable onPress={() => void flush()} disabled={syncing} hitSlop={8}>
            <Text style={styles.action}>{syncing ? t.pwa.syncing : t.pwa.syncNow}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs + 2,
  },
  text: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  action: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
