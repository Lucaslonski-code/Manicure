# 16. Android — Arquitetura e Compatibilidade

Status: CONFIRMADO quanto aos princípios; valores numéricos de API sujeitos à data de consulta abaixo.

Data da consulta às fontes oficiais: 18 de agosto de 2026.

Fontes oficiais consultadas:

- Android Developers — "Meet Google Play's target API level requirement":
  `https://developer.android.com/google/play/requirements/target-sdk`
- Google Play Console Help — "Target API level requirements for Google Play apps":
  `https://support.google.com/googleplay/android-developer/answer/11926878`

## 16.1 Requisito de target API — situação vigente na data de consulta

Segundo as fontes oficiais acima, em 18 de agosto de 2026:

- A partir de **31 de agosto de 2026**, novos aplicativos e atualizações de aplicativos existentes devem
  ter `targetSdkVersion` = **Android 16 (API level 36)** ou superior para serem publicados/atualizados no
  Google Play (exceções para Wear OS, Android Automotive, Android TV e Android XR não se aplicam a este
  projeto, que é um app de telefone/tablet convencional).
- Aplicativos já existentes devem ter, no mínimo, `targetSdkVersion` = Android 15 (API level 35) para
  permanecerem disponíveis a novos usuários em dispositivos com versão de Android mais recente que o alvo do
  app.
- Desenvolvedores podem solicitar extensão do prazo até **1º de novembro de 2026** por meio de formulário no
  Play Console.

**Decisão do projeto (RNF-COMPAT-001):** adotar `targetSdkVersion` = **API 36 (Android 16)** desde o início
do desenvolvimento, evitando dependência de prazos de extensão e alinhando-se ao requisito vigente para
novos aplicativos na data de consulta. Esta decisão está consistente com o requisito de produto definido na
missão original ("considerar API 36 como requisito atual do projeto para publicação em 2026").

Como esta é uma regra de política de plataforma sujeita a atualização anual, a validação final antes de cada
submissão/atualização deve ser refeita contra as fontes oficiais vigentes no momento — `REQUER VALIDAÇÃO
OFICIAL` a cada ciclo de release (ver `24-operacao-manutencao.md`).

## 16.2 Versões suportadas

| Parâmetro | Valor decidido | Origem |
|---|---|---|
| `targetSdkVersion` | 36 (Android 16) | Requisito de publicação vigente na data de consulta (16.1) |
| `compileSdkVersion` | Igual ou superior ao `targetSdkVersion` (36) | Prática recomendada da plataforma Android |
| `minSdkVersion` | `PENDENTE DE DECISÃO` — a definir conforme alcance de mercado desejado e suporte de bibliotecas (Expo/React Native) na data de implementação | — |

## 16.3 Identidade do aplicativo

| Item | Status |
|---|---|
| `applicationId` / package name | `PENDENTE DE DECISÃO` — deve ser definido e reservado antes da criação do app no Play Console (ver `20-google-play.md`); não pode ser alterado após a primeira publicação. |
| `versionCode` | Inteiro incremental a cada release enviado ao Play Console; controle de versionamento detalhado em `22-deploy-operacao.md`. |
| `versionName` | String de versão legível ao usuário (ex.: semântica `MAJOR.MINOR.PATCH`), decisão de convenção em `20-decisoes-arquiteturais.md`. |

## 16.4 Identidade visual do app (nível de sistema operacional)

| Item | Status |
|---|---|
| Launcher icon | `PENDENTE DE DECISÃO` — depende da identidade visual definitiva (ver `13-ux-ui-design-system.md`, seção 13.6). |
| Splash screen (nativa do sistema) | Deve seguir a API de splash screen padrão do Android moderno (comportamento gerenciado pelo sistema a partir de versões recentes) — implementação concreta via Expo, a validar na documentação oficial do Expo (`REQUER VALIDAÇÃO OFICIAL`). |
| Status bar / navigation bar | Comportamento "edge-to-edge" é o padrão recomendado/obrigatório em versões recentes do Android alvo — a validar mudanças de comportamento específicas da API 36 na documentação oficial (`REQUER VALIDAÇÃO OFICIAL`, ver nota de "behavior changes" da fonte 16.1). |
| Orientação | Retrato (vertical), como padrão de aplicativos mobile de uso cotidiano — modo paisagem não é requisito do MVP. `PENDENTE DE DECISÃO` quanto a travar exclusivamente retrato vs. permitir rotação. |

