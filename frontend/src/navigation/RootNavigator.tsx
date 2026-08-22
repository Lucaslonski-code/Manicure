import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import SplashScreenComponent from '@screens/public/SplashScreen';
import PublicStack from './stacks/PublicStack';
import EmailVerificationStack from './stacks/EmailVerificationStack';
import ClientStack from './stacks/ClientStack';
import AdminStack from './stacks/AdminStack';
import { useAuth } from '@hooks/useAuth';

SplashScreen.preventAutoHideAsync();

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

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch((err) => {
        console.error('Error hiding splash screen:', err);
      });
    }
  }, [loading]);

  if (loading) {
    return <SplashScreenComponent />;
  }

  if (!session) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Public" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Public" component={PublicStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (!isEmailVerified) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="EmailVerification" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="EmailVerification" component={EmailVerificationStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (profile?.role === 'admin') {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Admin" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Admin" component={AdminStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (profile?.role === 'client') {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Client" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Client" component={ClientStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Public" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Public" component={PublicStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
