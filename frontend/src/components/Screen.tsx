import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
}

export function Screen({ children, scroll = true, refreshing, onRefresh, style }: Props) {
  if (!scroll) {
    return (
      <SafeAreaView style={[styles.container, style]} edges={['top']}>
        <View style={styles.inner}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, style]}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: { flex: 1, padding: theme.spacing.md },
  scrollView: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: 32 },
});
