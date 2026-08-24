# AppManicure

Aplicativo mobile de agendamento para manicure. Permite que clientes agendem atendimentos com profissionais e que administradoras gerenciem a agenda do negócio de forma centralizada.

**Status:** em desenvolvimento e homologação (Android).

---

## Visão geral

O AppManicure resolve o problema do agendamento manual (telefone, mensagens, papel) centralizando a operação em um aplicativo mobile. O negócio conta com múltiplas profissionais, e a agenda é compartilhada entre administradoras, mas cada profissional é responsável apenas pelos próprios atendimentos.

**Público-alvo:**
- Clientes: agendam, visualizam e cancelam seus próprios atendimentos.
- Administradoras (profissionais/proprietárias): visualizam a agenda global e gerenciam seus próprios agendamentos, profissionais, serviços e disponibilidade.

---

## Principais funcionalidades

- Cadastro e login com verificação obrigatória de e-mail.
- Recuperação e redefinição de senha via deep link.
- Agendamento de atendimentos com seleção de profissional, serviço, data e horário.
- Motor de disponibilidade que impede conflitos de horário.
- Agenda global para administradoras, com escrita restrita ao profissional responsável.
- Notificações push para confirmação, alteração, cancelamento e lembretes.
- Exclusão de conta (cliente e admin).
- Histórico de atendimentos.

---

## Arquitetura

```
Frontend Mobile (React Native + Expo)
        │
        │  Supabase SDK (PostgREST / Auth)
        ▼
Supabase BaaS
  ├── Auth (JWT, verificação de e-mail)
  ├── PostgREST (API REST automática)
  └── Edge Functions (notificações, exclusão de conta)
        │
        │  RLS + RPCs
        ▼
PostgreSQL (banco de dados)
```

**Responsabilidades por camada:**

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Frontend | React Native + Expo + TypeScript | Interface, navegação, validação de formato, feedback de UX. |
| Autenticação | Supabase Auth | Emissão/validação de JWT, verificação de e-mail. |
| API | PostgREST | Queries e mutações protegidas por RLS. |
| Autorização | PostgreSQL RLS | Defesa primária: controle de acesso a nível de linha. |
| Mutações críticas | PostgreSQL RPCs | Operações atômicas (ex.: verificação de disponibilidade). |
| Processos assíncronos | Edge Functions (Deno) | Push notifications e exclusão externa de conta. |

**Regra de autorização central:**
- Todos os admins podem **visualizar** todos os agendamentos.
- Somente o admin vinculado ao profissional responsável pode **modificar/cancelar/excluir** agendamentos.
- Esta regra é enforcing no banco via RLS. O frontend apenas oculta ações não permitidas (UX), mas não é a camada de segurança.

---

## Stack

| Componente | Tecnologia |
|---|---|
| Frontend | React Native + Expo SDK 57 + TypeScript |
| Navegação | React Navigation (native-stack) |
| Estado | React hooks + contexto |
| Backend | Supabase (PostgreSQL gerenciado) |
| Autenticação | Supabase Auth (e-mail/senha, verificação obrigatória) |
| Armazenamento seguro | expo-secure-store (KeyStore Android) |
| Notificações | expo-notifications + Expo Push API + Edge Function |
| Validação | Zod |
| Testes | Jest + Testing Library |
| Build Android | EAS (Expo Application Services) |

---

## Estrutura do projeto

```
Aplicativo/
├── README.md                  # Este arquivo
├── AGENTS.md                  # Regras de desenvolvimento
├── docs/                      # Documentação de produto e arquitetura
│   ├── 01-visao-escopo-atores.md
│   ├── 02-requisitos.md
│   ├── ...
│   └── 29-decisoes-arquiteturais.md
├── frontend/                  # App React Native + Expo
│   ├── App.tsx                # Entry point, controle do splash nativo
│   ├── app.json               # Configuração Expo (scheme, plugins, adaptive icon)
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis (Button, Input, PasswordInput)
│   │   ├── forms/             # Schemas de validação (Zod)
│   │   ├── hooks/             # Hooks (useAuth, useNotifications)
│   │   ├── navigation/        # RootNavigator + stacks
│   │   ├── screens/           # Telas (public, client, admin)
│   │   ├── services/          # Serviços (auth, supabase client)
│   │   ├── supabase/          # Cliente Supabase + storage adapter
│   │   └── __tests__/         # Testes unitários e de integração
│   ├── postman/               # Coleção Postman de homologação
│   └── android/               # Gerado por expo prebuild (CNG)
├── supabase/                  # Backend
│   ├── config.toml            # Configuração do projeto Supabase
│   ├── migrations/            # SQL migrations (schema, RLS, RPCs, triggers)
│   ├── functions/             # Edge Functions (Deno)
│   │   ├── send-push-notification/
│   │   └── delete-account-external/
│   └── seed.sql               # Dados iniciais (desenvolvimento)
├── eas.json                   # Configuração EAS
└── package.json               # Scripts do workspace
```

