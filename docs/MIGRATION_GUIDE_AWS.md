# 🚀 Guia de Migração: Firebase para AWS

## 1. Visão Geral da Migração

Este documento é um guia técnico passo a passo para migrar a aplicação **Monitor do Índice UCS** do ecossistema Firebase (Firestore e Firebase Authentication) para uma arquitetura 100% baseada na AWS (Amazon Web Services).

**Objetivo:** Substituir os serviços de backend do Firebase por alternativas da AWS para centralizar a infraestrutura, aumentar o controle e garantir a escalabilidade a longo prazo.

**Arquitetura Anterior (Firebase):**
- **Banco de Dados:** Cloud Firestore
- **Autenticação:** Firebase Authentication
- **Backend:** Funções do Next.js (Server-Side) interagindo diretamente com o Firebase Admin SDK.

**Arquitetura Alvo (AWS):**
- **Banco de Dados:** **Amazon DynamoDB** (NoSQL, escalável e performático)
- **Autenticação:** **Amazon Cognito** (Gerenciamento de identidades e usuários)
- **Backend (API):** **Amazon API Gateway** + **AWS Lambda** (Arquitetura serverless para processar requisições)

---

## 2. Diagrama da Arquitetura Alvo na AWS

```mermaid
graph TD
    subgraph "Navegador do Usuário"
        A[Aplicação Web<br>(Next.js / Vercel)]
    end

    subgraph "Infraestrutura AWS"
        B(Amazon Cognito)
        C(Amazon API Gateway)
        D[Funções AWS Lambda]
        E[Banco de Dados<br>(Amazon DynamoDB)]
    end
    
    F[Servidor N8N<br>(VPS Externa)]

    A -- 1. Autentica Usuário --> B
    B -- 2. Retorna Token JWT --> A
    A -- "3. Requisição API<br>(com Token JWT)" --> C
    C -- 4. Valida Token c/ Cognito --> C
    C -- 5. Aciona Função --> D
    D -- 6. Lê/Escreve Dados --> E
    E -- 7. Retorna Dados --> D
    D -- 8. Retorna Resposta --> C
    C -- 9. Retorna Dados --> A
    
    F -- "10. Envia Cotações<br>(Requisição HTTP)" --> C
```

---

## 3. Plano de Ação Passo a Passo

### Passo 1: Configuração dos Serviços na AWS

#### A. Amazon Cognito (Autenticação)
1.  **Criar um User Pool:**
    - Acesse o Amazon Cognito no console da AWS.
    - Escolha "Create a user pool".
    - Configure os provedores de identidade (selecione "Email").
    - Na seção "Configure sign-in experience", desmarque "Enable self-registration" para que apenas administradores possam criar usuários.
    - Configure a política de senhas e o fluxo de recuperação de conta.
2.  **Criar um "App client":**
    - Dentro do seu User Pool, vá para a aba "App integration".
    - Crie um novo "App client". Selecione "Web app" como tipo.
    - Anote o **Client ID** gerado. Ele será usado no frontend.
3.  **Anotar Credenciais:**
    - Anote o **User Pool ID** e o **Client ID**.

#### B. Amazon DynamoDB (Banco de Dados)
1.  **Criar Tabelas:**
    - Acesse o Amazon DynamoDB no console.
    - Crie as seguintes tabelas (sugestão inicial):
        - `ucs_quotes`: Para armazenar as cotações diárias. Chave primária (Partition Key): `asset_id` (String), Chave de ordenação (Sort Key): `timestamp` (Number).
        - `ucs_users`: Para armazenar dados adicionais dos usuários. Chave primária: `user_id` (String).
        - `ucs_audit_logs`: Para os logs de auditoria. Chave primária: `log_id` (String), com um índice secundário na data.
2.  **Provisionamento de Capacidade:**
    - Comece com o modo "On-demand" (pagamento por uso). É a opção mais simples e custo-efetiva para iniciar, escalando automaticamente conforme a necessidade.

#### C. IAM (Identity and Access Management)
1.  **Criar um Usuário Programático:**
    - Acesse o IAM no console.
    - Crie um novo usuário com "Access key - Programmatic access".
    - Associe a ele uma política que dê permissão de leitura e escrita nas tabelas do DynamoDB que você criou (ex: `AmazonDynamoDBFullAccess` para começar, ou uma política mais restrita para produção).
2.  **Anotar Credenciais:**
    - Salve o **Access Key ID** e o **Secret Access Key** gerados. **Este é o único momento em que a chave secreta será exibida.**

### Passo 2: Configuração do Backend (API Gateway + Lambda)

Esta será a sua nova API de backend, que substituirá o acesso direto ao Firebase.

1.  **Criar Funções Lambda:**
    - Acesse o AWS Lambda.
    - Crie funções (ex: `getQuotes`, `updateQuote`, `createUser`) usando Node.js.
    - Cada função receberá eventos da API Gateway, processará a requisição (lendo/escrevendo no DynamoDB) e retornará uma resposta.
    - Configure as variáveis de ambiente em cada Lambda com as credenciais do DynamoDB.
