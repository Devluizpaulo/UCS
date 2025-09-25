# Monitor do Índice UCS - Documentação Técnica

## 1. Visão Geral do Projeto

O **Monitor do Índice UCS** é uma aplicação web completa, desenvolvida para calcular, monitorar e analisar o "Índice de Unidade de Conservação Sustentável" (UCS) e seus ativos componentes. A plataforma oferece um dashboard em tempo real, ferramentas de análise estratégica, geração de relatórios com IA e um sistema de configuração flexível para os ativos.

O objetivo é fornecer a gestores, analistas e produtores rurais uma ferramenta poderosa para entender a performance econômica de ativos ambientais e agrícolas de forma unificada.

## 2. Funcionalidades Principais

- **Dashboard Principal:** Visualização em tempo real do valor do Índice UCS, com gráficos históricos e uma tabela de cotações dos ativos que o compõem. Permite a navegação para dias anteriores.
- **Análise Estratégica:**
  - **Análise de Tendências:** Gráficos interativos para analisar a performance histórica do índice em diferentes períodos (7, 30 e 90 dias).
  - **Análise de Risco:** Ferramenta para calcular e exibir métricas de volatilidade (desvio padrão, coeficiente de variação, etc.) para qualquer ativo em um período selecionado.
- **Geração de Relatórios com IA:**
  - Ferramenta para gerar uma análise executiva sobre a performance de um ativo em um período específico.
  - A IA (via Genkit) atua como uma analista financeira sênior, baseando-se nos dados históricos reais do ativo, que são buscados do banco de dados no momento da geração.
  - O usuário pode fornecer observações adicionais para guiar a análise da IA.
- **Administração:**
  - **Gerenciamento de Usuários:** Interface completa de **CRUD** (Adicionar, Editar, Desativar, Remover) para os usuários da plataforma, com um fluxo de convite que gera um link para o novo usuário definir sua senha.
  - **Gerenciamento de Ativos:** Interface para visualizar a lista de todos os ativos e **adicionar novos**, salvando as configurações diretamente no banco de dados.
- **Autenticação:**
  - Sistema de login com e-mail e senha.
  - Fluxo de **recuperação de senha** através de um link enviado por e-mail.
  - Perfil de usuário editável (nome, senha, telefone).

## 3. Arquitetura e Stack Tecnológica

