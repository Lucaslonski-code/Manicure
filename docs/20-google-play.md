# 20. Google Play — Processo Completo de Publicação

Status: CONFIRMADO quanto à estrutura do processo. Requisitos temporais/numéricos citados abaixo foram
verificados nas fontes oficiais na data de consulta indicada; devem ser reconfirmados antes de cada
submissão real, dado o caráter dinâmico dessas políticas.

Data da consulta às fontes oficiais: 18 de agosto de 2026.

Fontes oficiais consultadas:

- Play Console Help — "App testing requirements for new personal developer accounts":
  `https://support.google.com/googleplay/android-developer/answer/14151465`
- Play Console Help — "Target API level requirements for Google Play apps":
  `https://support.google.com/googleplay/android-developer/answer/11926878`
- Android Developers — "Meet Google Play's target API level requirement":
  `https://developer.android.com/google/play/requirements/target-sdk`

## 20.1 Caminho completo até produção

```
 1. Criação da conta de desenvolvedor Google Play
 2. Verificação da conta (identidade)
 3. Configuração do aplicativo no Play Console
 4. Definição do package name (applicationId) — irreversível após primeira publicação
 5. Configuração de Play App Signing
 6. Geração e envio do AAB (Android App Bundle)
 7. Preenchimento da ficha da loja (título, descrição, ícone, screenshots)
 8. Classificação indicativa de conteúdo (questionário de classificação)
 9. Política de privacidade (URL pública)
10. Formulário de Data Safety (segurança e privacidade de dados)
11. Declaração de permissões utilizadas
12. Fluxo de exclusão de conta (dentro do app + acesso externo, ver `15-privacidade-exclusao-conta.md`)
13. Acesso para revisão (credenciais de teste, se necessário, para o revisor do Google)
14. Teste interno
15. Teste fechado (com requisito de testadores/duração para contas pessoais novas)
16. Solicitação de acesso à produção
17. Revisão do Google
18. Publicação em produção
19. Atualizações subsequentes
```

## 20.2 Criação e verificação da conta

- Conta de desenvolvedor Google Play criada mediante taxa única de registro cobrada pelo Google (valor exato
  sujeito à política vigente do Google — `REQUER VALIDAÇÃO OFICIAL` no momento da criação da conta).
- Verificação de identidade é etapa obrigatória do Google antes de liberar certas capacidades da conta
  (varia conforme tipo de conta — pessoal ou organização) — processo e prazos exatos a confirmar na
  documentação oficial vigente (`REQUER VALIDAÇÃO OFICIAL`).
- **Propriedade da conta:** ver `22-deploy-operacao-ambientes.md`, seção 22.6 — recomenda-se que a conta
  pertença à proprietária do negócio, não exclusivamente ao desenvolvedor (mitigação de risco descrita em
  `30-riscos-pendencias-glossario.md`).

## 20.3 Configuração do aplicativo

- **Package name / `applicationId`:** identificador único e definitivo do app (ex.: padrão de domínio
  reverso); não pode ser alterado após a primeira publicação. Definição exata: `PENDENTE DE DECISÃO`.
- **Play App Signing:** habilitado por padrão para novos apps publicados via fluxo padrão do Console;
  detalhado em `18-android-build-assinatura-testes.md`, seção 18.4.

## 20.4 Ficha da loja

| Item | Status |
|---|---|
| Título do app | `PENDENTE DE DECISÃO` |
| Descrição curta e longa | `PENDENTE DE DECISÃO` |
| Ícone | `PENDENTE DE DECISÃO` — depende da identidade visual (ver `13-ux-ui-design-system.md`) |
| Screenshots | `PENDENTE DE DECISÃO` — a produzir a partir de builds reais do app, não mockups genéricos |
| Categoria do app | `PENDENTE DE DECISÃO` (ex.: "Estilo de vida" / "Negócios" — a confirmar categoria mais adequada disponível no Console) |

## 20.5 Classificação de conteúdo

- Preenchimento do questionário de classificação indicativa do Google Play, refletindo com precisão o
  conteúdo do app (aplicativo de agendamento, sem conteúdo sensível, sem interação social pública, sem
  conteúdo gerado por usuário exposto publicamente).
- Resultado esperado: classificação livre/baixo risco, a confirmar formalmente apenas no preenchimento real
  do questionário no Console (não deve ser presumido antecipadamente como resultado final).

## 20.6 Política de privacidade

- URL pública de política de privacidade é exigida pelo Google Play para apps que coletam dados pessoais —
  este produto se enquadra nessa exigência (ver `15-privacidade-exclusao-conta.md`).
