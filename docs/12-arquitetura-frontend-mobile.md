# 12. Arquitetura Frontend Mobile e Navegação

Status: CONFIRMADO. Documento conceitual — nenhum código é escrito aqui.

Stack de referência: React Native + Expo + TypeScript (ver `20-decisoes-arquiteturais.md`). Versões
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
  components/        → componentes reutilizáveis (ver design system, doc 13)
  hooks/             → hooks de estado/efeitos reutilizáveis (ex.: sessão, disponibilidade)
  services/
    api/             → cliente HTTP e definição de contratos (espelha doc 10)
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

## 12.4 Serviços e API client

- Um único cliente HTTP centralizado é responsável por anexar o token de sessão às requisições autenticadas,
  tratar renovação/expiração de sessão de forma uniforme, e mapear erros padronizados (ver
  `10-api-especificacao.md`, seção 10.9) para tratamento consistente na UI.
- Nenhuma tela realiza chamada direta sem passar por esse cliente centralizado.

## 12.5 Armazenamento local

- Token/sessão: armazenamento seguro do dispositivo (mecanismo específico do Android detalhado em
  `16-android.md`).
- Preferências não sensíveis (ex.: última visão de calendário usada): armazenamento local simples.
- Nenhum dado sensível (senha, token) é armazenado em texto simples ou em local acessível a outros
  aplicativos.

## 12.6 Cache, loading, erro e estados vazios — padrão transversal

Toda tela que depende de dados remotos deve tratar explicitamente quatro estados: carregando, sucesso com
dados, sucesso sem dados (estado vazio, ver docs 05/06), e erro (com opção de tentar novamente). Esse padrão
é transversal a todas as telas do app, cliente e admin.

## 12.7 Notificações (papel do frontend)

- Solicitação de permissão de notificações ao usuário (Android — ver `16-android.md`).
- Registro do token de dispositivo junto ao backend após login bem-sucedido.
- Tratamento de abertura de tela a partir do toque em notificação (deep link interno) — ver `14-notificacoes.md`.

## 12.8 Deep links

- Deep links internos (originados de notificação) devem respeitar a mesma proteção de rota da navegação
  normal: um deep link para detalhe de agendamento exige sessão válida e, no caso administrativo, é
  resolvido como leitura ampla (qualquer admin visualiza) com ações de escrita condicionadas à regra central
  de autorização.
- Deep links externos (ex.: link universal para abrir o app a partir de um e-mail de confirmação) são
  tratados como parte do fluxo de autenticação (ver `03-identidade-roles-autenticacao.md`).

## 12.9 Conectividade / offline

O MVP não define suporte funcional a uso offline (criação de agendamento sem conexão, por exemplo). O app
deve, no mínimo, detectar ausência de conectividade e apresentar mensagem apropriada, sem permitir ações que
dependam do backend. Suporte offline mais avançado é `PENDENTE DE DECISÃO` (fora do MVP).

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

A pilha ativa é determinada exclusivamente pelo estado de autenticação resolvido a partir do backend
(`/auth/me`, ver `10-api-especificacao.md`), nunca por escolha do usuário na interface:

```
SE não autenticado           → PublicStack
SENÃO SE email_verified = falso → EmailVerificationStack
SENÃO SE role = "client"     → ClientStack
SENÃO SE role = "admin"      → AdminStack
```

### 12.10.3 Login único

A tela de Login pertence exclusivamente à `PublicStack` e é a mesma para todos os usuários. Não existe rota,
parâmetro ou botão que direcione para uma "versão admin" da tela de login (ver `03-identidade-roles-autenticacao.md`).

### 12.10.4 Proteção de rotas

- Toda tela fora da `PublicStack` exige sessão válida; tentativa de navegação direta (ex.: deep link) sem
  sessão redireciona para Login.
- Toda tela da `AdminStack` exige `role = admin`; uma conta `client` que tente acessar (por manipulação de
  estado local, deep link, ou navegação indevida) é redirecionada, e qualquer chamada de API subjacente
  retorna `403` (ver `10-api-especificacao.md`).
- Toda tela fora da `EmailVerificationStack` exige `email_verified = true`.

### 12.10.5 Logout e sessão expirada

- Logout limpa estado global e armazenamento local sensível, retornando à `PublicStack`.
- Qualquer resposta `401` de qualquer endpoint aciona o mesmo comportamento de logout local (sessão inválida)
  e redirecionamento para Login, com mensagem informativa.

### 12.10.6 Navegação "voltar" (back navigation)

- Botão "voltar" do sistema Android não deve permitir retornar a uma pilha para a qual o usuário não tem
  mais permissão (ex.: usuário que fez logout não deve conseguir "voltar" para telas autenticadas via botão
  físico/gesto de voltar) — a troca de pilha reinicia a árvore de navegação.
