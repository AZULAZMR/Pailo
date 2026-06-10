import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../utils/theme';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ title, subtitle, icon, color, onPress, style }: Props) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} style={[styles.card, style]}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {color && <View style={[styles.badge, { backgroundColor: color }]} />}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  badge: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});
