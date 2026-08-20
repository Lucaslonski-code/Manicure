import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmailConfirmationScreen from '@screens/public/EmailConfirmationScreen';

export type EmailVerificationStackParamList = {
  EmailConfirmation: undefined;
};

const Stack = createNativeStackNavigator<EmailVerificationStackParamList>();

export default function EmailVerificationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
    </Stack.Navigator>
  );
}
