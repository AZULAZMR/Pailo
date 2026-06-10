import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CycleScreen } from '../screens/CycleScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { FoodScreen } from '../screens/FoodScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { SupplementScreen } from '../screens/SupplementScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { AIScreen } from '../screens/AIScreen';
import { theme } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, any> = {
    Dashboard: { focused: 'home', unfocused: 'home-outline' },
    Cycle: { focused: 'water', unfocused: 'water-outline' },
    Goals: { focused: 'flag', unfocused: 'flag-outline' },
    Tasks: { focused: 'checkmark-circle', unfocused: 'checkmark-circle-outline' },
    Dagboek: { focused: 'book', unfocused: 'book-outline' },
    Profiel: { focused: 'person', unfocused: 'person-outline' },
  };
  const icon = icons[label];
  const name = focused ? icon.focused : icon.unfocused;
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Ionicons name={name} size={focused ? 24 : 22} color={focused ? '#fff' : '#9E9E9E'} />
    </View>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: theme.colors.background, shadowColor: 'transparent', elevation: 0 },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { fontWeight: '600', color: theme.colors.primary },
      headerBackTitle: 'Terug',
    }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profiel' }} />
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Inzichten' }} />
      <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Cycle Kalender' }} />
      <Stack.Screen name="Food" component={FoodScreen} options={{ title: 'Voedingsdagboek' }} />
      <Stack.Screen name="Workout" component={WorkoutScreen} options={{ title: 'Workouts' }} />
      <Stack.Screen name="Supplements" component={SupplementScreen} options={{ title: 'Supplementen' }} />
      <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Export' }} />
      <Stack.Screen name="AIAgent" component={AIScreen} options={{ title: 'AI Coach' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: Platform.OS === 'ios' ? 50 + insets.bottom : 56,
          ...theme.shadow.sm,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Cycle" component={CycleScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Dagboek" component={JournalScreen} />
      <Tab.Screen name="Profiel" component={MoreStack} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { token, loading, onboardingDone } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          onboardingDone ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 16 },
  iconWrapActive: { backgroundColor: theme.colors.primary, width: 32, height: 32, borderRadius: 16 },
});