- O **conteúdo jurídico** da política em si não é produzido nesta documentação técnica (conforme escopo
  definido na missão) — apenas o insumo técnico de quais dados são tratados, com qual finalidade. Redação
  final da política: `PENDENTE DE DECISÃO` de responsabilidade (jurídica/negócio), com hospedagem pública
  necessária antes da submissão.

## 20.7 Data Safety (Segurança dos Dados)

Formulário obrigatório do Google Play descrevendo quais dados o app coleta, com qual finalidade, se são
compartilhados com terceiros, e práticas de segurança (ex.: criptografia em trânsito, opção de exclusão).

Mapeamento preliminar com base em `15-privacidade-exclusao-conta.md`:

| Dado | Coletado | Finalidade declarável | Compartilhado com terceiros | Opcional |
|---|---|---|---|---|
| Nome | Sim | Funcionalidade do app (identificação em agendamentos) | Não | Não |
| E-mail | Sim | Funcionalidade do app, gerenciamento de conta | Não (exceto processamento técnico por provedor de e-mail transacional, se aplicável) | Não |
| Telefone | Sim | Funcionalidade do app (contato para agendamento) | Não | Não |
| Dados de agendamento | Sim | Funcionalidade do app | Não | Não |
| Token de dispositivo (push) | Sim | Funcionalidade do app (notificações) | Compartilhamento técnico com serviço de push (ex.: infraestrutura de notificações usada) | Sim (usuário pode negar permissão) |

Preenchimento definitivo do formulário deve ocorrer diretamente no Console, usando este mapeamento como
insumo, e deve ser revisado a cada mudança relevante na coleta de dados do produto.

## 20.8 Exclusão de conta

- Requisito de disponibilizar exclusão de conta dentro do app **e** por página externa acessível sem o app
  instalado — ver `15-privacidade-exclusao-conta.md`, seção 15.8.
- O link para a página externa de exclusão de conta é informado no próprio Data Safety/ficha da loja,
  conforme exigido pelo processo do Console — `REQUER VALIDAÇÃO OFICIAL` quanto ao campo exato no momento
  da submissão.

## 20.9 Permissões declaradas

- Alinhadas ao levantamento de `17-android-permissoes.md`: apenas Internet e Notificações no MVP.
- Nenhuma permissão sensível (câmera, localização, contatos) é declarada, reduzindo a superfície de revisão
  e risco de questionamento pelo Google.

## 20.10 Acesso para revisão

- Caso o app exija login para uso (como é o caso deste produto), o Google Play solicita credenciais de teste
  válidas (ou instruções de acesso) para que o revisor consiga navegar pelo app durante a análise.
- Deve ser fornecida uma conta de demonstração (cliente e/ou admin) especificamente para fins de revisão,
  distinta de contas reais de clientes do negócio — `PENDENTE DE DECISÃO` quanto ao mecanismo de criação
  dessa conta de demonstração (manual vs. automatizado).

## 20.11 Testes — visão geral (detalhado em `21-teste-interno-fechado-conformidade.md`)

| Track | Obrigatório para contas pessoais novas? | Observação |
|---|---|---|
| Teste interno | Não obrigatório pela política de acesso à produção, mas fortemente recomendado como primeira validação. | Distribuição rápida, até um número limitado de testadores cadastrados por e-mail. |
| Teste fechado | **Obrigatório** para contas pessoais criadas após 13 de novembro de 2023 (data de corte definida pela política vigente na fonte oficial consultada), antes de solicitar acesso à produção. | Requisito: mínimo de 12 testadores optados (`opted in`) continuamente pelos últimos 14 dias no momento da solicitação de acesso à produção. |
| Teste aberto | Opcional, não utilizado neste projeto no MVP. | — |
| Produção | Disponível após aprovação de acesso à produção (quando aplicável) e revisão do Google. | — |

## 20.12 Solicitação de acesso à produção e revisão

- Após cumprir o requisito de teste fechado (quando aplicável ao tipo de conta), a solicitação de acesso à
  produção é feita no Console, respondendo a um questionário sobre o design do app, processo de teste e
  prontidão para produção.
- Prazo de revisão pelo Google varia e não deve ser presumido com um número fixo de dias — `REQUER
  VALIDAÇÃO OFICIAL` a cada submissão real.

## 20.13 Atualizações

- Cada atualização subsequente segue o mesmo pipeline de build (AAB) e passa por revisão do Google, embora
  tipicamente mais rápida que a primeira submissão — sem presumir prazo fixo.
- `targetSdkVersion` deve ser mantido em conformidade com a política vigente a cada ciclo anual do Google
  (ver `16-android.md`, seção 16.1, e `27-operacao-manutencao.md`).
