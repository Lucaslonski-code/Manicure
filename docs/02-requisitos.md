# 02. Requisitos Funcionais e Não Funcionais

Status: CONFIRMADO. Cada requisito possui ID único, reutilizado na matriz de rastreabilidade
(`26-matriz-rastreabilidade-criterios-aceitacao.md`).

Convenção de IDs: `RF-<DOMÍNIO>-<NNN>` para funcionais, `RNF-<DOMÍNIO>-<NNN>` para não funcionais.

---

## 2.1 Requisitos funcionais

### Autenticação e conta (AUTH)

| ID | Nome | Ator | Descrição resumida |
|---|---|---|---|
| RF-AUTH-001 | Cadastro de conta | Visitante | Criar conta com nome, e-mail, telefone, senha e confirmação de senha; role resultante sempre `client`. |
| RF-AUTH-002 | Confirmação de e-mail | Visitante/Cliente | Confirmar posse do e-mail via link/código antes de liberar uso funcional. |
| RF-AUTH-003 | Login único | Cliente/Admin | Autenticar-se em uma única tela; o sistema resolve o papel após autenticação. |
| RF-AUTH-004 | Logout | Cliente/Admin | Encerrar sessão ativa e limpar dados locais sensíveis. |
| RF-AUTH-005 | Recuperação de senha | Visitante/Cliente/Admin | Solicitar redefinição de senha via e-mail cadastrado. |
| RF-AUTH-006 | Redefinição de senha | Visitante/Cliente/Admin | Definir nova senha a partir de link/token de recuperação válido. |
| RF-AUTH-007 | Identificação de role pós-login | Sistema | Determinar `client` ou `admin` a partir de dado de backend, nunca do frontend. |
| RF-AUTH-008 | Bloqueio de conta não verificada | Sistema | Impedir uso funcional do app enquanto e-mail não estiver confirmado. |
| RF-AUTH-009 | Exclusão de conta | Cliente/Admin | Permitir que o usuário solicite exclusão da própria conta (ver `15-privacidade-exclusao-conta.md`). |

### Perfil (PROFILE)

| ID | Nome | Ator | Descrição |
|---|---|---|---|
| RF-PROFILE-001 | Visualizar perfil | Cliente/Admin | Exibir nome, e-mail, telefone do usuário autenticado. |
| RF-PROFILE-002 | Editar dados de perfil | Cliente/Admin | Permitir alteração de nome e telefone; alteração de e-mail sujeita a nova verificação. |

### Profissionais e serviços (CATALOG)

| ID | Nome | Ator | Descrição |
|---|---|---|---|
| RF-CAT-001 | Listar profissionais ativos | Cliente | Exibir profissionais disponíveis para agendamento. |
| RF-CAT-002 | Listar serviços do profissional | Cliente | Exibir serviços ativos oferecidos pelo profissional selecionado. |
| RF-CAT-003 | Gerenciar serviços | Admin | Cadastrar/editar/ativar/desativar serviços do próprio catálogo. |
| RF-CAT-004 | Vincular serviço a profissional | Admin | Definir quais serviços um profissional oferece, com duração e preço (se aplicável). |

### Disponibilidade (AVAIL)

| ID | Nome | Ator | Descrição |
|---|---|---|---|
| RF-AVAIL-001 | Definir jornada de trabalho | Admin | Configurar dias/horários de atendimento do próprio profissional. |
| RF-AVAIL-002 | Definir bloqueios/folgas | Admin | Registrar períodos indisponíveis do próprio profissional. |
| RF-AVAIL-003 | Consultar horários disponíveis | Cliente | Exibir apenas horários compatíveis com jornada, bloqueios, duração do serviço e agendamentos existentes. |

### Agendamento (APPT)

| ID | Nome | Ator | Descrição |
|---|---|---|---|
| RF-APPT-001 | Criar agendamento | Cliente | Selecionar profissional, serviço, data e horário válidos; confirmar. |
| RF-APPT-002 | Impedir conflito de horário | Sistema | Rejeitar criação/alteração que gere sobreposição para o mesmo profissional. |
| RF-APPT-003 | Visualizar meus agendamentos | Cliente | Listar agendamentos futuros e passados do próprio usuário. |
| RF-APPT-004 | Cancelar agendamento (cliente) | Cliente | Cancelar o próprio agendamento, respeitando prazo mínimo se definido. |
| RF-APPT-005 | Visualizar agenda global | Admin | Listar todos os agendamentos de todos os profissionais do negócio. |
| RF-APPT-006 | Alterar agendamento (admin) | Admin | Alterar apenas agendamentos do profissional ao qual o admin está vinculado. |
| RF-APPT-007 | Cancelar agendamento (admin) | Admin | Cancelar apenas agendamentos do profissional ao qual o admin está vinculado. |
| RF-APPT-008 | Excluir agendamento (admin) | Admin | Excluir apenas agendamentos do profissional ao qual o admin está vinculado. |
| RF-APPT-009 | Reagendar (admin) | Admin | Alterar data/horário apenas de agendamentos do próprio profissional. |
| RF-APPT-010 | Histórico de agendamentos | Cliente/Admin | Consultar agendamentos concluídos/cancelados. |
| RF-APPT-011 | Observação da cliente | Cliente | Incluir observação textual opcional ao criar agendamento. |
| RF-APPT-012 | Observação administrativa | Admin | Incluir observação textual associada ao próprio agendamento. |
| RF-APPT-013 | Dados de contato no detalhe | Admin | Exibir nome, telefone e e-mail da cliente no detalhe do agendamento. |

