# 03. Modelo de Identidade, Roles e Autenticação

Status: CONFIRMADO.
Origem: regra de produto e regra de segurança (prompt mestre).

---

## 3.1 Conceito central

`role ≠ elemento de interface.`

O papel (`role`) é um dado de segurança, resolvido e armazenado no backend/banco, nunca inferido, escolhido
ou enviado pelo cliente (app). O frontend apenas reflete o que o backend informa após autenticação.

## 3.2 Roles existentes

| Role | Criação | Descrição |
|---|---|---|
| `client` | Cadastro público | Usuário que agenda atendimentos. |
| `admin` | Provisionamento manual controlado | Profissional/administradora com acesso à área administrativa e a uma agenda própria. |

O cadastro público (`RF-AUTH-001`) **sempre** resulta em `client`. Não existe endpoint, tela, parâmetro ou
opção de interface que permita que um cadastro público resulte em `admin`.

## 3.3 Provisionamento de admin

Admins são criados por mecanismo controlado, fora do fluxo de cadastro público. Mecanismos possíveis
(a confirmar em decisão de implementação — `PENDENTE DE DECISÃO` quanto ao mecanismo exato):

- Promoção manual de uma conta `client` existente para `admin`, executada por operação administrativa
  restrita (ex.: acesso direto ao banco/console do provedor, ou rotina interna sem exposição pública).
- Criação direta de conta com role `admin` por processo interno da proprietária do negócio/desenvolvedor.

Em qualquer mecanismo escolhido, vale a regra: **nenhum endpoint de API pública aceita `role` como
parâmetro de entrada para definir o papel do próprio usuário.**

## 3.4 Relação conceitual `user → professional → appointment`

```
users (1) ---- (0..1) professionals (1) ---- (N) appointments
users (client) (1) ---------------------------- (N) appointments
```

- Um `user` com role `admin` está associado a **no máximo um** registro em `professionals` (o profissional
  que ele representa). Essa associação é a base da regra de autorização de escrita (ver
  `04-autorizacao-seguranca.md`).
- Um `user` com role `client` não possui associação com `professionals`.
- Um `appointment` referencia exatamente um `client` (via `users`) e exatamente um `professional` (via
  `professionals`), além de um `service`.

## 3.5 Estado da conta

| Atributo | Domínio | Descrição |
|---|---|---|
| `email_verified` | boolean | Indica se o e-mail foi confirmado. Obrigatório ser `true` para uso funcional. |
| `is_active` | boolean | Indica se a conta está ativa. Contas inativas não autenticam com sucesso. |
| `role` | `client` \| `admin` | Papel de segurança do usuário. |

## 3.6 Fluxo de autenticação — visão geral

```
Cadastro
  → envio de e-mail de confirmação
  → confirmação de e-mail (email_verified = true)
  → login
  → identificação de role (backend)
  → fluxo client OU fluxo admin
```

### 3.6.1 Cadastro (RF-AUTH-001)

Campos obrigatórios: nome, e-mail, telefone, senha, confirmação de senha.

Validações mínimas:

- Nome: não vazio, tamanho mínimo razoável.
- E-mail: formato válido, unicidade (não pode haver dois usuários com o mesmo e-mail).
- Telefone: formato válido para o mercado (Brasil), unicidade não obrigatória salvo decisão contrária —
  `PENDENTE DE DECISÃO`.
- Senha: política mínima de complexidade a ser definida pelo provedor de autenticação escolhido — detalhes
  concretos (tamanho mínimo, caracteres exigidos) ficam como `REQUER VALIDAÇÃO OFICIAL` junto à documentação
  do provedor.
- Confirmação de senha: deve ser idêntica à senha.

Resultado: conta criada com `role = client`, `email_verified = false`, `is_active = true`.

### 3.6.2 Confirmação de e-mail (RF-AUTH-002 / RF-AUTH-008)

- Sistema envia e-mail com link/código de confirmação após cadastro.
- Enquanto `email_verified = false`, a conta autentica (login aceito) mas o app deve bloquear o uso
  funcional, direcionando para tela de "confirme seu e-mail", com opção de reenviar confirmação.
- Após confirmação, `email_verified = true` e o usuário segue para o fluxo normal.

### 3.6.3 Login (RF-AUTH-003)

- Tela única de login (e-mail + senha) para todos os usuários, independentemente do role.
- Não existe seletor de "entrar como cliente" ou "entrar como admin".
- Após autenticação bem-sucedida, o backend retorna sessão/token e os dados de identidade, incluindo `role`
  e, se `admin`, o `professional_id` associado.
- O frontend usa exclusivamente esse dado de backend para decidir a navegação (ver
  `10-arquitetura-frontend-mobile.md` e `11-navegacao-rotas.md`... consolidados em `11-arquitetura-frontend-mobile.md`).

### 3.6.4 Recuperação e redefinição de senha (RF-AUTH-005 / RF-AUTH-006)

- Usuário solicita recuperação informando e-mail.
- Sistema envia link/token de redefinição com validade limitada (tempo exato a definir — `PENDENTE DE
  DECISÃO`, sugestão de referência: prática comum de provedores de autenticação, a validar na documentação
  oficial do provedor escolhido).
- Redefinição exige nova senha + confirmação, seguindo a mesma política de complexidade do cadastro.
- Após redefinição, sessões antigas devem ser invalidadas — comportamento exato depende do provedor
  (`REQUER VALIDAÇÃO OFICIAL`).

### 3.6.5 Logout (RF-AUTH-004)

- Encerra sessão no backend/provedor (invalidação de token quando suportado) e limpa dados sensíveis do
  armazenamento local do dispositivo (ver `15-android.md`, seção de armazenamento).

### 3.6.6 Sessão expirada / inválida

- Chamadas à API com sessão expirada/inválida retornam erro de autenticação (401); o app deve redirecionar
  para o login, preservando, quando possível, a intenção de navegação anterior (retomar após novo login é
  desejável, não obrigatório no MVP).

### 3.6.7 Conta desativada

- Login com conta `is_active = false` é rejeitado com mensagem genérica de erro de autenticação (evitar
  vazar detalhes sobre o motivo específico, por princípio de exposição mínima de dados — `RNF-SEC-001`).

## 3.7 Provedor de autenticação

A escolha concreta do provedor/tecnologia de autenticação (ex.: serviço gerenciado com suporte nativo a
verificação de e-mail e sessão) deve ser validada contra a documentação oficial vigente do provedor
selecionado antes da implementação. Este documento não presume um provedor específico além do requisito
funcional de suportar: cadastro com senha, verificação de e-mail, recuperação de senha e emissão de sessão/
token utilizável pelo backend para checagem de identidade e role.

Status da escolha de provedor: `PENDENTE DE DECISÃO` (arquitetural), com restrição obrigatória de que o
mecanismo de definição de `role` seja controlado no backend, independentemente do provedor escolhido.

## 3.8 Estados de autenticação (resumo para frontend)

| Estado | Condição | Comportamento esperado |
|---|---|---|
| Não autenticado | Sem sessão válida | Acesso apenas a telas públicas (login, cadastro, recuperação de senha). |
| Autenticado, e-mail não verificado | Sessão válida, `email_verified = false` | Acesso apenas à tela de confirmação de e-mail. |
| Autenticado, client | Sessão válida, `email_verified = true`, `role = client` | Acesso ao fluxo de cliente. |
| Autenticado, admin | Sessão válida, `email_verified = true`, `role = admin` | Acesso à área administrativa. |
| Sessão expirada | Token expirado/inválido | Redirecionamento para login. |