---

## Requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npx expo`)
- Conta Supabase (projeto configurado)
- EAS CLI (`npm install -g eas-cli`) para builds

---

## Configuração do ambiente

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd Aplicativo/frontend
```

### 2. Variáveis de ambiente

Crie um arquivo `.env` em `frontend/` com:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

**Importante:**
- `EXPO_PUBLIC_*` são públicas e podem aparecer no bundle do app.
- `service_role` **nunca** deve estar no frontend.
- `.env` não deve ser commitado.

### 3. Instale dependências

```bash
cd frontend
npm install
```

---

## Desenvolvimento

### Iniciar Metro (development server)

```bash
npm start
```

### Executar no Android ( Development Build )

```bash
npm run android
```

Para desenvolvimento rápido com hot reload, use `npm start` e escaneie o QR code com o Expo Go. Para builds com código nativo customizado, use Development Build (`eas build --profile development --platform android`).

---

## Testes

```bash
# Todos os testes
npm test

# Com output detalhado
npm test -- --verbose
```

Testes cobrem:
- Autenticação e bootstrap (timeout, erro, sucesso)
- Componentes de UI (Login, PasswordInput)
- Schemas de validação (Zod)
- Serviços (authService)
- Navegação (RootNavigator)

---

## Android / Expo / EAS

### Prebuild (gerar código nativo)

```bash
npx expo prebuild --clean --platform android
```

### Export (bundle JS)

```bash
npx expo export --platform android --clear
```

### Build de homologação (EAS)

```bash
eas build --platform android --profile preview
```

### Development Build

```bash
eas build --platform android --profile development
```

Perfis disponíveis em `eas.json`:
- `development`: cliente de desenvolvimento, distribuição interna.
- `preview`: distribuição interna, para homologação.
- `production`: auto-incremento, para loja.

---

## Supabase

### Estrutura

```
supabase/
├── config.toml          # Configurações (auth, RLS, rate limit, etc.)
├── migrations/          # Migrations SQL em ordem
│   ├── 0001_initial_schema.sql
│   ├── 0002_rls_policies.sql
│   ├── ...
│   └── 0008_delete_account.sql
├── functions/           # Edge Functions (Deno)
│   ├── send-push-notification/
│   └── delete-account-external/
└── seed.sql             # Dados de desenvolvimento
```

### Aplicar migrations

```bash
supabase migration up
```

### Ambiente local

```bash
supabase start
```

### Documentação

Detalhes em `docs/11-arquitetura-backend.md`, `docs/08-modelo-banco-dados.md` e `docs/10-api-especificacao.md`.

---

## Postman

Uma coleção de homologação está em `frontend/postman/AppManicure-Homologacao.postman_collection.json`.

**Uso:**
1. Importe a coleção no Postman.
2. Preencha as variáveis (URLs, tokens, e-mails de teste).
3. Execute na ordem dos folders.

**Importante:** a coleção não contém secrets. Preencha as variáveis com dados de homologação antes de executar.

Cobertura: autenticação, operações de cliente, operações de admin, notificações, exclusão de conta, testes de segurança (401/403).

---

## Segurança

### Princípios

- **RLS é a defesa definitiva.** Toda tabela pública tem RLS habilitado.
- **Frontend não é camada de segurança.** Oculta ações não permitidas para UX, mas a autorização efetiva está no banco.
- **Sem secrets no frontend.** Apenas `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` estão no bundle.
- **Tokens em KeyStore.** Sessões são armazenadas via `expo-secure-store`, não em texto claro.
- **Deep links autorizados.** Links de confirmação e reset de senha usam `appmanicure://auth/confirm`.