- **Frontend:**
  - **Framework:** [Next.js](https://nextjs.org/) (com App Router)
  - **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
  - **UI:** [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
  - **Gráficos:** [Recharts](https://recharts.org/)
  - **Ícones:** [Lucide React](https://lucide.dev/)
  - **Estatísticas:** [simple-statistics](https://simplestatistics.org/)

- **Backend & IA:**
  - **Orquestração de IA:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
  - **Banco de Dados:** [Cloud Firestore](https://firebase.google.com/docs/firestore)
  - **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth)

- **Fonte de Dados Externa:**
  - **Automação de Dados:** Processos externos (como [n8n](https://n8n.io/)) são usados para coletar dados de mercado do [investing.com.br](https://br.investing.com/) e inseri-los no Firestore diariamente. A aplicação apenas lê esses dados.

## 4. Camada de Abstração de Dados

Um dos princípios de design mais importantes desta aplicação é a **abstração da camada de dados**.

- **Ponto Central:** Todas as interações com o banco de dados (leitura e escrita) estão centralizadas no arquivo `src/lib/data-service.ts`. Nenhum outro arquivo na aplicação (seja componente de UI ou fluxo de IA) acessa o Firestore diretamente.
- **Objetivo:** Isolar a lógica de negócio da tecnologia específica do banco de dados. Os componentes pedem "me dê os preços dos ativos", e o `data-service` é o único responsável por saber *como* buscar esses dados no Firestore.

### **Previsão para Migração de Banco de Dados**
Esta arquitetura foi pensada para facilitar uma futura migração do Cloud Firestore para outro banco de dados (ex: PostgreSQL, MongoDB, etc.).

Para realizar a migração:
1. A equipe de backend precisará criar um novo serviço com a mesma "interface" de funções que o `data-service.ts` atual (ex: `getCommodityPrices`, `getCotacoesHistorico`, etc.).
2. A implementação dessas funções será específica para o novo banco de dados (usando SQL, um ORM, ou queries NoSQL).
3. Uma vez que o novo serviço esteja pronto, basta substituir a implementação interna do `data-service.ts`.

**Nenhuma alteração será necessária nos componentes de UI, fluxos de IA ou lógica de apresentação**, pois eles dependem do "contrato" (as funções exportadas) do serviço de dados, e não de sua implementação interna. Para mais detalhes, consulte o arquivo `DATA_ABSTRACTION.md`.

## 5. Estrutura de Pastas do Projeto
```
/
├── src/
│   ├── app/                # Rotas da aplicação (Next.js App Router)
│   │   ├── (main)/         # Layout e páginas principais (dashboard, análise, admin)
│   │   ├── (public)/       # Layout e páginas públicas (landing, login, etc.)
│   │   ├── page.tsx        # Landing Page (página inicial pública)
│   │   └── api/            # Endpoints de API (se necessário)
│   │
│   ├── components/         # Componentes React reutilizáveis
│   │   ├── ui/             # Componentes base do ShadCN
│   │   ├── admin/          # Componentes para a área de administração
│   │   └── *.tsx           # Componentes de lógica da aplicação
│   │
│   ├── lib/                # Funções utilitárias, serviços e configurações
│   │   ├── data-service.ts # <<< PONTO CENTRAL DE ACESSO AO BANCO DE DADOS
│   │   ├── admin-actions.ts# Funções de servidor para ações de admin (CRUD de usuários)
│   │   └── firebase-admin-config.ts # Configuração do Firebase Admin SDK
│   │
│   ├── ai/                 # Lógica de Inteligência Artificial com Genkit
│   │   ├── flows/          # Fluxos de IA (ex: geração de relatório)
│   │   └── genkit.ts       # Configuração e inicialização do Genkit
│   │
│   ├── hooks/              # Hooks React customizados
│   ├── firebase/           # Configuração, providers e hooks do Firebase Client SDK
│
├── public/                 # Arquivos estáticos (imagens, etc.)
│
├── .env                    # Arquivo para variáveis de ambiente
├── next.config.ts          # Configuração do Next.js
└── tailwind.config.ts      # Configuração do Tailwind CSS
```

## 6. Fluxos de Dados e Processos

### 6.1. Coleta e Exibição de Dados

1.  **Coleta de Dados (externa):** Um processo `n8n` busca as cotações mais recentes do `investing.com.br`.
2.  **Armazenamento:** O `n8n` salva os dados brutos em coleções separadas no Firestore para cada ativo (ex: coleção `soja`, `milho`, etc.), incluindo um `timestamp`.
3.  **Leitura pela Aplicação:** Quando um usuário acessa o dashboard, o `data-service.ts` é chamado.
4.  **Exibição:** O `data-service` busca os dados do Firestore, os processa (calculando variações) e os retorna para os componentes React, que os renderizam em tabelas e gráficos. A aplicação implementa um cache em memória para otimizar as leituras repetidas.

### 6.2. Geração de Relatório com IA

1.  **Interface do Usuário:** O usuário seleciona um ativo, um período e (opcionalmente) digita uma observação no componente `ReportGenerator`.
2.  **Chamada do Fluxo:** O componente chama a função `generateReport` no `report-flow.ts`.
3.  **Busca de Dados Reais:** O fluxo de IA primeiro usa o `data-service` para buscar no Firestore todo o histórico de cotações para o ativo e período selecionados.
4.  **Invocação da IA:** O fluxo envia os dados históricos e as instruções (o *prompt*) para a API do Google AI via Genkit.
5.  **Retorno Estruturado:** A IA retorna a análise em um formato JSON estruturado (resumo, tendências, etc.).
6.  **Exibição:** O componente `ReportGenerator` recebe o JSON e exibe a análise formatada para o usuário.

## 7. Configuração e Variáveis de Ambiente

Para executar a aplicação, configure as seguintes variáveis de ambiente no arquivo `.env`.

**Configurações do Firebase Admin SDK (Lado do Servidor):**
- `FIREBASE_SERVICE_ACCOUNT_BASE64`: O conteúdo completo do seu arquivo JSON de conta de serviço Firebase, codificado em Base64. (Instruções em `VERCEL_SETUP.md`)

**Configurações da IA (Gemini):**
- `GEMINI_API_KEY`: Sua chave de API do Google AI Studio (ou Google Cloud).

**Exemplo de arquivo `.env`:**
```
# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT_BASE64="COLE_SUA_STRING_BASE64_AQUI"

# Google AI
GEMINI_API_KEY=sua_gemini_api_key
```

### 7.1. Trocando o Projeto Firebase

Caso seja necessário conectar a aplicação a um projeto Firebase diferente, siga estes passos:

1.  **Gere uma Nova Chave de Serviço:** No console do **novo** projeto Firebase, vá para "Configurações do Projeto" > "Contas de Serviço" e gere uma nova chave privada. Um arquivo JSON será baixado.
2.  **Codifique a Chave em Base64:** Converta todo o conteúdo do arquivo JSON para uma única string em Base64. Você pode usar um site como o [Base64 Encode](https://www.base64encode.org/).
3.  **Atualize as Variáveis de Ambiente:** Substitua o valor da variável `FIREBASE_SERVICE_ACCOUNT_BASE64` pela nova string Base64 que você gerou.
    -   **Localmente:** Altere o valor no seu arquivo `.env`.
    -   **Em Produção (Vercel, etc.):** Altere o valor nas configurações de variáveis de ambiente do seu provedor de hospedagem.
4.  **Reinicie a Aplicação:** Para que as alterações tenham efeito, reinicie seu servidor de desenvolvimento local ou faça um novo deploy em produção.

## 8. Como Executar Localmente

1.  **Instalar Dependências:**
    ```bash
    npm install
    ```
2.  **Configurar Variáveis de Ambiente:**
    - Crie um arquivo `.env` na raiz do projeto.
    - Configure as variáveis do Firebase e Gemini conforme o exemplo acima.
3.  **Executar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
4.  **Acessar a Aplicação:**
    - Abra `http://localhost:9002` em seu navegador.
