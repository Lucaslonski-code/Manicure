# 11. Arquitetura Backend

Status: CONFIRMADO. Documento conceitual/arquitetural — nenhuma implementação.

## 11.1 Responsabilidades por camada (visão consolidada)

| Camada | Responsabilidade | Confiável para segurança? |
|---|---|---|
| Frontend (app mobile) | Coleta de entrada, validação de UX (feedback imediato), exibição condicional de ações, cache local, navegação. | Não — apenas UX. |
| API/Backend | Autenticação da requisição, resolução de identidade e role, validação de regra de negócio, orquestração de escrita, envio de notificações, geração de auditoria. | Sim — camada primária. |
| Banco de dados | Integridade referencial, constraints de unicidade/exclusão, políticas de acesso em nível de linha (RLS ou equivalente) quando aplicável. | Sim — camada de defesa em profundidade. |

Todo dado enviado pelo cliente (app) é tratado como não confiável até validado no backend — inclusive
campos que o frontend já valida (ver `RNF-SEC-001`, `04-autorizacao-seguranca.md`).

## 11.2 Módulos conceituais do backend

```
backend/
  auth/            → cadastro, login, verificação, recuperação, sessão
  users/           → perfil, exclusão de conta
  professionals/   → CRUD de profissionais (provisionamento controlado)
  services/        → catálogo de serviços
  availability/    → jornada e bloqueios
  appointments/     → motor de agendamento, disponibilidade, conflito, transições de estado
  admin-agenda/    → consultas de agenda global (leitura ampla) e escrita restrita
  notifications/   → orquestração de envio (push/local) — ver 14
  audit/           → registro de eventos sensíveis
  shared/
    authz/         → middleware/helpers de autorização (regra Ana 1 / Ana 2)
    validation/    → validação de entrada
    errors/        → padronização de respostas de erro
```

Esta é uma organização conceitual por domínio; a tecnologia concreta do backend (framework, linguagem)
consta como decisão arquitetural em `20-decisoes-arquiteturais.md`.

## 11.3 Fluxo conceitual de uma escrita administrativa (exemplo: cancelar agendamento)

```
1. Requisição chega com token de sessão.
2. Middleware de autenticação resolve current_user a partir do token (não do payload).
3. Middleware de autorização verifica current_user.role = admin.
4. Handler busca appointment pelo id.
   4.1. Se não existir → 404.
5. Handler compara appointment.professional_id com current_user.professional_id
   (resolvido via tabela professionals, nunca enviado pelo cliente).
   5.1. Se divergente → 403 + registro em audit_logs (negado).
6. Handler aplica regra de transição de estado (ex.: não cancelar já cancelado).
7. Handler executa a escrita em transação, com constraints do banco como defesa adicional.
8. Handler dispara notificação (assíncrona, ver 14).
9. Handler registra sucesso em audit_logs.
10. Resposta 200 ao cliente.
```

## 11.4 RLS (Row Level Security) — papel na arquitetura

Quando o mecanismo de acesso ao banco permitir que múltiplas conexões representem diretamente o usuário
final (padrão comum em certas plataformas de backend gerenciado sobre PostgreSQL), políticas de RLS devem
replicar, na tabela `appointments`, a mesma regra central:

- Política de leitura (`SELECT`): permitida se `current_setting('app.role') = 'admin'` (ou equivalente) —
  sem restrição adicional de propriedade, refletindo a agenda global.
- Política de escrita (`UPDATE`/`DELETE`): permitida apenas se, além do papel `admin`, o `professional_id`
  da linha corresponder ao profissional associado ao usuário autenticado na sessão de banco.

Caso a arquitetura escolhida utilize um backend de aplicação convencional com uma única credencial de banco
compartilhada (sem RLS por usuário final), a responsabilidade de aplicar a regra recai integralmente sobre a
camada de aplicação (seção 11.3), e RLS não é aplicável dessa forma — decisão concreta sobre o modelo de
acesso ao banco é registrada em `20-decisoes-arquiteturais.md` como `PENDENTE DE DECISÃO` até a escolha do
backend específico.

## 11.5 Funções de banco (conceito)

Quando funções armazenadas forem utilizadas (ex.: para encapsular a checagem de conflito de horário de forma
atômica — ver `07-motor-disponibilidade.md`, seção 7.6), elas devem:

- Ser a única via de escrita para a tabela `appointments` quando a estratégia de constraint de exclusão não
  for suficiente isoladamente.
- Nunca aceitar `professional_id` de "quem está autorizado" como parâmetro livre — a identidade deve vir do
  contexto de sessão/autenticação, não de argumento arbitrário.

## 11.6 Validação — divisão de responsabilidade

| Tipo de validação | Frontend | Backend |
|---|---|---|
| Formato de e-mail/telefone | Sim (feedback imediato) | Sim (obrigatório, não confiar no frontend) |
| Senha e confirmação idênticas | Sim | Sim |
| Campos obrigatórios preenchidos | Sim | Sim |
| Unicidade de e-mail | Não (não é possível verificar com segurança/atomicidade no cliente) | Sim |
| Disponibilidade de horário | Consulta de leitura (não reserva) | Sim — validação definitiva na escrita |
| Autorização (role, propriedade do agendamento) | Não é validação — é apenas ocultação de UI | Sim — única fonte de verdade |

## 11.7 Notificações (papel do backend)

O backend é responsável por orquestrar o envio de notificações (ver `14-notificacoes.md`) de forma
assíncrona em relação à operação principal (criação/alteração/cancelamento de agendamento), de modo que uma
falha no envio de notificação não deve impedir nem reverter a operação de agendamento em si.

## 11.8 Storage

O MVP não possui requisito funcional de upload de arquivos/imagens (ex.: fotos de unhas, avatar) — não
definido como parte obrigatória do escopo (ver `01-visao-escopo-atores.md`). Caso isso seja introduzido no
futuro, um serviço de storage de objetos deve ser adicionado como novo módulo, sem impacto na regra central
de autorização. Status: `PENDENTE DE DECISÃO` (fora do MVP).

## 11.9 Tratamento de erros — padronização

- Respostas de erro seguem estrutura conceitual única: código HTTP + código de erro interno estável (ex.:
  `PROFESSIONAL_MISMATCH`, `SLOT_CONFLICT`, `EMAIL_NOT_VERIFIED`) + mensagem — para permitir tratamento
  consistente no frontend sem depender de parsing de texto livre.
- Mensagens voltadas ao usuário final não devem expor detalhes internos (stack trace, nomes de tabela,
  queries).

## 11.10 Concorrência e integridade

Ver detalhamento em `07-motor-disponibilidade.md`, seção 7.6. O backend não deve depender exclusivamente de
uma checagem "ler depois escrever" sem garantia atômica — a garantia final deve residir em constraint de
banco e/ou transação com isolamento adequado.

## 11.11 Logs (técnicos, distintos de auditoria de negócio)

- Logs técnicos (erros de aplicação, exceções não tratadas, tempos de resposta) são distintos dos registros
  de `audit_logs` (que documentam eventos de negócio/segurança). Ambos são necessários; detalhamento de
  observabilidade em `18-deploy-operacao.md`.