### Agenda administrativa (AGENDA)

| ID | Nome | Ator | Descrição |
|---|---|---|---|
| RF-AGENDA-001 | Visão diária/semanal/mensal | Admin | Alternar granularidade de visualização da agenda global. |
| RF-AGENDA-002 | Filtros | Admin | Filtrar por profissional, serviço, status e data. |
| RF-AGENDA-003 | Busca | Admin | Buscar por nome da cliente. |
| RF-AGENDA-004 | Indicação visual de permissão | Admin | Diferenciar visualmente itens editáveis (próprio profissional) de itens somente leitura. |

### Notificações (NOTIF)

| ID | Nome | Ator | Descrição |
|---|---|---|---|
| RF-NOTIF-001 | Confirmação de agendamento | Sistema | Notificar cliente e admin responsável na criação. |
| RF-NOTIF-002 | Alteração de agendamento | Sistema | Notificar partes envolvidas quando dados relevantes mudarem. |
| RF-NOTIF-003 | Cancelamento | Sistema | Notificar partes envolvidas no cancelamento. |
| RF-NOTIF-004 | Lembrete | Sistema | Notificar cliente antes do horário agendado. |

Detalhamento completo em `14-notificacoes.md`.

---

## 2.2 Requisitos não funcionais

| ID | Categoria | Descrição |
|---|---|---|
| RNF-SEC-001 | Segurança | Toda decisão de autorização deve ser aplicada em camada de backend/banco, nunca somente no frontend. |
| RNF-SEC-002 | Segurança | Senhas nunca armazenadas em texto puro; uso de hashing pelo Supabase Auth. |
| RNF-SEC-003 | Segurança | Comunicação cliente-servidor exclusivamente via HTTPS/TLS. |
| RNF-PRIV-001 | Privacidade | Dados pessoais coletados apenas com finalidade declarada (ver `15-privacidade-exclusao-conta.md`). |
| RNF-DISP-001 | Disponibilidade | Indisponibilidade planejada deve ser comunicável; sem SLA numérico definido para o MVP — `PENDENTE DE DECISÃO`. |
| RNF-CONF-001 | Confiabilidade | Nenhuma operação de escrita em `appointments` pode resultar em sobreposição de horários para o mesmo profissional, mesmo sob concorrência. |
| RNF-INTEG-001 | Integridade | Toda alteração de dado sensível (agendamento, conta) deve ser auditável (ver `23-backup-auditoria-observabilidade.md`). |
| RNF-PERF-001 | Desempenho | Sem metas numéricas de latência definidas no MVP sem medição prévia — `PENDENTE DE DECISÃO`. Não inventar valores. |
| RNF-ESCALA-001 | Escalabilidade | Arquitetura deve suportar crescimento do número de profissionais e agendamentos sem redesenho estrutural do modelo de dados. |
| RNF-ACESS-001 | Acessibilidade | Interface deve seguir práticas mínimas de acessibilidade mobile (contraste, tamanho de toque, leitura por leitor de tela) — detalhado em `13-ux-ui-design-system.md`. |
| RNF-MANUT-001 | Manutenibilidade | Código e documentação organizados por domínio, permitindo manutenção por terceiros sem depender do autor original. |
| RNF-OBS-001 | Observabilidade | Erros críticos (falha de autenticação, falha de agendamento) devem ser registráveis para diagnóstico. |
| RNF-COMPAT-001 | Compatibilidade | Compatibilidade com Android conforme `16-android.md` (API mínima e alvo definidas ali). |
| RNF-COMPAT-002 | Compatibilidade futura | Decisões de arquitetura não devem impedir futura versão iOS (ver `28-arquitetura-futura-ios.md`). |
| RNF-CONCUR-001 | Concorrência | Duas requisições simultâneas de agendamento para o mesmo profissional/horário não podem ambas ser aceitas. |

Nenhum valor numérico de SLA, throughput ou latência foi definido pelo produto até o momento; onde necessário,
os documentos técnicos referenciam este requisito como `PENDENTE DE DECISÃO` em vez de presumir números.
