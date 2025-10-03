# Monitor do Índice UCS - Documentação Técnica Completa

## 1. Visão Geral do Projeto

### 1.1. Objetivo
O **Monitor do Índice UCS** é uma plataforma analítica desenvolvida para calcular, monitorar e analisar o "Índice de Unidade de Conservação Sustentável" (UCS) e seus ativos componentes. O sistema resolve o problema da falta de uma visão unificada e em tempo real sobre o valor econômico de ativos ambientais e agrícolas.

### 1.2. Público-Alvo
- **Gestores e Diretores:** Para tomada de decisão estratégica baseada em dados consolidados.
- **Analistas Financeiros e de Risco:** Para análise de tendências, volatilidade e composição de índices.
- **Auditores e Administradores:** Para garantir a integridade dos dados através de ferramentas de correção e recálculo.

---

## 2. Arquitetura do Sistema

### 2.1. Diagrama de Fluxo de Dados

```mermaid
graph TD
    subgraph Fontes Externas
        A[Investing.com]
    end

    subgraph Automação
        B(N8N)
        A -- Coleta Diária --> B
    end

    subgraph Backend & Persistência
        C[Cloud Firestore]
        D(Firebase Auth)
        E{Genkit (Google AI)}
        F[Serviços de Cálculo]

        B -- Grava Cotações --> C
        G[Admin UI] -- Login --> D
        G -- Lê/Grava Dados --> F
        F -- Interage com --> C
        F -- Interage com --> E
        E -- Gera Análises --> G
    end

    subgraph Frontend
        G[Next.js App]
    end

    style B fill:#FFC400,stroke:#333
    style C fill:#FFA000,stroke:#333
    style E fill:#4285F4,stroke:#FFF
    style G fill:#0070F3,stroke:#FFF
```

### 2.2. Componentes da Arquitetura
- **Frontend (Next.js):** Interface reativa construída com React, ShadCN UI e TailwindCSS, hospedada na Vercel.
- **Automação (N8N):** Processo externo responsável por coletar dados de mercado (ex: `investing.com.br`) e popular o banco de dados. A aplicação **não** depende do N8N para funcionar, mas sim dos dados que ele gera.
- **Banco de Dados (Cloud Firestore):** Banco NoSQL gerenciado pelo Google, utilizado para armazenar cotações históricas, configurações de ativos e dados de usuários.
- **Autenticação (Firebase Authentication):** Gerencia o acesso de usuários (login, senha, perfis).
- **Inteligência Artificial (Genkit):** Orquestra chamadas para a API do Google (Gemini) para gerar análises e relatórios.

---

## 3. Banco de Dados

### 3.1. Estrutura Atual (Firestore)
- **Coleções de Ativos:** Cada ativo (ex: `soja`, `milho`, `ucs_ase`) possui sua própria coleção, onde cada documento representa a cotação para um dia específico.
- **`settings/commodities`:** Documento central que armazena a configuração de todos os ativos (ID, nome, categoria, etc.).
- **`users`:** Coleção para dados de perfil dos usuários (gerenciado pelo Firebase Auth).
- **`roles_admin`:** Coleção usada para controle de acesso. A existência de um documento com o UID do usuário como ID o designa como administrador.
- **`audit_logs`:** Coleção para registrar todas as edições e recálculos feitos na plataforma.

### 3.2. Proposta de Migração (Ex: PostgreSQL)
A aplicação foi projetada com uma **Camada de Abstração de Dados** (`src/lib/data-service.ts`), o que significa que **nenhum componente da UI ou fluxo de IA acessa o Firestore diretamente**. Isso torna uma futura migração para um banco relacional como o PostgreSQL um processo controlado:
1.  **Não há impacto na UI:** Nenhuma alteração nos componentes React é necessária.
2.  **Reimplementação Centralizada:** Apenas as funções dentro de `data-service.ts` precisariam ser reescritas para usar SQL em vez de chamadas do Firestore.
3.  **Benefícios:** Maior poder de consulta (JOINs, agregações complexas), integridade referencial e potencial redução de custos em cenários de leitura intensiva.

### 3.3. Backup e Restore
- **Firestore:** Utiliza os mecanismos nativos do Google Cloud. Backups podem ser automatizados através do console do GCP para recuperação de desastres (Point-in-Time Recovery).
- **Exportação Manual:** A ferramenta de Auditoria permite exportar dados em formato CSV ou JSON como um backup funcional.

### 3.4. Segurança e Permissões
- O acesso ao Firestore é controlado por **Firestore Security Rules**, que restringem a leitura e escrita com base no status de autenticação e no papel do usuário (admin/usuário comum).
- Acesso de administrador é verificado tanto no cliente (para exibir/ocultar elementos de UI) quanto no servidor (para proteger ações críticas como edição de usuários).

---

## 4. Controle de Versão (GitHub)

- **Repositório Centralizado:** Todo o código-fonte está em um único repositório no GitHub.
- **Branch Strategy:**
    - `main`: Reflete o ambiente de produção. Apenas merges de `develop` são permitidos.
    - `develop`: Branch de integração. Novas funcionalidades são mergidas aqui para testes antes de irem para `main`.
    - `feature/...`: Branches para novas funcionalidades (ex: `feature/risk-analysis`).
    - `fix/...`: Branches para correções de bugs (ex: `fix/audit-modal-spacing`).
- **Tags e Deploy:** Cada deploy para produção a partir da branch `main` deve gerar uma tag de versão (ex: `v1.0.0`, `v1.1.0`), facilitando o rollback se necessário.

