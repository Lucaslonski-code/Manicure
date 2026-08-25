import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NewPasswordScreen from '@screens/public/NewPasswordScreen';

export type RecoveryStackParamList = {
  NewPassword: undefined;
};

const Stack = createNativeStackNavigator<RecoveryStackParamList>();

export default function RecoveryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
    </Stack.Navigator>
  );
}
