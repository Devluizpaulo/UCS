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
│   │   ├── 📁 (main)/            # Rotas autenticadas
│   │   │   ├── 📁 dashboard/     # Dashboard principal
│   │   │   ├── 📁 analysis/      # Análises (composição, tendências, rentabilidade)
│   │   │   ├── 📁 admin/         # Administração (usuários, auditoria)
│   │   │   ├── 📁 reports/       # Gerador de relatórios
│   │   │   └── 📁 settings/      # Configurações
│   │   ├── 📁 (public)/          # Rotas públicas
│   │   │   ├── 📁 login/         # Autenticação
│   │   │   ├── 📁 forgot-password/
│   │   │   └── 📁 reset-password/
│   │   ├── 📁 privacy-policy/    # Política de privacidade
│   │   ├── layout.tsx            # Layout raiz
│   │   ├── page.tsx              # Página inicial
│   │   └── globals.css           # Estilos globais
│   │
│   ├── 📁 components/            # Componentes React
│   │   ├── 📁 admin/             # Componentes administrativos
│   │   ├── 📁 auth/              # Componentes de autenticação
│   │   ├── 📁 ui/                # Componentes base (Radix UI)
│   │   ├── excel-export-button.tsx
│   │   ├── excel-preview-modal.tsx
│   │   ├── pdf-export-button.tsx
│   │   ├── pdf-preview-modal.tsx
│   │   └── ...
│   │
│   ├── 📁 lib/                   # Lógica de negócio e utilitários
│   │   ├── 📁 ai/                # Integração com IA
│   │   ├── 📁 firebase/          # Configuração Firebase
│   │   ├── data-service.ts       # Camada de abstração de dados
│   │   ├── pdf-generator.ts      # Geração de PDFs
│   │   ├── types.ts              # Definições TypeScript
│   │   └── ...
│   │
│   └── 📁 hooks/                 # Custom hooks React
│
├── 📁 docs/                      # Documentação técnica
├── 📁 public/                    # Assets estáticos
├── 📄 package.json               # Dependências e scripts
├── 📄 next.config.ts             # Configuração Next.js
├── 📄 tailwind.config.ts         # Configuração Tailwind
├── 📄 firestore.rules            # Regras de segurança Firestore
└── 📄 DATA_ABSTRACTION.md        # Documentação da arquitetura
```

### Módulos Principais

#### 🎯 **Core Modules**
- **`data-service.ts`**: Camada de abstração para acesso a dados
- **`types.ts`**: Definições TypeScript centralizadas
- **`formatters.ts`**: Utilitários de formatação de dados
- **`constants.ts`**: Constantes do sistema

#### 🔐 **Authentication & Security**
- **`firebase/config.ts`**: Configuração Firebase client-side
- **`firebase-admin-config.ts`**: Configuração Firebase server-side
- **`firestore.rules`**: Regras de segurança do banco

#### 📊 **Business Logic**
- **`calculation-service.ts`**: Cálculos de índices
- **`recalculation-service.ts`**: Sistema de recálculos
- **`audit-log-service.ts`**: Logs de auditoria

#### 🤖 **AI Integration**
- **`ai/flows/report-flow.ts`**: Fluxo de geração de relatórios com IA
- **`ai/genkit.ts`**: Configuração Google AI

---

## ⚙️ Configuração de Ambiente

### Pré-requisitos
- **Node.js 18+** (recomendado: 20.x)
- **npm 9+** ou **yarn 1.22+**
- **Git 2.30+**

### Instalação Local

#### 1. Clone do Repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd UCS
```

#### 2. Instalação de Dependências
```bash
npm install
# ou
yarn install
```

#### 3. Configuração de Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_service_account_json

# Google AI Configuration
GOOGLE_AI_API_KEY=your_google_ai_api_key

