# 🏛️ UCS Index Platform

Sistema avançado de monitoramento e análise de índices de sustentabilidade, commodities e ativos financeiros.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm 9+
- Docker e Docker Compose (para rodar o N8N localmente)

### Instalação
```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd UCS

# 2. Instale as dependências da aplicação
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas credenciais do Firebase e Google AI.
# A chave da API do N8N já vem pré-configurada para o ambiente local.

# 4. Inicie o N8N localmente com Docker
docker-compose up -d

# 5. Execute a aplicação em modo de desenvolvimento
npm run dev
```

Acesse a aplicação em [http://localhost:9002](http://localhost:9002) e o N8N em [http://localhost:5682](http://localhost:5682).

## 📚 Documentação Completa

Para um guia técnico detalhado sobre arquitetura, configuração, deploy, integrações e manutenção, consulte o nosso documento principal:

- **[📋 Documentação Técnica de Entrega](./DOCUMENTACAO_TECNICA_ENTREGA.md)**

## 🎯 Principais Funcionalidades

- **📊 Dashboard Executivo**: Visualização em tempo real dos principais índices.
- **📈 Análise de Composição e Tendências**: Breakdown detalhado com gráficos interativos.
- **📋 Relatórios Automatizados**: Geração de relatórios em PDF e Excel.
- **⚙️ Administração**: Gestão de usuários, auditoria e recálculo de dados.
- **🤖 IA Integrada**: Geração de análises executivas com Google AI.
- **🔄 Integração N8N**: Orquestração da coleta e cálculo dos dados.

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend & IA**: Firebase (Auth, Firestore), Google AI (Genkit)
- **Automação**: N8N (executado via Docker)
- **Relatórios**: ExcelJS, jsPDF

##  Scripts Disponíveis

```bash
npm run dev          # Inicia em modo de desenvolvimento na porta 9002
npm run build        # Cria a build de produção
npm run start        # Inicia o servidor de produção
npm run lint         # Executa o linter para análise de código
```

---

**🏛️ UCS Index Platform v1.0.0**
