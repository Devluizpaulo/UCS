# 🏛️ UCS Index Platform

Sistema avançado de monitoramento e análise de índices de sustentabilidade, commodities e ativos financeiros.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm 9+ ou yarn 1.22+
- Conta Firebase configurada

### Instalação
```bash
# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd UCS

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute em desenvolvimento
npm run dev
```

Acesse: [http://localhost:9002](http://localhost:9002)

## 📚 Documentação Completa

Para documentação técnica detalhada, consulte:
- **[📋 Documentação Técnica de Entrega](./DOCUMENTACAO_TECNICA_ENTREGA.md)** - Guia completo de instalação, deploy e manutenção
- **[🏗️ Arquitetura de Dados](./DATA_ABSTRACTION.md)** - Explicação da camada de abstração
- **[📖 Documentação da API](./docs/)** - Documentação técnica detalhada

## 🎯 Principais Funcionalidades

- **📊 Dashboard Executivo** - Visualização em tempo real de índices
- **📈 Análise de Composição** - Breakdown detalhado com gráficos
- **📋 Relatórios Automatizados** - PDF e Excel com análises
- **🔍 Análise de Tendências** - Histórico e projeções
- **⚙️ Administração** - Gestão de usuários e auditoria
- **🤖 IA Integrada** - Relatórios automatizados
- **📱 Interface Responsiva** - Design moderno e acessível

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase, Firestore, Firebase Admin
- **IA**: Google AI (Genkit)
- **Automação**: N8N
- **Relatórios**: ExcelJS, jsPDF

## 📋 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento (porta 9002)
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Verificação ESLint
npm run typecheck    # Verificação TypeScript
```

## 🔧 Configuração

### Variáveis de Ambiente Obrigatórias
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_BASE64=

# Google AI
GOOGLE_AI_API_KEY=

# N8N
N8N_WEBHOOK_URL=
```

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm i -g vercel
vercel --prod
```

### Hostinger/Locaweb
Consulte a [documentação de deploy](./DOCUMENTACAO_TECNICA_ENTREGA.md#-procedimentos-de-deploy) para instruções detalhadas.

## 📞 Suporte

- **Documentação**: [DOCUMENTACAO_TECNICA_ENTREGA.md](./DOCUMENTACAO_TECNICA_ENTREGA.md)
- **Issues**: Use o sistema de issues do GitHub
- **Contato**: [seu.email@empresa.com]

## 📄 Licença

Este projeto é propriedade da [Nome da Empresa] e está protegido por direitos autorais.

---

**🏛️ UCS Index Platform v1.0.0**  
**📅 2024** - Todos os direitos reservados