import * as ExpoNetwork from 'expo-network';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type ExpoNetworkState = {
  ipAddress?: string | null;
  isAirplaneModeEnabled?: boolean | null;
  isNetworkAvailable?: boolean | null;
  isInternetReachable?: boolean | null;
  networkState?: ExpoNetwork.NetworkState | null;
  networkType?: ExpoNetwork.NetworkStateType | null;
  macAddress?: string | null;
  dnsServers?: string[] | null;
};

export default function ExpoNetworkScreen() {
  const [state, setState] = useState<ExpoNetworkState>({});

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [ipAddress, isAirplaneModeEnabled, networkState, macAddress, dnsServers] = await Promise.all([
          ExpoNetwork.getIpAddressAsync(),
          ExpoNetwork.isAirplaneModeEnabledAsync(),
          ExpoNetwork.getNetworkStateAsync(),
          // Note: getMacAddressAsync may be limited on iOS and recent Android
          ExpoNetwork.getMacAddressAsync?.(AsyncMacAddressIdentifier) ?? Promise.resolve(null),
          ExpoNetwork.getDnsServersAsync?.() ?? Promise.resolve(null),
        ]);

        if (!isMounted) return;
        setState({
          ipAddress,
          isAirplaneModeEnabled,
          isNetworkAvailable: networkState?.isConnected ?? null,
          isInternetReachable: networkState?.isInternetReachable ?? null,
          networkState,
          networkType: networkState?.type ?? null,
          macAddress: (macAddress as string) ?? null,
          dnsServers: (dnsServers as string[]) ?? null,
        });
      } catch (e) {
        if (!isMounted) return;
        setState({});
      }
    };
    load();
    const sub = ExpoNetwork.addNetworkStateListener?.((s) => {
      console.log('expo-network -->', s);
      setState((prev) => ({
        ...prev,
        isNetworkAvailable: s.isConnected,
        isInternetReachable: s.isInternetReachable ?? null,
        networkState: s,
        networkType: s.type,
      }));
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
        <InfoRow label="macAddress" value={String(state.macAddress ?? '—')} />
        <InfoRow label="dnsServers" value={state.dnsServers?.join(', ') ?? '—'} />
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


