# Monitor do Índice UCS - Documentação Técnica

## 1. Visão Geral do Projeto

O **Monitor do Índice UCS** é uma aplicação web completa, desenvolvida para calcular, monitorar e analisar o "Índice de Unidade de Conservação Sustentável" (UCS). A plataforma oferece um dashboard em tempo real, ferramentas de análise estratégica, geração de relatórios com IA e um sistema de configuração flexível para a fórmula do índice e seus ativos subjacentes.

O objetivo é fornecer a gestores, analistas financeiros e produtores rurais uma ferramenta poderosa para entender a performance econômica de ativos ambientais e agrícolas de forma unificada.

## 2. Funcionalidades Principais

- **Dashboard Principal:** Visualização em tempo real do valor do Índice UCS, com gráficos históricos e uma tabela de cotações dos ativos que o compõem.
- **Análise Estratégica:**
    - **Tendências de Mercado:** Gráficos interativos para analisar a performance histórica do índice em diferentes períodos (diário, semanal, anual).
    - **Análise de Risco:** Cálculo de volatilidade e correlação dos ativos em relação ao índice.
    - **Análise de Cenários:** Ferramenta para simular o impacto de mudanças nos preços dos ativos sobre o valor final do índice.
- **Configuração do Sistema:**
    - **Fórmula do Índice:** Interface para ajustar todos os parâmetros, pesos e fatores que compõem a fórmula de cálculo do UCS.
    - **Fontes de Dados:** Gerenciamento completo (CRUD) dos ativos que compõem o índice, permitindo adicionar, editar ou remover commodities.
- **Geração de Relatórios com IA:**
    - Criação de relatórios em formato PDF e Excel (XLSX).
    - Análise executiva gerada por IA com base nos dados do período selecionado e em observações do usuário.
    - Funcionalidade de pré-visualização, download e compartilhamento nativo.
- **Alertas de Preço:** Sistema para configurar notificações por e-mail quando o índice atinge um determinado valor (acima ou abaixo de um limiar).
- **Autenticação e Gestão de Usuários:** Sistema de login seguro e painel de administração para criar, editar e gerenciar usuários e suas permissões.

## 3. Arquitetura e Stack Tecnológica

A aplicação é construída com uma arquitetura moderna baseada em componentes, utilizando o Next.js App Router.

