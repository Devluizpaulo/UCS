# Integração n8n com Sistema de Reorganização Automática

Este documento explica como configurar o n8n para trabalhar com nosso sistema de reorganização automática de dados do Firebase.

## Visão Geral

O sistema permite que o n8n continue salvando dados na coleção `cotacoes_do_dia` como sempre fez, mas agora com reorganização automática para coleções organizadas por ativo e data.

## Workflow Otimizado

Use o arquivo `n8n-workflow-optimized.json` que inclui:
- **Agendamento automático**: Executa às 9h e 15h nos dias úteis
- **Processamento otimizado**: Nomes de ativos padronizados (milho, boi_gordo, soja, carbono, madeira, usd_brl, eur_brl)
- **Integração automática**: Chama o webhook de reorganização após salvar os dados
- **Tratamento de erros**: Melhor handling de erros e timeouts

**Ativos Monitorados:**
- Milho (Commodities)
- Boi (Commodities)
- Soja (Commodities)
- Boi Gordo / Live Cattle (Commodities)
- Madeira / Lumber (Commodities)
- Carbono / Carbon Emissions (Commodities)
- USD/BRL (Moedas)
- EUR/BRL (Moedas)

**Estrutura do Workflow:**
1. **🕐 Agendador (9h e 15h)** - Cron que executa às 9h e 15h
2. **🌐 Buscar [Ativo]** - Requisições HTTP para Investing.com (8 ativos)
3. **🔍 Extrair Preço [Ativo]** - Extração HTML dos preços
4. **⚙️ Processar [Ativo]** - Processamento e formatação dos dados
5. **💾 Salvar [Ativo]** - Salvamento no Firestore
6. **🔄 Consolidar Resultados** - Merge node que aguarda todos os salvamentos (8 inputs)
7. **⚙️ Processar Consolidado** - Processa dados consolidados de todos os ativos
8. **🚀 Trigger Reorganização** - Webhook para reorganização automática
9. **✅ Resposta Final** - Confirmação de execução

### Correções Implementadas

**Problema Resolvido**: "Referenced node is unexecuted" no nó Consolidar Resultados

**Solução Aplicada**:
- **Merge Node**: Substituição do código que referenciava nós específicos por um merge node
- **Aguarda Execução**: O merge node aguarda todos os nós paralelos terminarem
- **Consolidação Segura**: Processa resultados apenas após todos os salvamentos
- **Webhook Sequencial**: Chama reorganização somente após consolidação completa

**Estrutura Corrigida**:
1. **Processamento Paralelo** → Salva dados de múltiplos ativos simultaneamente
2. **Merge Node** → Aguarda todos os salvamentos terminarem
3. **Consolidar Resultados** → Processa dados consolidados de forma segura
4. **Webhook Reorganização** → Chama endpoint de reorganização
5. **Resposta Final** → Retorna status consolidado

## Fluxo de Trabalho

1. **N8N coleta dados** → Salva na coleção `cotacoes_do_dia`
2. **N8N chama webhook** → Endpoint `/api/webhook/reorganize`
3. **Sistema reorganiza** → Cria coleções como `milho_futuros/07-09-2025`
4. **Marca como processado** → Adiciona `migrated_at` no documento original

## Configuração do Workflow n8n

### 1. Importar o Workflow Otimizado

1. Abra o n8n
2. Clique em "Import from File"
3. Importe o arquivo `n8n-workflow-optimized.json`
4. Configure suas credenciais do Firebase
5. Atualize a URL do webhook (se necessário)

### 2. Configurar Credenciais e URLs

**Firebase Credentials**: 
- Use a mesma credencial configurada: "Google Firebase Cloud Firestore account 2"

**Webhook URL**: 
- Desenvolvimento: `http://localhost:3000/api/webhook/reorganize`
- Produção: `https://seu-dominio.com/api/webhook/reorganize`

**Authorization Token**:
- Substitua `sua_chave_secreta_aqui` pela sua chave real no nó "🚀 Trigger Reorganização"

### 3. Configurar Variáveis de Ambiente

No seu arquivo `.env`:
```
WEBHOOK_SECRET_TOKEN=sua_chave_secreta_aqui
NEXT_PUBLIC_APP_ENV=development
```

### 4. Ativar o Workflow

1. No n8n, ative o workflow clicando no toggle "Active"
2. O workflow executará automaticamente às 9h e 15h nos dias úteis
3. Você também pode executar manualmente para testes

### 5. Workflow Principal (Referência)

