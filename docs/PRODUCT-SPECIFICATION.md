# PRODUCT-SPECIFICATION — Especificação Central Consolidada

Status: documento de consolidação. Não substitui os documentos especializados (`01` a `31`) — reúne, em uma
única referência, a visão de conjunto do produto, com remissão direta a cada documento fonte para
detalhamento. Em caso de qualquer divergência aparente entre este documento e um documento especializado, o
documento especializado prevalece como fonte normativa.

Última consolidação: 18 de agosto de 2026.

---

## 1. Visão geral e objetivo

Aplicativo mobile de agendamento para uma profissional/empresa de manicure, permitindo que clientes marquem
atendimentos com profissionais específicos e que administradoras gerenciem, de forma centralizada, a agenda
do negócio. Detalhes: [`01-visao-escopo-atores.md`](01-visao-escopo-atores.md).

## 2. Escopo

MVP prioriza: autenticação, verificação de e-mail, cadastro de profissionais e serviços, motor de
disponibilidade sem conflito, agenda global administrativa, cancelamento/alteração/histórico de
agendamentos, contato da cliente no detalhe administrativo, notificações essenciais e exclusão de conta.
Fora do MVP: pagamentos, chat, fidelidade/cupons, IA, iOS (apenas preparação arquitetural), multi-idioma,
avaliações públicas. Detalhes: [`01`](01-visao-escopo-atores.md), seções 1.4–1.6.

Requisitos funcionais e não funcionais completos, com IDs rastreáveis: [`02-requisitos.md`](02-requisitos.md).

## 3. Atores e roles

| Ator | Role | Descrição |
|---|---|---|
| Cliente | `client` | Agenda, acompanha e cancela os próprios atendimentos. |
| Administradora/Profissional | `admin` | Atende clientes; administra a própria disponibilidade; visualiza a agenda global do negócio. |

Cadastro público sempre resulta em `role = client`; nunca em `admin`. `admin` é provisionado por mecanismo
controlado, fora do fluxo público — mecanismo exato: `PENDENTE DE DECISÃO`. `role` é dado de segurança
resolvido no backend, nunca escolhido pelo usuário ou pelo frontend. Detalhes:
[`03-identidade-roles-autenticacao.md`](03-identidade-roles-autenticacao.md).

## 4. Autenticação e verificação de e-mail

- Autoridade de autenticação: **Supabase Auth** (GoTrue gerenciado), com tokens JWT e ciclo de vida de sessão controlados pela plataforma.
- Tela única de login para todos os usuários (`supabase.auth.signInWithPassword`); o backend/banco resolve o papel (`role`) após autenticação, e o app
  direciona ao fluxo correspondente.
- Cadastro exige nome, e-mail, telefone, senha e confirmação de senha (`supabase.auth.signUp`), com trigger de banco inserindo o registro em `public.users` com `role = client`.
- Verificação de e-mail é obrigatória: enquanto `email_verified = false` (`email_confirmed_at` nulo no Supabase Auth), nenhuma funcionalidade além da
  confirmação é acessível.
- Fluxo: cadastro → e-mail de confirmação → confirmação → login → identificação de role → fluxo
  correspondente.
- Recuperação/redefinição de senha, logout, sessão expirada e conta desativada são tratados de forma
  padronizada via Supabase Auth (mensagens genéricas, sem vazar informação sobre existência de contas).
- A tabela `public.users` não armazena senha nem hash de senha (gerenciados exclusivamente em `auth.users`).

Detalhes completos: [`03-identidade-roles-autenticacao.md`](03-identidade-roles-autenticacao.md). Fluxos de
tela: [`05-fluxos-cliente.md`](05-fluxos-cliente.md), [`06-fluxos-admin-agenda-global.md`](06-fluxos-admin-agenda-global.md).
Navegação e proteção de rotas: [`12-arquitetura-frontend-mobile.md`](12-arquitetura-frontend-mobile.md), seção 12.10.

## 5. Regra central de autorização (agenda global e responsabilidade profissional)

> Todos os admins podem **visualizar** todos os agendamentos (agenda global).
> Somente o admin vinculado ao profissional **responsável** por um agendamento pode **alterar, cancelar,
> excluir ou reagendar** aquele agendamento.

Formalmente, para qualquer escrita sobre um `appointment`:

```
PERMITIR SE E SOMENTE SE:
  autenticado = verdadeiro
  E email_verified = verdadeiro
  E current_user.role = "admin"
  E current_user.professional_id = appointment.professional_id
```

Para leitura da agenda administrativa, exige-se apenas `role = admin`, sem restrição de propriedade.

**Exemplo de referência (usado em toda a documentação):** Ana 1 (`admin`, profissional P1) e Ana 2 (`admin`,
profissional P2). Ana 1 pode visualizar agendamentos de P1 e P2, mas só pode alterar/cancelar/excluir/
reagendar agendamentos de P1. Ana 2 possui a regra inversa. Nenhuma admin pode modificar agendamentos da
outra.

Esta regra é tratada como **requisito de negócio** (agenda colaborativa com responsabilidade individual) e
como **requisito de segurança** (prevenção de acesso horizontal indevido — IDOR/BOLA). Esconder um botão na
interface não é considerado segurança suficiente: a autorização efetiva é sempre revalidada no
PostgreSQL via Row Level Security (RLS) e validações server-side, independentemente do que a interface exibe.

Rastreabilidade completa desta regra (banco, API, backend, frontend, testes, critérios de aceitação):
[`04-autorizacao-seguranca.md`](04-autorizacao-seguranca.md) (documento normativo) e
[`26-matriz-rastreabilidade-criterios-aceitacao.md`](26-matriz-rastreabilidade-criterios-aceitacao.md), seção 26.1.

## 6. Agendamento, disponibilidade e prevenção de double booking

Fluxo da cliente: profissional → serviço → data → horário → resumo → confirmação → agendamento criado
(`status = confirmed`). O motor de disponibilidade considera jornada do profissional, bloqueios/folgas,
duração do serviço e agendamentos existentes para oferecer apenas horários válidos.

A prevenção de conflito (double booking) é garantida no **PostgreSQL** via constraint de exclusão temporal
e/ou Stored Procedure / RPC atômica (`book_appointment`), não apenas por uma checagem prévia na interface — duas requisições concorrentes para o
mesmo profissional/horário nunca resultam em duas criações bem-sucedidas.

Detalhes: [`07-motor-disponibilidade.md`](07-motor-disponibilidade.md). Estados e transições do
agendamento: [`09-entidade-appointment.md`](09-entidade-appointment.md).

## 7. Banco de dados

PostgreSQL gerenciado pelo Supabase com Row Level Security (RLS) mandatório em 100% das tabelas públicas.
Entidades principais: `users` (vinculada a `auth.users`), `professionals`, `services`, `professional_services`, `appointments`,
`availability`, `blocked_times`, `notifications`, `audit_logs`, `business_settings`. A FK
`appointments.professional_id` é a base estrutural da regra central de autorização (seção 5).

Detalhes: [`08-modelo-banco-dados.md`](08-modelo-banco-dados.md),
[`09-entidade-appointment.md`](09-entidade-appointment.md).

## 8. API

Acesso unificado via **Supabase SDK / PostgREST** para operações CRUD protegidas por RLS, **PostgreSQL RPCs** para
operações transacionais críticas (reserva atômica de horários com prevenção de concorrência) e **Supabase Edge Functions**
para tarefas com privilégios elevados (envio de push notifications via Expo Push API, exclusão externa de conta).
Toda escrita administrativa sobre agendamento aplica a regra da seção 5; leitura da agenda global é permitida a qualquer admin.

Detalhes: [`10-api-especificacao.md`](10-api-especificacao.md).

## 9. Backend

Arquitetura BaaS (Backend as a Service) baseada em Supabase: PostgREST + PostgreSQL RLS + Stored Procedures/RPCs + Triggers + Edge Functions.
Frontend nunca é fonte de verdade de autorização. Divisão de responsabilidade de validação entre frontend (UX) e banco/backend (definitivo) documentada explicitamente.

Detalhes: [`11-arquitetura-backend.md`](11-arquitetura-backend.md).

## 10. Frontend, navegação e UX/UI

Stack: React Native + Expo + TypeScript + `@supabase/supabase-js` com persistência de sessão segura via `expo-secure-store`.
Navegação com quatro pilhas (`PublicStack`, `EmailVerificationStack`, `ClientStack`, `AdminStack`), resolvidas exclusivamente por dado retornado pelo Supabase (`auth.users` e `public.users`). A tela de login é única e compartilhada.