## 16.5 Tamanhos de tela e densidades

- O aplicativo deve ser responsivo a diferentes tamanhos de tela de smartphones Android comuns (telas
  pequenas, médias e grandes) e diferentes densidades de pixel, sem depender de layout fixo em pixels
  absolutos — princípio de UX, sem lista fechada de dispositivos específicos.
- Suporte a tablets Android não é requisito do MVP — `PENDENTE DE DECISÃO`.

## 16.6 Dispositivos físicos e emuladores

- Desenvolvimento e testes iniciais podem ocorrer em emulador Android (via Android Studio/Expo).
- Testes finais antes de cada release devem incluir ao menos um dispositivo físico real (ver
  `19-testes-android-distribuicao.md` para estratégia detalhada).

## 16.7 Ciclo de vida do aplicativo

| Evento | Comportamento esperado |
|---|---|
| Foreground → Background | Sessão permanece válida; nenhuma ação destrutiva é interrompida sem confirmação prévia. |
| Background → Foreground (retomada) | App revalida sessão (token ainda válido?) antes de permitir novas ações sensíveis; dados podem ser atualizados (ex.: agenda pode ter mudado enquanto em background). |
| Encerramento pelo sistema (memória) | Estado de navegação não persiste obrigatoriamente entre encerramentos completos — reabertura inicia pela resolução normal de sessão (Splash, ver `12-arquitetura-frontend-mobile.md`). Persistência de rascunho de formulário em andamento é `PENDENTE DE DECISÃO` (não obrigatória no MVP). |
| Encerramento pelo usuário | Sessão permanece válida (token local preservado) até logout explícito ou expiração natural do token. |

## 16.8 Armazenamento

Detalhado em `18-android-armazenamento-seguranca-local.md`... consolidado nesta mesma família de documentos —
ver seção de armazenamento em `12-arquitetura-frontend-mobile.md`, seção 12.5, e reforço de segurança local
abaixo:

- Nenhuma senha em texto puro é armazenada localmente.
- Token de sessão armazenado via mecanismo de armazenamento seguro do sistema operacional (ex.: keystore/
  armazenamento criptografado nativo do Android, acessado através de biblioteca apropriada do Expo/React
  Native) — mecanismo concreto a validar na documentação oficial do Expo (`REQUER VALIDAÇÃO OFICIAL`).
- Logout limpa todo dado sensível armazenado localmente.
- Troca de usuário no mesmo dispositivo (logout de Ana 1, login de Ana 2) deve garantir que nenhum dado de
  sessão/cache de Ana 1 permaneça acessível a Ana 2.
- Desinstalação do aplicativo remove todo dado local (comportamento padrão do sistema operacional Android
  para armazenamento de app não compartilhado).
- Reinstalação inicia como sessão não autenticada (sem dados locais anteriores), exigindo novo login.

## 16.9 Notificações, permissões, deep links e conectividade

Detalhados em documentos dedicados: `17-android-permissoes.md`, `14-notificacoes.md` (ciclo de vida de
notificação em Android detalhado ali), `12-arquitetura-frontend-mobile.md` (deep links, seção 12.8).
Conectividade: ver `12-arquitetura-frontend-mobile.md`, seção 12.9.

## 16.10 Atualização, desinstalação e reinstalação do app

| Cenário | Comportamento esperado |
|---|---|
| Atualização de versão via Play Store | Deve preservar sessão local (token) quando o mecanismo de armazenamento seguro sobreviver à atualização — comportamento padrão esperado, a confirmar na implementação concreta. |
| Desinstalação | Remove todos os dados locais do app (padrão do sistema operacional). |
| Reinstalação | Novo início: sem sessão local; usuário deve autenticar-se novamente. Dados remotos (agendamentos, perfil) permanecem inalterados no backend. |

## 16.11 Compatibilidade entre versões do app e do backend

- O backend deve permanecer compatível com versões anteriores do app ainda em uso por usuários que não
  atualizaram, dentro de uma janela razoável — política exata de descontinuação de versões antigas é
  `PENDENTE DE DECISÃO` (ver `22-deploy-operacao.md` e `24-operacao-manutencao.md`).