```json
{
  "nodes": [
    {
      "name": "Coletar Dados",
      "type": "HTTP Request",
      "parameters": {
        "url": "sua-fonte-de-dados",
        "method": "GET"
      }
    },
    {
      "name": "Salvar no Firebase",
      "type": "Firebase Firestore",
      "parameters": {
        "collection": "cotacoes_do_dia",
        "operation": "add",
        "data": {
          "ativo": "{{ $json.ativo }}",
          "data": "{{ $json.data }}",
          "abertura": "{{ $json.abertura }}",
          "maximo": "{{ $json.maximo }}",
          "minimo": "{{ $json.minimo }}",
          "ultimo": "{{ $json.ultimo }}",
          "volume": "{{ $json.volume }}",
          "variacao_pct": "{{ $json.variacao_pct }}",
          "fonte": "n8n",
          "timestamp": "{{ $now }}"
        }
      }
    },
    {
      "name": "Reorganizar Dados",
      "type": "HTTP Request",
      "parameters": {
        "url": "https://seu-dominio.com/api/webhook/reorganize",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer SEU_TOKEN_AQUI"
        },
        "body": {
          "source": "n8n",
          "timestamp": "{{ $now }}",
          "processed_items": "{{ $json.length }}"
        }
      }
    }
  ]
}
```

### 6. Configuração de Segurança

Adicione no arquivo `.env`:

```env
N8N_WEBHOOK_TOKEN=seu_token_secreto_aqui
```

### 3. Headers Necessários

- `Content-Type: application/json`
- `Authorization: Bearer SEU_TOKEN_AQUI` (opcional, mas recomendado)

## Endpoints Disponíveis

### Webhook Automático (Recomendado)

**POST** `/api/webhook/reorganize`

- **Uso**: Chamado pelo N8N após salvar dados
- **Processa**: Apenas dados das últimas 24 horas
- **Eficiência**: Alta (processa apenas dados novos)
- **Autenticação**: Bearer token (opcional)

```bash
curl -X POST https://seu-dominio.com/api/webhook/reorganize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"source": "n8n", "timestamp": "2025-01-09T10:30:00Z"}'
```

### Migração Manual

**POST** `/api/migrate-data`

- **Uso**: Migração manual ou completa
- **Processa**: Todos os dados ou apenas recentes
- **Parâmetros**:
  - `onlyRecent: false` → Migra todos os dados
  - `onlyRecent: true` → Migra apenas dados recentes

```bash
# Migração completa
curl -X POST https://seu-dominio.com/api/migrate-data \
  -H "Content-Type: application/json" \
  -d '{"onlyRecent": false}'

# Migração apenas dados recentes
curl -X POST https://seu-dominio.com/api/migrate-data \
  -H "Content-Type: application/json" \
  -d '{"onlyRecent": true}'
```

## Estrutura de Dados

### Entrada (cotacoes_do_dia)

```json
{
  "ativo": "Milho Futuros",
  "data": "07/09/2025",
  "abertura": 650.50,
  "maximo": 655.00,
  "minimo": 648.00,
  "ultimo": 652.75,
  "volume": 15000,
  "variacao_pct": 0.35,
  "fonte": "n8n",
  "timestamp": "2025-01-09T10:30:00Z"
}
```

### Saída (milho_futuros/07-09-2025)

```json
{
  "ativo": "Milho Futuros",
  "data": "07/09/2025",
  "abertura": 650.50,
  "maximo": 655.00,
  "minimo": 648.00,
  "ultimo": 652.75,
  "volume": 15000,
  "variacao_pct": 0.35,
  "fonte_original": "n8n",
  "migrated_from": "cotacoes_do_dia",
  "migrated_at": "2025-01-09T10:35:00Z",
  "original_doc_id": "abc123"
}
```

## Vantagens do Sistema

1. **Eficiência**: N8N salva em uma única coleção (simples)
2. **Organização**: Dados automaticamente organizados por ativo/data
3. **Performance**: Processa apenas dados novos
4. **Rastreabilidade**: Mantém referência aos documentos originais
5. **Flexibilidade**: Suporta migração manual quando necessário

## Monitoramento

### Logs do Sistema

- `[Webhook] Received reorganization request from n8n`
- `[DataService] Starting data migration to organized collections...`
- `[DataService] Migration completed successfully. Processed X documents.`

### Verificação de Status

```bash
# Verificar configuração do webhook
curl https://seu-dominio.com/api/webhook/reorganize

# Verificar configuração da migração
curl https://seu-dominio.com/api/migrate-data
```

## Troubleshooting

### Problema: Dados não sendo reorganizados

1. Verificar se o webhook está sendo chamado pelo N8N
2. Verificar logs do servidor
3. Testar endpoint manualmente
4. Verificar token de autenticação

### Problema: Duplicação de dados

- O sistema marca documentos como processados (`migrated_at`)
- Documentos já processados são ignorados em execuções subsequentes

### Problema: Performance lenta

- Use `onlyRecent: true` para processar apenas dados das últimas 24h
- O webhook automático já faz isso por padrão