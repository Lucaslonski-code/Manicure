# 28. Arquitetura Futura para iOS

Status: CONFIRMADO quanto ao princípio — apenas preparação arquitetural, sem desenvolvimento de iOS nesta
fase.

## 28.1 Princípio

O projeto não será desenvolvido como dois aplicativos independentes. A escolha de React Native + Expo (ver
`12-arquitetura-frontend-mobile.md`, `29-decisoes-arquiteturais.md`) já é orientada, desde o início, a
permitir futura expansão para iOS a partir da mesma base de código, sem reescrita completa.

## 28.2 Decisões já portáveis (sem trabalho adicional para iOS)

| Área | Portabilidade |
|---|---|
| Modelo de dados (`08`, `09`) | Totalmente portável — não depende de plataforma. |
| Regras de autorização e segurança (`04`) | Totalmente portável — reside no backend, independente do cliente. |
| API/contratos (`10`) | Totalmente portável — mesma API serviria a um futuro cliente iOS. |
| Motor de disponibilidade (`07`) | Totalmente portável — lógica de backend. |
| Estrutura de navegação conceitual (`12`, seção 12.10) | Portável em conceito; implementação técnica de navegação em React Native é compartilhada entre Android e iOS. |
| Design system conceitual (`13`) | Portável em conceito; adaptações visuais específicas de plataforma (ex.: convenções nativas do iOS) são normais e esperadas, não uma reescrita. |

## 28.3 Dependências atualmente específicas de Android

| Item | Observação |
|---|---|
| Permissões (`17-android-permissoes.md`) | Modelo de permissões do iOS é distinto do Android; ao avaliar iOS, será necessário um levantamento equivalente específico da plataforma (não coberto por este documento). |
| Build/assinatura (`18-android-build-assinatura-testes.md`) | Processo de assinatura e publicação do iOS (App Store) é inteiramente distinto do Google Play; não presumido neste documento. |
| Publicação (`20`, `21`) | Processo da Apple App Store possui políticas próprias, não cobertas por esta documentação (fora de escopo do MVP). |
| `targetSdkVersion`/API level (`16`) | Conceito específico do Android; iOS possui seu próprio versionamento de plataforma-alvo. |

## 28.4 Notificações

- A estratégia de push notification, se implementada por meio de um serviço já compatível com múltiplas
  plataformas (ex.: serviço de push do próprio Expo, que abstrai APNs para iOS e FCM/equivalente para
  Android), tende a ser portável com esforço adicional limitado — validação concreta de compatibilidade e
  configuração específica de iOS (ex.: certificados APNs) fica para quando a expansão for decidida, e não é
  detalhada nesta documentação.

## 28.5 Autenticação

- O provedor de autenticação escolhido (`03-identidade-roles-autenticacao.md`, seção 3.7) deve, idealmente,
  suportar múltiplos clientes (Android e iOS) sobre a mesma base de usuários sem exigir arquitetura
  duplicada — este é um critério a considerar na escolha final do provedor, registrado como orientação em
  `29-decisoes-arquiteturais.md`.

## 28.6 Armazenamento local

- O padrão de armazenamento seguro local (ver `16-android.md`, seção 16.8) deve ser abstraído por uma
  biblioteca compatível com ambas as plataformas (comum em soluções Expo/React Native), evitando lógica
  duplicada específica de Android que precisaria ser reescrita para iOS.

## 28.7 Serviços externos

- Qualquer serviço externo (e-mail transacional, push, banco de dados) já é, por natureza, uma dependência
  de backend, portanto agnóstica de plataforma cliente — nenhuma mudança arquitetural adicional é necessária
  nesses serviços para suportar iOS no futuro.

## 28.8 O que este documento não faz

- Não define cronograma de desenvolvimento de iOS.
- Não define orçamento, conta de desenvolvedor Apple, nem processo de publicação na App Store.
- Não implica compromisso de que uma versão iOS será construída — apenas garante que a arquitetura atual não
  cria obstáculos desnecessários a essa possibilidade futura.
