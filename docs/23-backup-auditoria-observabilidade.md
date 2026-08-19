# 23. Backup, Auditoria e Observabilidade

Status: CONFIRMADO quanto à estrutura; ferramentas concretas dependem da escolha final de backend/infra
(`20-decisoes-arquiteturais.md`), a validar na documentação oficial do(s) serviço(s) escolhido(s).

## 23.1 Backup

| Item | Requisito |
|---|---|
| Banco de dados | Backups periódicos automatizados (frequência exata `PENDENTE DE DECISÃO`, dependente da oferta do provedor de banco escolhido) com retenção suficiente para restauração em caso de perda de dados. |
| Storage (se introduzido futuramente) | Mesmo princípio de backup periódico, quando aplicável — fora do MVP (ver `11-arquitetura-backend.md`, seção 11.8). |
| Restauração | Processo de restauração deve ser testável/verificável periodicamente, não apenas assumido como funcional — cadência de teste de restauração `PENDENTE DE DECISÃO`. |
| Integridade | Backups devem ser verificados quanto à integridade (possibilidade de restauração completa), não apenas quanto à existência do arquivo/snapshot. |
| Recuperação | Objetivo de tempo de recuperação (RTO) e objetivo de ponto de recuperação (RPO) não possuem valores numéricos definidos pelo produto — `PENDENTE DE DECISÃO`, não inventados aqui. |

A escolha de um provedor de banco gerenciado com backup automatizado nativo é a estratégia preferencial,
reduzindo a necessidade de rotina de backup construída manualmente — decisão concreta de provedor:
`PENDENTE DE DECISÃO` em `26-decisoes-arquiteturais.md`.

## 23.2 Auditoria

Base de dados: tabela `audit_logs` (ver `08-modelo-banco-dados.md`, seção 8.10).

| Categoria de evento | Exemplos |
|---|---|
| Autenticação | Login bem-sucedido, login falho, logout, redefinição de senha. |
| Criação | Criação de agendamento, criação de bloqueio/disponibilidade. |
| Alteração | Atualização de agendamento, reagendamento, atualização de perfil. |
| Cancelamento | Cancelamento de agendamento (por cliente ou admin). |
| Exclusão | Exclusão de agendamento (admin), exclusão de conta (cliente/admin). |
| Mudanças administrativas | Provisionamento de novo admin, ativação/desativação de profissional ou serviço. |
| Tentativas negadas | Qualquer tentativa de escrita bloqueada por autorização (ex.: Ana 1 tentando alterar agendamento de Ana 2) — ver `04-autorizacao-seguranca.md`, seção 4.4. |

Cada registro de auditoria inclui, no mínimo: ator, ação, recurso afetado, resultado (sucesso/negado) e
timestamp — conforme já especificado na entidade `audit_logs`.

## 23.3 Observabilidade

| Categoria | Descrição |
|---|---|
| Logs técnicos | Erros de aplicação, exceções não tratadas — distintos da auditoria de negócio (ver `11-arquitetura-backend.md`, seção 11.11). |
| Erros | Captura e registro de erros críticos (ex.: falha ao processar agendamento, falha ao enviar notificação, falha de autenticação em massa). |
| Métricas | Indicadores operacionais básicos (ex.: taxa de erro de requisições, tempo de resposta) — ferramenta concreta `PENDENTE DE DECISÃO`, dependente do provedor de backend escolhido. |
| Falhas críticas | Mecanismo de alerta para falhas que afetem a operação do negócio (ex.: backend indisponível, motor de disponibilidade retornando erros sistemáticos) — mecanismo exato de alerta (e-mail, painel, outro) é `PENDENTE DE DECISÃO`. |
| Disponibilidade | Monitoramento de disponibilidade do backend — ferramenta concreta `PENDENTE DE DECISÃO`. |
| Problemas de agendamento | Monitoramento específico de falhas na criação/alteração de agendamento (ex.: taxa elevada de conflitos 409 pode indicar problema no motor de disponibilidade ou uso indevido). |
| Problemas de autenticação | Monitoramento de taxa elevada de falhas de login (possível indicativo de ataque de força bruta), complementando a proteção de rate limiting (ver `04-autorizacao-seguranca.md`, seção 4.6). |

O escopo exato de ferramentas de observabilidade (ex.: painel de erros, métricas, alertas) depende
diretamente da escolha de backend/infraestrutura e deve ser delimitado, na implementação, ao que está
efetivamente disponível na documentação oficial do(s) serviço(s) escolhido(s) — não presumir recursos não
confirmados.
