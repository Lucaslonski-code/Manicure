# 04. Autorização (RBAC) e Segurança

Status: CONFIRMADO. Este é o documento de maior criticidade do projeto — contém a regra central de negócio
e segurança do sistema. Toda contradição com este documento em qualquer outro arquivo é um defeito
documental a ser corrigido (ver `31-auditoria-consistencia.md`).

---

## 4.1 Regra central

> Todos os admins podem **visualizar** todos os agendamentos (agenda global).
> Somente o admin vinculado ao profissional responsável por um agendamento pode **modificá-lo**
> (alterar, cancelar, excluir, reagendar).

Formalmente, para qualquer operação de escrita sobre um `appointment`:

```
PERMITIR escrita SE E SOMENTE SE:
  autenticado = verdadeiro
  E email_verified = verdadeiro
  E current_user.role = "admin"
  E current_user.professional_id = appointment.professional_id
```

Para operação de leitura da agenda administrativa:

```
PERMITIR leitura SE E SOMENTE SE:
  autenticado = verdadeiro
  E email_verified = verdadeiro
  E current_user.role = "admin"
```

(sem restrição adicional de `professional_id` para leitura).

## 4.2 Exemplo de referência (usado em todos os documentos)

- Ana 1 é `admin`, vinculada ao `professional_id = P1`.
- Ana 2 é `admin`, vinculada ao `professional_id = P2`.

| Ação | Ana 1 sobre agendamentos de P1 | Ana 1 sobre agendamentos de P2 | Ana 2 sobre agendamentos de P1 | Ana 2 sobre agendamentos de P2 |
|---|---|---|---|---|
| Visualizar | Permitido | Permitido | Permitido | Permitido |
| Editar | Permitido | Negado | Negado | Permitido |
| Cancelar | Permitido | Negado | Negado | Permitido |
| Excluir | Permitido | Negado | Negado | Permitido |
| Reagendar | Permitido | Negado | Negado | Permitido |

Esta tabela é a referência normativa para: API (`10-api-especificacao.md`), banco (`08-modelo-banco-dados.md`),
frontend administrativo (`12-arquitetura-frontend-mobile.md`, `13-ux-ui-design-system.md`), testes (`24-testes-qa.md`) e critérios de aceitação
(`26-matriz-rastreabilidade-criterios-aceitacao.md`).

## 4.3 Por que esconder um botão não é segurança

Esconder ou desabilitar um botão na interface impede apenas o **acesso casual** através do aplicativo
oficial. Não impede:

- Chamada direta ao PostgREST / Supabase Client via ferramenta externa (ex.: cliente HTTP, proxy de interceptação).
- Reconstrução manual da requisição observando o tráfego do aplicativo.
- Modificação do aplicativo (engenharia reversa, build alterado) para reexibir a ação.
- Uso de outro cliente (futuro app iOS, integração de terceiros) que não implemente a mesma ocultação.

Por isso, a interface **deve** ocultar/desabilitar ações não permitidas (para boa experiência e prevenção de
erro), mas a autorização **efetiva** é aplicada de forma inviolável no **PostgreSQL via Row Level Security (RLS)**:

1. **Banco de dados (PostgreSQL + RLS — Defesa Primária e Definitiva):** Todas as tabelas públicas possuem RLS habilitado. As políticas de `SELECT`, `UPDATE` e `DELETE` utilizam `auth.uid()`, `get_auth_role()` e `get_auth_professional_id()` para garantir que qualquer requisição — mesmo forjada — seja barrada diretamente no motor do banco.
2. **PostgreSQL RPCs e Validações Server-side:** Mutações complexas (criação com checagem de concorrência) são executadas em Stored Functions `SECURITY DEFINER` que revalidam a identidade e integridade antes de persistir.
3. **Frontend (Apenas UX):** Oculta ações não permitidas para feedback visual imediato ao usuário.

## 4.4 Cenário de ataque de referência

