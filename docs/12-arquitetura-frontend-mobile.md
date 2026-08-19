# 12. Arquitetura Frontend Mobile e Navegação

Status: CONFIRMADO. Documento conceitual — nenhum código é escrito aqui.

Stack de referência: React Native + Expo + TypeScript (ver `29-decisoes-arquiteturais.md`). Versões
específicas de SDK/bibliotecas devem ser validadas na documentação oficial vigente do Expo/React Native no
momento da implementação — `REQUER VALIDAÇÃO OFICIAL`.

## 12.1 Estrutura de pastas (conceitual)

```
app/
  navigation/        → definição de pilhas e proteção de rotas
  screens/
    public/          → Splash, Login, Cadastro, Confirmação de e-mail, Recuperação de senha
    client/          → Home, Profissionais, Serviços, Calendário, Horários, Resumo, Confirmação,
                        Meus Agendamentos, Detalhes, Histórico, Perfil, Exclusão de Conta
    admin/           → Dashboard, Agenda Global, Detalhes do Agendamento, Disponibilidade,
                        Bloqueios, Serviços, Perfil, Exclusão de Conta
  components/        → componentes reutilizáveis (ver design system, 13-ux-ui-design-system.md)
  hooks/             → hooks de estado/efeitos reutilizáveis (ex.: sessão, disponibilidade)
  services/
    api/             → cliente HTTP e definição de contratos (espelha 10-api-especificacao.md)
    auth/            → integração com provedor de autenticação
    notifications/   → registro de push, tratamento de recebimento
    storage/         → armazenamento seguro local (sessão, preferências)
  state/             → estado global (sessão, usuário atual, role)
  forms/             → definição e validação de formulários
  utils/             → formatação de data/hora, máscaras de telefone, etc.
```

Esta estrutura é conceitual; nomes exatos de pastas/arquivos ficam a critério da implementação, desde que a
separação de responsabilidades seja preservada.

## 12.2 Estado

| Tipo de estado | Escopo | Exemplos |
|---|---|---|
| Estado global | Toda a aplicação | Sessão atual, usuário autenticado, `role`, `professional_id` (se admin), status de conectividade. |
| Estado local de tela | Uma tela/fluxo | Seleção de profissional/serviço/data/horário durante o fluxo de agendamento; filtros da agenda administrativa. |
| Cache de dados remotos | Compartilhado entre telas, com invalidação | Lista de profissionais, serviços, agenda consultada recentemente. |

A tecnologia concreta de gerenciamento de estado (ex.: biblioteca de estado global, cache de requisições) é
`PENDENTE DE DECISÃO` de implementação, desde que respeite a separação acima.

## 12.3 Formulários e validação

- Todo formulário (cadastro, login, criação de agendamento, edição de perfil) realiza validação client-side
  para feedback imediato (formato, campos obrigatórios, senha/confirmação).
- Essa validação é exclusivamente de UX — a validação definitiva ocorre no backend (ver `11-arquitetura-backend.md`,
  seção 11.6). Nenhuma regra de autorização é decidida no formulário.

## 12.4 Cliente Supabase e Gerenciamento de Sessão

- O aplicativo utiliza o SDK oficial `@supabase/supabase-js` instanciado como singleton em `src/services/supabase.ts`.
- O armazenamento seguro de tokens de sessão (JWT e refresh token) é integrado ao SDK via adaptador customizado usando `expo-secure-store`:
  ```typescript
  import { createClient } from '@supabase/supabase-js';
  import * as SecureStore from 'expo-secure-store';

  const ExpoSecureStoreAdapter = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };

  export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
  ```
- O ciclo de vida da autenticação é monitorado globalmente via `supabase.auth.onAuthStateChange((event, session) => ...)`.
- As variáveis públicas `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` são as únicas credenciais presentes no bundle do app. A chave `service_role` **nunca** é incluída no frontend.

## 12.5 Armazenamento local

- **Sessão / Tokens JWT:** Gerenciados via `expo-secure-store` no KeyStore seguro do Android.
- **Preferências locais (ex.: filtros de data na agenda):** Armazenadas via AsyncStorage / SQLite local simples.
- Nenhum dado sensível (senhas, chaves privadas) é persistido em texto claro.

