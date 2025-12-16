import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export const HomeStats: React.FC<{ completed: number; total: number; contacts: number }> = ({ completed, total, contacts }) => {
  const cardBackgroundColor = useThemeColor({}, 'cardBackgroundColor');
  const borderColor = useThemeColor({ light: '#ddd', dark: '#404040' }, 'cardBorderColor');

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.statCard, { backgroundColor: cardBackgroundColor, borderColor }]}> 
        <ThemedText type="defaultSemiBold" style={styles.statNumber}>{completed}</ThemedText>
        <ThemedText style={styles.statLabel}>Completed Trips</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.statCard, { backgroundColor: cardBackgroundColor, borderColor }]}> 
        <ThemedText type="defaultSemiBold" style={styles.statNumber}>{total}</ThemedText>
        <ThemedText style={styles.statLabel}>Total Trips</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.statCard, { backgroundColor: cardBackgroundColor, borderColor }]}> 
        <ThemedText type="defaultSemiBold" style={styles.statNumber}>{contacts}</ThemedText>
        <ThemedText style={styles.statLabel}>Emergency Contacts</ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 8,
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 70,
  },
  statNumber: {
    fontSize: 22,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default HomeStats;
