# 31. Auditoria de Consistência

Status: AUDITORIA REALIZADA em 18 de agosto de 2026, sobre os documentos `01` a `30`.

Esta auditoria verifica efetivamente as referências cruzadas entre documentos, não apenas declara
conformidade. Cada item abaixo indica o resultado da verificação e, quando aplicável, a correção aplicada.

## 31.1 Verificação item a item (conforme checklist da missão)

| # | Item verificado | Resultado | Evidência |
|---|---|---|---|
| 1 | Login único | Conforme | `03` §3.6.3, `12` §12.10.3, `06` §6.1, `05` — mesma tela em todos os fluxos, nenhuma menção contrária encontrada. |
| 2 | Cadastro público cria apenas `client` | Conforme | `03` §3.2, `08` §8.2, `10` §10.1 (`/auth/register` nunca aceita `role`), `25` CA-CAD-01/03. |
| 3 | Admin é provisionado manualmente | Conforme | `03` §3.3, `29` ADR-05. Mecanismo exato registrado como `PENDENTE DE DECISÃO` — consistente (não inventado). |
| 4 | Verificação de e-mail obrigatória | Conforme | `03` §3.6.2, `05`, `06`, `12` §12.10.1 (`EmailVerificationStack`), `25` CA-EMAIL-01/02. |
| 5 | Agenda é global | Conforme | `04` §4.1, `06` §6.4, `10` §10.5, `26` §26.1. |
| 6 | Todos os admins visualizam toda a agenda | Conforme | `04` §4.1-4.2, `08` §8.6 (regra de leitura), `10` §10.5/10.8, `11` §11.4, `13` §13.3.1, `25` CA-AUTZ-03. |
| 7 | Cada admin só altera os próprios agendamentos profissionais | Conforme | `04` §4.1-4.2 (tabela Ana 1/Ana 2), `09` §9.8, `10` §10.5/10.8, `26` §26.1. |
| 8 | Limitação aplicada fora do frontend | Conforme | `04` §4.3-4.4 (explicação explícita), `11` §11.3 (fluxo de verificação no handler), `13` §13.3.1 (frontend explicitamente descrito como não-autoritativo). |
| 9 | Banco suporta a autorização | Conforme | `08` §8.6, §8.12; `11` §11.4 (RLS como defesa em profundidade, condicionada à arquitetura de acesso ao banco escolhida — status corretamente marcado como dependente de decisão de backend). |
| 10 | API respeita a autorização | Conforme | `10` §10.5, §10.8, §10.10. |
| 11 | Frontend reflete a autorização | Conforme | `12` §12.10.4, `13` §13.3.1 — sempre com ressalva explícita de que é apenas UX. |
| 12 | Testes verificam a autorização | Conforme | `24` §24.3, `25` §25.4/25.9. |
| 13 | Exclusão de conta documentada | Conforme | `15` (documento dedicado completo), `10` §10.2, `25` §25.6. |
| 14 | Data Safety documentado | Conforme | `20` §20.7, `21` §21.3. |
| 15 | Política de privacidade prevista | Conforme | `15` §15.1-15.6 (insumo técnico), `20` §20.6 (requisito de publicação), explicitamente não redigida como texto jurídico — conforme escopo da missão. |
| 16 | API 36 considerada | Conforme | `16` §16.1 (com fontes oficiais e data de consulta), `29` ADR-09, `25` CA-AND-01. |
| 17 | AAB e assinatura documentados | Conforme | `18` §18.1, §18.4, `20` §20.1, `29` ADR-08. |
| 18 | Teste interno documentado | Conforme | `19`, `20` §20.11, `21` §21.1. |
| 19 | Teste fechado documentado | Conforme | `21` §21.2. |
| 20 | Regra de 12 testadores/14 dias documentada | Conforme | `21` §21.2, com fonte oficial e data de consulta; esclarecimento explícito de que testadores não são funcionários do Google (§21.2.1) e que clientes reais podem participar voluntariamente (§21.2.2). |
| 21 | Processo de produção documentado | Conforme | `20` §20.11-20.13, `22` §22.1. |
| 22 | Atualizações documentadas | Conforme | `20` §20.13, `22` §22.3-22.4, `27` §27.1-27.3. |
| 23 | Futura expansão para iOS não foi esquecida | Conforme | `28` (documento dedicado), `29` ADR-11. |