# N8N Integration
N8N_WEBHOOK_URL=https://your_n8n_instance.com/webhook/ucs
N8N_API_KEY=your_n8n_api_key

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:9002
NODE_ENV=development
```

#### 4. Configuração do Firebase

##### Firebase Console Setup:
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto ou selecione existente
3. Ative **Authentication** → **Sign-in method** → **Email/Password**
4. Ative **Firestore Database**
5. Gere uma **Service Account Key** em **Project Settings** → **Service Accounts**

##### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para cotações (públicas para leitura)
    match /quotes/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Regras para configurações (admin only)
    match /commodity_configs/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        resource.data.admin_emails.hasAny([request.auth.token.email]);
    }
    
    // Regras para usuários
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 5. Execução em Desenvolvimento
```bash
npm run dev
# Acesse: http://localhost:9002
```

#### 6. Build para Produção
```bash
npm run build
npm run start
```

### Scripts Disponíveis
```bash
npm run dev          # Desenvolvimento com Turbopack
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Verificação ESLint
npm run typecheck    # Verificação TypeScript
```

---

## 🗄️ Banco de Dados e Integrações

### Estrutura Firebase Firestore

#### 📊 **Coleção: `quotes`**
Armazena cotações históricas de ativos.

```typescript
interface FirestoreQuote {
  id: string;                    // asset_id + timestamp
  asset_id: string;              // ID do ativo
  data: string;                  // Data da cotação (DD/MM/YYYY)
  ultimo: number;                // Preço atual
  variacao_pct: number;          // Variação percentual
  timestamp: number;             // Timestamp Unix
  valor?: number;                // Valor adicional
  [key: string]: any;           // Campos adicionais específicos
}
```

**Exemplo de documento:**
```json
{
  "id": "usd_20241201_180000",
  "asset_id": "usd",
  "data": "01/12/2024",
  "ultimo": 5.12,
  "variacao_pct": 0.85,
  "timestamp": 1701456000,
  "fonte": "API Externa"
}
```

#### ⚙️ **Coleção: `commodity_configs`**
Configurações dos ativos e commodities.

```typescript
interface CommodityConfig {
  id: string;                    // Identificador único
  name: string;                  // Nome do ativo
  currency: 'USD' | 'BRL' | 'EUR';
  category: string;              // Categoria do ativo
  description: string;           // Descrição
  unit: string;                  // Unidade de medida
  sourceUrl?: string;            // URL da fonte de dados
  admin_emails: string[];        // Emails com permissão admin
}
```

#### 👥 **Coleção: `users`**
Dados dos usuários do sistema.

```typescript
interface UserData {
  uid: string;                   // Firebase UID
  email: string;                 // Email do usuário
  displayName?: string;          // Nome exibido
  isAdmin: boolean;              // Flag de administrador
  createdAt: Timestamp;          // Data de criação
  lastLogin: Timestamp;          // Último login
  preferences: {                 // Preferências do usuário
    theme: 'light' | 'dark';
    language: 'pt' | 'en';
  };
}
```

#### 📝 **Coleção: `audit_logs`**
Logs de auditoria do sistema.

```typescript
interface AuditLogEntry {
  id: string;                    // ID único do log
  timestamp: Timestamp;          // Data/hora da ação
  action: string;                // Tipo de ação
  assetId: string;               // ID do ativo afetado
  assetName: string;             // Nome do ativo
  oldValue: any;                 // Valor anterior
  newValue: any;                 // Novo valor
  user: string;                  // Email do usuário
  details: string;               // Detalhes adicionais
  targetDate: string;            // Data alvo (YYYY-MM-DD)
}
```

### Integração N8N

#### 🔄 **Fluxo Principal de Coleta de Dados**

O N8N é responsável pela coleta automatizada de dados de APIs externas e cálculo dos índices.

**Workflows Principais:**

1. **Coleta Diária de Cotações**
   - **Trigger**: Cron job (diário às 18:00)
   - **Ações**: 
     - Busca cotações de APIs externas
     - Calcula índices derivados (VUS, VMAD, UCS)
     - Salva dados no Firestore
     - Envia notificações de erro se necessário

2. **Recálculo Manual**
   - **Trigger**: Webhook do sistema
   - **Ações**:
     - Recebe parâmetros de data e ativos
     - Reprocessa cálculos específicos
     - Atualiza banco de dados
     - Retorna status da operação

**Configuração do Webhook:**
```bash
# URL do webhook N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ucs-recalculation

