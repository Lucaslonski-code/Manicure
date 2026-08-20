import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '@screens/public/SplashScreen';
import LoginScreen from '@screens/public/LoginScreen';
import SignUpScreen from '@screens/public/SignUpScreen';
import EmailConfirmationScreen from '@screens/public/EmailConfirmationScreen';
import PasswordRecoveryScreen from '@screens/public/PasswordRecoveryScreen';

export type PublicStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  EmailConfirmation: undefined;
  PasswordRecovery: undefined;
};

const Stack = createNativeStackNavigator<PublicStackParamList>();

export default function PublicStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
      <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
    </Stack.Navigator>
  );
}
