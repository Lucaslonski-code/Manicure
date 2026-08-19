# 15. Privacidade, Dados Pessoais e Exclusão de Conta

Status: CONFIRMADO quanto à estrutura. Não constitui texto jurídico de política de privacidade — apenas
especificação técnica de tratamento de dados, a ser usada como insumo para a política de privacidade
publicável (redigida separadamente por quem de direito).

## 15.1 Dados pessoais tratados pelo aplicativo

| Dado | Finalidade | Origem |
|---|---|---|
| Nome | Identificação da cliente/profissional em agendamentos e contato. | Cadastro |
| E-mail | Autenticação, verificação de conta, comunicação transacional, recuperação de senha. | Cadastro |
| Telefone | Contato relacionado ao agendamento (visível ao admin responsável e demais admins na agenda global). | Cadastro |
| Dados de autenticação (senha com hash, tokens de sessão) | Autenticação e manutenção de sessão. | Cadastro/Login |
| Agendamentos (data, horário, serviço, profissional) | Operação central do produto. | Uso do app |
| Observações (`client_note`, `admin_note`) | Contexto adicional do atendimento. | Uso do app |
| Token de dispositivo (push) | Envio de notificações. | Uso do app, após permissão |
| Dados técnicos mínimos (logs de erro, auditoria de ações sensíveis) | Segurança, diagnóstico, auditoria. | Operação do sistema |

Nenhum dado além dos listados é coletado no MVP (sem geolocalização, sem acesso a contatos do dispositivo,
sem câmera/fotos — ver `17-android-permissoes.md`).

## 15.2 Acesso aos dados

| Dado | Quem acessa |
|---|---|
| Perfil da cliente (nome, e-mail, telefone) | A própria cliente; qualquer admin, no contexto de um agendamento dela (agenda global — RF-APPT-013). |
| Perfil do admin (nome, e-mail, telefone) | O próprio admin. Exposição a clientes limitada ao nome de exibição do profissional (`professionals.display_name`); e-mail/telefone do admin não são expostos à cliente no MVP — `PENDENTE DE DECISÃO` caso isso mude. |
| Agendamentos | Cliente titular; qualquer admin (leitura global); escrita restrita ao admin responsável (ver `04-autorizacao-seguranca.md`). |
| Observações administrativas (`admin_note`) | Visível a qualquer admin na leitura da agenda global (mesmo tratamento de leitura ampla); edição restrita ao admin responsável. |

## 15.3 Armazenamento e segurança

- Dados armazenados no PostgreSQL gerenciado pelo Supabase com Row Level Security (RLS) mandatório.
- Senhas gerenciadas exclusivamente pelo Supabase Auth em `auth.users` (nunca no frontend, nunca em `public.users`).
- Comunicação 100% criptografada via HTTPS/TLS.
- Tokens de sessão armazenados no KeyStore do Android via `expo-secure-store`.

## 15.4 Compartilhamento

- Nenhum dado pessoal é compartilhado com terceiros para fins de publicidade.
- Serviços de infraestrutura essenciais: Supabase (BaaS / Database / Auth) e Expo / Google FCM (Push Notifications).

## 15.5 Retenção

- Dados de conta e agendamentos são retidos enquanto a conta estiver ativa.
- Após a exclusão, dados identificáveis são anonimizados para preservar o histórico contábil e operacional do estabelecimento.
- Prazo de retenção de `audit_logs`: `PENDENTE DE DECISÃO`.

## 15.6 Anonimização

Quando uma conta é excluída, os agendamentos passados são mantidos com dados anonimizados (`name = 'Cliente Removida'`, `email = null`, `phone = null`) para garantir a integridade dos relatórios e histórico do profissional responsável.

## 15.7 Fluxo técnico de exclusão de conta

### 15.7.1 Cliente (In-App)

```
Perfil → Excluir Conta → Confirmação explícita no App
   → Invocação de Edge Function ou RPC segura
   → Execução de supabase.auth.admin.deleteUser(user_id)
   → Trigger no PostgreSQL:
       - Marca public.users.deleted_at = now() e anonimiza dados de contato.
       - Cancela agendamentos futuros pendentes (status = 'cancelled').
       - Remove tokens de notificação em notifications_tokens.
       - Registra evento de exclusão em public.audit_logs.
   → App: supabase.auth.signOut(), limpeza de SecureStore e retorno à Splash/Login.
```

### 15.7.2 Admin (In-App)

```
Perfil → Excluir Conta → Confirmação explícita
   → Inativação do registro em public.professionals (is_active = false).
   → Exclusão da conta no Supabase Auth e anonimização do perfil.
   → Agendamentos futuros: PENDENTE DE DECISÃO quanto ao cancelamento automático ou realocação.
   → Histórico passado mantido com profissional inativo.
   → Registro em public.audit_logs.
```

## 15.8 Requisitos Google Play (Exclusão Externa de Conta)

Para atender à política de conformidade da Google Play (Data Safety / Account Deletion):
- **Página Web Externa:** Uma página web simples acessível via navegador para clientes solicitarem a exclusão de conta sem ter o aplicativo instalado.
- **Backend / Edge Function:** A página externa submete a requisição para a Supabase Edge Function `delete-account-external`, que valida o e-mail/senha ou link de confirmação e executa a exclusão com os mesmos triggers de anonimização.
- **Hospedagem da página:** `PENDENTE DE DECISÃO` quanto ao domínio/hospedagem da página estática (ex.: Vercel, Netlify, GitHub Pages ou Supabase Storage/Hosting).

## 15.9 Dados retidos por auditoria

Registros em `public.audit_logs` registram apenas que uma conta com determinado UUID foi excluída, sem preservar dados pessoais desnecessários.