# Exemplo de payload
{
  "action": "recalculate",
  "targetDate": "2024-12-01",
  "assets": ["usd", "eur", "soja"],
  "force": false
}
```

#### 📋 **Importação do Fluxo N8N**

1. **Exportar Fluxo Atual:**
   - Acesse N8N Interface
   - Selecione o workflow
   - Export → JSON

2. **Importar em Nova Instância:**
   - Crie novo workflow
   - Import → JSON
   - Configure credenciais e URLs

3. **Configurações Necessárias:**
   - Credenciais de APIs externas
   - URL do Firestore
   - Chaves de autenticação
   - Webhooks endpoints

---

## 🚀 Procedimentos de Deploy

### Deploy na Vercel (Recomendado)

#### 1. **Configuração Automática**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### 2. **Configuração de Variáveis**
No painel Vercel:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `GOOGLE_AI_API_KEY`
- `N8N_WEBHOOK_URL`

#### 3. **Configuração de Domínio**
1. Adicione domínio customizado
2. Configure DNS records
3. SSL automático via Vercel

### Deploy na Hostinger

#### 1. **Preparação do Build**
```bash
# Build de produção
npm run build

# Teste local do build
npm run start
```

#### 2. **Configuração no cPanel Hostinger**
1. Acesse o **File Manager** no cPanel
2. Navegue até `/public_html`
3. Faça upload da pasta `.next` (build)
4. Faça upload dos arquivos estáticos:
   - `package.json`
   - `next.config.ts`
   - `tailwind.config.ts`
   - `tsconfig.json`

#### 3. **Configuração de Domínio e SSL**
1. **Domínio**: Configure DNS para apontar para o servidor
2. **SSL**: Ative certificado SSL gratuito no cPanel
3. **Redirects**: Configure redirect de HTTP para HTTPS

#### 4. **Configuração do Servidor Node.js**
1. Acesse **Node.js** no cPanel
2. Configure:
   - **Node.js Version**: 18.x ou superior
   - **Application Mode**: Production
   - **Application Root**: `/public_html`
   - **Application URL**: `https://seudominio.com`

#### 5. **Variáveis de Ambiente em Produção**
Configure no painel Node.js do cPanel:
```env
NODE_ENV=production
NEXT_PUBLIC_FIREBASE_API_KEY=production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=production_domain
# ... outras variáveis de produção
```

### Deploy na Locaweb

#### 1. **Preparação**
```bash
npm run build
tar -czf ucs-deploy.tar.gz .next package.json next.config.ts
```

#### 2. **Upload via FTP**
1. Conecte via FTP/SFTP
2. Faça upload do arquivo `ucs-deploy.tar.gz`
3. Extraia no servidor: `tar -xzf ucs-deploy.tar.gz`

#### 3. **Configuração do Apache/Nginx**
```apache
# .htaccess para Apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Configuração Nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Configuração do N8N em VPS

#### 1. **Instalação do N8N**
```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar N8N
sudo npm install n8n -g

# Criar usuário para N8N
sudo useradd -m -s /bin/bash n8n
sudo usermod -aG sudo n8n
```

#### 2. **Configuração como Serviço**
```bash
# Criar serviço systemd
sudo nano /etc/systemd/system/n8n.service
```

```ini
[Unit]
Description=n8n
After=network.target

[Service]
Type=simple
User=n8n
WorkingDirectory=/home/n8n
ExecStart=/usr/bin/n8n start
Restart=always
RestartSec=10
Environment=N8N_BASIC_AUTH_ACTIVE=true
Environment=N8N_BASIC_AUTH_USER=admin
Environment=N8N_BASIC_AUTH_PASSWORD=your_secure_password
Environment=N8N_HOST=0.0.0.0
Environment=N8N_PORT=5678
Environment=N8N_PROTOCOL=https

