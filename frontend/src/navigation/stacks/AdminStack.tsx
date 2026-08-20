import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '@screens/admin/DashboardScreen';
import GlobalAgendaScreen from '@screens/admin/GlobalAgendaScreen';
import ProfileScreen from '@screens/admin/ProfileScreen';
import AccountDeletionScreen from '@screens/admin/AccountDeletionScreen';

export type AdminStackParamList = {
  Dashboard: undefined;
  GlobalAgenda: undefined;
  Profile: undefined;
  AccountDeletion: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="GlobalAgenda" component={GlobalAgendaScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
    </Stack.Navigator>
  );
}