**Cenário:** Ana 1 intercepta ou constrói manualmente uma requisição ao Supabase para cancelar ou alterar um agendamento cujo
`professional_id` pertence a Ana 2 (P2), alterando diretamente o `appointment_id` sem passar pela interface.

**Camadas de defesa em ordem:**

1. **Frontend (não confiável, apenas UX):** a opção de cancelar não aparece para agendamentos de P2 na
   interface de Ana 1. Isso não é segurança, apenas prevenção de erro operacional.
2. **PostgreSQL / Row Level Security (RLS — Defesa Mandatória):** A política de `UPDATE` da tabela `appointments` avalia:
   ```
   (get_auth_role() = 'admin' AND professional_id = get_auth_professional_id())
   ```
   Como o `professional_id` da linha pertence a P2 e o `get_auth_professional_id()` de Ana 1 retorna P1, a condição é `false`. O banco rejeita a alteração (0 linhas afetadas / erro de permissão).
3. **Auditoria:** Triggers de auditoria registram a tentativa em `public.audit_logs`, permitindo investigação.

Resultado esperado: nenhuma alteração é persistida, e o agendamento de Ana 2 permanece inalterado.

## 4.5 Camadas de segurança — visão consolidada

| Camada | Responsabilidade | Mecanismo |
|---|---|---|
| Frontend | UX: ocultar/desabilitar ações não permitidas; nunca é fonte de verdade de autorização. | React Native / Contexto de Auth |
| API / BaaS | Autenticação de tokens JWT, exposição de endpoints seguros. | Supabase Auth + PostgREST |
| Banco de dados | **Autorização definitiva**, integridade referencial, constraints e regras de concorrência. | **PostgreSQL RLS** + Stored Procedures / RPCs |
| Auditoria | Registro de tentativas de escrita e ações sensíveis. | Database Triggers em `public.audit_logs` |

## 4.6 Outros princípios de segurança (RNF-SEC)

- **Menor privilégio:** O cliente mobile utiliza exclusivamente a chave pública anônima (`anon key`) combinada com o token JWT do usuário autenticado. A chave de serviço (`service_role key`) **nunca** é embutida no aplicativo.
- **Proteção contra acesso horizontal (IDOR/BOLA):** Garantida pelo RLS em todas as tabelas (um cliente só enxerga seus próprios agendamentos; um admin enxerga todos na leitura, mas só altera os seus).
- **Proteção contra acesso vertical (privilege escalation):** A tabela `public.users` proíbe alteração do campo `role` por usuários comuns via políticas RLS. O cadastro público fixa `role = 'client'` via trigger de banco.
- **Validação e sanitização:** Validação de tipos, constraints de checagem (`CHECK`) e constraints de exclusão temporal no banco de dados.
- **Tokens e sessão:** Tokens JWT e refresh tokens gerenciados pelo Supabase SDK e armazenados em keystore seguro (`expo-secure-store`).
- **Secrets:** Credenciais privilegiadas existem unicamente no ambiente de execução das Supabase Edge Functions.
- **Exposição mínima de dados:** Respostas padronizadas, sem confirmação da existência de contas em tentativas de recuperação.

## 4.7 Aplicação da regra por domínio (referência cruzada)

| Domínio | Onde a regra é aplicada | Documento |
|---|---|---|
| Banco de dados | Constraint/FK de `appointments.professional_id`; políticas de RLS obrigatórias | `08-modelo-banco-dados.md` |
| API | PostgREST filtrado por RLS e Stored Functions RPC | `10-api-especificacao.md` |
| Backend | Arquitetura BaaS Supabase + RLS + Edge Functions | `11-arquitetura-backend.md` |
| Frontend | Ocultação visual de ações não permitidas (UX) | `12-arquitetura-frontend-mobile.md`, `13-ux-ui-design-system.md` |
| Testes | Casos negativos obrigatórios (Ana 1 x Ana 2, Client x Admin) | `24-testes-qa.md` |
| Critérios de aceitação | Verificação explícita da regra ponta a ponta | `25-criterios-aceitacao.md`, `26-matriz-rastreabilidade-criterios-aceitacao.md` |