UX/UI cobre todas as telas de cliente e admin, com princípios de simplicidade, clareza, confiança, poucos
passos, feedback, prevenção de erro e acessibilidade. A interface administrativa diferencia visualmente
"pode visualizar" de "pode alterar" (medida de UX, não de segurança). Design system documentado
conceitualmente; valores visuais definitivos (cores, tipografia) permanecem `PENDENTE DE DECISÃO`.

Detalhes: [`12-arquitetura-frontend-mobile.md`](12-arquitetura-frontend-mobile.md),
[`13-ux-ui-design-system.md`](13-ux-ui-design-system.md).

## 11. Notificações

Quatro notificações essenciais no MVP: confirmação, alteração, cancelamento e lembrete — via push, com
possível reforço local. Escopo de destinatário sempre alinhado à regra central (admin só é notificado de
eventos do próprio profissional). Detalhes: [`14-notificacoes.md`](14-notificacoes.md).

## 12. Segurança

Princípios: RBAC, menor privilégio, proteção contra acesso horizontal (IDOR/BOLA) e vertical (privilege
escalation), validação server-side obrigatória, tokens/secrets protegidos, TLS obrigatório, rate limiting em
endpoints sensíveis, exposição mínima de dados, auditoria de eventos sensíveis. Cenário de ataque de
referência (Ana 1 tentando cancelar agendamento de Ana 2 via requisição manipulada) documentado com as
camadas de defesa esperadas. Detalhes: [`04-autorizacao-seguranca.md`](04-autorizacao-seguranca.md).

## 13. Privacidade e exclusão de conta

Dados tratados: nome, e-mail, telefone, dados de autenticação, agendamentos, observações, token de
dispositivo. Cada dado possui finalidade declarada. Exclusão de conta é suportada dentro do app (cliente e
admin), com anonimização de dados identificáveis em registros históricos preservados para o profissional, e
por página externa ao app, conforme exigência vigente do Google Play. Tratamento de agendamentos futuros ao
excluir conta de admin permanece `PENDENTE DE DECISÃO`. Detalhes:
[`15-privacidade-exclusao-conta.md`](15-privacidade-exclusao-conta.md).

## 14. Testes e critérios de aceitação

Estratégia cobre autenticação, verificação de e-mail, sessão, roles, autorização, agendamento, conflito/
double booking, cancelamento, exclusão de conta, notificações, UI, segurança e dispositivos Android. Casos
negativos obrigatórios incluem explicitamente: Ana 1 alterando/cancelando/excluindo agendamento de Ana 2 (e
vice-versa), client acessando área administrativa, usuário não verificado tentando usar o app, e duas
clientes disputando o mesmo horário. Critérios de aceitação verificáveis cobrem todos os domínios do
produto, incluindo publicação.

Detalhes: [`24-testes-qa.md`](24-testes-qa.md), [`25-criterios-aceitacao.md`](25-criterios-aceitacao.md),
[`26-matriz-rastreabilidade-criterios-aceitacao.md`](26-matriz-rastreabilidade-criterios-aceitacao.md).

## 15. Android

Android é a primeira plataforma, com arquitetura preparada para expansão futura a iOS. Situação vigente na
data de consulta (18/08/2026, fontes oficiais em [`16`](16-android.md) e [`20`](20-google-play.md)):

- `targetSdkVersion` = **API 36 (Android 16)**, requisito vigente do Google Play para novos apps/atualizações
  a partir de 31/08/2026 (extensão possível até 01/11/2026).
- `compileSdkVersion` ≥ `targetSdkVersion`; `minSdkVersion`: `PENDENTE DE DECISÃO`.
- `applicationId`/package name, `versionCode`, `versionName`: convenções e valores definitivos `PENDENTE DE
  DECISÃO`, mas o mecanismo de versionamento (incremento obrigatório de `versionCode`, `versionName`
  legível) está definido.
- Permissões do MVP: apenas **Internet** e **Notificações** — nenhuma permissão sensível (câmera, contatos,
  localização, telefone, calendário, microfone, fotos, Bluetooth) é solicitada, por ausência de necessidade
  funcional. Análise individual completa em [`17-android-permissoes.md`](17-android-permissoes.md).
