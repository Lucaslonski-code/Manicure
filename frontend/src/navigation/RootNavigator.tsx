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
import type { Profile } from '../supabase/types';

export type RootStackParamList = {
  Public: undefined;
  EmailVerification: undefined;
  Recovery: undefined;
  Client: undefined;
  Admin: undefined;
};

export type RootDecision = 'Public' | 'EmailVerification' | 'Recovery' | 'Client' | 'Admin';

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
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

// Decide o fluxo de destino com base no estado REAL de autenticação.
// O bootstrap (useAuth) já rodou em paralelo; esta função apenas mapeia
// o estado para a pilha correta. Não dispara nenhuma Promise/rede.
export function resolveRootState(s: {
  loading: boolean;
  session: { user: { id: string } } | null;
  isEmailVerified: boolean;
  profile: Profile | null;
  recoveryMode: boolean;
}): RootDecision {
  if (!s.session) {
    return 'Public';
  }
  if (!s.isEmailVerified) {
    return 'EmailVerification';
  }
  if (s.recoveryMode) {
    return 'Recovery';
  }
  if (s.profile?.role === 'admin') {
    return 'Admin';
  }
  if (s.profile?.role === 'client') {
    return 'Client';
  }
  return 'Public';
}

type AuthSnapshot = {
  loading: boolean;
  session: { user: { id: string } } | null;
  isEmailVerified: boolean;
  profile: Profile | null;
  recoveryMode: boolean;
};

export type RootNavigatorProps = {
  // Quando fornecido, o RootNavigator consome o estado já resolvido pelo
  // AppRoot (bootstrap único, sem re-disparar getSession/initialize).
  authState?: AuthSnapshot;
};

export default function RootNavigator({ authState }: RootNavigatorProps) {
  if (authState) {
    return <RootNavigatorContent authState={authState} />;
  }
  return <RootNavigatorInternal />;
}

function RootNavigatorInternal() {
  const { loading, session, isEmailVerified, profile, recoveryMode } = useAuth();
  return (
    <RootNavigatorContent
      authState={{ loading, session, isEmailVerified, profile, recoveryMode }}
    />
  );
}

function RootContainer({ name, component }: { name: RootDecision; component: React.ComponentType<any> }) {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator initialRouteName={name} screenOptions={{ headerShown: false }}>
        <Stack.Screen name={name} component={component} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function renderRoot(decision: RootDecision) {
  switch (decision) {
    case 'EmailVerification':
      return <RootContainer name="EmailVerification" component={EmailVerificationStack} />;
    case 'Recovery':
      return <RootContainer name="Recovery" component={RecoveryStack} />;
    case 'Admin':
      return <RootContainer name="Admin" component={AdminStack} />;
    case 'Client':
      return <RootContainer name="Client" component={ClientStack} />;
    case 'Public':
    default:
      return <RootContainer name="Public" component={PublicStack} />;
  }
}

function RootNavigatorContent({ authState }: { authState: AuthSnapshot }) {
  const { loading, session, isEmailVerified, profile, recoveryMode } = authState;

  // Estado 1: bootstrap de auth em andamento.
  // Não deve ser confundido com splash nativo — o splash já foi liberado.
  if (loading) {
    return <LoadingFallback />;
  }

  const decision = resolveRootState({ loading, session, isEmailVerified, profile, recoveryMode });
  return renderRoot(decision);
}
