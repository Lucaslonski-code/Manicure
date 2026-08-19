# 19. Distribuição Privada para a Cliente Antes da Publicação

Status: CONFIRMADO.

## 19.1 Objetivo

Permitir que a proprietária do negócio (cliente do desenvolvedor) experimente e valide versões do
aplicativo antes da publicação pública, sem depender exclusivamente do processo formal do Google Play.

## 19.2 Métodos disponíveis, do mais informal ao mais próximo de produção

| Método | Descrição | Quando usar | Limitações |
|---|---|---|---|
| Teste local (desenvolvimento) | Execução do app diretamente a partir do ambiente de desenvolvimento (development build, ver `18-android-build-assinatura-testes.md`), conectado ao dispositivo do desenvolvedor. | Validação inicial pelo próprio desenvolvedor. | Não é prático para a cliente instalar em seu próprio dispositivo sem passos técnicos. |
| Build instalável (preview build) | Geração de um APK de preview, compartilhável diretamente (link/arquivo) para instalação manual em um dispositivo Android. | Demonstrações pontuais para a cliente, antes mesmo de configurar o Google Play Console. | Exige habilitar instalação de fontes desconhecidas no dispositivo da cliente; não passa pelas proteções/verificações do Play Protect da mesma forma que um app publicado; distribuição manual do arquivo. |
| Distribuição privada gerenciada (ex.: canal de distribuição do próprio Expo/EAS para preview builds) | Compartilhamento de builds de preview por meio de um canal/link gerenciado, sem publicação pública. | Demonstrações recorrentes durante o desenvolvimento, com atualização facilitada a cada nova build. | Ainda não é o ambiente real do Google Play; não substitui os testes formais exigidos pela plataforma. |
| Teste interno (Google Play Console) | Track de teste dentro do próprio Google Play Console, com lista restrita de testadores (via e-mail), distribuição quase imediata. | Primeira validação já dentro do ambiente real do Google Play, incluindo a cliente como testadora. | Exige que o app já esteja configurado no Play Console (ver `20-google-play.md`); não conta, por si só, para o requisito de acesso à produção de contas pessoais novas (ver `20-google-play.md`, seção de teste fechado). |
| Teste fechado (Google Play Console) | Track de teste mais próximo de produção, com requisito formal de testadores e duração para contas pessoais novas. | Etapa obrigatória (para contas pessoais criadas após a data de corte definida pela política vigente) antes de solicitar acesso à produção. | Sujeito ao requisito de 12 testadores/14 dias (ver `20-google-play.md`). |

## 19.3 Recomendação de uso combinado

```
Desenvolvimento local
   → Preview build (APK) compartilhado diretamente com a cliente para primeira demonstração
   → Configuração do app no Google Play Console
   → Teste interno (cliente incluída como testadora, junto à equipe)
   → Teste fechado (cliente pode participar como uma das testadoras, junto a outras pessoas
     recrutadas pelo desenvolvedor — ver 20-google-play.md)
   → Solicitação de acesso à produção
```

Este fluxo permite que a cliente veja e opine sobre o produto desde as primeiras builds, sem esperar pela
conclusão do processo formal de publicação, ao mesmo tempo em que cumpre os requisitos oficiais da Google
Play quando chegar a hora de publicar.

## 19.4 Diferenciação essencial

`Teste para desenvolvimento` (métodos informais, sem exigência da plataforma) é distinto de `teste exigido
pelo processo de publicação` (teste interno e, principalmente, teste fechado com requisito de 12
testadores/14 dias). O primeiro serve para validação e aprovação do produto pela cliente; o segundo é um
requisito formal e obrigatório do Google Play antes da liberação de acesso à produção para contas pessoais
novas — detalhado em `20-google-play.md`.