- Notificações: push via serviço compatível com Android moderno, com tratamento de token inválido,
  permissão negada e abertura de tela via deep link.
- Armazenamento: nenhuma senha em texto puro; token de sessão em armazenamento seguro do sistema; limpeza no
  logout e na troca de usuário.
- Ciclo de vida: sessão preservada em background/retomada; revalidação ao retomar; limpeza completa de dados
  locais na desinstalação; nova autenticação exigida na reinstalação.
- Build: development, preview e production builds via EAS; artefato de produção em **AAB**, assinado com
  **Play App Signing** habilitado; upload key protegida como segredo crítico, com titularidade da conta de
  assinatura pertencente à proprietária do negócio.
- Testes em dispositivos: cobertura mínima racional (ao menos duas versões de Android, dois tamanhos de
  tela, testes de conectividade/permissão/notificação/ciclo de vida), com ao menos um dispositivo físico
  real antes de cada release.

Detalhes completos: [`16-android.md`](16-android.md), [`17-android-permissoes.md`](17-android-permissoes.md),
[`18-android-build-assinatura-testes.md`](18-android-build-assinatura-testes.md).

## 16. Distribuição privada e Google Play

Antes da publicação pública, a proprietária do negócio pode validar o produto via build instalável (APK de
preview) ou distribuição privada gerenciada, além dos tracks formais do Google Play (teste interno e teste
fechado) — ver [`19-distribuicao-privada-cliente.md`](19-distribuicao-privada-cliente.md).

Processo completo de publicação: criação e verificação da conta de desenvolvedor → configuração do app
(package name, Play App Signing) → AAB → ficha da loja → classificação de conteúdo → política de privacidade
→ Data Safety → declaração de permissões → fluxo de exclusão de conta (app + página externa) → acesso para
revisão → testes → solicitação de acesso à produção → revisão do Google → publicação → atualizações.
Detalhes: [`20-google-play.md`](20-google-play.md).

**Teste interno:** validação rápida com grupo pequeno definido pelo desenvolvedor/proprietária.

**Teste fechado — requisito vigente para contas pessoais novas** (fonte oficial consultada em 18/08/2026,
`support.google.com/googleplay/android-developer/answer/14151465`): contas pessoais criadas **após 13 de
novembro de 2023** devem executar teste fechado com no mínimo **12 testadores** optados (`opted in`)
continuamente pelos **14 dias** imediatamente anteriores à solicitação de acesso à produção. Esses
testadores **não são funcionários do Google**; devem ser convidados pelo próprio desenvolvedor/proprietária,
não precisam ser contratados/remunerados, e **clientes reais da manicure podem participar voluntariamente**,
desde que sigam o processo formal de opt-in da plataforma — o que também serve como validação real adicional
do produto, sem substituir o cumprimento formal da regra.

**Data Safety:** formulário obrigatório mapeando cada dado coletado (nome, e-mail, telefone, dados de
agendamento, token de dispositivo) à sua finalidade declarada, ausência de compartilhamento com terceiros
para fins de marketing, e práticas de segurança (TLS, opção de exclusão).

Matriz de conformidade completa (privacidade, dados, permissões, segurança, contas, exclusão, classificação,
conteúdo/PI, acesso para revisão, publicação): [`21-teste-interno-fechado-conformidade.md`](21-teste-interno-fechado-conformidade.md).

## 17. Deploy, ambientes, secrets, backup, auditoria e observabilidade

Ciclo: desenvolvimento → build → teste local/com a cliente → correções → release candidate → teste interno →
teste fechado → solicitação de produção → revisão → publicação → monitoramento → atualização.

Contas críticas (Google Play Console, Supabase, domínio) devem pertencer à
proprietária do negócio, não apenas ao desenvolvedor, evitando dependência exclusiva de uma pessoa física.
Nenhuma credencial real é registrada em qualquer documento ou em controle de versão.
Chaves públicas seguras (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) residem no cliente, enquanto chaves privilegiadas (`service_role`) ficam restritas a Edge Functions e infraestrutura interna.

