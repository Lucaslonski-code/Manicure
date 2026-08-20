import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@screens/client/HomeScreen';
import ProfileScreen from '@screens/client/ProfileScreen';
import AccountDeletionScreen from '@screens/client/AccountDeletionScreen';

export type ClientStackParamList = {
  Home: undefined;
  Profile: undefined;
  AccountDeletion: undefined;
};

const Stack = createNativeStackNavigator<ClientStackParamList>();

export default function ClientStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} />
    </Stack.Navigator>
  );
}
