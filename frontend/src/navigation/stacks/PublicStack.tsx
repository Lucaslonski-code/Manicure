import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@screens/public/LoginScreen';
import SignUpScreen from '@screens/public/SignUpScreen';
import EmailConfirmationScreen from '@screens/public/EmailConfirmationScreen';
import PasswordRecoveryScreen from '@screens/public/PasswordRecoveryScreen';
import NewPasswordScreen from '@screens/public/NewPasswordScreen';

export type PublicStackParamList = {
  Login: undefined;
  SignUp: undefined;
  EmailConfirmation: { email?: string };
  PasswordRecovery: undefined;
  NewPassword: undefined;
};

const Stack = createNativeStackNavigator<PublicStackParamList>();

export default function PublicStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
      <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
    </Stack.Navigator>
  );
}
