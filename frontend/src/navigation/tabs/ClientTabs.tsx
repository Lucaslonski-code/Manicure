import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { colors, elevation } from '@theme';
import AppIcon from '@components/icons/AppIcon';
import HomeScreen from '@screens/client/HomeScreen';
import MyAppointmentsScreen from '@screens/client/MyAppointmentsScreen';
import ProfileScreen from '@screens/client/ProfileScreen';
import NotificationsScreen from '@screens/client/NotificationsScreen';
import ProfessionalPanelScreen from '@screens/professional/ProfessionalPanelScreen';
import { useAuthContext } from '@hooks/AuthContext';

const Tab = createBottomTabNavigator();

type IconName = 'home' | 'calendar' | 'bell' | 'user' | 'scissors';

function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <AppIcon name={name} size={20} color={focused ? 'gold' : 'secondary'} />
    </View>
  );
}

export default function ClientTabs() {
  const insets = useSafeAreaInsets();
  const { isProfessional } = useAuthContext();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const iconName: IconName =
            route.name === 'Home'
              ? 'home'
              : route.name === 'MyAppointments'
                ? 'calendar'
                : route.name === 'Notifications'
                  ? 'bell'
                  : route.name === 'ProfessionalPanel'
                    ? 'scissors'
                    : 'user';
          return <TabBarIcon name={iconName} focused={focused} />;
        },
        tabBarLabel: ({ focused, children }) => (
          <Text style={[styles.label, focused && styles.labelFocused]}>{children}</Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderTopWidth: 1,
          borderRadius: 20,
          marginHorizontal: 12,
          marginBottom: 8,
          height: 58 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          ...elevation.sm,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarLabelPosition: 'below-icon',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="MyAppointments" component={MyAppointmentsScreen} options={{ tabBarLabel: 'Agenda' }} />
      {isProfessional && (
        <Tab.Screen
          name="ProfessionalPanel"
          component={ProfessionalPanelScreen}
          options={{ tabBarLabel: 'Painel' }}
        />
      )}
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Notificações' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: colors.goldOverlay,
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  labelFocused: {
    color: colors.gold,
    fontWeight: '600',
  },
});
