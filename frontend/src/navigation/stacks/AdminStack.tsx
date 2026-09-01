import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '@screens/admin/DashboardScreen';
import GlobalAgendaScreen from '@screens/admin/GlobalAgendaScreen';
import ProfileScreen from '@screens/admin/ProfileScreen';
import AccountDeletionScreen from '@screens/admin/AccountDeletionScreen';
import AvailabilityScreen from '@screens/admin/AvailabilityScreen';
import BlockedTimesScreen from '@screens/admin/BlockedTimesScreen';
import AppointmentDetailsScreen from '@screens/admin/AppointmentDetailsScreen';
import AdminProfessionalsScreen from '@screens/admin/AdminProfessionalsScreen';
import AdminServicesScreen from '@screens/admin/AdminServicesScreen';
import ScheduleCustomizationScreen from '@screens/admin/ScheduleCustomizationScreen';
import WeeklyScheduleScreen from '@screens/admin/WeeklyScheduleScreen';
import SpecificDatesScreen from '@screens/admin/SpecificDatesScreen';
import BlockedTimesAdminScreen from '@screens/admin/BlockedTimesAdminScreen';

export type AdminStackParamList = {
  Dashboard: undefined;
  GlobalAgenda: undefined;
  Profile: undefined;
  AccountDeletion: undefined;
  Availability: undefined;
  BlockedTimes: undefined;
  AppointmentDetails: { appointmentId: string };
  AdminProfessionals: undefined;
  AdminServices: undefined;
  ScheduleCustomization: undefined;
  WeeklySchedule: undefined;
  SpecificDates: undefined;
  BlockedTimesAdmin: undefined;
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
      <Stack.Screen name="AdminProfessionals" component={AdminProfessionalsScreen} />
      <Stack.Screen name="AdminServices" component={AdminServicesScreen} />
      <Stack.Screen name="ScheduleCustomization" component={ScheduleCustomizationScreen} />
      <Stack.Screen name="WeeklySchedule" component={WeeklyScheduleScreen} />
      <Stack.Screen name="SpecificDates" component={SpecificDatesScreen} />
      <Stack.Screen name="BlockedTimesAdmin" component={BlockedTimesAdminScreen} />
    </Stack.Navigator>
  );
}