2.  **Criar a API Gateway:**
    - Acesse a Amazon API Gateway.
    - Crie uma nova REST API.
    - Crie os recursos (endpoints), como `/quotes/{assetId}` e `/users`.
    - Conecte cada método (GET, POST, PUT) à sua respectiva função Lambda.
3.  **Proteger a API com Cognito:**
    - Crie um "Authorizer" do tipo "Cognito" na API Gateway.
    - Selecione o User Pool que você criou no Passo 1.
    - Em cada método da sua API que requer autenticação, configure o "Method Request" para usar o seu novo autorizador do Cognito. Isso garante que apenas requisições com um token JWT válido (gerado pelo Cognito no login) possam acessar a API.

### Passo 3: Alterações no Código do Frontend (Next.js)

Esta é a parte onde você adapta a aplicação web para usar os novos serviços.

#### A. Configurar o AWS Amplify
Amplify é a forma mais fácil de integrar o frontend com os serviços da AWS.

1.  **Instalar Amplify:**
    ```bash
    npm install aws-amplify
    ```
2.  **Configurar Amplify no App:**
    - Crie um arquivo `src/lib/aws-config.ts`.
    - Adicione a configuração do Amplify com o `User Pool ID` e `Client ID` do Cognito.

    ```typescript
    // src/lib/aws-config.ts
    import { Amplify } from 'aws-amplify';

    export function configureAmplify() {
      Amplify.configure({
        Auth: {
          Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID!,
            userPoolClientId: process.env.NEXT_PUBLIC_AWS_COGNITO_CLIENT_ID!,
          }
        }
      });
    }
    ```
    - Chame `configureAmplify()` no seu `layout.tsx` principal.

#### B. Reescrever Lógica de Autenticação
Substitua as chamadas do Firebase Auth pelas do Amplify.

-   **Login:** `signInWithEmailAndPassword` vira `Auth.signIn`.
-   **Cadastro:** `createUserWithEmailAndPassword` vira `Auth.signUp` (e `Auth.confirmSignUp` se a verificação de e-mail estiver ativa).
-   **Estado do Usuário:** O hook `useUser` será reescrito para usar `Auth.currentAuthenticatedUser` e `Hub.listen('auth', ...)` para monitorar o estado da autenticação.

#### C. Reescrever Camada de Dados (`data-service.ts`)
Esta é a mudança mais crítica.

1.  **Remova as importações do Firebase Admin SDK.**
2.  **Reescreva cada função para chamar sua nova API Gateway usando `fetch`:**
    - Você precisará primeiro obter o token JWT do usuário logado usando `(await Auth.currentSession()).getIdToken().getJwtToken()`.
    - Adicione este token ao cabeçalho `Authorization` de cada requisição `fetch`.

    **Exemplo de reescrita:**

    ```typescript
    // Nova versão de uma função em data-service.ts
    import { Auth } from 'aws-amplify';

    export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/prices`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar preços da nova API.');
      }
      return response.json();
    }
    ```

### Passo 4: Migração de Dados (Firestore -> DynamoDB)

1.  **Exportar do Firestore:** Use a funcionalidade de exportação do console do Firebase ou um script customizado para exportar suas coleções para arquivos JSON ou CSV.
2.  **Transformar os Dados:** Ajuste a estrutura dos dados exportados para o modelo que você definiu no DynamoDB (se necessário).
3.  **Importar para o DynamoDB:** Use a funcionalidade de importação do S3 no DynamoDB ou escreva um script (usando o AWS SDK) para ler os arquivos e inserir os itens em suas tabelas DynamoDB.

---

## 4. Checklist da Migração

- [ ] **AWS Setup:**
    - [ ] Criar User Pool no Cognito.
    - [ ] Criar tabelas no DynamoDB.
    - [ ] Criar usuário IAM com chaves de acesso.
- [ ] **Backend:**
    - [ ] Criar funções Lambda para cada operação de dados.
    - [ ] Criar API Gateway e conectar endpoints às Lambdas.
    - [ ] Proteger API Gateway com o Autorizador do Cognito.
- [ ] **Frontend:**
    - [ ] Instalar e configurar o AWS Amplify.
    - [ ] Reescrever hooks e componentes de autenticação para usar o Amplify.
    - [ ] Reescrever todas as funções do `data-service.ts` para chamar a nova API Gateway.
- [ ] **Dados:**
    - [ ] Exportar dados do Firestore.
    - [ ] Importar dados para o DynamoDB.
- [ ] **N8N:**
    - [ ] Atualizar o workflow para enviar dados para o novo endpoint da API Gateway em vez de escrever no Firestore.
- [ ] **Deploy:**
    - [ ] Configurar todas as novas variáveis de ambiente (`NEXT_PUBLIC_...`) na Vercel (ou outro provedor).
    - [ ] Fazer deploy da nova versão da aplicação.
    - [ ] Testar de ponta a ponta.

Este guia fornece uma visão geral técnica completa. Cada etapa, especialmente a criação do backend na AWS, envolve seus próprios detalhes, mas esta estrutura garante que a migração seja organizada e bem-sucedida.

    