[Install]
WantedBy=multi-user.target
```

#### 3. **Configuração Nginx (Proxy)**
```nginx
server {
    listen 80;
    server_name your-n8n-domain.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4. **SSL com Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-n8n-domain.com
```

### Checklist Pós-Deploy

#### ✅ **Testes Obrigatórios**
- [ ] Acesso ao sistema via URL de produção
- [ ] Login/logout funcionando
- [ ] Dashboard carregando dados
- [ ] Exportação de PDF/Excel
- [ ] Responsividade mobile
- [ ] Performance (Core Web Vitals)

#### ✅ **Monitoramento**
- [ ] Logs de erro configurados
- [ ] Uptime monitoring ativo
- [ ] Backup automático configurado
- [ ] Alertas de performance configurados

#### ✅ **Segurança**
- [ ] HTTPS configurado e funcionando
- [ ] Firewall configurado
- [ ] Backup das credenciais
- [ ] Teste de penetração básico

---

## 📚 Controle de Versão (GitHub)

### Estrutura do Repositório

#### 🌿 **Branches**
```
main                    # Produção estável
├── develop            # Desenvolvimento principal
├── feature/           # Features específicas
│   ├── feature/excel-preview
│   ├── feature/ai-reports
│   └── feature/admin-panel
├── hotfix/            # Correções urgentes
│   ├── hotfix/security-patch
│   └── hotfix/critical-bug
└── release/           # Preparação de releases
    ├── release/v1.0.0
    └── release/v1.1.0
```

#### 📝 **Padrões de Commit**
```bash
# Formato: <tipo>(<escopo>): <descrição>

feat(auth): adicionar autenticação com Firebase
fix(dashboard): corrigir carregamento de dados
docs(readme): atualizar instruções de instalação
style(ui): ajustar cores do tema escuro
refactor(data): otimizar queries do Firestore
test(auth): adicionar testes de login
chore(deps): atualizar dependências
```

#### 🏷️ **Versionamento Semântico**
```bash
# Formato: MAJOR.MINOR.PATCH

1.0.0    # Release inicial
1.0.1    # Bug fix
1.1.0    # Nova feature
1.1.1    # Bug fix
2.0.0    # Breaking change
```

### Configuração do Repositório

#### 📋 **Arquivos Essenciais**

**`.gitignore`**
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build
.next/
out/
dist/
build/

# Firebase
.firebase/
firebase-debug.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

**`README.md`**
```markdown
# UCS Index Platform

Sistema de monitoramento de índices de sustentabilidade.

## 🚀 Início Rápido

```bash
npm install
npm run dev
```

## 📚 Documentação

- [Instalação](./docs/INSTALLATION.md)
- [Deploy](./docs/DEPLOYMENT.md)
- [API](./docs/API.md)
```

#### 🔄 **Workflow de Colaboração**

1. **Fork do Repositório**
2. **Clone Local**
   ```bash
   git clone https://github.com/seu-usuario/UCS.git
   cd UCS
   ```

3. **Criar Branch para Feature**
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

4. **Desenvolvimento**
   ```bash
   git add .
   git commit -m "feat(feature): implementar nova funcionalidade"
   git push origin feature/nova-funcionalidade
   ```

5. **Pull Request**
   - Criar PR no GitHub
   - Revisão de código obrigatória
   - Testes automatizados
   - Merge após aprovação

#### 🛡️ **Proteções de Branch**

**Branch `main`:**
- [ ] Require pull request reviews (2 approvers)
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date before merging
- [ ] Restrict pushes that create files larger than 100MB

**Branch `develop`:**
- [ ] Require pull request reviews (1 approver)
- [ ] Require status checks to pass before merging

#### 🤖 **GitHub Actions**

**`.github/workflows/ci.yml`**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run typecheck
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        # ... outras variáveis de teste
```

---

## 🔒 LGPD e Segurança

### Pontos de Coleta de Dados Pessoais

#### 📊 **Dados Coletados**

1. **Dados de Autenticação**
   - Email do usuário
   - Nome (opcional)
   - Timestamp de login/logout

2. **Dados de Uso**
   - Páginas visitadas
   - Ações realizadas (exports, relatórios)
   - Preferências de interface

3. **Dados Administrativos**
   - Logs de auditoria
   - Alterações em configurações
   - Histórico de recálculos

#### 🛡️ **Boas Práticas LGPD**

##### **Armazenamento Seguro**
```typescript
// Exemplo de criptografia de dados sensíveis
import crypto from 'crypto';

const encryptData = (data: string, key: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Armazenamento seguro no Firestore
await db.collection('users').doc(userId).set({
  email: user.email,
  preferences: encryptData(JSON.stringify(preferences), process.env.ENCRYPTION_KEY),
  createdAt: FieldValue.serverTimestamp(),
  lastLogin: FieldValue.serverTimestamp()
});
```

##### **Consentimento Explícito**
```typescript
// Componente de consentimento LGPD
export function LGPDConsentModal() {
  const [consent, setConsent] = useState({
    analytics: false,
    marketing: false,
    necessary: true // Sempre necessário
  });

  const handleConsent = async () => {
    await db.collection('user_consents').doc(userId).set({
      consent,
      timestamp: FieldValue.serverTimestamp(),
      ip: await getClientIP(),
      userAgent: navigator.userAgent
    });
  };

  return (
    <Dialog>
      <DialogContent>
        <h2>Política de Privacidade</h2>
        <p>Coletamos os seguintes dados:</p>
        
        <div className="space-y-2">
          <Checkbox 
            checked={consent.necessary}
            disabled
          >
            Dados necessários para funcionamento (obrigatório)
          </Checkbox>
          
          <Checkbox 
            checked={consent.analytics}
            onCheckedChange={(checked) => 
              setConsent(prev => ({ ...prev, analytics: !!checked }))
            }
          >
            Dados de uso para melhorar o sistema (opcional)
          </Checkbox>
          
          <Checkbox 
            checked={consent.marketing}
            onCheckedChange={(checked) => 
              setConsent(prev => ({ ...prev, marketing: !!checked }))
            }
          >
            Comunicações sobre novos recursos (opcional)
          </Checkbox>
        </div>
        
        <Button onClick={handleConsent}>
          Aceitar e Continuar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

##### **Direito ao Esquecimento**
```typescript
// Função para exclusão completa de dados
export async function deleteUserData(userId: string): Promise<void> {
  const batch = db.batch();
  
  // Deletar dados do usuário
  batch.delete(db.collection('users').doc(userId));
  batch.delete(db.collection('user_consents').doc(userId));
  
  // Deletar logs de auditoria (manter por período legal)
  const auditLogs = await db.collection('audit_logs')
    .where('user', '==', userId)
    .get();
  
  auditLogs.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  
  // Log da exclusão
  await db.collection('data_deletions').add({
    userId,
    timestamp: FieldValue.serverTimestamp(),
    reason: 'user_request',
    deletedCollections: ['users', 'user_consents', 'audit_logs']
  });
}
```

#### 🔐 **Segurança Técnica**

##### **Autenticação e Autorização**
```typescript
// Middleware de autenticação
export async function requireAuth(request: NextRequest): Promise<Response | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return null; // Autorizado
  } catch (error) {
    return new Response('Invalid token', { status: 403 });
  }
}