- **Frontend:**
    - **Framework:** [Next.js](https://nextjs.org/) (com App Router)
    - **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
    - **UI:** [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
    - **Gráficos:** [Recharts](https://recharts.org/)
    - **Ícones:** [Lucide React](https://lucide.dev/)

- **Backend & IA:**
    - **Orquestração de IA:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
    - **Banco de Dados:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (para salvar configurações, usuários, histórico do índice e cotações)
    - **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth) e sistema de autenticação customizado com Firestore e JWT.

- **Fonte de Dados Externa:**
    - **Automação de Dados:** Processos externos (como [n8n](https://n8n.io/)) são usados para coletar dados de mercado e inseri-los no Firestore.

## 4. Estrutura de Pastas do Projeto

```
/
├── src/
│   ├── app/                # Rotas e páginas da aplicação (Next.js App Router)
│   │   ├── (main)/         # Layout principal e páginas autenticadas
│   │   ├── login/          # Página de login e recuperação de senha
│   │   └── api/            # Endpoints de API do Next.js
│   │
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── ui/             # Componentes base do ShadCN (Button, Card, etc.)
│   │   └── *.tsx           # Componentes de lógica da aplicação (DashboardPage, etc.)
│   │
│   ├── lib/                # Lógica de negócio, serviços e configurações
│   │   ├── calculation-service.ts  # Lógica pura de cálculo da fórmula
│   │   ├── data-service.ts           # Funções para ler/escrever dados do Firestore
│   │   ├── firebase-admin-config.ts  # Configuração do Firebase Admin SDK (servidor)
│   │   ├── firebase-config.ts        # Configuração do Firebase SDK (cliente)
│   │   └── ...outros serviços
│   │
│   ├── ai/                 # Lógica de Inteligência Artificial com Genkit
│   │   ├── flows/          # Arquivos de fluxos do Genkit
│   │   └── genkit.ts       # Configuração e inicialização do Genkit
│   │
│   ├── hooks/              # Hooks React customizados (ex: useToast)
│   │
│   └── middleware.ts       # Middleware para proteção de rotas
│
├── public/                 # Arquivos estáticos (imagens, etc.)
│
├── .env                    # Arquivo para variáveis de ambiente
├── next.config.ts          # Configuração do Next.js
└── tailwind.config.ts      # Configuração do Tailwind CSS
```

## 5. Fluxos de Dados e Processos

### 5.1. Autenticação de Usuário

1.  O usuário insere e-mail e senha na página de **/login**.
2.  A API (`/api/auth/login`) valida as credenciais contra os dados no **Firestore**.
3.  Se válido, um token **JWT** é gerado e armazenado em um cookie `httpOnly`, e um token customizado do Firebase Auth é retornado para o cliente.
4.  O cliente usa o token customizado para se autenticar com o Firebase Auth SDK.
5.  O `middleware.ts` intercepta todas as requisições a páginas protegidas, valida o JWT do cookie e libera ou nega o acesso.
6.  No primeiro login, o usuário é forçado a trocar sua senha temporária.

### 5.2. Cálculo e Atualização do Índice

1.  **Coleta de Dados:** Um processo automatizado (ex: n8n) busca as cotações mais recentes das commodities em fontes externas e as salva na coleção `cotacoes_do_dia` no Firestore.
2.  **Cálculo (`calculateIndex`):** A função em `calculation-service.ts` é chamada. Ela busca os preços mais recentes das commodities e os parâmetros da fórmula (ambos do Firestore), executa a lógica de cálculo e retorna o valor final do índice.
3.  **Armazenamento:** O novo valor do índice e seus componentes são salvos na coleção `ucs_index_history` para manter um registro diário.
4.  **Exibição:** O frontend (`DashboardPage`) busca e exibe o último valor registrado do índice e seu histórico.

## 6. Configuração e Variáveis de Ambiente

Para o funcionamento correto da aplicação, é necessário configurar as seguintes variáveis de ambiente no arquivo `.env` na raiz do projeto. Para deploy na **Vercel**, siga as instruções em `VERCEL_SETUP.md`.

**Configurações do Firebase Admin SDK (Lado do Servidor):**
- `FIREBASE_SERVICE_ACCOUNT_BASE64`: O conteúdo completo do seu arquivo JSON de conta de serviço Firebase, codificado em Base64.

**Configurações da IA (Gemini):**
- `GEMINI_API_KEY`: Sua chave de API do Google AI Studio (ou Google Cloud).

**Chave Secreta para JWT:**
- `JWT_SECRET`: Uma chave secreta forte e aleatória para assinar os tokens de sessão.

**Exemplo de arquivo `.env`:**

```
# Firebase Admin SDK (instruções em VERCEL_SETUP.md)
FIREBASE_SERVICE_ACCOUNT_BASE64="COLE_SUA_STRING_BASE64_AQUI"

# Google AI
GEMINI_API_KEY=sua_gemini_api_key

# JWT Secret
JWT_SECRET=gere_uma_chave_secreta_forte_aqui
```

## 7. Como Executar Localmente

1.  **Instalar Dependências:**
    ```bash
    npm install
    ```
2.  **Configurar Variáveis de Ambiente:**
    - Crie um arquivo `.env` na raiz do projeto.
    - Configure as variáveis do Firebase, Gemini e JWT conforme o exemplo acima.
3.  **Executar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
4.  **Acessar a Aplicação:**
    - Abra `http://localhost:9002` em seu navegador.
5.  **Primeiro Acesso:**
    - Como não há usuários, use a opção "Criar Conta de Administrador" na tela de login para criar o primeiro usuário do sistema.
