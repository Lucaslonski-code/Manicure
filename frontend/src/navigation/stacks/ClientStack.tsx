import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ClientTabs from '@navigation/tabs/ClientTabs';
import AccountDeletionScreen from '@screens/client/AccountDeletionScreen';
import ProfessionalSelectionScreen from '@screens/client/ProfessionalSelectionScreen';
import ServiceSelectionScreen from '@screens/client/ServiceSelectionScreen';
import DateSelectionScreen from '@screens/client/DateSelectionScreen';
import TimeSlotsScreen from '@screens/client/TimeSlotsScreen';
import BookingSummaryScreen from '@screens/client/BookingSummaryScreen';
import BookingConfirmationScreen from '@screens/client/BookingConfirmationScreen';
import AppointmentDetailsScreen from '@screens/client/AppointmentDetailsScreen';
import NotificationsScreen from '@screens/client/NotificationsScreen';

export type ClientStackParamList = {
  ClientTabs: undefined;
  Notifications: undefined;
  AccountDeletion: undefined;
  ProfessionalSelection: undefined;
  ServiceSelection: { professionalId: string; editAppointmentId?: string };
  DateSelection: { professionalId: string; serviceId: string; editAppointmentId?: string };
  TimeSlots: { professionalId: string; serviceId: string; date: string; editAppointmentId?: string };
  BookingSummary: { professionalId: string; serviceId: string; date: string; time: string; editAppointmentId?: string };
  BookingConfirmation: undefined;
  AppointmentDetails: { appointmentId: string };
};

const Stack = createNativeStackNavigator<ClientStackParamList>();

export default function ClientStack() {
  return (
    <Stack.Navigator initialRouteName="ClientTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientTabs" component={ClientTabs} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <Stack.Screen name="ProfessionalSelection" component={ProfessionalSelectionScreen} />
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
      <Stack.Screen name="DateSelection" component={DateSelectionScreen} />
      <Stack.Screen name="TimeSlots" component={TimeSlotsScreen} />
      <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
    </Stack.Navigator>
  );
}
