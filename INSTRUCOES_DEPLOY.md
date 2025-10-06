# 🚀 Instruções de Deploy - UCS Index Platform

## 📋 Pré-requisitos

### 🔧 **Requisitos do Sistema**
- Node.js 18+ instalado
- npm 9+ ou yarn 1.22+
- Conta Firebase configurada
- Conta Google AI configurada
- Acesso ao servidor de destino

### 📦 **Arquivos Necessários**
- Código-fonte completo
- Arquivo `.env.local` com credenciais
- Documentação técnica
- Checklist de deploy

---

## 🌐 Deploy na Vercel (Recomendado)

### 1. **Preparação**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login na Vercel
vercel login

# Navegar para o projeto
cd UCS
```

### 2. **Deploy Inicial**
```bash
# Deploy para desenvolvimento
vercel

# Deploy para produção
vercel --prod
```

### 3. **Configuração de Variáveis**
No painel da Vercel, configure as seguintes variáveis:

```env
# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase (Admin)
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_service_account

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_key

# N8N
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ucs

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### 4. **Configuração de Domínio**
1. Acesse **Settings** → **Domains**
2. Adicione seu domínio customizado
3. Configure os DNS records conforme instruções
4. SSL será configurado automaticamente

---

## 🏠 Deploy na Hostinger

### 1. **Preparação do Build**
```bash
# Build de produção
npm run build

# Teste local
npm run start
```

### 2. **Upload via File Manager**
1. Acesse **File Manager** no cPanel
2. Navegue até `/public_html`
3. Faça upload dos arquivos:
   - Pasta `.next/`
   - `package.json`
   - `next.config.ts`
   - `tailwind.config.ts`

### 3. **Configuração Node.js**
1. Acesse **Node.js** no cPanel
2. Configure:
   - **Node.js Version**: 18.x
   - **Application Mode**: Production
   - **Application Root**: `/public_html`
   - **Application URL**: `https://seudominio.com`

### 4. **Variáveis de Ambiente**
No painel Node.js, configure as variáveis de produção.

### 5. **Configuração de Domínio**
1. Configure DNS para apontar para o servidor
2. Ative SSL gratuito no cPanel
3. Configure redirect HTTP → HTTPS

---

## 🏢 Deploy na Locaweb

### 1. **Preparação**
```bash
# Build de produção
npm run build

# Compactar arquivos
tar -czf ucs-deploy.tar.gz .next package.json next.config.ts
```

### 2. **Upload via FTP**
```bash
# Conectar via SFTP
sftp usuario@servidor.locaweb.com.br

# Upload do arquivo
put ucs-deploy.tar.gz

# Extrair no servidor
tar -xzf ucs-deploy.tar.gz
```

### 3. **Configuração do Servidor**
```bash
# Instalar dependências
npm install --production

# Configurar PM2 para produção
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "ucs-platform" -- start
pm2 save
pm2 startup
```

### 4. **Configuração Nginx**
```nginx
server {
    listen 80;
    server_name seudominio.com.br;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. **SSL com Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br
```

---

## 🖥️ Deploy em VPS Própria

### 1. **Configuração do Servidor**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2
sudo npm install -g pm2
```

### 2. **Configuração da Aplicação**
```bash
# Criar diretório da aplicação
sudo mkdir -p /var/www/ucs-platform
sudo chown -R $USER:$USER /var/www/ucs-platform

# Upload dos arquivos
# (via SCP, rsync, ou git clone)

# Instalar dependências
cd /var/www/ucs-platform
npm install --production

# Build da aplicação
npm run build
```

### 3. **Configuração PM2**
```bash
# Criar arquivo de configuração
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'ucs-platform',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/ucs-platform',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. **Configuração Nginx**
```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/ucs-platform
```

```nginx
server {
    listen 80;
    server_name seudominio.com;
    root /var/www/ucs-platform;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        alias /var/www/ucs-platform/.next/static;
        expires 365d;
        access_log off;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/ucs-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. **SSL com Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

---

## 🔧 Configuração do N8N

### 1. **Instalação do N8N**
```bash
# Instalar N8N
sudo npm install n8n -g

# Criar usuário para N8N
sudo useradd -m -s /bin/bash n8n
sudo usermod -aG sudo n8n
```

### 2. **Configuração como Serviço**
```bash
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

```bash
# Ativar serviço
sudo systemctl enable n8n
sudo systemctl start n8n
sudo systemctl status n8n
```

### 3. **Configuração Nginx para N8N**
```nginx
server {
    listen 80;
    server_name n8n.seudominio.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. **SSL para N8N**
```bash
sudo certbot --nginx -d n8n.seudominio.com
```

---

## ✅ Checklist Pós-Deploy

### 🧪 **Testes Obrigatórios**
- [ ] Acesso ao sistema via URL de produção
- [ ] Login/logout funcionando
- [ ] Dashboard carregando dados
- [ ] Exportação de PDF/Excel funcionando
- [ ] Responsividade mobile testada
- [ ] Performance aceitável (< 3s carregamento)

### 🔒 **Segurança**
- [ ] HTTPS configurado e funcionando
- [ ] Firewall configurado (portas 80, 443, 22)
- [ ] Backup das credenciais realizado
- [ ] Logs de acesso configurados
- [ ] Monitoramento de uptime ativo

### 📊 **Monitoramento**
- [ ] Logs de erro configurados
- [ ] Alertas de performance configurados
- [ ] Backup automático configurado
- [ ] Métricas de uso configuradas

### 🔄 **Manutenção**
- [ ] Procedimentos de atualização documentados
- [ ] Contatos de suporte definidos
- [ ] SLA de resposta estabelecido
- [ ] Plano de rollback definido

---

## 🆘 Troubleshooting

### ❌ **Problemas Comuns**

#### **Erro: "Cannot find module"**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **Erro: "Firebase not initialized"**
- Verificar variáveis de ambiente
- Confirmar credenciais do Firebase
- Verificar configuração do projeto

#### **Erro: "Build failed"**
```bash
# Limpar cache
npm run build -- --no-cache
# ou
rm -rf .next
npm run build
```

#### **Erro: "Port already in use"**
```bash
# Verificar processos na porta
sudo lsof -i :3000
# Matar processo se necessário
sudo kill -9 PID
```

### 📞 **Suporte**
- **Documentação**: Consulte `DOCUMENTACAO_TECNICA_ENTREGA.md`
- **Logs**: Verifique logs do PM2: `pm2 logs ucs-platform`
- **Status**: Verifique status: `pm2 status`
- **Restart**: Reiniciar aplicação: `pm2 restart ucs-platform`

---

**📅 Data de Deploy:** _________________________  
**👨‍💻 Responsável:** _________________________  
**🌐 URL de Produção:** _________________________
