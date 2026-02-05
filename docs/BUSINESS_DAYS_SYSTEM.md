# Sistema de Validação de Dias Úteis - UCS

Este documento descreve o sistema implementado para impedir que o **N8N processe cotações** aos fins de semana e feriados, com integração automática de API de feriados brasileiros.

## 📋 Visão Geral

O sistema implementa validação automática de dias úteis **antes do N8N processar dados**, impedindo:
- ✅ Processamento em **fins de semana** (sábados e domingos)
- ✅ Processamento em **feriados nacionais** (via API automática)
- ✅ Processamento em **feriados adicionais** configuráveis

**Importante**: As cotações vêm do banco de dados via N8N. Este sistema atua como um **guard** que valida se o N8N deve ou não processar dados para uma data específica.

## 🏗️ Arquitetura

### Componentes Principais

1. **`business-days-service.ts`** - Serviço core para validação de dias úteis
2. **`n8n-business-day-guard.ts`** - **Guard específico para N8N** 🎯
3. **`/api/n8n/validate-business-day`** - **API para N8N consultar antes de processar** 🎯
4. **`business-day-status.tsx`** - Componente React para exibição de status
5. **`use-business-day-validation.ts`** - Hook personalizado para React
6. **`/api/business-day-status`** - API route para consultas do painel

### Integração com API de Feriados

