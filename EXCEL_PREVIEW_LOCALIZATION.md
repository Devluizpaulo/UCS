# Sistema de Localização - Exportação e Preview do Excel

O sistema completo de exportação e preview do Excel foi localizado para suportar Português (pt), Inglês (en) e Espanhol (es).

## Componentes Localizados

### 1. Excel Preview Modal (`excel-preview-modal.tsx`)
- Modal de preview com todas as strings traduzidas
- Formatação de datas localizada
- Estatísticas e gráficos com textos traduzidos

### 2. Excel Export Button (`excel-export-button.tsx`)
- Botões de preview e exportação traduzidos
- Estados de carregamento localizados

### 3. Dashboard Excel Export (`dashboard/page.tsx`)
- Função completa de exportação do Excel localizada
- Cabeçalhos de tabelas traduzidos
- Resumo estatístico localizado
- Análises e gráficos com textos traduzidos
- Mensagens de sucesso/erro localizadas

## Funcionalidades Localizadas

### 📊 **Preview do Excel**
- Título e subtítulo do modal
- Estatísticas (Total de Ativos, Em Alta, Em Baixa, Estáveis)
- Abas (Dados Principais, Distribuição, Top Variações)
- Cabeçalhos da tabela
- Legendas dos gráficos
- Botões (Cancelar, Gerando..., Exportar para Excel)
- Lista de recursos do Excel

### 📤 **Exportação do Excel**
- Botões (Preview Excel, Exportar Excel, Exportando...)
- Cabeçalhos das planilhas
- Resumo estatístico
- Análises e gráficos
- Resumo executivo
- Mensagens de sucesso/erro

### 🌍 **Idiomas Suportados**

#### Português (pt) - Padrão
- "Preview do Relatório Excel"
- "Exportar Excel"
- "📊 RESUMO ESTATÍSTICO"

#### Inglês (en)
- "Excel Report Preview"
- "Export Excel"
- "📊 STATISTICAL SUMMARY"

#### Espanhol (es)
- "Vista Previa del Reporte Excel"
- "Exportar Excel"
- "📊 RESUMEN ESTADÍSTICO"

## Estrutura de Traduções

```typescript
interface Translations {
  excelPreview: {
    title: string;
    subtitle: string;
    totalAssets: string;
    rising: string;
    falling: string;
    stable: string;
    tabs: {
      mainData: string;
      distribution: string;
      topVariations: string;
    };
    // ... mais traduções
  };
  excelExport: {
    buttons: {
      previewExcel: string;
      exportExcel: string;
      exporting: string;
    };
    messages: {
      exportSuccess: string;
      exportError: string;
      noDataToExport: string;
    };
    headers: {
      category: string;
      asset: string;
      lastPrice: string;
      variationPercent: string;
      // ... mais cabeçalhos
    };
    // ... mais seções
  };
}
```

## Como Usar

### 1. Componente de Preview
```tsx
import { ExcelPreviewModal } from '@/components/excel-preview-modal';

<ExcelPreviewModal
  isOpen={isOpen}
  onClose={onClose}
  onExport={onExport}
  data={data}
  isExporting={isExporting}
/>
```

### 2. Botão de Exportação
```tsx
import { ExcelExportButton } from '@/components/excel-export-button';

<ExcelExportButton
  data={data}
  onExport={handleExport}
  variant="outline"
  size="default"
/>
```

### 3. Função de Exportação no Dashboard
A função `handleExportExcel` no dashboard já está localizada e usa automaticamente o idioma selecionado pelo usuário.

## Recursos do Excel Exportado

### 📋 **Planilhas Geradas**
1. **Painel de Cotações**: Dados principais com formatação condicional
2. **Análises**: Gráficos interativos de distribuição e variações
3. **Resumo Executivo**: Métricas principais, KPIs e gráficos de tendências

### 📊 **Visualizações Implementadas**

#### 🍕 **Distribuição por Categoria - Visualização com Barras**
- Representação visual usando caracteres █ e ░
- Cores diferenciadas para cada categoria
- Percentuais calculados e exibidos
- Formatação condicional com cores vibrantes

