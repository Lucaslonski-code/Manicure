# 27. Operação e Manutenção

Status: CONFIRMADO quanto à estrutura.

## 27.1 Após a publicação

| Área | Prática esperada |
|---|---|
| Novas versões | Seguem o mesmo pipeline de `22-deploy-operacao-ambientes.md`; toda alteração relevante passa por teste (ver `24-testes-qa.md`) antes de novo release. |
| Atualização de backend | Pode ocorrer de forma independente do app (sem exigir nova versão publicada na loja), desde que mantenha compatibilidade com versões de app ainda em uso (ver `16-android.md`, seção 16.11). |
| Atualização do app | Segue revisão do Google Play a cada envio; frequência não definida numericamente — dependente da necessidade real do produto. |
| Correções | Priorizadas conforme severidade (ver `22-deploy-operacao-ambientes.md`, seção 22.5, sobre incidentes). |
| Backups | Verificação periódica de que os backups automatizados estão de fato ocorrendo e são restauráveis (ver `23-backup-auditoria-observabilidade.md`). |
| Monitoramento | Acompanhamento contínuo dos indicadores definidos em `23-backup-auditoria-observabilidade.md`, seção 23.3. |
| Suporte | Canal de suporte para dúvidas/problemas da proprietária do negócio e, indiretamente, das clientes finais — mecanismo concreto (e-mail, outro) `PENDENTE DE DECISÃO`. |
| Avaliações | Acompanhamento de avaliações e comentários deixados na ficha da loja do Google Play, como insumo de melhoria contínua — não é requisito técnico, é prática operacional recomendada. |
| Segurança | Revisão periódica das práticas de segurança descritas em `04-autorizacao-seguranca.md`, especialmente após qualquer mudança relevante na API ou no modelo de dados. |

## 27.2 Renovação de credenciais

- Credenciais/secrets com validade limitada (ex.: chaves de serviços de terceiros, se aplicável) devem ser
  monitoradas quanto ao vencimento, com renovação antes da expiração — processo formal de calendário de
  renovação é `PENDENTE DE DECISÃO`.
- Upload key/keystore Android: ver `18-android-build-assinatura-testes.md`, seção 18.4, para procedimento de
  proteção e eventual rotação.

## 27.3 Alteração de requisitos Android — target SDK anual

- O Google Play atualiza anualmente o requisito mínimo de `targetSdkVersion` para novos apps/atualizações
  (ver `16-android.md`, seção 16.1, com a situação vigente na data de consulta deste conjunto documental).
- **Processo recorrente obrigatório:** antes de cada atualização relevante do app, e no mínimo uma vez por
  ciclo anual do Google, revalidar o requisito de target API vigente diretamente na documentação oficial
  (`https://developer.android.com/google/play/requirements/target-sdk`), atualizando `16-android.md` se
  necessário.
- O mesmo princípio se aplica à revalidação periódica do requisito de teste fechado (12 testadores/14 dias),
  cuja política já mudou no passado (de 20 para 12 testadores, segundo fonte oficial consultada) e pode
  mudar novamente — revalidar em `20-google-play.md`/`21-teste-interno-fechado-conformidade.md` antes de
  qualquer nova submissão que dependa desse requisito.

## 27.4 Manutenção de dependências

- Bibliotecas do app (React Native, Expo, dependências de terceiros) e do backend devem ser mantidas
  atualizadas de forma periódica, especialmente para correções de segurança — cadência exata de revisão é
  `PENDENTE DE DECISÃO`.
- Atualizações de versão maior do Expo/React Native devem ser avaliadas quanto a mudanças de compatibilidade
  antes de aplicadas, validando contra a documentação oficial vigente no momento da atualização.

## 27.5 Compatibilidade

- Compatibilidade Android é mantida conforme `16-android.md`.
- Compatibilidade futura com iOS não deve ser comprometida por decisões de manutenção tomadas apenas sob a
  ótica Android — ver `28-arquitetura-futura-ios.md`.