- **API Utilizada**: [Brasil API](https://brasilapi.com.br/api/feriados/v1/{ano})
- **Cache**: 24 horas para otimização
- **Fallback**: Sistema continua funcionando mesmo se a API estiver indisponível
- **Feriados Adicionais**: Configuráveis no código para feriados regionais

## 🚀 Como Usar

### 🎯 **1. Integração com N8N (Principal)**

O N8N deve consultar a API antes de processar qualquer cotação:

```javascript
// No início do workflow do N8N
const validationResponse = await fetch('http://seu-dominio/api/n8n/validate-business-day', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2025-12-25', // ou data_especifica
    source: 'webhook_cotacoes'
  })
});

const validation = await validationResponse.json();

if (!validation.shouldProceed) {
  console.log(`Processamento bloqueado: ${validation.message}`);
  return { success: false, skipped: true, reason: validation.skipReason };
}

// Continuar com o processamento normal...
```

**Alternativa via GET:**
```javascript
const response = await fetch('http://seu-dominio/api/n8n/validate-business-day?date=2025-12-25');
const validation = await response.json();
```

### 2. Validação Básica de Data

```typescript
import { isBusinessDay, validateQuoteOperations } from '@/lib/business-days-service';

// Verificar se uma data é dia útil
const result = await isBusinessDay(new Date());
console.log(result.isBusinessDay); // true/false
console.log(result.holidayName); // Nome do feriado se aplicável

// Validar operações de cotação
const validation = await validateQuoteOperations(new Date());
console.log(validation.allowed); // true/false
console.log(validation.message); // Mensagem explicativa
```

### 2. Operações de Cotação com Validação

```typescript
import { createOrUpdateQuoteWithValidation } from '@/lib/data-service';

// Criar cotação com validação automática
const result = await createOrUpdateQuoteWithValidation(
  'milho', // assetId
  new Date(), // data
  { valor: 1500, fonte: 'API' }, // dados da cotação
  { allowHistorical: true } // opções
);

if (result.success) {
  console.log('Cotação criada:', result.data);
} else {
  console.log('Erro:', result.message);
}
```

### 3. Componente React no Painel

```tsx
import { BusinessDayStatus, BusinessDayStatusCompact } from '@/components/business-day-status';

// Componente completo
<BusinessDayStatus 
  onRefresh={() => console.log('Refreshed')}
  showDetails={true}
/>

// Componente compacto para header
<BusinessDayStatusCompact />
```

### 4. Hook Personalizado

```tsx
import { useQuoteOperationValidation } from '@/hooks/use-business-day-validation';

function QuoteForm() {
  const { 
    canCreateQuote, 
    validateQuoteOperation, 
    getOperationMessage 
  } = useQuoteOperationValidation();

  const handleSubmit = async () => {
    const validation = await validateQuoteOperation(selectedDate);
    
    if (!validation.canProceed) {
      alert(validation.message);
      return;
    }
    
    // Proceder com a criação da cotação
  };

  return (
    <div>
      <p>{getOperationMessage('cotação')}</p>
      <button disabled={!canCreateQuote} onClick={handleSubmit}>
        Criar Cotação
      </button>
    </div>
  );
}
```

### 5. Validação no N8N/Webhooks

O sistema já está integrado no webhook do N8N:

```typescript
// Automático - não requer configuração adicional
// O webhook valida automaticamente antes de processar
```

## ⚙️ Configuração

### Variáveis de Ambiente

Nenhuma variável adicional é necessária. O sistema usa a API pública do Brasil API.

### Feriados Adicionais

Para adicionar feriados específicos da sua região, edite o arquivo `business-days-service.ts`:

```typescript
function getAdditionalHolidays(year: number): string[] {
  const additional: string[] = [];
  
  // Adicione feriados municipais/estaduais aqui
  additional.push(`15/11/${year}`); // Exemplo: feriado municipal
  additional.push(`20/11/${year}`); // Consciência Negra
  
  return additional;
}
```

### Opções de Validação

```typescript
interface QuoteOperationOptions {
  allowHistorical?: boolean; // Permite operações em dados históricos
  bypassValidation?: boolean; // Bypass para operações administrativas
  operationType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
}
```

## 📊 Monitoramento

### API de Status

```bash
# Obter status atual do sistema
GET /api/business-day-status

# Validar data específica
POST /api/business-day-status
{
  "date": "2025-12-25T00:00:00.000Z"
}
```

### Logs do Sistema

O sistema gera logs detalhados:

```
[BusinessDays] Feriados carregados para 2025: 12 feriados
[BusinessDays] Cache atualizado para 2025: 13 feriados
[QuoteValidation] Operação bloqueada: Natal
[N8N Trigger] Tentativa de reprocessamento em dia não útil: Natal
```

## 🔧 Manutenção

### Limpeza de Cache

```typescript
import { clearHolidaysCache } from '@/lib/business-days-service';

// Limpar cache de feriados (força nova consulta à API)
await clearHolidaysCache();
```

### Estatísticas do Cache

```typescript
import { getCacheStats } from '@/lib/business-days-service';

const stats = await getCacheStats();
console.log('Anos em cache:', stats.cachedYears);
console.log('Última atualização:', stats.lastUpdate);
console.log('Idade do cache:', stats.cacheAge);
```

## 🚨 Tratamento de Erros

O sistema é resiliente e continua funcionando mesmo em caso de:

- ❌ API de feriados indisponível
- ❌ Erro de rede
- ❌ Dados corrompidos no cache

**Comportamento de Fallback**: Em caso de erro na validação, o sistema permite a operação para não bloquear funcionalidades críticas, mas registra o erro nos logs.

## 📱 Interface do Usuário

### Indicadores Visuais

- 🟢 **Verde**: Operações permitidas (dia útil)
- 🔴 **Vermelho**: Operações bloqueadas (feriado/fim de semana)
- 🟡 **Amarelo**: Verificando status

### Mensagens para o Usuário

- ✅ "Operações de cotação permitidas"
- ❌ "Operações bloqueadas: Natal. Próximo dia útil: 26/12/2025"
- ⚠️ "Operações bloqueadas: Fim de semana (sábado)"

## 🔄 Integração com Sistemas Existentes

### Data Service

Todas as funções existentes de cotação foram mantidas. Novas funções com validação:

- `createOrUpdateQuoteWithValidation()`
- `validateQuoteOperationForDate()`
- `getBusinessDayQuotes()`

### N8N Webhooks

Validação automática integrada em:
- `triggerN8NRecalculation()`
- Todos os webhooks de reprocessamento

### Cache Service

Integração com o sistema de cache existente para otimização.

## 📈 Performance

- **Cache de Feriados**: 24 horas TTL
- **Validação de Data**: ~5ms (com cache)
- **API de Feriados**: ~200ms (primeira consulta do ano)
- **Atualização Automática**: A cada 5 minutos no frontend

## 🔐 Segurança

- ✅ Validação server-side obrigatória
- ✅ Sanitização de inputs
- ✅ Rate limiting na API externa
- ✅ Logs de auditoria para todas as operações

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs do sistema
2. Teste a API de status: `/api/business-day-status`
3. Limpe o cache se necessário: `await clearHolidaysCache()`
4. Consulte este documento para configurações

**Implementado com sucesso! 🎉**
