import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import PublicStack from './stacks/PublicStack';
import EmailVerificationStack from './stacks/EmailVerificationStack';
import ClientStack from './stacks/ClientStack';
import AdminStack from './stacks/AdminStack';
import { useAuth } from '@hooks/useAuth';
import { resolveStack } from './resolveStack';

export type RootStackParamList = {
  Public: undefined;
  EmailVerification: undefined;
  Client: undefined;
  Admin: undefined;
};

const prefix = Linking.createURL('/');
const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      Client: {
        screens: {
          AppointmentDetails: 'appointment/:appointmentId',
        },
      },
      Admin: {
        screens: {
          AppointmentDetails: 'appointment/:appointmentId',
        },
      },
    },
  },
} as any;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { loading, session, isEmailVerified, profile } = useAuth();

  const initialStack = resolveStack(loading, session, isEmailVerified, profile);

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName={initialStack} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Public" component={PublicStack} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationStack} />
        <Stack.Screen name="Client" component={ClientStack} />
        <Stack.Screen name="Admin" component={AdminStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
