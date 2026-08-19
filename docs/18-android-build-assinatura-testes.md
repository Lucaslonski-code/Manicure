# 18. Android — Build (EAS), Assinatura e Testes em Dispositivos

Status: CONFIRMADO quanto aos conceitos; detalhes de comandos/configuração exatos ficam como `REQUER
VALIDAÇÃO OFICIAL` contra a documentação vigente do Expo/EAS no momento da implementação
(`https://docs.expo.dev`). Nenhum comando é executado ou prescrito aqui — apenas conceitos.

## 18.1 Tipos de build (conceitual)

| Tipo | Finalidade | Formato | Uso |
|---|---|---|---|
| Development build | Build com runtime de desenvolvimento, permite uso de ferramentas de depuração e recarregamento rápido. | APK (ou instalação direta em dispositivo/emulador) | Uso exclusivo da equipe de desenvolvimento durante a construção do produto. |
| Preview build | Build de pré-visualização, próxima da configuração de produção, mas ainda destinada a testes internos/privados. | APK | Demonstração para a cliente antes da publicação (ver `19-distribuicao-privada-cliente.md`) e testes internos da equipe. |
| Production build | Build final, assinada para distribuição pelo Google Play. | AAB (Android App Bundle) | Envio ao Google Play Console (testes internos/fechados/produção). |

O Google Play exige o formato **AAB** (Android App Bundle) para novos aplicativos publicados, não mais APK
direto — este é um requisito de plataforma já consolidado (não específico de 2026), a reconfirmar na
documentação oficial do Google Play no momento da implementação (`REQUER VALIDAÇÃO OFICIAL`).

## 18.2 EAS Build e EAS Submit (conceitual)

- **EAS Build**: serviço do Expo para compilar o aplicativo (Android/iOS) em infraestrutura gerenciada,
  produzindo os artefatos (APK/AAB) descritos acima a partir do código-fonte e de um arquivo de configuração
  de build.
- **EAS Submit**: serviço do Expo para enviar o artefato de build (AAB) diretamente ao Google Play Console,
  reduzindo passos manuais de upload.
- Ambos exigem credenciais específicas (ver 18.3) e variáveis de ambiente/segredos de build (ver
  `22-deploy-operacao-ambientes.md`).

## 18.3 Credenciais de build (`credentials`)

- O Expo/EAS gerencia credenciais de assinatura Android (keystore) de forma que podem ser geradas e
  armazenadas pelo próprio serviço gerenciado, ou fornecidas pelo proprietário do projeto.
- Independentemente do gerenciamento (serviço gerenciado ou local), a **responsabilidade final** pelas
  credenciais deve pertencer à proprietária do produto/negócio, não exclusivamente à conta pessoal do
  desenvolvedor — ver `22-deploy-operacao-ambientes.md`, seção 22.6.

## 18.4 Assinatura — signing key, upload key e Play App Signing

| Conceito | Descrição |
|---|---|
| Upload key | Chave usada pelo desenvolvedor para assinar o artefato (AAB) antes do envio ao Google Play. |
| Play App Signing | Serviço do Google Play que gerencia a chave de assinatura final usada para distribuir o app aos usuários, a partir do artefato assinado com a upload key. Recomendado/padrão para novos apps. |
| Signing key (chave de assinatura final) | Gerenciada pelo Google quando Play App Signing está habilitado; nunca exposta ao desenvolvedor diretamente nesse modelo. |

### 18.4.1 Proteção e responsabilidade

- A **upload key** deve ser protegida como segredo crítico: perda ou comprometimento exige processo de
  recuperação/rotação junto ao Google Play (procedimento formal existente para esse cenário — a validar
  exatamente na documentação oficial no momento em que for necessário, `REQUER VALIDAÇÃO OFICIAL`).
- Nenhuma credencial real (senha de keystore, chave privada) é registrada em qualquer documento deste
  projeto, em controle de versão (Git) ou em qualquer lugar acessível publicamente — ver
  `22-deploy-operacao-ambientes.md`.
- A titularidade da conta do Google Play Console (que controla o Play App Signing) deve pertencer à
  proprietária do negócio (ver `22-deploy-operacao-ambientes.md`, seção 22.6), não apenas ao desenvolvedor, para evitar
  dependência exclusiva de uma pessoa física externa ao negócio.

### 18.4.2 Rotação

- Rotação da upload key é um procedimento suportado pelo Google Play quando Play App Signing está habilitado
  (o Google mantém a chave de assinatura final estável para os usuários mesmo que a upload key mude) — a
  confirmar procedimento exato na documentação oficial (`REQUER VALIDAÇÃO OFICIAL`).

## 18.5 Versionamento

- `versionCode` incrementado a cada build enviado ao Google Play (obrigatoriamente crescente).
- `versionName` seguindo convenção legível (ex.: semântica) — convenção exata `PENDENTE DE DECISÃO` em
  `29-decisoes-arquiteturais.md`.
- Estratégia de incremento automático via EAS (auto-incremento gerenciado) é uma opção conceitual válida, a
  confirmar disponibilidade/configuração na documentação oficial do Expo (`REQUER VALIDAÇÃO OFICIAL`).

## 18.6 Variáveis de ambiente e segredos de build

- URLs de API (produção/homologação), chaves públicas de serviços de terceiros e outras configurações não
  sensíveis podem ser injetadas via variáveis de ambiente de build.
- Segredos verdadeiros (credenciais de assinatura, chaves privadas de serviços de backend) nunca residem no
  repositório de código-fonte nem em arquivos versionados — ver `22-deploy-operacao-ambientes.md`.

---

## 18.7 Testes em dispositivos — estratégia

### 18.7.1 Cobertura mínima racional

| Dimensão | Cobertura mínima recomendada |
|---|---|
| Versões de Android | Ao menos duas versões: a mínima suportada (`minSdkVersion`, ver `16-android.md`, seção 16.2) e uma versão recente próxima ao `targetSdkVersion`. |
| Tamanhos de tela | Ao menos um smartphone de tela pequena/média e um de tela grande. |
| Densidade | Coberta indiretamente pelos dispositivos físicos escolhidos; sem matriz exaustiva de densidades. |
| Conectividade | Teste com conexão estável, conexão instável (throttling) e ausência de conexão. |
| Notificações | Teste de recebimento em foreground, background e app encerrado. |
| Permissões | Teste de fluxo com permissão concedida e negada. |
| Login/Agendamento/Agenda admin | Cobertos como parte do fluxo funcional principal (ver `24-testes-qa.md`). |
| Ciclo de vida | Teste de app em background prolongado, retomada, encerramento pelo sistema. |
| Atualização/reinstalação | Teste de atualização de versão anterior e de reinstalação limpa. |

Este documento evita definir uma matriz irrealmente grande (dezenas de combinações de dispositivo/versão),
priorizando cobertura racional compatível com um produto de escopo de negócio único (não uma plataforma de
massa). Expansão da matriz de testes é `PENDENTE DE DECISÃO` conforme necessidade observada em produção.

### 18.7.2 Emulador vs. dispositivo físico

- Emuladores são adequados para desenvolvimento e primeira validação funcional.
- Testes finais antes de cada release (candidatos a release, ver `22-deploy-operacao-ambientes.md`) devem incluir ao
  menos um dispositivo físico real, dado que comportamentos de notificação, permissões e desempenho real
  podem divergir do emulador.