Backup automatizado do banco gerenciado pelo Supabase, com verificação periódica de restaurabilidade. Auditoria de eventos sensíveis
(autenticação, criação/alteração/cancelamento/exclusão de agendamento, mudanças administrativas, tentativas
negadas de autorização) via tabela `audit_logs`. Observabilidade de logs técnicos, erros, métricas e
disponibilidade via Postgres Logs e Supabase Logflare.

Detalhes: [`22-deploy-operacao-ambientes.md`](22-deploy-operacao-ambientes.md),
[`23-backup-auditoria-observabilidade.md`](23-backup-auditoria-observabilidade.md).

## 18. Operação, manutenção e arquitetura futura para iOS

Pós-publicação: novas versões seguem o mesmo pipeline; backend pode ser atualizado independentemente do app,
respeitando compatibilidade entre versões; requisito de `targetSdkVersion` deve ser revalidado a cada ciclo
anual do Google Play; dependências (Expo/React Native/Supabase) mantidas atualizadas periodicamente.

A arquitetura atual (modelo de dados, regras de autorização RLS, API PostgREST/RPC, motor de disponibilidade, stack React
Native/Expo) já é portável para uma futura versão iOS sem redesenho estrutural. Itens especificamente
Android (permissões, build/assinatura, processo de publicação) não são portáveis e exigirão levantamento
próprio quando/se a expansão for decidida — não desenvolvida nesta fase.

Detalhes: [`27-operacao-manutencao.md`](27-operacao-manutencao.md),
[`28-arquitetura-futura-ios.md`](28-arquitetura-futura-ios.md).

## 19. Decisões arquiteturais, riscos e pendências

Doze decisões arquiteturais principais registradas em formato contexto/decisão/justificativa/alternativas/
consequências/riscos, cobrindo: Android first, React Native/Expo/TypeScript, Supabase com PostgreSQL gerenciado, verificação de
e-mail obrigatória via Supabase Auth, roles com admin provisionado manualmente, agenda global com escrita restrita, autorização
aplicada no PostgreSQL via Row Level Security (RLS), AAB com Play App Signing, `targetSdkVersion` = API 36, propriedade de contas
independente do desenvolvedor, preparação para iOS e adoção do Supabase como BaaS oficial (ADR-12).

Doze riscos identificados (segurança, produto, operação, publicação, privacidade, manutenção), cada um com
mitigação documentada. Lista consolidada de todas as decisões ainda não tomadas (`PENDENTE DE DECISÃO`) — a escolha de backend e autenticação está oficialmente resolvida em favor do Supabase; pendências restantes (como identidade visual e package name) estão listadas em `30-riscos-pendencias-glossario.md`.

Detalhes: [`29-decisoes-arquiteturais.md`](29-decisoes-arquiteturais.md),
[`30-riscos-pendencias-glossario.md`](30-riscos-pendencias-glossario.md).

## 20. Auditoria de consistência

Auditoria formal realizada sobre os 30 documentos temáticos em 18 de agosto de 2026, verificando os 23 itens
de checklist obrigatórios da missão (login único, cadastro público restrito a `client`, provisionamento
manual de admin, verificação de e-mail obrigatória, agenda global, regra de responsabilidade profissional
aplicada em todas as camadas, exclusão de conta, Data Safety, política de privacidade, API 36, AAB/
assinatura, teste interno/fechado, regra de 12 testadores/14 dias, produção, atualizações, preparação para
iOS) mais verificações adicionais de coerência cruzada entre banco, API, frontend, backend, segurança,
notificações, Android e Google Play. Nenhuma contradição normativa foi encontrada; um esclarecimento textual
foi registrado (uso do termo "horário" em resumos vs. os campos técnicos `start_at`/`end_at` nos documentos
normativos), sem impacto em nenhuma regra de negócio ou segurança.

Detalhes completos: [`31-auditoria-consistencia.md`](31-auditoria-consistencia.md).

---

## Nota final

Este documento consolida, mas não substitui, os 31 documentos especializados listados em
[`README.md`](README.md). A implementação do produto deve seguir os documentos especializados como fonte
detalhada, usando este arquivo apenas como mapa de navegação e resumo executivo. Toda decisão marcada como
`PENDENTE DE DECISÃO` deve ser resolvida formalmente antes ou durante a implementação correspondente; toda
marcação `REQUER VALIDAÇÃO OFICIAL` deve ser reconfirmada contra a fonte oficial vigente no momento em que
for efetivamente necessária.
