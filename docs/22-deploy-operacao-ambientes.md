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

## 22.6 Propriedade de contas e ativos (evitar dependência exclusiva do desenvolvedor)

| Ativo | Titularidade recomendada |
|---|---|
| Conta do Google Play Console | Proprietária do negócio (ou entidade formal do negócio, quando existir) |
| Backend (conta do provedor de hospedagem/serviço gerenciado) | Proprietária do negócio, com acesso operacional concedido ao desenvolvedor |
| Banco de dados | Mesmo provedor do backend; backups sob controle da titular da conta |
| E-mail transacional (serviço de envio) | Proprietária do negócio (conta do serviço), com credenciais técnicas geridas como secrets (ver 22.7) |
| Domínio (se houver site/página de exclusão de conta) | Proprietária do negócio |
| Storage (se necessário no futuro) | Proprietária do negócio |
| Certificados/chaves de assinatura Android | Play App Signing sob a conta do Google Play da proprietária (ver `18-android-build-assinatura-testes.md`) |
| Secrets operacionais | Cofre de segredos sob controle conjunto, nunca apenas no dispositivo/máquina pessoal do desenvolvedor |

Princípio orientador: o produto não deve ficar **dependente exclusivamente** da conta pessoal do
desenvolvedor para continuar operando, sendo atualizado ou republicado. Isso é tratado como risco de negócio
em `24-riscos-pendencias.md`.

## 22.7 Ambientes e variáveis de ambiente

| Ambiente | Finalidade |
|---|---|
| Desenvolvimento | Uso exclusivo da equipe de desenvolvimento, dados fictícios/de teste. |
| Homologação/Staging | Opcional — `PENDENTE DE DECISÃO` se será mantido um ambiente intermediário além de desenvolvimento e produção, dado o porte do projeto. |
| Produção | Dados reais do negócio e das clientes. |

Variáveis de ambiente típicas (sem valores reais registrados em nenhum documento):

- URL base da API por ambiente.
- Credenciais de conexão com banco de dados (produção nunca compartilhada com desenvolvimento).
- Chaves de serviço de notificações push.
- Chaves de serviço de e-mail transacional.
- Segredos de assinatura Android (gerenciados preferencialmente pelo Play App Signing/EAS, ver doc 18).

## 22.8 O que nunca entra no Git (controle de versão)

- Senhas, chaves privadas, tokens de API, arquivos de keystore, arquivos de credenciais de serviços em nuvem.
- Qualquer arquivo de variáveis de ambiente com valores reais (apenas arquivos de exemplo, sem valores, podem
  ser versionados).
- Dumps de banco de dados de produção.
- Nenhuma credencial real é registrada em nenhum documento desta pasta `docs/` — todos os exemplos aqui são
  estruturais/conceituais.

## 22.9 Observabilidade (ligação com auditoria e backup — ver `23-backup-auditoria-observabilidade.md`)

Detalhamento completo de backup, auditoria e observabilidade em documento dedicado, para não sobrecarregar
este arquivo — ver `23-backup-auditoria-observabilidade.md`.
