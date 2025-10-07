import * as ExpoNetwork from 'expo-network';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';

type ExpoNetworkState = {
  ipAddress?: string | null;
  isAirplaneModeEnabled?: boolean | null;
  isNetworkAvailable?: boolean | null;
  isInternetReachable?: boolean | null;
  networkState?: ExpoNetwork.NetworkState | null;
  networkType?: ExpoNetwork.NetworkStateType | null;
};

type ExpoChangeEntry = {
  id: string;
  time: string;
  summary: string;
  state: ExpoNetwork.NetworkState;
  signature: string;
};

export default function ExpoNetworkScreen() {
  const [state, setState] = useState<ExpoNetworkState>({});
  const [changes, setChanges] = useState<ExpoChangeEntry[]>([]);
  const lastSignatureRef = useRef<string | null>(null);
  const seenSignaturesRef = useRef<Set<string>>(new Set());


  const makeSignature = (s: ExpoNetwork.NetworkState) => {
    const minimal = {
      type: s.type,
      isConnected: s.isConnected,
      isInternetReachable: s.isInternetReachable,
    };
    return JSON.stringify(minimal);
  };

  const recordChange = (s: ExpoNetwork.NetworkState) => {
    const signature = makeSignature(s);
    if (signature === lastSignatureRef.current) return;
    if (seenSignaturesRef.current.has(signature)) return;
    lastSignatureRef.current = signature;
    seenSignaturesRef.current.add(signature);
    const entry: ExpoChangeEntry = {
      id: `${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      summary: `type=${s.type}`,
      state: s,
      signature,
    };
    setChanges((prev) => [...prev, entry]);
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [ipAddress, isAirplaneModeEnabled, networkState] = await Promise.all([
          ExpoNetwork.getIpAddressAsync(),
          ExpoNetwork.isAirplaneModeEnabledAsync(),
          ExpoNetwork.getNetworkStateAsync()
        
        ]);

        if (!isMounted) return;
        setState({
          ipAddress,
          isAirplaneModeEnabled,
          isNetworkAvailable: networkState?.isConnected ?? null,
          isInternetReachable: networkState?.isInternetReachable ?? null,
          networkState,
          networkType: networkState?.type ?? null
        });
        if (networkState) {
          recordChange(networkState);
        }
      } catch (e) {
        if (!isMounted) return;
        setState({});
      }
    };
    load();
    const sub = ExpoNetwork.addNetworkStateListener?.((s) => {
      setState((prev) => ({
        ...prev,
        isNetworkAvailable: s.isConnected,
        isInternetReachable: s.isInternetReachable ?? null,
        networkState: s,
        networkType: s.type,
      }));
      recordChange(s);
    });
    return () => {
      isMounted = false;
      sub?.remove?.();
    };
  }, []);

  return (
    <ParallaxScrollView headerBackgroundColor={{ light: '#E6F7FF', dark: '#0F1C26' }} headerImage={<View />}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Expo Network</ThemedText>
        <ThemedText style={styles.subtitle}>Snapshot and listener-based network info</ThemedText>
      </ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <InfoRow label="isNetworkAvailable" value={String(state.isNetworkAvailable ?? 'unknown')} />
        <InfoRow label="isInternetReachable" value={String(state.isInternetReachable ?? 'unknown')} />
        <InfoRow label="type" value={String(state.networkType ?? 'unknown')} />
        <InfoRow label="ipAddress" value={String(state.ipAddress ?? '—')} />
        <InfoRow label="isAirplaneModeEnabled" value={String(state.isAirplaneModeEnabled ?? '—')} />
        <ThemedView style={styles.logHeader}>
          <ThemedText type="subtitle">Change log</ThemedText>
        </ThemedView>
        {changes.length === 0 ? (
          <ThemedText>No changes yet.</ThemedText>
        ) : (
          [...changes].reverse().map((entry) => (
            <Collapsible key={entry.id} title={`${entry.time} — ${entry.summary}`}>
              <ThemedText selectable>{JSON.stringify(entry.state, null, 2)}</ThemedText>
            </Collapsible>
          ))
        )}
      </ScrollView>
    </ParallaxScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
    </ThemedView>
  );
}

const AsyncMacAddressIdentifier = '02:00:00:00:00:00';

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  content: {
    gap: 10,
    paddingVertical: 8,
  },
  logHeader: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: {
    fontWeight: '600',
  },
  value: {},
});


