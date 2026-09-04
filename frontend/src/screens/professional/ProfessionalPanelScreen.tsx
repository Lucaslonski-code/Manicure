import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '@screens/admin/DashboardScreen';
import GlobalAgendaScreen from '@screens/admin/GlobalAgendaScreen';
import AppointmentDetailsScreen from '@screens/admin/AppointmentDetailsScreen';
import FilteredAppointmentsScreen from '@screens/admin/FilteredAppointmentsScreen';
import ScheduleCustomizationScreen from '@screens/admin/ScheduleCustomizationScreen';
import WeeklyScheduleScreen from '@screens/admin/WeeklyScheduleScreen';
import SpecificDatesScreen from '@screens/admin/SpecificDatesScreen';
import BlockedTimesAdminScreen from '@screens/admin/BlockedTimesAdminScreen';
import ServicesProfessionalScreen from '@screens/professional/ServicesProfessionalScreen';

export type ProfessionalPanelParamList = {
  PanelDashboard: undefined;
  PanelGlobalAgenda: undefined;
  PanelAppointmentDetails: { appointmentId: string };
  PanelFilteredAppointments: { filter: 'today' | 'confirmed' | 'cancelled' | 'upcoming' };
  PanelScheduleCustomization: undefined;
  PanelWeeklySchedule: undefined;
  PanelSpecificDates: undefined;
  PanelBlockedTimes: undefined;
  PanelServices: undefined;
};

const Stack = createNativeStackNavigator<ProfessionalPanelParamList>();

export default function ProfessionalPanelScreen() {
  return (
    <Stack.Navigator initialRouteName="PanelDashboard" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PanelDashboard" component={DashboardScreen} />
      <Stack.Screen name="PanelGlobalAgenda" component={GlobalAgendaScreen} />
      <Stack.Screen name="PanelAppointmentDetails" component={AppointmentDetailsScreen} />
      <Stack.Screen name="PanelFilteredAppointments" component={FilteredAppointmentsScreen} />
      <Stack.Screen name="PanelScheduleCustomization" component={ScheduleCustomizationScreen} />
      <Stack.Screen name="PanelWeeklySchedule" component={WeeklyScheduleScreen} />
      <Stack.Screen name="PanelSpecificDates" component={SpecificDatesScreen} />
      <Stack.Screen name="PanelBlockedTimes" component={BlockedTimesAdminScreen} />
      <Stack.Screen name="PanelServices" component={ServicesProfessionalScreen} />
    </Stack.Navigator>
  );
}
