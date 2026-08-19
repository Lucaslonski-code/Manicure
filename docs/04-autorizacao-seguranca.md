# 04. Autorização (RBAC) e Segurança

Status: CONFIRMADO. Este é o documento de maior criticidade do projeto — contém a regra central de negócio
e segurança do sistema. Toda contradição com este documento em qualquer outro arquivo é um defeito
documental a ser corrigido (ver `22-auditoria-consistencia.md`).

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

Esta tabela é a referência normativa para: API (`08-api-especificacao.md`), banco (`07-modelo-banco-dados.md`),
frontend administrativo (`12-ux-ui-design-system.md`), testes (`14-testes-qa.md`) e critérios de aceitação
(`21-matriz-rastreabilidade-criterios-aceitacao.md`).

## 4.3 Por que esconder um botão não é segurança

Esconder ou desabilitar um botão na interface impede apenas o **acesso casual** através do aplicativo
oficial. Não impede:

- Chamada direta ao endpoint da API via ferramenta externa (ex.: cliente HTTP, proxy de interceptação).
- Reconstrução manual da requisição observando o tráfego do aplicativo.
- Modificação do aplicativo (engenharia reversa, build alterado) para reexibir a ação.
- Uso de outro cliente (futuro app iOS, integração de terceiros) que não implemente a mesma ocultação.

Por isso, a interface **deve** ocultar/desabilitar ações não permitidas (para boa experiência e prevenção de
erro), mas a autorização **efetiva** deve ser reaplicada de forma independente em toda camada que recebe a
requisição:

1. **API/backend**: toda rota de escrita revalida `role` e `professional_id` a partir da sessão autenticada,
   nunca a partir de parâmetros enviados pelo cliente.
2. **Banco de dados**: quando o mecanismo de acesso ao banco suportar políticas de acesso em nível de linha
   (Row Level Security — RLS) ou equivalente, essas políticas devem replicar a mesma regra, como camada de
   defesa adicional independente do backend de aplicação.

## 4.4 Cenário de ataque de referência

**Cenário:** Ana 1 intercepta ou constrói manualmente uma requisição HTTP para cancelar um agendamento cujo
`professional_id` pertence a Ana 2 (P2), alterando diretamente o `appointment_id` no corpo/URL da requisição
sem passar pela interface.

**Camadas de defesa esperadas, em ordem:**

1. **Frontend (não confiável, apenas UX):** a opção de cancelar nem aparece para agendamentos de P2 na
   interface de Ana 1. Isso não é considerado defesa para fins de segurança, apenas prevenção de erro
   operacional.
2. **API/backend (defesa primária):** o endpoint de cancelamento identifica o usuário autenticado pela
   sessão (não por parâmetro do cliente), busca o `appointment`, compara `appointment.professional_id` com
   `current_user.professional_id` e retorna `403 Forbidden` quando divergente. A operação de cancelamento
   **não é executada**.
3. **Banco de dados (defesa em profundidade):** caso o modelo de acesso ao banco utilize políticas de
   RLS/equivalente, mesmo uma falha hipotética na camada de aplicação (bug, endpoint mal implementado) seria
   barrada na tentativa de UPDATE/DELETE na tabela `appointments`, pois a política de linha exige que
   `professional_id` da linha corresponda ao `professional_id` do usuário autenticado na conexão.
4. **Auditoria:** a tentativa negada é registrável em log de auditoria (ver `16-backup-auditoria-observabilidade.md`),
   permitindo detecção de tentativas repetidas de acesso indevido.

Resultado esperado: requisição retorna erro de autorização (`403`), nenhuma alteração é persistida, e o
agendamento de Ana 2 permanece inalterado.

## 4.5 Camadas de segurança — visão consolidada

| Camada | Responsabilidade |
|---|---|
| Frontend | UX: ocultar/desabilitar ações não permitidas; nunca é fonte de verdade de autorização. |
| API/backend | Autenticação da requisição, resolução de identidade e role a partir da sessão, validação de regra de negócio (`professional_id` correspondente), respostas de erro padronizadas. |
| Banco de dados | Constraints de integridade referencial; políticas de acesso em nível de linha (RLS ou equivalente), quando o mecanismo de acesso ao dado for compartilhado entre múltiplos usuários/roles na mesma conexão lógica. |
| Auditoria | Registro de tentativas de escrita, sucesso e falha, para detecção e investigação. |

## 4.6 Outros princípios de segurança (RNF-SEC)

- **Menor privilégio:** cada credencial/serviço técnico (ex.: chave de API de notificações, credenciais de
  banco) possui apenas o acesso mínimo necessário à sua função.
- **Proteção contra acesso horizontal (IDOR/BOLA):** todo endpoint que recebe um identificador de recurso
  (ex.: `appointment_id`) deve validar que o usuário autenticado tem relação legítima com aquele recurso
  antes de retornar dados ou permitir alteração — aplica-se tanto à agenda quanto ao perfil.
- **Proteção contra acesso vertical (privilege escalation):** nenhum endpoint aceita `role` ou
  `professional_id` como entrada controlável pelo cliente para operações sensíveis; esses valores são
  sempre resolvidos a partir da sessão autenticada no backend.
- **Validação e sanitização:** toda entrada de usuário (nome, observação, e-mail, telefone) é validada em
  formato e tamanho no backend, independentemente de validação já existente no frontend.
- **Tokens e sessão:** tokens de sessão armazenados de forma seletivamente segura no dispositivo (ver
  `15-android.md`), nunca em texto legível por outros aplicativos, nunca logados em texto claro.
- **Secrets:** nenhuma credencial de backend (chaves de banco, chaves de serviço de notificação, etc.) reside
  no aplicativo mobile; o app conhece apenas endpoints públicos e, quando aplicável, chaves públicas
  destinadas a clientes (ver `17-ambientes-secrets.md`... consolidado em `16-deploy-operacao-ambientes.md`).
- **Rate limiting e força bruta:** endpoints de login, recuperação de senha e criação de conta devem possuir
  limitação de tentativas — mecanismo concreto a validar na documentação oficial do provedor/infraestrutura
  escolhida (`REQUER VALIDAÇÃO OFICIAL`).
- **Exposição mínima de dados:** respostas de erro não revelam se um e-mail existe na base (ex.: mensagens
  genéricas em login e recuperação de senha).
- **Backups e recuperação:** ver `16-deploy-operacao-ambientes.md`.

## 4.7 Aplicação da regra por domínio (referência cruzada)

| Domínio | Onde a regra é aplicada | Documento |
|---|---|---|
| Banco de dados | Constraint/FK de `appointments.professional_id`; política de linha (se aplicável) | `07-modelo-banco-dados.md` |
| API | Middleware/handler de autorização em cada endpoint de escrita | `08-api-especificacao.md` |
| Backend | Camada de regra de negócio antes de qualquer persistência | `09-arquitetura-backend.md` |
| Frontend | Ocultação de ações não permitidas (UX, não segurança) | `11-arquitetura-frontend-mobile.md`, `12-ux-ui-design-system.md` |
| Testes | Casos negativos obrigatórios (Ana 1 x Ana 2) | `14-testes-qa.md` |
| Critérios de aceitação | Verificação explícita da regra ponta a ponta | `21-matriz-rastreabilidade-criterios-aceitacao.md` |