Todos os 23 itens da checklist obrigatória foram verificados como conformes. Nenhuma contradição foi
localizada entre os documentos quanto a esses pontos.

## 31.2 Verificações adicionais de consistência (busca ativa por contradições)

| Verificação | Resultado |
|---|---|
| Coerência entre banco (`08`,`09`) e API (`10`) | Conforme — todos os campos de request/response referenciados em `10` existem no modelo de `08`/`09`. Nenhum campo órfão identificado. |
| Coerência entre API (`10`) e frontend (`12`,`13`) | Conforme — toda ação de UI descrita em `13` corresponde a um endpoint existente em `10`. |
| Coerência entre roles e permissões | Conforme — `03`, `04`, `10` e `12` usam consistentemente `client`/`admin` como único conjunto de papéis, sem menção a papel adicional não declarado. |
| Coerência entre agenda e banco | Conforme — a distinção leitura ampla/escrita restrita em `06`/`04` é suportada pelos campos `professional_id`/`client_user_id` de `08`/`09`. |
| Coerência entre segurança e autorização | Conforme — `04` é referenciado consistentemente por `10`, `11`, `13`, `24`, `25`, `26` sem definição divergente da regra central em nenhum desses documentos. |
| Coerência entre notificações e Android | Conforme — `14` (push/local) e `16`/`17` (permissão de notificações) usam o mesmo modelo de permissão única (`POST_NOTIFICATIONS`/equivalente), sem contradição de escopo. |
| Coerência entre app e Google Play | Conforme — permissões declaradas em `17` correspondem ao mapeamento de Data Safety em `20` §20.7 e à matriz de conformidade em `21` §21.3. |
| Coerência entre autenticação e exclusão de conta | Conforme — `15` §15.7 usa o mesmo modelo de estado de conta (`deleted_at`, `is_active`) definido em `03`/`08`. |
| Coerência entre Android e Expo/EAS | Conforme — `16`, `17`, `18` tratam a mesma stack (React Native + Expo) sem contradição de versão-alvo. |
| Coerência entre testes e publicação | Conforme — `24` (testes de desenvolvimento) e `21` (testes de publicação) são explicitamente diferenciados, sem sobreposição confusa (ver `19` §19.4 para a distinção formal). |
| Entidades ausentes | Nenhuma das dez entidades mínimas exigidas (`users`, `professionals`, `services`, `professional_services`, `appointments`, `availability`, `blocked_times`, `notifications`, `audit_logs`, `business_settings`) está ausente — todas documentadas em `08`/`09`. |
| Endpoints incompatíveis | Nenhum endpoint em `10` referencia entidade ou campo inexistente em `08`/`09`. |
| Fluxos quebrados | Fluxos de cliente (`05`) e admin (`06`) foram verificados quanto a transições sem tela de destino — nenhuma lacuna encontrada. |
| Regras de segurança sem cobertura em teste | As regras centrais de `04` possuem caso de teste correspondente em `24` §24.3-24.4 e critério de aceitação em `25` §25.4/25.9 — nenhuma regra central órfã de teste. |
| Requisitos da Play Store ausentes | Checklist de `21` §21.3 cobre todos os itens exigidos pela missão original (privacidade, dados, Data Safety, permissões, segurança, contas, exclusão, classificação, conteúdo/PI, acesso para revisão, publicação). |
| Dados sem finalidade declarada | Todos os dados listados em `15` §15.1 possuem finalidade explícita; nenhum dado coletado é declarado "sem uso". |
| Funcionalidades documentadas sem suporte arquitetural | Nenhuma funcionalidade de `02` (requisitos funcionais) ficou sem referência em `08`-`13` — verificado por amostragem cruzada dos IDs `RF-*`. |
| Decisões que aparecem somente no frontend | Não identificada nenhuma regra de autorização definida exclusivamente em `12`/`13` sem contraparte em `04`/`10`/`11`. |
| Regras que aparecem somente no backend | Não identificada nenhuma regra de negócio em `11` sem representação (ainda que apenas de leitura/exibição) em `12`/`13`. |
| Lacunas entre produto e publicação | O fluxo de exclusão de conta (`15`) foi verificado quanto ao requisito específico de página externa da Google Play (`15` §15.8) — presente e consistente com `20`/`21`. |

## 31.3 Inconsistência identificada e correção aplicada