// Controle de acesso baseado em roles
export async function requireAdmin(request: NextRequest): Promise<Response | null> {
  const authResponse = await requireAuth(request);
  if (authResponse) return authResponse;
  
  const user = await getCurrentUser(request);
  if (!user.isAdmin) {
    return new Response('Admin access required', { status: 403 });
  }
  
  return null;
}
```

##### **Sanitização de Dados**
```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export function sanitizeInput(input: string): string {
  // Remove scripts e HTML malicioso
  return purify.sanitize(input, { 
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

##### **Rate Limiting**
```typescript
// Rate limiting para APIs
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  return true;
}
```

#### 📋 **Checklist de Conformidade LGPD**

##### **✅ Implementado**
- [ ] Consentimento explícito para coleta de dados
- [ ] Política de privacidade clara e acessível
- [ ] Criptografia de dados sensíveis
- [ ] Logs de auditoria para alterações
- [ ] Direito ao esquecimento (exclusão de dados)
- [ ] Sanitização de inputs do usuário
- [ ] Rate limiting em APIs
- [ ] Backup seguro de dados

##### **🔄 Em Desenvolvimento**
- [ ] Portal de transparência para usuários
- [ ] Relatórios de conformidade automáticos
- [ ] Análise de impacto de proteção de dados
- [ ] Treinamento de equipe em LGPD

##### **📋 Documentação Necessária**
- [ ] Política de Privacidade atualizada
- [ ] Termos de Uso
- [ ] Cookie Policy
- [ ] Procedimentos de resposta a incidentes
- [ ] Mapeamento de dados pessoais
- [ ] Relatório de conformidade LGPD

---

## 📞 Suporte e Manutenção

### Contatos Técnicos
- **Desenvolvedor Principal**: [Seu Nome] - [seu.email@empresa.com]
- **Suporte Técnico**: [suporte@empresa.com]
- **Emergências**: [emergencia@empresa.com]

### Documentação Adicional
- **API Documentation**: `/docs/api.md`
- **User Manual**: `/docs/user-guide.md`
- **Troubleshooting**: `/docs/troubleshooting.md`

### Próximos Passos
1. Configurar ambiente de produção
2. Implementar monitoramento avançado
3. Configurar backups automáticos
4. Treinar equipe de suporte
5. Estabelecer SLA de suporte

---

**📅 Data de Entrega**: [Data Atual]  
**📝 Versão**: 1.0.0  
**👨‍💻 Desenvolvedor**: [Seu Nome]  
**🏢 Empresa**: [Nome da Empresa]
