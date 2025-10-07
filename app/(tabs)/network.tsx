import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';

type NetInfoChangeEntry = {
  id: string;
  time: string;
  type: string;
  state: NetInfoState;
  signature: string;
};

export default function NetworkScreen() {
  const [netInfo, setNetInfo] = useState<NetInfoState | null>(null);
  const [changes, setChanges] = useState<NetInfoChangeEntry[]>([]);
  const lastSignatureRef = useRef<string | null>(null);
  const seenSignaturesRef = useRef<Set<string>>(new Set());

  const makeSignature = (s: NetInfoState) => {
    const minimal = {
      type: s.type,
      isConnected: s.isConnected,
      isInternetReachable: s.isInternetReachable,
      details: {
        ipAddress: (s.details as any)?.ipAddress,
        cellularGeneration: (s.details as any)?.cellularGeneration,
        isConnectionExpensive: (s.details as any)?.isConnectionExpensive,
        ssid: (s.details as any)?.ssid,
        bssid: (s.details as any)?.bssid,
        strength: (s.details as any)?.strength,
        frequency: (s.details as any)?.frequency,
      },
    };
    return JSON.stringify(minimal);
  };

  const recordChange = (s: NetInfoState) => {
    const signature = makeSignature(s);
    // Skip if identical to the immediately previous event
    if (signature === lastSignatureRef.current) return;
    // Skip if we've already logged this exact state earlier in this session
    if (seenSignaturesRef.current.has(signature)) return;
    lastSignatureRef.current = signature;
    seenSignaturesRef.current.add(signature);
    const entry: NetInfoChangeEntry = {
      id: `${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      type: s.type,
      state: s,
      signature,
    };
    setChanges((prev) => [...prev, entry]);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netInfoState) => {
      console.log('netInfoState -->', netInfoState);
      setNetInfo(netInfoState);
      recordChange(netInfoState);
    });

    NetInfo.fetch()
      .then((s) => {
        setNetInfo(s);
        recordChange(s);
      })
      .catch(() => {
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

        <ThemedView style={styles.logHeader}>
          <ThemedText type="subtitle">Change log</ThemedText>
        </ThemedView>
        {changes.length === 0 ? (
          <ThemedText>No changes yet.</ThemedText>
        ) : (
          [...changes].reverse().map((entry) => (
            <Collapsible key={entry.id} title={`${entry.time} — ${entry.type}`}>
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
  value: {
  },
});