### Regra de autorização

| Ação | Cliente | Admin (qualquer) | Admin do profissional |
|---|---|---|---|
| Visualizar agenda global | Negado | Permitido | Permitido |
| Modificar/cancelar agendamento próprio | Permitido | Negado | Permitido |
| Modificar/cancelar agendamento de outro | Negado | Negado | Negado |

### Testes de segurança

A coleção Postman inclui cenários que validam:
- Cliente não acessa dados de outro cliente.
- Cliente não cria/edita profissionais.
- Admin não modifica agendamentos de outro profissional.
- Edge Functions rejeitam chamadas sem autenticação.

---

## Documentação

A fonte da verdade do produto está em `docs/`. Principais documentos:

| Documento | Conteúdo |
|---|---|
| `01-visao-escopo-atores.md` | Visão de produto, atores, limites do MVP. |
| `02-requisitos.md` | Requisitos funcionais e não funcionais. |
| `03-identidade-roles-autenticacao.md` | Roles, autenticação, fluxos de auth. |
| `04-autorizacao-seguranca.md` | Regra central de autorização, RLS, cenários de ataque. |
| `05-fluxos-cliente.md` | Fluxos funcionais do cliente. |
| `06-fluxos-admin-agenda-global.md` | Fluxos administrativos. |
| `11-arquitetura-backend.md` | Arquitetura Supabase, RLS, RPCs, Edge Functions. |
| `12-arquitetura-frontend-mobile.md` | Arquitetura frontend, navegação, estado, deep links. |
| `13-ux-ui-design-system.md` | Design system, componentes, diretrizes visuais. |
| `14-notificacoes.md` | Push notifications, Expo Push API, Edge Function. |
| `15-privacidade-exclusao-conta.md` | Dados pessoais, retenção, anonimização, exclusão. |
| `16-android.md` | Arquitetura Android, API levels, identidade visual. |
| `29-decisoes-arquiteturais.md` | ADRs (Architecture Decision Records). |

---

## Estado do projeto

| Item | Status |
|---|---|
| Frontend (Android) | Em homologação |
| Backend (Supabase) | Implementado |
| Segurança (RLS) | Implementada |
| Notificações push | Implementadas |
| Exclusão de conta | Implementada |
| Testes automatizados | Implementados (Jest) |
| iOS | Planejado para futuro |
| Publicação Google Play | Pendente |

---

## Roadmap

### Concluído
- Autenticação com verificação de e-mail.
- Agendamento com motor de disponibilidade sem conflito.
- Agenda global para admins.
- Notificações push.
- Exclusão de conta.
- Testes automatizados.
- Build Android via EAS.

### Em andamento
- Homologação do fluxo de confirmação de e-mail.
- Ajustes finos de UX (show/hide senha, feedback de operações).
- Validação em dispositivo físico.

### Próximos passos
- Publicação no Google Play (teste interno → fechado → produção).
- Monitoramento e observabilidade.
- Revisão de performance e crashes.
- Preparação para iOS (arquitetura preparatória documentada em `28-arquitetura-futura-ios.md`).

---

## Contribuição

1. Leia `AGENTS.md` — regras de nomenclatura, arquitetura e segurança.
2. Leia o documento relevante em `docs/` antes de implementar.
3. Mantenha a fonte da verdade (`docs/`) sincronizada com o código.
4. Não altere regras de segurança sem documentação explícita.
5. Execute testes, lint e typecheck antes de propor mudanças.

---

## Observações importantes

- **Frontend não é camada de segurança.** Toda regra de autorização deve ser enforcing no backend (RLS/RPCs).
- **Deep links de confirmação de e-mail usam `appmanicure://auth/confirm`.** Não usar localhost ou URLs de desenvolvimento em fluxos reais.
- **`service_role` nunca deve estar no frontend.**
- **O app Android é gerado via CNG (prebuild).** Não edite `android/` permanentemente; altere `app.json` e config plugins.
- **RLS é obrigatório em 100% das tabelas públicas.**

---

## Licença

MIT
