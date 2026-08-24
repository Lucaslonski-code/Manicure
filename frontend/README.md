# Frontend — AppManicure Mobile

Aplicativo React Native + Expo (TypeScript). Entrypoint: `src/index.ts` → `App.tsx`.

---

## Estrutura

```
frontend/
├── App.tsx                    # Entry point: controle do splash nativo + providers
├── app.json                   # Configuração Expo (scheme, plugins, adaptive icon)
├── src/
│   ├── components/base/       # Componentes reutilizáveis (Button, Input, PasswordInput)
│   ├── forms/                 # Schemas de validação (Zod)
│   ├── hooks/                 # Hooks (useAuth, useNotifications)
│   ├── navigation/            # RootNavigator + stacks por perfil
│   ├── screens/               # Telas organizadas por perfil (public, client, admin)
│   ├── services/              # Serviços (auth, supabase client)
│   ├── supabase/              # Cliente Supabase + adapter SecureStore
│   └── __tests__/             # Testes
├── postman/                   # Coleção Postman de homologação
└── android/                   # Gerado por expo prebuild (CNG)
```

---

## Scripts

```bash
npm start          # Metro bundler
npm run android    # Build e execução no Android
npm run ios        # Build e execução no iOS
npm run export     # Export bundle para build nativo
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Jest
```

---

## Navegação

O `RootNavigator` resolve a pilha ativa com base no estado de autenticação:

```
sem sessão     → PublicStack (Login)
não verificado  → EmailVerificationStack
client          → ClientStack
admin           → AdminStack
```

`PublicStack` inicia em `LoginScreen`. O splash nativo é controlado exclusivamente por `App.tsx` via `expo-splash-screen`.

---

## Autenticação

- `src/hooks/useAuth.ts`: hook principal. Gerencia sessão, perfil, loading, notificações.
- `src/services/auth/authService.ts`: serviços de auth (signUp, signIn, signOut, resetPassword, updatePassword).
- `src/supabase/client.ts`: cliente Supabase com `skipAutoInitialize: true` (inicialização controlada pelo hook).
- `src/supabase/storage.ts`: adapter `expo-secure-store` para persistência de tokens no KeyStore.

**Deep link de confirmação:** `appmanicure://auth/confirm`. O hook processa `Linking.getInitialURL()` no bootstrap e `addEventListener('url', ...)` para links recebidos em execução.

---

## Testes

```bash
npm test
```

Testes importantes:
- `src/__tests__/hooks/useAuth.test.ts`: bootstrap, timeout, erro, deep link.
- `src/__tests__/screens/LoginScreen.test.tsx`: renderização forense do Login.
- `src/__tests__/services/authService.test.ts`: serviços de autenticação.
- `src/__tests__/forms/schemas.test.ts`: validação de formulários.
- `src/__tests__/navigation/RootNavigator.test.tsx`: resolução de pilha.

---

## Build

### Prebuild (CNG)

```bash
npx expo prebuild --clean --platform android
```

Gera `android/` a partir de `app.json` e config plugins. Não edite `android/` permanentemente.

### Export

```bash
npx expo export --platform android --clear
```

### EAS

Perfis: `development`, `preview`, `production`. Configurados em `eas.json`.

---

## Postman

Coleção de homologação: `postman/AppManicure-Homologacao.postman_collection.json`.

Inclui folders para: health, auth, client, admin, notifications, account deletion, security tests, data setup.

---

## Convenções

- Nomes semânticos: `LoginScreen`, `ProfessionalCard`, `appointmentDate`.
- Sem identificadores genéricos (`temp`, `data2`, `thing`).
- Componentes pequenos e focados.
- Erros mapeados para mensagens amigáveis em `authService.ts`.
