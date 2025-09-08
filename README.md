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
- **Autenticação de Usuários:** Sistema de login seguro utilizando Firebase Authentication para proteger o acesso à plataforma.

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
    - **Banco de Dados:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (para salvar configurações, histórico do índice e cotações)
    - **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth)

- **Fonte de Dados Externa:**
    - **API de Cotações:** [MarketData.app](https://marketdata.app/) para buscar preços de commodities e taxas de câmbio.

## 4. Estrutura de Pastas do Projeto

```
/
├── src/
│   ├── app/                # Rotas e páginas da aplicação (Next.js App Router)
│   │   ├── (main)/         # Layout principal e páginas autenticadas
│   │   ├── login/          # Página de login
│   │   └── api/            # Endpoints de API (ex: para cron jobs)
│   │
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── ui/             # Componentes base do ShadCN (Button, Card, etc.)
│   │   └── *.tsx           # Componentes de lógica da aplicação (DashboardPage, etc.)
│   │
│   ├── lib/                # Lógica de negócio e serviços core
│   │   ├── calculation-service.ts  # Lógica pura de cálculo da fórmula do índice
│   │   ├── commodity-config-service.ts # CRUD para configuração dos ativos
│   │   ├── data-service.ts           # Funções para ler dados do Firestore
│   │   ├── database-service.ts       # Funções para escrever dados no Firestore
│   │   ├── firebase-admin-config.ts  # Configuração do Firebase Admin SDK (servidor)
│   │   ├── firebase-config.ts        # Configuração do Firebase (cliente)
│   │   ├── formula-service.ts        # CRUD para os parâmetros da fórmula
│   │   ├── marketdata-config.ts      # Configuração dos ativos padrão
│   │   └── seed-test-data.ts         # Dados de teste para desenvolvimento
│   │
│   ├── ai/                 # Lógica de Inteligência Artificial com Genkit
│   │   ├── flows/          # Arquivos de fluxos do Genkit
│   │   └── genkit.ts       # Configuração e inicialização do Genkit
│   │
│   └── hooks/              # Hooks React customizados (ex: useToast, useDebounce)
│
├── public/                 # Arquivos estáticos (imagens, etc.)
│
├── .env                    # Arquivo para variáveis de ambiente (Firebase)
├── next.config.ts          # Configuração do Next.js
└── tailwind.config.ts      # Configuração do Tailwind CSS
```

## 5. Fluxos de Dados e Processos

### 5.1. Cálculo e Atualização do Índice

1.  **Dados de Teste:** O sistema utiliza dados de teste gerados automaticamente através do `seed-test-data.ts`.
2.  **Fluxo de Dados:**
    - Os dados são carregados diretamente do Firebase através do `data-service.ts`.
3.  **Cálculo (`calculateUcsIndex`):**
    - Busca os preços mais recentes e os parâmetros da fórmula (`formula-service.ts`).
    - Executa a lógica de cálculo em `calculation-service.ts`.
    - Salva o novo valor do índice e seus componentes no Firestore através de `database-service.ts`.

### 5.2. Renderização do Dashboard

1.  **Carregamento da Página:** O componente `DashboardPage` é renderizado.
2.  **Busca de Dados:** `data-service.ts` é chamado para buscar:
    - O último valor registrado do Índice UCS.
    - O histórico de valores para o gráfico.
    - A lista de ativos com seus preços mais recentes.
3.  **Exibição:** Os dados são passados para os componentes filhos (`UcsIndexChart`, `UnderlyingAssetsTable`, etc.) para serem exibidos.

## 6. Configuração e Variáveis de Ambiente

Para o funcionamento correto da aplicação, é necessário configurar as seguintes variáveis de ambiente no arquivo `.env` na raiz do projeto.

**Configurações do Firebase:**

O projeto utiliza Firebase Admin SDK para conectar com o banco de dados. As configurações são feitas através de variáveis de ambiente no arquivo `.env`.
Você precisa gerar uma chave longa e aleatória. Pode usar um gerador de senhas online ou o seguinte comando no terminal (Linux/macOS):
**Exemplo de arquivo `.env`:**

```
FIREBASE_SERVICE_ACCOUNT=sua_chave_privada_do_firebase
NEXT_PUBLIC_APP_ENV=development
```

## 7. Como Executar Localmente

1.  **Instalar Dependências:**
    ```bash
    npm install
    ```
2.  **Configurar Variáveis de Ambiente:**
    - Crie um arquivo `.env` na raiz do projeto.
    - Configure as variáveis do Firebase conforme necessário.
3.  **Executar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
4.  **Acessar a Aplicação:**
    - Abra `http://localhost:9002` em seu navegador.
```