Durante a auditoria, foi identificado que a missão original (Prompt Mestre, item "AGENDA") menciona
"horário inicial" e "horário final" como campos a exibir na agenda, enquanto alguns documentos de fluxo
inicialmente listavam apenas "horário". **Correção:** confirmado que `06` §6.4.1 já lista corretamente
"Horário inicial" e "Horário final" como campos separados, e que `09` §9.2 define `start_at`/`end_at` como
os campos correspondentes no modelo de dados. Nenhuma alteração adicional foi necessária — a aparente
divergência em textos de resumo (ex.: `01`, que usa "horário" de forma abreviada em contexto de visão geral)
não constitui contradição normativa, pois os documentos técnicos (`06`, `08`, `09`, `10`) usam
consistentemente os dois campos. Registrado aqui para transparência da auditoria.

## 31.4 Itens que permanecem como decisão pendente (não resolvidos silenciosamente)

Ver lista completa e consolidada em `30-riscos-pendencias-glossario.md`, seção 30.2. A auditoria confirma que
nenhuma dessas pendências foi preenchida com suposição em nenhum documento — todas permanecem
identificadas como `PENDENTE DE DECISÃO` ou `REQUER VALIDAÇÃO OFICIAL` de forma consistente em todos os
locais onde são mencionadas.

## 31.6 Auditoria de Fechamento Arquitetural — Supabase BaaS (19 de agosto de 2026)

Auditoria formal realizada após o fechamento arquitetural oficial adotando **Supabase** como backend do projeto:

| # | Item de Fechamento Arquitetural | Status | Evidência / Validação |
|---|---|---|---|
| A1 | Stack Frontend confirmada | Conforme | React Native + Expo + TypeScript + `@supabase/supabase-js` (`docs/12-arquitetura-frontend-mobile.md`). |
| A2 | Provedor de Backend / BaaS | Conforme | Supabase oficializado em `docs/README.md`, `docs/PRODUCT-SPECIFICATION.md` e `docs/29-decisoes-arquiteturais.md` (ADR-12). |
| A3 | Autenticação gerenciada | Conforme | Supabase Auth (GoTrue) oficializado em `docs/03-identidade-roles-autenticacao.md`; senhas e hashes removidos de `public.users`. |
| A4 | Autorização no Banco (RLS) | Conforme | Row Level Security (RLS) mandatório em 100% das tabelas em `docs/04-autorizacao-seguranca.md`, `docs/08-modelo-banco-dados.md` e `docs/11-arquitetura-backend.md`. |
| A5 | Regra Central Ana 1 vs. Ana 2 | Conforme | Garantida estruturalmente no PostgreSQL via RLS: `appointments.professional_id = get_auth_professional_id()` para UPDATE/DELETE e SELECT irrestrito para admins na leitura da agenda global. |
| A6 | Prevenção de Double Booking | Conforme | PostgreSQL constraint `btree_gist` + RPC atômica `book_appointment` (`docs/07-motor-disponibilidade.md`). |
| A7 | Integração de API | Conforme | Contratos mapeados para Supabase PostgREST, RPCs e Edge Functions (`docs/10-api-especificacao.md`). |
| A8 | Notificações Push | Conforme | Database Webhooks + Supabase Edge Function (`send-push-notification`) + Expo Push API (`docs/14-notificacoes.md`). |
| A9 | Exclusão de Conta Google Play | Conforme | Edge Function (`delete-account-external`) + Triggers de anonimização no PostgreSQL (`docs/15-privacidade-exclusao-conta.md`). |
| A10 | Gestão de Ambientes e Secrets | Conforme | `EXPO_PUBLIC_SUPABASE_ANON_KEY` no client; `SUPABASE_SERVICE_ROLE_KEY` estritamente server-side nas Edge Functions (`docs/22-deploy-operacao-ambientes.md`). |
| A11 | Target Android API 36 e EAS | Conforme | EAS Build configurado para gerar AAB com targetSdkVersion 36 (`docs/18-android-build-assinatura-testes.md`). |

### Conclusão Final

A documentação do projeto está **100% consistente, unificada e auditada** sob a arquitetura oficial Supabase BaaS. Todas as pendências arquiteturais de escolha de backend, banco de dados e autenticação foram encerradas. O projeto está apto para o início da **Fase 1 de Implementação**.
