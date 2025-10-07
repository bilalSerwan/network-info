import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NetworkScreen() {
  const [netInfo, setNetInfo] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(
      (netInfoState)=>{
       console.log('netInfoState', netInfoState);
      setNetInfo(netInfoState);
    }
  );

    // Fetch initial state immediately
    NetInfo.fetch().then(setNetInfo).catch(() => {
      // ignore
    });

    return () => unsubscribe();
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#CFE8FF', dark: '#122233' }}
      headerImage={<View />}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Network Info</ThemedText>
        <ThemedText style={styles.subtitle}>Live connection state from NetInfo</ThemedText>
      </ThemedView>
      <ScrollView contentContainerStyle={styles.content}>
        <InfoRow label="isConnected" value={String(netInfo?.isConnected ?? 'unknown')} />
        <InfoRow label="isInternetReachable" value={String(netInfo?.isInternetReachable ?? 'unknown')} />
        <InfoRow label="type" value={netInfo?.type ?? 'unknown'} />
        <InfoRow label="details.ipAddress" value={(netInfo?.details as any)?.ipAddress ?? '—'} />
        <InfoRow label="details.isConnectionExpensive" value={String((netInfo?.details as any)?.isConnectionExpensive ?? '—')} />
        <InfoRow label="details.cellularGeneration" value={(netInfo?.details as any)?.cellularGeneration ?? '—'} />
        <InfoRow label="details.ssid" value={(netInfo?.details as any)?.ssid ?? '—'} />
        <InfoRow label="details.bssid" value={(netInfo?.details as any)?.bssid ?? '—'} />
        <InfoRow label="details.strength" value={String((netInfo?.details as any)?.strength ?? '—')} />
        <InfoRow label="details.frequency" value={String((netInfo?.details as any)?.frequency ?? '—')} />
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
  value: {
  },
});


