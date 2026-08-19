# 22. Deploy, Ambientes e Secrets

Status: CONFIRMADO quanto à estrutura do processo.

## 22.1 Ciclo completo de deploy

```
Desenvolvimento
  → Build (development/preview, ver doc 18)
  → Teste local / teste com a cliente (ver doc 19)
  → Correções
  → Release candidate (build de produção, AAB)
  → Teste interno (Google Play)
  → Teste fechado (Google Play, com requisito de testadores/duração — ver doc 21)
  → Solicitação de acesso à produção
  → Revisão do Google
  → Publicação em produção
  → Monitoramento
  → Atualização (novo ciclo)
```

## 22.2 Responsabilidades por etapa

| Etapa | Responsável principal | Observações |
|---|---|---|
| Desenvolvimento e build | Desenvolvedor(a) | Inclui testes automatizados/manuais de desenvolvimento (ver `23-testes-qa.md`). |
| Teste com a cliente | Desenvolvedor(a) + proprietária do negócio | Validação funcional e de UX antes de avançar para os tracks formais. |
| Correções | Desenvolvedor(a) | Ciclo iterativo até aprovação da proprietária. |
| Release candidate | Desenvolvedor(a) | Build final candidata à publicação, versionada. |
| Teste interno/fechado | Desenvolvedor(a) (execução) + proprietária e testadoras convidadas (participação) | Ver `21-teste-interno-fechado-conformidade.md`. |
| Solicitação de produção e revisão | Desenvolvedor(a), em nome da conta cuja titularidade é da proprietária (ver 22.6) | — |
| Publicação | Conta do Google Play Console (titularidade da proprietária) | — |
| Monitoramento | Desenvolvedor(a), com acesso concedido pela proprietária | Ver `18.` observabilidade abaixo (seção 22.9). |
| Atualização | Desenvolvedor(a), seguindo o mesmo ciclo | — |

## 22.3 Versionamento e gerenciamento de releases

- Cada release corresponde a um `versionCode` único e crescente, associado a um `versionName` legível (ver
  `16-android.md`, seção 16.3).
- Convenção de versionamento (ex.: semântica) é `PENDENTE DE DECISÃO`, a registrar em
  `26-decisoes-arquiteturais.md`.
- Cada release deve ter registro do que mudou (changelog), ao menos internamente, para rastreabilidade e
  para eventual comunicação de novidades relevantes na ficha da loja.

## 22.4 Rollback

- Em caso de defeito crítico identificado após publicação, o processo de reversão no Google Play consiste em
  publicar uma nova versão corrigida (o Google Play não oferece, tipicamente, "downgrade" automático para
  usuários que já atualizaram) — comportamento exato a confirmar na documentação oficial (`REQUER VALIDAÇÃO
  OFICIAL`).
- Rollback de **backend** (ver 22.8) é tratado separadamente e pode ser mais imediato que o rollback de app,
  dado que o backend não depende de revisão de loja.
- Compatibilidade entre versões de app e backend deve ser mantida durante o período de transição (ver
  `16-android.md`, seção 16.11).

## 22.5 Incidentes

- Um incidente (ex.: indisponibilidade do backend, falha de autenticação em massa, brecha de segurança
  identificada) deve ser tratado com prioridade sobre novas funcionalidades.
- Processo formal de resposta a incidentes (papéis, prazos de comunicação) é `PENDENTE DE DECISÃO` — não
  presumido neste documento além do princípio de priorização.

## 22.6 Propriedade de contas e ativos

| Ativo | Titularidade recomendada |
|---|---|
| Conta do Google Play Console | Proprietária do negócio |
| Projeto Supabase (Auth, Postgres, Edge Functions) | Proprietária do negócio (organização Supabase com acesso concedido ao desenvolvedor) |
| Banco de dados PostgreSQL | Gerenciado pelo Supabase; backups automáticos sob a conta da organização |
| Conta Expo / EAS Build | Conta organizacional do negócio / desenvolvedor com permissões controladas |
| Domínio / Hospedagem externa (página de exclusão de conta) | Proprietária do negócio |
| Certificados de assinatura Android | Google Play App Signing + EAS Credentials |

Princípio: a infraestrutura deve ser autônoma e pertencer à organização do negócio, evitando dependência de contas pessoais do desenvolvedor.

## 22.7 Ambientes e Secrets (Supabase e Expo)

| Ambiente | Projeto Supabase | Mobile Build Profile (EAS) | Finalidade |
|---|---|---|---|
| Desenvolvimento | Projeto Supabase Dev / Local | `development` / `preview` | Testes locais, dados fictícios, migrations em teste. |
| Produção | Projeto Supabase Prod | `production` | Dados reais do negócio, RLS estrito, backups ativos. |

### Separação e Classificação de Variáveis / Secrets:

1. **Cliente Mobile (Públicas, injetadas no bundle via Expo):**
   - `EXPO_PUBLIC_SUPABASE_URL`: Endpoint da API do projeto Supabase.
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública (todas as requisições protegidas por RLS).
2. **Ambiente de Servidor / Edge Functions (Privadas e Críticas):**
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave mestre com privilégios administrativos. **NUNCA entra no bundle do app**, configurada unicamente nos secrets do Supabase (`supabase secrets set`).
   - `EXPO_ACCESS_TOKEN`: Token para autenticação segura com a Expo Push API.

## 22.8 O que NUNCA entra no Git

- Arquivos `.env` contendo chaves reais (apenas `.env.example` sem valores é versionado).
- Chaves de serviço (`service_role key`), keystores locais e tokens de acesso pessoal.
- Backups ou dados reais de produção.
- Nenhuma credencial real é documentada em `docs/`.

## 22.9 Observabilidade e Backup

Detalhamento de backups gerenciados pelo Supabase, logs do PostgreSQL e trilha de auditoria em `23-backup-auditoria-observabilidade.md`.
