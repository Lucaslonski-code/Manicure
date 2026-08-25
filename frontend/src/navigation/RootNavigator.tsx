import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import PublicStack from './stacks/PublicStack';
import EmailVerificationStack from './stacks/EmailVerificationStack';
import RecoveryStack from './stacks/RecoveryStack';
import ClientStack from './stacks/ClientStack';
import AdminStack from './stacks/AdminStack';
import { useAuth } from '@hooks/useAuth';
import { colors, typography } from '@theme';

export type RootStackParamList = {
  Public: undefined;
  EmailVerification: undefined;
  Recovery: undefined;
  Client: undefined;
  Admin: undefined;
};

// O prefixo de deep link deve coincidir com o scheme em app.json.
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

// LoadingFallback é exibido apenas enquanto useAuth resolve o bootstrap.
// O splash nativo já foi liberado por App.tsx; este é um fallback React
// transitório, não um estado permanente.
function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});

export default function RootNavigator() {
  const { loading, session, isEmailVerified, profile, recoveryMode } = useAuth();

  // Estado 1: bootstrap de auth em andamento.
  // Não deve ser confundido com splash nativo — o splash já foi liberado.
  if (loading) {
    return <LoadingFallback />;
  }

  // Estado 2: sem sessão → fluxo público (Login).
  // Esta é a primeira tela interativa para usuários não autenticados.
  if (!session) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Public" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Public" component={PublicStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Estado 3: autenticado mas e-mail não confirmado.
  // O usuário não pode acessar fluxos funcionais até confirmar.
  if (!isEmailVerified) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="EmailVerification" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="EmailVerification" component={EmailVerificationStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Estado 3b: recuperação de senha via deep link.
  // O usuário precisa definir uma nova senha antes de acessar o app.
  if (recoveryMode) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Recovery" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Recovery" component={RecoveryStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Estado 4: admin → AdminStack.
  // A regra de autorização (escrita restrita ao profissional responsável)
  // é enforcing no backend via RLS. O frontend apenas oculta ações
  // não permitidas para UX.
  if (profile?.role === 'admin') {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Admin" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Admin" component={AdminStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Estado 5: client → ClientStack.
  if (profile?.role === 'client') {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator initialRouteName="Client" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Client" component={ClientStack} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Fallback: se o profile não tem role reconhecida, retorna ao público.
  // Isso evida telas vazias ou crashes por role desconhecida.
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName="Public" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Public" component={PublicStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
