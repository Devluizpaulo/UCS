export type SupportedLanguage = 'pt' | 'en' | 'es';

export interface Translations {
  home: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
    };
    quote: {
      title: string;
      subtitle: string;
      conversionRate: string;
    };
    whatIs: {
      title: string;
      description: string;
    };
    stakeholders: {
      producers: { title: string; description: string };
      investors: { title: string; description: string };
      institutions: { title: string; description: string };
      environment: { title: string; description: string };
    };
    pillars: {
      title: string;
      subtitle: string;
      monitoring: { title: string; details: string[] };
      real: { title: string; details: string[] };
      technological: { title: string; details: string[] };
      financial: { title: string; details: string[] };
      audit: { title: string; details: string[] };
      scientific: { title: string; details: string[] };
      technical: { title: string; details: string[] };
      legal: { title: string; details: string[] };
      regulatory: { title: string; details: string[] };
    };
    legal: {
      title: string;
      subtitle: string;
      cnae: string;
      law: string;
      decree: string;
    };
    summary: {
      title: string;
      points: string[];
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
    };
    footer: {
      rights: string;
      source: string;
    }
  },
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
    table: {
      asset: string;
      price: string;
      variation: string;
    };
    distribution: {
      title: string;
      assets: string;
    };
    topVariations: {
      title: string;
    };
    features: {
      title: string;
      features: string[];
    };
    buttons: {
      cancel: string;
      generating: string;
      exportToExcel: string;
    };
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
      absoluteVariation: string;
      unit: string;
      currency: string;
      status: string;
      lastUpdate: string;
      notes: string;
    };
    summary: {
      title: string;
      total: string;
      rising: string;
      falling: string;
      stable: string;
    };
    analysis: {
      title: string;
      topGains: string;
      topLosses: string;
      mostVolatile: string;
    };
    executiveSummary: {
      title: string;
      generatedOn: string;
      dataFor: string;
      marketOverview: string;
      keyMetrics: string;
      recommendations: string;
    };
    charts: {
      categoryDistribution: string;
      topVariations: string;
      priceTrends: string;
      category: string;
      quantity: string;
      percentage: string;
      rank: string;
      asset: string;
      variation: string;
      date: string;
      price: string;
    };
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  pt: {
    home: {
      hero: {
        title: "UCS: O Crédito que Transforma Florestas Preservadas em Ativos Financeiros",
        subtitle: "Uma inovação que reconhece economicamente a conservação ambiental e gera valor para produtores rurais, investidores e para o planeta.",
        cta: "Saiba mais",
      },
      quote: {
        title: "Índice UCS ASE",
        subtitle: "Cotação em tempo real",
        conversionRate: "Taxa de conversão:",
      },
      whatIs: {
        title: "O que é o UCS Crédito de Sustentabilidade?",
        description: "O UCS (Crédito de Sustentabilidade) é um produto financeiro inovador, lastreado na atividade rural de conservação de florestas nativas. Ele converte a preservação ambiental em um ativo econômico tangível e legalmente reconhecido.",
      },
      stakeholders: {
        producers: { title: "Produtores Rurais", description: "São remunerados por manter e conservar áreas de floresta nativa em suas propriedades." },
        investors: { title: "Investidores", description: "Adquirem créditos que representam benefícios ambientais mensuráveis." },
        institutions: { title: "Instituições Financeiras", description: "Participam de um mercado sustentável e regulamentado." },
        environment: { title: "Meio Ambiente", description: "Ganha com a proteção efetiva de ecossistemas florestais." },
      },
      pillars: {
        title: "Por que o UCS é um Investimento Seguro e Inovador?",
        subtitle: "Nossa metodologia incorpora múltiplos pilares de lastro que garantem transparência, segurança e confiabilidade em cada crédito emitido.",
        monitoring: { title: "Lastro Monitoramento", details: ["Acesso por imagem satélite em tempo real"] },
        real: { title: "Lastro Real", details: ["Tangível pela vegetação nativa mantida"] },
        technological: { title: "Lastro Tecnológico", details: ["Registro Blockchain na aposentadoria/consumo das UCS", "Registro Blockchain na origem das UCS"] },
        financial: { title: "Lastro Financeiro", details: ["Identificação Internacional, código ISIN (International Securities Identification Number)", "Instrumento Financeiro regulado para cooperação no mercado de capitais", "Registro na bolsa brasileira (B3)"] },
        audit: { title: "Lastro Auditoria Independente", details: ["Verificação por terceira parte independente com notoriedade internacional", "Validação por terceira parte independente com notoriedade internacional"] },
        scientific: { title: "Lastro Científico", details: ["Diretrizes do IPCC (Intergovernmental Panel on Climate Change)", "Diretrizes das ISOs (International Organization for Standardization)"] },
        technical: { title: "Lastro Técnico", details: ["Análise laboratorial internacional", "Análise laboratorial nacional", "Análise de campo (27 serviços ecossistêmicos)"] },
        legal: { title: "Lastro Jurídico", details: ["Definição do produto", "Definição da atividade econômica", "Registro em cartório da propriedade", "Contrato de Parceria Rural e adesão"] },
        regulatory: { title: "Lastro Regulatório", details: ["Internacional: Regulação União Europeia 2020/852", "Pactos globais: Acordo de Paris (artigo 5), Acordo de Montreal (Biodiversidade)", "Política Nacional de Mudanças Climáticas", "Constituição Brasileira, Direito de Propriedade, Direito Ambiental", "Código Florestal Brasileiro"] },
      },
      legal: {
        title: "Amparo Legal Sólido e Inovador",
        subtitle: "O UCS Crédito de Sustentabilidade está ancorado em um marco regulatório robusto que lhe confere segurança e validade jurídica.",
        cnae: "Reconhece a atividade rural de conservação de floresta nativa.",
        law: "Estabelece que produtos rurais podem ser gerados por atividades de conservação.",
        decree: "Regulamenta a CPR Verde, integrando a conservação como ativo econômico.",
      },
      summary: {
        title: "Conservação que Gera Valor",
        points: [
          'Transforma conservação ambiental em ativo financeiro',
          'Oferece transparência total através de múltiplos lastros',
          'Garante segurança jurídica e regulatória',
          'Gera retorno econômico sem comprometer o meio ambiente',
          'Conecta produtores, investidores e instituições em um ciclo virtuoso'
        ],
      },
      cta: {
        title: "Interessado em Saber Mais?",
        subtitle: "Junte-se à nova economia verde que valoriza a floresta em pé!",
        button: "Visite a BMV Digital",
      },
      footer: {
        rights: "Todos os direitos reservados.",
        source: "Fonte dos dados:",
      }
    },
    excelPreview: {
      title: 'Preview do Relatório Excel',
      subtitle: 'Dados para',
      totalAssets: 'Total de Ativos',
      rising: 'Em Alta',
      falling: 'Em Baixa',
      stable: 'Estáveis',
      tabs: {
        mainData: '📊 Dados Principais',
        distribution: '🍕 Distribuição',
        topVariations: '📈 Top Variações',
      },
      table: {
        asset: 'Ativo',
        price: 'Preço',
        variation: 'Variação',
      },
      distribution: {
        title: 'Distribuição por Categoria',
        assets: 'ativo(s)',
      },
      topVariations: {
        title: 'Top 10 Maiores Variações',
      },
      features: {
        title: 'Recursos do Excel Exportado:',
        features: [
          'Três abas organizadas: Dados, Análises e Resumo.',
          'Formatação condicional com cores para altas e baixas.',
          'Gráficos de Pizza e Barras interativos.',
        ],
      },
      buttons: {
        cancel: 'Cancelar',
        generating: 'Gerando...',
        exportToExcel: 'Exportar para Excel',
      },
    },
    excelExport: {
      buttons: {
        previewExcel: 'Preview Excel',
        exportExcel: 'Exportar Excel',
        exporting: 'Exportando...',
      },
      messages: {
        exportSuccess: 'Excel exportado com sucesso!',
        exportError: 'Erro ao exportar Excel',
        noDataToExport: 'Nenhum dado para exportar',
      },
      headers: {
        category: '🏷️ Categoria',
        asset: '📋 Ativo',
        lastPrice: '💰 Último Preço',
        variationPercent: '📊 Variação (%)',
        absoluteVariation: '📈 Variação Absoluta',
        unit: '📏 Unidade',
        currency: '💱 Moeda',
        status: '🎯 Status',
        lastUpdate: '🕐 Última Atualização',
        notes: '📝 Observações',
      },
      summary: {
        title: '📊 RESUMO ESTATÍSTICO',
        total: 'Total',
        rising: '📈 Altas',
        falling: '📉 Baixas',
        stable: '➡️ Estáveis',
      },
      analysis: {
        title: '📈 Análises',
        topGains: 'Maiores Altas',
        topLosses: 'Maiores Baixas',
        mostVolatile: 'Mais Voláteis',
      },
      executiveSummary: {
        title: '📋 Resumo Executivo',
        generatedOn: 'Gerado em',
        dataFor: 'Dados para',
        marketOverview: 'Visão Geral do Mercado',
        keyMetrics: 'Métricas Principais',
        recommendations: 'Recomendações',
      },
      charts: {
        categoryDistribution: 'Distribuição por Categoria',
        topVariations: 'Top 15 Maiores Variações',
        priceTrends: 'Tendências de Preços',
        category: 'Categoria',
        quantity: 'Quantidade',
        percentage: 'Percentual',
        rank: 'Rank',
        asset: 'Ativo',
        variation: 'Variação (%)',
        date: 'Data',
        price: 'Preço',
      },
    },
  },
  en: {
    home: {
      hero: {
        title: "UCS: The Credit that Transforms Preserved Forests into Financial Assets",
        subtitle: "An innovation that economically recognizes environmental conservation and generates value for rural producers, investors, and the planet.",
        cta: "Learn more",
      },
      quote: {
        title: "UCS ASE Index",
        subtitle: "Real-time quote",
        conversionRate: "Conversion rate:",
      },
      whatIs: {
        title: "What is the UCS Sustainability Credit?",
        description: "The UCS (Sustainability Credit) is an innovative financial product, backed by the rural activity of conserving native forests. It converts environmental preservation into a tangible and legally recognized economic asset.",
      },
      stakeholders: {
        producers: { title: "Rural Producers", description: "They are remunerated for maintaining and conserving native forest areas on their properties." },
        investors: { title: "Investors", description: "They acquire credits that represent measurable environmental benefits." },
        institutions: { title: "Financial Institutions", description: "They participate in a sustainable and regulated market." },
        environment: { title: "Environment", description: "Benefits from the effective protection of forest ecosystems." },
      },
      pillars: {
        title: "Why is UCS a Secure and Innovative Investment?",
        subtitle: "Our methodology incorporates multiple pillars of backing that ensure transparency, security, and reliability in every credit issued.",
        monitoring: { title: "Monitoring Backing", details: ["Access via real-time satellite imagery"] },
        real: { title: "Real Backing", details: ["Tangible through maintained native vegetation"] },
        technological: { title: "Technological Backing", details: ["Blockchain registration on UCS retirement/consumption", "Blockchain registration at the origin of UCS"] },
        financial: { title: "Financial Backing", details: ["International Identification, ISIN code (International Securities Identification Number)", "Regulated Financial Instrument for cooperation in the capital market", "Registration on the Brazilian stock exchange (B3)"] },
        audit: { title: "Independent Audit Backing", details: ["Verification by an independent third party with international notoriety", "Validation by an independent third party with international notoriety"] },
        scientific: { title: "Scientific Backing", details: ["IPCC (Intergovernmental Panel on Climate Change) guidelines", "ISO (International Organization for Standardization) guidelines"] },
        technical: { title: "Technical Backing", details: ["International laboratory analysis", "National laboratory analysis", "Field analysis (27 ecosystem services)"] },
        legal: { title: "Legal Backing", details: ["Product definition", "Definition of economic activity", "Property registration in a notary's office", "Rural Partnership and adhesion contract"] },
        regulatory: { title: "Regulatory Backing", details: ["International: European Union Regulation 2020/852", "Global pacts: Paris Agreement (article 5), Montreal Protocol (Biodiversity)", "National Policy on Climate Change", "Brazilian Constitution, Property Law, Environmental Law", "Brazilian Forest Code"] },
      },
      legal: {
        title: "Solid and Innovative Legal Support",
        subtitle: "The UCS Sustainability Credit is anchored in a robust regulatory framework that gives it security and legal validity.",
        cnae: "Recognizes the rural activity of native forest conservation.",
        law: "Establishes that rural products can be generated by conservation activities.",
        decree: "Regulates the Green CPR, integrating conservation as an economic asset.",
      },
      summary: {
        title: "Conservation that Generates Value",
        points: [
          'Transforms environmental conservation into a financial asset',
          'Offers full transparency through multiple backings',
          'Guarantees legal and regulatory security',
          'Generates economic return without compromising the environment',
          'Connects producers, investors, and institutions in a virtuous cycle'
        ],
      },
      cta: {
        title: "Interested in Knowing More?",
        subtitle: "Join the new green economy that values standing forests!",
        button: "Visit BMV Digital",
      },
      footer: {
        rights: "All rights reserved.",
        source: "Data source:",
      }
    },
    excelPreview: {
      title: 'Excel Report Preview',
      subtitle: 'Data for',
      totalAssets: 'Total Assets',
      rising: 'Rising',
      falling: 'Falling',
      stable: 'Stable',
      tabs: {
        mainData: '📊 Main Data',
        distribution: '🍕 Distribution',
        topVariations: '📈 Top Variations',
      },
      table: {
        asset: 'Asset',
        price: 'Price',
        variation: 'Variation',
      },
      distribution: {
        title: 'Distribution by Category',
        assets: 'asset(s)',
      },
      topVariations: {
        title: 'Top 10 Largest Variations',
      },
      features: {
        title: 'Exported Excel Features:',
        features: [
          'Three organized tabs: Data, Analysis and Summary.',
          'Conditional formatting with colors for highs and lows.',
          'Interactive Pie and Bar charts.',
        ],
      },
      buttons: {
        cancel: 'Cancel',
        generating: 'Generating...',
        exportToExcel: 'Export to Excel',
      },
    },
    excelExport: {
      buttons: {
        previewExcel: 'Preview Excel',
        exportExcel: 'Export Excel',
        exporting: 'Exporting...',
      },
      messages: {
        exportSuccess: 'Excel exported successfully!',
        exportError: 'Error exporting Excel',
        noDataToExport: 'No data to export',
      },
      headers: {
        category: '🏷️ Category',
        asset: '📋 Asset',
        lastPrice: '💰 Last Price',
        variationPercent: '📊 Variation (%)',
        absoluteVariation: '📈 Absolute Variation',
        unit: '📏 Unit',
        currency: '💱 Currency',
        status: '🎯 Status',
        lastUpdate: '🕐 Last Update',
        notes: '📝 Notes',
      },
      summary: {
        title: '📊 STATISTICAL SUMMARY',
        total: 'Total',
        rising: '📈 Rising',
        falling: '📉 Falling',
        stable: '➡️ Stable',
      },
      analysis: {
        title: '📈 Analysis',
        topGains: 'Top Gains',
        topLosses: 'Top Losses',
        mostVolatile: 'Most Volatile',
      },
      executiveSummary: {
        title: '📋 Executive Summary',
        generatedOn: 'Generated on',
        dataFor: 'Data for',
        marketOverview: 'Market Overview',
        keyMetrics: 'Key Metrics',
        recommendations: 'Recommendations',
      },
      charts: {
        categoryDistribution: 'Distribution by Category',
        topVariations: 'Top 15 Largest Variations',
        priceTrends: 'Price Trends',
        category: 'Category',
        quantity: 'Quantity',
        percentage: 'Percentage',
        rank: 'Rank',
        asset: 'Asset',
        variation: 'Variation (%)',
        date: 'Date',
        price: 'Price',
      },
    },
  },
  es: {
    home: {
      hero: {
        title: "UCS: El Crédito que Transforma Bosques Preservados en Activos Financieros",
        subtitle: "Una innovación que reconoce económicamente la conservación ambiental y genera valor para productores rurales, inversores y el planeta.",
        cta: "Saber más",
      },
      quote: {
        title: "Índice UCS ASE",
        subtitle: "Cotización en tiempo real",
        conversionRate: "Tasa de conversión:",
      },
      whatIs: {
        title: "¿Qué es el Crédito de Sostenibilidad UCS?",
        description: "El UCS (Crédito de Sostenibilidad) es un producto financiero innovador, respaldado por la actividad rural de conservación de bosques nativos. Convierte la preservación ambiental en un activo económico tangible y legalmente reconocido.",
      },
      stakeholders: {
        producers: { title: "Productores Rurales", description: "Son remunerados por mantener y conservar áreas de bosque nativo en sus propiedades." },
        investors: { title: "Inversores", description: "Adquieren créditos que representan beneficios ambientales medibles." },
        institutions: { title: "Instituciones Financieras", description: "Participan en un mercado sostenible y regulado." },
        environment: { title: "Medio Ambiente", description: "Se beneficia de la protección efectiva de los ecosistemas forestales." },
      },
      pillars: {
        title: "¿Por qué UCS es una Inversión Segura e Innovadora?",
        subtitle: "Nuestra metodología incorpora múltiples pilares de respaldo que garantizan transparencia, seguridad y confiabilidad en cada crédito emitido.",
        monitoring: { title: "Respaldo de Monitoreo", details: ["Acceso por imagen de satélite en tiempo real"] },
        real: { title: "Respaldo Real", details: ["Tangible por la vegetación nativa mantenida"] },
        technological: { title: "Respaldo Tecnológico", details: ["Registro en Blockchain en la jubilación/consumo de UCS", "Registro en Blockchain en el origen de UCS"] },
        financial: { title: "Respaldo Financiero", details: ["Identificación Internacional, código ISIN (International Securities Identification Number)", "Instrumento Financiero regulado para la cooperación en el mercado de capitales", "Registro en la bolsa brasileña (B3)"] },
        audit: { title: "Respaldo de Auditoría Independiente", details: ["Verificación por un tercero independiente con notoriedad internacional", "Validación por un tercero independiente con notoriedad internacional"] },
        scientific: { title: "Respaldo Científico", details: ["Directrices del IPCC (Panel Intergubernamental sobre el Cambio Climático)", "Directrices de las ISO (Organización Internacional de Normalización)"] },
        technical: { title: "Respaldo Técnico", details: ["Análisis de laboratorio internacional", "Análisis de laboratorio nacional", "Análisis de campo (27 servicios ecosistémicos)"] },
        legal: { title: "Respaldo Jurídico", details: ["Definición del producto", "Definición de la actividad económica", "Registro de la propiedad en notaría", "Contrato de Asociación Rural y adhesión"] },
        regulatory: { title: "Respaldo Regulatorio", details: ["Internacional: Regulación de la Unión Europea 2020/852", "Pactos globales: Acuerdo de París (artículo 5), Protocolo de Montreal (Biodiversidad)", "Política Nacional sobre el Cambio Climático", "Constitución Brasileña, Derecho de Propiedad, Derecho Ambiental", "Código Forestal Brasileño"] },
      },
      legal: {
        title: "Soporte Legal Sólido e Innovador",
        subtitle: "El Crédito de Sostenibilidad UCS se ancla en un marco regulatorio robusto que le confiere seguridad y validez jurídica.",
        cnae: "Reconoce la actividad rural de conservación de bosques nativos.",
        law: "Establece que los productos rurales pueden ser generados por actividades de conservación.",
        decree: "Regula el CPR Verde, integrando la conservación como un activo económico.",
      },
      summary: {
        title: "Conservación que Genera Valor",
        points: [
          'Transforma la conservación ambiental en un activo financiero',
          'Ofrece total transparencia a través de múltiples respaldos',
          'Garantiza la seguridad jurídica y regulatoria',
          'Genera retorno económico sin comprometer el medio ambiente',
          'Conecta a productores, inversores e instituciones en un ciclo virtuoso'
        ],
      },
      cta: {
        title: "¿Interesado en Saber Más?",
        subtitle: "¡Únete a la nueva economía verde que valora los bosques en pie!",
        button: "Visita BMV Digital",
      },
      footer: {
        rights: "Todos los derechos reservados.",
        source: "Fuente de datos:",
      }
    },
    excelPreview: {
      title: 'Vista Previa del Reporte Excel',
      subtitle: 'Datos para',
      totalAssets: 'Total de Activos',
      rising: 'En Alza',
      falling: 'En Baja',
      stable: 'Estables',
      tabs: {
        mainData: '📊 Datos Principales',
        distribution: '🍕 Distribución',
        topVariations: '📈 Top Variaciones',
      },
      table: {
        asset: 'Activo',
        price: 'Precio',
        variation: 'Variación',
      },
      distribution: {
        title: 'Distribución por Categoría',
        assets: 'activo(s)',
      },
      topVariations: {
        title: 'Top 10 Mayores Variaciones',
      },
      features: {
        title: 'Características del Excel Exportado:',
        features: [
          'Tres pestañas organizadas: Datos, Análisis y Resumen.',
          'Formato condicional con colores para altas y bajas.',
          'Gráficos de Pastel y Barras interactivos.',
        ],
      },
      buttons: {
        cancel: 'Cancelar',
        generating: 'Generando...',
        exportToExcel: 'Exportar a Excel',
      },
    },
    excelExport: {
      buttons: {
        previewExcel: 'Vista Previa Excel',
        exportExcel: 'Exportar Excel',
        exporting: 'Exportando...',
      },
      messages: {
        exportSuccess: '¡Excel exportado exitosamente!',
        exportError: 'Error al exportar Excel',
        noDataToExport: 'No hay datos para exportar',
      },
      headers: {
        category: '🏷️ Categoría',
        asset: '📋 Activo',
        lastPrice: '💰 Último Precio',
        variationPercent: '📊 Variación (%)',
        absoluteVariation: '📈 Variación Absoluta',
        unit: '📏 Unidad',
        currency: '💱 Moneda',
        status: '🎯 Estado',
        lastUpdate: '🕐 Última Actualización',
        notes: '📝 Notas',
      },
      summary: {
        title: '📊 RESUMEN ESTADÍSTICO',
        total: 'Total',
        rising: '📈 Subiendo',
        falling: '📉 Bajando',
        stable: '➡️ Estables',
      },
      analysis: {
        title: '📈 Análisis',
        topGains: 'Mayores Subidas',
        topLosses: 'Mayores Bajadas',
        mostVolatile: 'Más Volátiles',
      },
      executiveSummary: {
        title: '📋 Resumen Ejecutivo',
        generatedOn: 'Generado el',
        dataFor: 'Datos para',
        marketOverview: 'Resumen del Mercado',
        keyMetrics: 'Métricas Clave',
        recommendations: 'Recomendaciones',
      },
      charts: {
        categoryDistribution: 'Distribución por Categoría',
        topVariations: 'Top 15 Mayores Variaciones',
        priceTrends: 'Tendencias de Precios',
        category: 'Categoría',
        quantity: 'Cantidad',
        percentage: 'Porcentaje',
        rank: 'Rango',
        asset: 'Activo',
        variation: 'Variación (%)',
        date: 'Fecha',
        price: 'Precio',
      },
    },
  },
};

export function getTranslations(language: SupportedLanguage): Translations {
  return translations[language] || translations.pt;
}
