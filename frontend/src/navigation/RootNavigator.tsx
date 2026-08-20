import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PublicStack from './stacks/PublicStack';
import EmailVerificationStack from './stacks/EmailVerificationStack';
import ClientStack from './stacks/ClientStack';
import AdminStack from './stacks/AdminStack';
import { useAuth } from '@hooks/useAuth';

export type RootStackParamList = {
  Public: undefined;
  EmailVerification: undefined;
  Client: undefined;
  Admin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Public" component={PublicStack} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationStack} />
        <Stack.Screen name="Client" component={ClientStack} />
        <Stack.Screen name="Admin" component={AdminStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