---

## 5. Serviços e Dependências

- **Frameworks:** Next.js (React), Tailwind CSS.
- **UI:** ShadCN UI, Recharts (gráficos), Lucide React (ícones).
- **IA:** Genkit (Google AI), Zod (validação de schemas).
- **Firebase:** `firebase` (client SDK), `firebase-admin` (server-side).
- **Utilitários:** `date-fns` (manipulação de datas), `jspdf` & `html2canvas` (exportação PDF), `exceljs` (exportação Excel).
- **Serviços Externos:**
    - **N8N:** Para automação da coleta de dados. **A aplicação não o consome diretamente**, apenas lê os dados que ele produz no Firestore.
    - **Google Cloud / Firebase:** Para hospedagem do banco de dados e autenticação.
    - **Vercel:** Para hospedagem do frontend Next.js.

---

## 6. Configuração de Domínios e Servidores

### 6.1. Frontend (Vercel)
- **Domínio:** O domínio da aplicação deve ser configurado no painel da Vercel.
- **SSL:** Gerenciado automaticamente pela Vercel.
- **Variáveis de Ambiente:**
    - `FIREBASE_SERVICE_ACCOUNT_BASE64`: Credenciais do Firebase para acesso do lado do servidor.
    - `GEMINI_API_KEY`: Chave da API do Google AI.
    - `N8N_WEBHOOK_URL`: (Opcional) URL para acionar fluxos de recálculo no N8N.

### 6.2. N8N (VPS Sugerida)
Para um ambiente de produção robusto e seguro:
1.  **Provisionar VPS:** Em um provedor como DigitalOcean, AWS EC2, etc.
2.  **Configurar Domínio/Subdomínio:** Apontar um subdomínio (ex: `n8n.suaempresa.com`) para o IP da VPS.
3.  **Instalar Docker e Docker Compose.**
4.  **Configurar N8N com Docker:** Usar um `docker-compose.yml` para rodar o N8N.
5.  **Configurar Reverse Proxy (Nginx):** Para gerenciar o tráfego e aplicar SSL.
6.  **Instalar Certificado SSL:** Usar Let's Encrypt para gerar um certificado SSL gratuito.
7.  **Configurar Firewall:** Liberar apenas as portas necessárias (80, 443, 22).
8.  **Deploy Seguro:** Manter as credenciais do N8N (API keys, etc.) como variáveis de ambiente no `docker-compose.yml`.

---

## 7. LGPD e Segurança

- **Dados Pessoais Armazenados:** Apenas dados essenciais são coletados (Nome, E-mail, Telefone opcional). Nenhum dado sensível é armazenado.
- **Logs de Auditoria:** A coleção `audit_logs` no Firestore registra todas as alterações de dados críticos (quem, o quê, quando, valor antigo e novo), garantindo a rastreabilidade exigida pela LGPD.
- **Controle de Acesso:** Acesso aos dados é estritamente controlado por papéis (admin vs. usuário), conforme definido nas regras de segurança do Firebase.
- **Política de Privacidade e Cookies:** O sistema inclui um banner de consentimento de cookies e deve ser complementado por uma página de Política de Privacidade detalhando o uso dos dados.

---

## 8. Funcionalidades do Sistema

- **Dashboard:** Visualização em tempo real do índice UCS ASE e seus componentes.
- **Auditoria:** Ferramenta administrativa para visualizar, editar e recalcular dados históricos de qualquer dia.
- **Gerenciamento de Usuários:** CRUD completo de usuários com sistema de convite e promoção para administrador.
- **Análise de Composição:** Gráfico interativo que detalha a participação de cada componente no índice "Valor de Uso do Solo".
- **Geração de Relatórios com IA:** Ferramenta que utiliza a IA do Google para gerar análises financeiras sobre o desempenho de um ativo em um período, com base em dados reais.

---

## 9. Escalabilidade

- **Aplicação (Vercel):** A arquitetura serverless da Vercel escala automaticamente com o tráfego.
- **Banco de Dados (Firestore):** Escala horizontalmente de forma nativa. O design de coleções separadas por ativo ajuda a distribuir as operações de escrita e leitura.
- **N8N Escalável:** Para alto volume de automações, a arquitetura do N8N pode evoluir:
    - **Workers Distribuídos:** Configurar múltiplos workers para processar execuções em paralelo.
    - **Fila de Tarefas:** Usar um sistema de fila (como Redis ou RabbitMQ) para gerenciar o agendamento de fluxos de trabalho.
    - **Containerização:** Usar Docker/Kubernetes para gerenciar e escalar os workers do N8N de forma eficiente.

---

## 10. Procedimentos Operacionais

- **Iniciar o Sistema (Desenvolvimento):**
    1.  Preencher o arquivo `.env` com as credenciais necessárias.
    2.  Rodar `npm install` para instalar as dependências.
    3.  Rodar `npm run dev` para iniciar o servidor local.
- **Atualizações:**
    1.  Seguir o `branch strategy` (merge para `develop`, depois para `main`).
    2.  A Vercel fará o deploy automaticamente a cada push na branch `main`.
- **Manutenção e Monitoramento:**
    - **Vercel:** Monitorar a saúde da aplicação e os logs no painel da Vercel.
    - **Firebase:** Monitorar o uso e os custos do Firestore e Auth no console do Firebase.
    - **N8N:** Verificar os logs de execução no painel do N8N para garantir que a coleta de dados está funcionando.
