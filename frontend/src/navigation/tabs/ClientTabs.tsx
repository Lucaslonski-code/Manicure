import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, iconSizes } from '@theme';
import HomeScreen from '@screens/client/HomeScreen';
import MyAppointmentsScreen from '@screens/client/MyAppointmentsScreen';
import ProfileScreen from '@screens/client/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {name}
    </Text>
  );
}

export default function ClientTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const iconName = route.name === 'Home' ? '🏠' : route.name === 'MyAppointments' ? '📅' : '👤';
          return <TabBarIcon name={iconName} focused={focused} />;
        },
        tabBarLabel: ({ focused, children }) => (
          <Text style={[styles.label, focused && styles.labelFocused]}>
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          height: 56 + Math.max(insets.bottom, spacing.sm),
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: spacing.xs,
        },
        tabBarLabelPosition: 'below-icon',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      <Tab.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{ tabBarLabel: 'Agenda' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: iconSizes.md,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  iconFocused: {
    color: colors.primary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  labelFocused: {
    color: colors.primary,
    fontWeight: '600',
  },
});
