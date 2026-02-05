# Exemplo de Integração N8N - Sistema de Dias Úteis

## 🎯 Objetivo

Impedir que o N8N processe cotações em fins de semana e feriados, consultando automaticamente uma API de feriados brasileiros.

## 📋 Fluxo de Integração

### 1. **Workflow N8N - Início**

Adicione este nó no **início** de qualquer workflow que processe cotações:

```javascript
// Nó: HTTP Request - Validação de Dia Útil
// URL: http://localhost:9002/api/n8n/validate-business-day
// Method: POST
// Body:
{
  "date": "{{ $json.data_especifica || new Date().toISOString().split('T')[0] }}",
  "source": "{{ $workflow.name }}"
}
```

### 2. **Nó de Decisão**

```javascript
// Nó: IF - Verificar se deve processar
// Condition: {{ $json.shouldProceed === true }}

// Se TRUE: Continuar com processamento normal
// Se FALSE: Pular para nó de log/notificação
```

### 3. **Nó de Log (quando bloqueado)**

```javascript
// Nó: Set - Log de Bloqueio
{
  "status": "skipped",
  "reason": "{{ $json.skipReason }}",
  "message": "{{ $json.message }}",
  "date": "{{ $json.date }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

## 🔧 Exemplo Completo de Workflow

### Workflow: "Processar Cotações Diárias"

```json
{
  "nodes": [
    {
      "name": "Validar Dia Útil",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:9002/api/n8n/validate-business-day",
        "method": "POST",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "{\n  \"date\": \"{{ $json.data_especifica || new Date().toISOString().split('T')[0] }}\",\n  \"source\": \"cotacoes_diarias\"\n}"
      },
      "position": [250, 300]
    },
    {
      "name": "Deve Processar?",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.shouldProceed }}",
              "value2": true
            }
          ]
        }
      },
      "position": [450, 300]
    },
    {
      "name": "Processar Cotações",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Seu código de processamento aqui\nconsole.log('Processando cotações para:', $json.date);\nreturn $input.all();"
      },
      "position": [650, 200]
    },
    {
      "name": "Log Bloqueio",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "status",
              "value": "blocked"
            },
            {
              "name": "reason",
              "value": "={{ $json.skipReason }}"
            },
            {
              "name": "message", 
              "value": "={{ $json.message }}"
            }
          ]
        }
      },
      "position": [650, 400]
    }
  ],
  "connections": {
    "Validar Dia Útil": {
      "main": [
        [
          {
            "node": "Deve Processar?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Deve Processar?": {
      "main": [
        [
          {
            "node": "Processar Cotações",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Log Bloqueio",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 📊 Respostas da API

### ✅ **Dia Útil (Permitido)**
```json
{
  "success": true,
  "allowed": true,
  "message": "Processamento autorizado para 27/10/2025",
  "shouldProceed": true,
  "timestamp": "2025-10-27T21:15:00.000Z"
}
```

### ❌ **Feriado/Fim de Semana (Bloqueado)**
```json
{
  "success": false,
  "message": "Processamento bloqueado para 25/12/2025: Natal",
  "skipReason": "Natal",
  "date": "2025-12-25",
  "timestamp": "2025-10-27T21:15:00.000Z",
  "businessDayValidation": false
}
```

## 🔄 Workflows Que Devem Usar Esta Validação

1. **Importação de Cotações**
2. **Processamento de Preços**
3. **Cálculo de Índices**
4. **Atualização de Commodities**
5. **Reprocessamento Manual**

## ⚙️ Configuração no N8N

### Variáveis de Ambiente
```bash
# No N8N, configure:
UCS_API_URL=http://localhost:9002
UCS_VALIDATION_ENDPOINT=/api/n8n/validate-business-day
```

### Nó Reutilizável
Crie um **Sub-workflow** chamado "Validar Dia Útil" que pode ser reutilizado:

```javascript
// Sub-workflow: Validar-Dia-Util
// Input: { date: "YYYY-MM-DD" }
// Output: { shouldProceed: boolean, message: string }

const response = await fetch(`${process.env.UCS_API_URL}${process.env.UCS_VALIDATION_ENDPOINT}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: $input.first().json.date,
    source: $workflow.name
  })
});

return await response.json();
```

## 📈 Monitoramento

### Logs Estruturados
O sistema gera logs que podem ser monitorados:

```bash
# Buscar por logs de bloqueio
grep "N8N Business Day Guard.*BLOCKED" /var/log/ucs.log

# Estatísticas de uso
grep "N8N Business Day Guard" /var/log/ucs.log | grep -c "ALLOWED"
grep "N8N Business Day Guard" /var/log/ucs.log | grep -c "BLOCKED"
```

### Dashboard de Monitoramento
No painel UCS, você verá:
- 🟢 Status atual (dia útil/feriado)
- 📊 Próximo dia útil
- ⚠️ Alertas de bloqueio

## 🚨 Tratamento de Erros

Se a API de validação falhar, o N8N deve:

1. **Log do erro**
2. **Continuar processamento** (para não quebrar operações críticas)
3. **Notificar administradores**

```javascript
// Nó de tratamento de erro
try {
  const validation = await validateBusinessDay(date);
  return validation;
} catch (error) {
  console.error('Erro na validação de dia útil:', error);
  // Permite processamento em caso de erro
  return { 
    shouldProceed: true, 
    message: 'Processamento autorizado (erro na validação)',
    error: error.message 
  };
}
```

## ✅ Checklist de Implementação

- [ ] Adicionar validação no início de todos os workflows de cotação
- [ ] Configurar variáveis de ambiente no N8N
- [ ] Testar com datas de feriado (ex: 25/12/2025)
- [ ] Testar com fins de semana
- [ ] Configurar logs e monitoramento
- [ ] Documentar workflows atualizados
- [ ] Treinar equipe sobre novo fluxo

---

**🎉 Com esta integração, o N8N automaticamente respeitará dias úteis e feriados brasileiros!**
