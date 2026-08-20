import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '@screens/admin/DashboardScreen';
import GlobalAgendaScreen from '@screens/admin/GlobalAgendaScreen';
import ProfileScreen from '@screens/admin/ProfileScreen';
import AccountDeletionScreen from '@screens/admin/AccountDeletionScreen';
import AvailabilityScreen from '@screens/admin/AvailabilityScreen';
import BlockedTimesScreen from '@screens/admin/BlockedTimesScreen';
import AppointmentDetailsScreen from '@screens/admin/AppointmentDetailsScreen';

export type AdminStackParamList = {
  Dashboard: undefined;
  GlobalAgenda: undefined;
  Profile: undefined;
  AccountDeletion: undefined;
  Availability: undefined;
  BlockedTimes: undefined;
  AppointmentDetails: { appointmentId: string };
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStack() {
  return (
    <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="GlobalAgenda" component={GlobalAgendaScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="BlockedTimes" component={BlockedTimesScreen} />
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
    </Stack.Navigator>
  );
}
