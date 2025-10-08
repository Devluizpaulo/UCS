# 📋 Documentação Técnica de Entrega - UCS Index Platform

## 🏛️ Visão Geral do Projeto

### Descrição do Sistema
O **UCS Index Platform** é uma plataforma web avançada para monitoramento e análise de índices de sustentabilidade, commodities e ativos financeiros. O sistema oferece visualização em tempo real, análises históricas, relatórios automatizados e integração com sistemas externos para cálculo de métricas de sustentabilidade.

### Principais Funcionalidades
- **📊 Dashboard Executivo**: Visualização em tempo real de índices principais (UCS ASE, PDM, UCS)
- **📈 Análise de Composição**: Breakdown detalhado do Valor de Uso do Solo com gráficos interativos
- **📋 Relatórios Automatizados**: Geração de PDFs e Excel com análises executivas
- **🔍 Análise de Tendências**: Histórico e projeções de performance dos ativos
- **⚙️ Administração**: Gestão de usuários, auditoria e recálculos de dados
- **🤖 IA Integrada**: Relatórios automatizados com análise de mercado via Google AI
- **📱 Interface Responsiva**: Design moderno com tema claro/escuro

### Tecnologias Utilizadas

#### Frontend
- **Next.js 15.3.3** - Framework React com App Router
- **React 18.3.1** - Biblioteca de interface
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS 3.4.1** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones modernos
- **Recharts** - Gráficos interativos

#### Backend & Integrações
- **Firebase 10.12.3** - Banco de dados NoSQL e autenticação
- **Firebase Admin 12.2.0** - Operações server-side
- **N8N** - Automação de workflows e coleta de dados
- **Google AI (Genkit)** - Geração de relatórios com IA
- **ExcelJS** - Geração de planilhas Excel
- **jsPDF** - Geração de relatórios PDF

#### Desenvolvimento
- **ESLint** - Linting de código
- **PostCSS** - Processamento CSS
- **Turbopack** - Bundling otimizado

---

## 📁 Estrutura de Pastas e Módulos Principais

```
UCS/
├── 📁 src/
│   ├── 📁 app/                    # App Router do Next.js
│   │   ├── 📁 (main)/            # Rotas autenticadas (Dashboard, Análises, Admin)
│   │   ├── 📁 (public)/          # Rotas públicas (Login, etc.)
│   │   ├── layout.tsx            # Layout raiz
│   │   └── globals.css           # Estilos globais
│   │
│   ├── 📁 components/            # Componentes React
│   │   ├── 📁 ui/                # Componentes base (Radix UI)
│   │   └── ...
│   │
│   ├── 📁 lib/                   # Lógica de negócio e utilitários
│   │   ├── data-service.ts       # Camada de abstração de dados (PONTO CENTRAL)
│   │   ├── admin-actions.ts      # Funções de servidor para administração
│   │   ├── firebase-admin-config.ts # Configuração do Firebase Admin
│   │   └── ...
│   │
│   └── 📁 ai/                     # Lógica de Inteligência Artificial com Genkit
│
├── 📁 public/                    # Assets estáticos
├── 📄 package.json               # Dependências e scripts
├── 📄 next.config.ts             # Configuração Next.js
├── 📄 firestore.rules            # Regras de segurança Firestore
└── 📄 docker-compose.yml        # Configuração do N8N local
```

### Arquitetura de Dados (Data Abstraction Layer)

A aplicação utiliza o **Padrão de Repositório** para desacoplar a lógica de negócio da tecnologia de banco de dados.

- **Ponto Central:** Toda a lógica de acesso ao banco de dados (leitura e escrita) está centralizada no arquivo `src/lib/data-service.ts`.
- **Benefício:** Nenhum outro componente da aplicação (UI, IA, etc.) acessa o Firestore diretamente. Eles requisitam dados ao `data-service`, que é o único responsável por saber *como* buscar essas informações.
- **Preparado para o Futuro:** Essa arquitetura é estratégica e permite uma futura migração do Firebase para um banco de dados na AWS (como DynamoDB ou RDS) com esforço mínimo, alterando apenas a implementação do `data-service.ts` sem impactar o resto da aplicação.

---

## ⚙️ Configuração de Ambiente

### Pré-requisitos
- **Node.js 18+** (recomendado: 20.x)
- **npm 9+** ou **yarn 1.22+**
- **Git 2.30+**
- **Docker** (para rodar o N8N localmente)

### Instalação Local

