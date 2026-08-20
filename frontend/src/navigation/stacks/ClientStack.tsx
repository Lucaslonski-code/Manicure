import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@screens/client/HomeScreen';
import ProfileScreen from '@screens/client/ProfileScreen';
import AccountDeletionScreen from '@screens/client/AccountDeletionScreen';
import ServiceSelectionScreen from '@screens/client/ServiceSelectionScreen';
import DateSelectionScreen from '@screens/client/DateSelectionScreen';
import TimeSlotsScreen from '@screens/client/TimeSlotsScreen';
import BookingSummaryScreen from '@screens/client/BookingSummaryScreen';
import BookingConfirmationScreen from '@screens/client/BookingConfirmationScreen';
import MyAppointmentsScreen from '@screens/client/MyAppointmentsScreen';
import AppointmentDetailsScreen from '@screens/client/AppointmentDetailsScreen';

export type ClientStackParamList = {
  Home: undefined;
  Profile: undefined;
  AccountDeletion: undefined;
  ServiceSelection: { professionalId: string };
  DateSelection: { professionalId: string; serviceId: string };
  TimeSlots: { professionalId: string; serviceId: string; date: string };
  BookingSummary: { professionalId: string; serviceId: string; date: string; time: string };
  BookingConfirmation: undefined;
  MyAppointments: undefined;
  AppointmentDetails: { appointmentId: string };
};

const Stack = createNativeStackNavigator<ClientStackParamList>();

export default function ClientStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
      <Stack.Screen name="DateSelection" component={DateSelectionScreen} />
      <Stack.Screen name="TimeSlots" component={TimeSlotsScreen} />
      <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} />
      <Stack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
      <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
      <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
    </Stack.Navigator>
  );
}