## 12.6 Cache, loading, erro e estados vazios — padrão transversal

Toda tela que depende de dados remotos deve tratar explicitamente quatro estados: carregando, sucesso com
dados, sucesso sem dados (estado vazio, ver docs 05/06), e erro (com opção de tentar novamente). Esse padrão
é transversal a todas as telas do app, cliente e admin.

## 12.7 Notificações (papel do frontend)

- Solicitação de permissão de notificações ao usuário (Android 13+ `POST_NOTIFICATIONS` — ver `16-android.md`).
- Obtenção do Expo Push Token via `expo-notifications` e persistência do token no banco Supabase (`notifications_tokens` ou metadados de perfil) após login.
- Tratamento de abertura de tela a partir do toque em notificação (deep link interno) — ver `14-notificacoes.md`.

## 12.8 Deep links

- Deep links internos (originados de notificação) devem respeitar a mesma proteção de rota da navegação
  normal: um deep link para detalhe de agendamento exige sessão válida e, no caso administrativo, é
  resolvido como leitura ampla (qualquer admin visualiza) com ações de escrita condicionadas à regra central
  de autorização.
- Deep links externos (ex.: link de confirmação de e-mail ou reset de senha do Supabase Auth) são
  capturados pelo Expo Linking e tratados no fluxo de autenticação.

## 12.9 Conectividade / offline

O MVP não define suporte funcional a uso offline (criação de agendamento sem conexão, por exemplo). O app
deve detectar ausência de conectividade (via `NetInfo`) e apresentar feedback claro, sem permitir mutações que
dependam do backend/banco.

---

## 12.10 Navegação — fluxos e proteção de rotas

### 12.10.1 Pilhas de navegação conceituais

```
RootNavigator
  ├── PublicStack        (não autenticado)
  │     Splash, Login, Cadastro, Recuperação de Senha
  ├── EmailVerificationStack   (autenticado, email_verified = false)
  │     Confirmação de E-mail
  ├── ClientStack         (autenticado, verificado, role = client)
  │     Home, Profissionais, Serviços, Calendário, Horários, Resumo, Confirmação,
  │     Meus Agendamentos, Detalhes, Histórico, Perfil, Exclusão de Conta
  └── AdminStack          (autenticado, verificado, role = admin)
        Dashboard, Agenda Global, Detalhes do Agendamento, Disponibilidade,
        Bloqueios, Serviços, Perfil, Exclusão de Conta
```

### 12.10.2 Regra de resolução de pilha

A pilha ativa é determinada pelo estado retornado pelo Supabase (`auth.session` e perfil em `public.users`):

```
SE session é nula             → PublicStack
SENÃO SE email_confirmed_at é nulo → EmailVerificationStack
SENÃO SE role = "client"      → ClientStack
SENÃO SE role = "admin"       → AdminStack
```

### 12.10.3 Login único

A tela de Login pertence exclusivamente à `PublicStack` e é a mesma para todos os usuários (`supabase.auth.signInWithPassword`). Não existe seletor de perfil na tela de login.

### 12.10.4 Proteção de rotas

- Toda tela fora da `PublicStack` exige sessão válida; tentativa de navegação direta sem sessão redireciona para Login.
- Toda tela da `AdminStack` exige `role = admin`; contas de cliente não possuem acesso visual e qualquer tentativa de chamada ao PostgREST é bloqueada pelo RLS com `403`.
- Toda tela funcional fora da `EmailVerificationStack` exige confirmação de e-mail.

### 12.10.5 Logout e sessão expirada

- `supabase.auth.signOut()` encerra a sessão, limpa `expo-secure-store` e direciona imediatamente à `PublicStack`.
- Eventos de expiração de token capturados por `onAuthStateChange` realizam o logout automático.

### 12.10.6 Navegação "voltar" (back navigation)

- O botão "voltar" do sistema Android é controlado para não permitir retorno a telas autenticadas após logout — a mudança de pilha reseta a árvore de navegação do React Navigation.