1.  **Clone o Repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd UCS
    ```

2.  **Instale as Dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie o arquivo `.env.local` na raiz do projeto (use o `.env.example` como base).

    ```env
    # Firebase Configuration (Client & Admin)
    # Codifique todo o conteúdo do seu arquivo JSON da conta de serviço em Base64
    # e cole a string resultante aqui.
    FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account_json

    # Google AI Configuration
    GOOGLE_AI_API_KEY=your_google_ai_api_key

    # N8N Integration
    # URL do webhook no seu N8N para o fluxo de recálculo
    N8N_WEBHOOK_URL=http://localhost:5678/webhook/ucs/recalc
    # Chave de API para autenticar a requisição no N8N (deve ser a mesma do docker-compose)
    N8N_API_KEY=c6af931287464f67b271fca5f3983f30
    ```

4.  **Execute o N8N Localmente (via Docker):**
    ```bash
    docker-compose up
    ```
    - O N8N estará acessível em `http://localhost:5682/`.
    - O webhook estará esperando requisições em `http://localhost:5678/webhook/ucs/recalc`.

5.  **Execute a Aplicação:**
    ```bash
    npm run dev
    ```
    - Acesse a aplicação em `http://localhost:9002`.

---

## 🗄️ Banco de Dados e Integrações

### Estrutura Firebase Firestore

-   **`quotes`**: Armazena cotações históricas de ativos.
-   **`commodity_configs`**: Configurações dos ativos e commodities.
-   **`users`**: Dados dos usuários do sistema.
-   **`audit_logs`**: Logs de auditoria para todas as alterações manuais.
-   **`roles_admin`**: Coleção para controle de acesso (a existência de um documento com o UID do usuário concede permissão de admin).

### Integração com N8N

O N8N é a fonte da verdade para os cálculos de índices e coleta de dados.

-   **Fluxo Principal:** Coleta cotações diárias e calcula todos os índices, salvando-os no Firestore.
-   **Webhook de Recálculo:** A aplicação possui um webhook (`/webhook/ucs/recalc`) que é acionado pelo Painel de Auditoria.
    -   **Endpoint:** `POST /webhook/ucs/recalc`
    -   **Autenticação:** A requisição deve conter o header `x-audit-token` com o valor da `N8N_API_KEY`.
    -   **Payload JSON:**
        ```json
        {
          "origem": "painel_auditoria",
          "data_especifica": "2024-12-01",
          "ativos": {
            "usd": { "preco": 5.42 },
            "boi": { "preco": 313.05 }
          }
        }
        ```

---

## 🚀 Procedimentos de Deploy

### Opção 1: Vercel (Recomendado)

A Vercel oferece a melhor integração com Next.js, deploy contínuo (CI/CD) e gerenciamento simplificado de variáveis de ambiente.

1.  **Conecte seu Repositório:** Crie um novo projeto na Vercel e conecte-o ao seu repositório do GitHub.
2.  **Configure as Variáveis de Ambiente:** No painel do projeto na Vercel (Settings > Environment Variables), adicione as mesmas variáveis do seu arquivo `.env.local`. **Certifique-se de que a `FIREBASE_SERVICE_ACCOUNT_BASE64` seja adicionada como uma única string.**
3.  **Deploy:** A Vercel fará o deploy automaticamente a cada `push` para a branch `main`.

### Opção 2: Servidor VPS (Hostinger, Locaweb, DigitalOcean)

Para hospedar a aplicação Next.js e o N8N (via Docker) no mesmo servidor.

**Pré-requisitos no Servidor:**
-   Node.js 18+
-   Nginx (ou outro proxy reverso)
-   PM2 (para gerenciar o processo do Next.js)
-   Docker e Docker Compose

**Passos para a Aplicação Next.js:**

1.  **Build:** Na sua máquina local, rode `npm run build`.
2.  **Upload:** Envie as pastas `.next`, `public` e os arquivos `package.json`, `next.config.ts` para o seu servidor (ex: em `/var/www/ucs-platform`).
3.  **Instalação:** No servidor, dentro da pasta, rode `npm install --production`.
4.  **PM2:** Inicie a aplicação com o PM2: `pm2 start npm --name "ucs-app" -- start`.
5.  **Nginx:** Configure o Nginx como um proxy reverso para a porta do Next.js (padrão 3000).

**Passos para o N8N:**

1.  **Upload:** Envie o arquivo `docker-compose.yml` e um arquivo `.env` com as credenciais para o servidor.
2.  **Execute:** Rode `docker-compose up -d`.
3.  **Nginx:** Configure outro bloco de servidor no Nginx para fazer o proxy reverso para a porta do N8N (ex: 5682).

**Não se esqueça de configurar os certificados SSL (Let's Encrypt) para ambos os domínios/subdomínios.**

---

## 🔒 LGPD e Segurança

A plataforma foi projetada com a LGPD em mente.

-   **Consentimento Explícito:** Um modal de consentimento é exibido no primeiro acesso, e a aceitação é registrada no banco de dados.
-   **Política de Privacidade:** A página `/privacy-policy` detalha todos os pontos de coleta e uso de dados.
-   **Mínima Coleta de Dados:** Apenas informações essenciais para autenticação e operação são coletadas.
-   **Controle de Acesso:** O sistema diferencia usuários "Admin" e "User" com regras de segurança no Firestore.
-   **Auditoria Completa:** Todas as alterações manuais de dados feitas no painel de Auditoria são registradas na coleção `audit_logs`, garantindo total rastreabilidade.
