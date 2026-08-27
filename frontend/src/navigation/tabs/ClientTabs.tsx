import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, iconSizes, elevation } from '@theme';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '@screens/client/HomeScreen';
import MyAppointmentsScreen from '@screens/client/MyAppointmentsScreen';
import ProfileScreen from '@screens/client/ProfileScreen';
import NotificationsScreen from '@screens/client/NotificationsScreen';

const Tab = createBottomTabNavigator();

function TabBarIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Ionicons
        name={name}
        size={iconSizes.md}
        color={focused ? colors.gold : colors.textSecondary}
      />
    </View>
  );
}

export default function ClientTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const iconName = route.name === 'Home' ? 'home-outline' : route.name === 'MyAppointments' ? 'calendar-outline' : route.name === 'Notifications' ? 'notifications-outline' : 'person-outline';
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
          ...elevation.sm,
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
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarLabel: 'Notificações' }}
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
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconContainerFocused: {
    backgroundColor: colors.goldOverlay,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: colors.gold,
    fontWeight: '600',
  },
});
