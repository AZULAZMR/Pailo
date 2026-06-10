import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../utils/theme';

interface Props {
  title: string;
  value: number;
  max?: number;
  color?: string;
  label?: string;
}

export function ProgressBar({ title, value, max = 10, color = theme.colors.primary, label }: Props) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{value}/{max}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  label: { fontSize: 12, color: theme.colors.textSecondary },
  track: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  value: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2, textAlign: 'right' },
});