#### 📊 **Top Variações - Visualização com Barras Coloridas**
- Ranking dos ativos com maiores variações
- Barras visuais proporcionais ao valor da variação
- Cores condicionais (verde para altas, vermelho para baixas)
- Valores percentuais formatados com precisão

#### 📈 **Tendências de Preços - Visualização com Barras**
- Top 5 ativos com maiores preços
- Barras visuais proporcionais aos valores
- Formatação de valores monetários
- Indicadores de variação coloridos

### 🎨 **Formatação Condicional Avançada**
- Cores vibrantes para categorias diferentes
- Formatação condicional baseada em valores
- Barras visuais usando caracteres Unicode
- Fontes monospace para alinhamento perfeito
- Cores de fundo e texto coordenadas

### 🎨 **Formatação Localizada**
- Cabeçalhos traduzidos
- Datas formatadas conforme o idioma
- Mensagens e labels traduzidos
- Títulos dos gráficos localizados
- Estrutura mantida em todos os idiomas

### 🔄 **Mudança de Idioma**
- Alteração em tempo real sem recarregar a página
- Persistência da escolha no localStorage
- Aplicação automática em todos os componentes

## Exemplo de Uso Completo

```tsx
import { useState } from 'react';
import { ExcelPreviewModal } from '@/components/excel-preview-modal';
import { ExcelExportButton } from '@/components/excel-export-button';
import { LanguageSwitcher } from '@/components/language-switcher';

function Dashboard() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Sua lógica de exportação aqui
    setTimeout(() => {
      setIsExporting(false);
      setIsPreviewOpen(false);
    }, 2000);
  };

  return (
    <div>
      <LanguageSwitcher />
      
      <ExcelExportButton
        data={yourData}
        onExport={handleExport}
        variant="outline"
      />
      
      <ExcelPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onExport={handleExport}
        data={previewData}
        isExporting={isExporting}
      />
    </div>
  );
}
```

## Adicionando Novos Idiomas

Para adicionar um novo idioma:

1. **Atualizar o tipo `SupportedLanguage`** em `src/lib/i18n.ts`
2. **Adicionar traduções** no objeto `translations`
3. **Importar locale do date-fns** se necessário
4. **Atualizar função `getDateLocale`** nos componentes
5. **Adicionar opção** no `LanguageSwitcher`

## Adicionando Novas Traduções

Para adicionar novas chaves de tradução:

1. **Atualizar interface `Translations`** em `src/lib/i18n.ts`
2. **Adicionar traduções** para todos os idiomas suportados
3. **Usar as novas chaves** nos componentes com `t.suaNovaChave`

## Melhorias Técnicas Implementadas

### 🔧 **Visualizações Robustas com Formatação Condicional**
- **Antes**: Gráficos do ExcelJS que não apareciam consistentemente
- **Agora**: Visualizações usando formatação condicional e caracteres Unicode
- **Benefícios**: Funcionamento garantido em todos os ambientes e versões do Excel

### 📊 **Tipos de Visualizações Implementadas**
1. **Barras Visuais**: Para distribuição por categoria
2. **Barras Coloridas**: Para ranking de variações
3. **Barras Proporcionais**: Para tendências de preços

### 🎯 **Características Técnicas**
- Caracteres Unicode (█ e ░) para barras visuais
- Formatação condicional baseada em valores
- Cores coordenadas para melhor legibilidade
- Fontes monospace para alinhamento perfeito
- Cálculos proporcionais automáticos

### 🌍 **Localização Completa das Visualizações**
- Títulos das visualizações traduzidos
- Labels e cabeçalhos localizados
- Formatação de números conforme o idioma
- Estrutura mantida em todos os idiomas

### ⚡ **Performance e Confiabilidade**
- Funcionamento garantido em todas as versões do Excel
- Não depende de APIs externas ou bibliotecas complexas
- Renderização rápida e consistente
- Compatibilidade total com Excel Online e Desktop

O sistema de exportação e preview do Excel está agora completamente localizado e com gráficos funcionais, pronto para uso profissional em múltiplos idiomas! 🎉
