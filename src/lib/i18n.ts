export type SupportedLanguage = 'pt' | 'en' | 'es' | 'ru' | 'zh';

export const languages = [
  { code: 'pt' as SupportedLanguage, label: 'Português' },
  { code: 'en' as SupportedLanguage, label: 'English' },
  { code: 'es' as SupportedLanguage, label: 'Español' },
  { code: 'ru' as SupportedLanguage, label: 'Русский' },
  { code: 'zh' as SupportedLanguage, label: '中文' },
];

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
    pdm: {
      title: string;
      subtitle: string;
      what_is: {
        title: string;
        p1: string;
        p2: string;
      };
      pillars_title: string;
      pillars: {
        vmad: {
          title: string;
          definition: string;
          origin?: string;
          methodology: string;
        };
        vus: {
          title: string;
          definition: string;
          origin?: string;
          methodology: string;
        };
        crs: {
          title: string;
          definition: string;
          origin?: string;
          methodology: string;
        };
      };
      methodology: string;
      applications_title: string;
      applications: {
        compensation: string;
        carbon_credits: string;
        licensing: string;
        asset_management: string;
      };
      conclusion: {
        title: string;
        p1: string;
      };
    };
    ucs: {
      badge: string;
      title: string;
      p1: string;
      p2: string;
      image_alt: string;
    };
    ucs_section: {
      title: string;
      description: string;
    };
    blockchain: {
      badge: string;
      title: string;
      p1: string;
      p2: string;
      image_alt: string;
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
        subtitle: "Um Ecoasset que reconhece economicamente a conservação ambiental e gera valor para produtores rurais, investidores e para o planeta.",
        cta: "Saiba mais",
      },
      quote: {
        title: "Índice UCS",
        subtitle: "Cotação Atual",
        conversionRate: "Taxa de conversão:",
      },
      pdm: {
        title: "UCS – Unidade de Créditos de Sustentabilidade",
        subtitle: "Transformando a conservação em ativos financeiros mensuráveis",
        what_is: {
          title: "O que é a UCS",
          p1: "A <strong>Unidade de Créditos de Sustentabilidade (UCS)</strong> é um <strong>Ecoasset</strong> — a representação financeira do valor gerado pela conservação da floresta. Ela converte benefícios ambientais — como manutenção de estoques de carbono, proteção da água e biodiversidade — em um ativo econômico mensurável, transparente e auditável.",
          p2: "A UCS utiliza uma base metodológica que considera dimensões econômicas e socioambientais da floresta, permitindo que empresas e investidores apoiem a preservação com métricas claras de desempenho e impacto."
        },
        pillars_title: "Os Três Pilares do Sistema",
        pillars: {
            vmad: {
                title: 'Valor Econômico da Floresta',
                definition: 'Mede o potencial econômico direto da floresta a partir da exploração sustentável de seus recursos, principalmente madeireiros. O cálculo considera o preço comercial das espécies exploradas sob manejo de baixo impacto, ciclos de corte controlados e custos operacionais, refletindo o uso responsável da floresta como ativo produtivo.',
                origin: 'O valor é obtido com base nas cotações de mercado da madeira extraída, considerando espécies regionais e índices de commodities florestais.',
                methodology: 'Baseada em modelos consagrados de valoração de ativos florestais, combinando análise de custo de oportunidade e o método americano de avaliação, levando em conta composição de espécies, custos logísticos, preço médio por metro cúbico e variações de mercado.'
            },
            vus: {
                title: 'Valor de Transformação Territorial',
                definition: 'Estima o valor que a terra teria caso a cobertura florestal fosse convertida para outros usos produtivos — como agricultura, pecuária, indústria ou expansão urbana. Esse pilar reflete o valor alternativo da área, ou seja, o potencial econômico de substituição da floresta por outra atividade.',
                origin: 'É derivado das cotações de commodities agrícolas, como milho, soja e boi gordo, utilizadas como referência para estimar a produtividade e o retorno financeiro dos usos alternativos da terra.',
                methodology: 'Adota uma adaptação do método americano de valoração de terras, considerando produtividade potencial, retorno esperado, custos de conversão e operação, além de variáveis regionais como acesso, infraestrutura e logística.'
            },
            crs: {
                title: 'Valor Socioambiental da Conservação',
                definition: 'Traduz o valor dos benefícios que a floresta em pé gera para a sociedade, como regulação do clima, sequestro de carbono, purificação da água, proteção do solo e manutenção da biodiversidade. Representa o investimento necessário para manter esses serviços ecossistêmicos e o retorno econômico e social associado à preservação.',
                origin: 'Baseia-se nos serviços ambientais mensuráveis, especialmente o uso da água e o crédito de carbono, que expressam financeiramente o papel da floresta como infraestrutura natural.',
                methodology: 'Inspirada em referências internacionais, como o TEEB (The Economics of Ecosystems and Biodiversity), combina a quantificação dos serviços ecossistêmicos com custos de conservação e métricas de impacto social e ambiental, ajustadas à realidade local.'
            }
        },
        methodology: "Metodologia de Avaliação",
        applications_title: "Aplicações Práticas",
        applications: {
            compensation: 'Compensação Ambiental',
            carbon_credits: 'Créditos de Carbono',
            licensing: 'Licenciamento Ambiental',
            asset_management: 'Gestão de Ativos'
        },
        conclusion: {
          title: "Equilíbrio Econômico-Ambiental",
          p1: "O sistema quantifica o equilíbrio entre explorar e preservar. Com base em dados financeiros concretos, o modelo demonstra que a preservação também tem valor econômico, permitindo que tomadores de decisão comparem cenários e investidores identifiquem oportunidades na economia verde."
        }
      },
      ucs: {
        badge: "O Ativo Final",
        title: "Unidade de Créditos de Sustentabilidade – UCS",
        p1: "As Unidades de Crédito de Sustentabilidade (UCS) são a materialização do valor gerado pelo monitoramento ambiental. Elas permitem que corporações contribuam com a proteção e restauração de biomas, alinhando-se às diretrizes do Acordo de Paris.",
        p2: "Empresas com passivos de emissões podem comprar créditos UCS para compensar seu impacto, financiando diretamente projetos que mantêm estoques de carbono e reduzem emissões de GEE, equilibrando o nível de emissões na atmosfera.",
        image_alt: "Mãos segurando uma planta jovem"
      },
      ucs_section: {
        title: "A Evolução do Índice UCS",
        description: "Acompanhe a performance histórica do Índice de Unidade de Crédito de Sustentabilidade. O gráfico abaixo ilustra a trajetória e a estabilidade do ativo ao longo do tempo, refletindo o valor crescente da conservação ambiental."
      },
      blockchain: {
        badge: "Tecnologia e Segurança",
        title: "Blockchain na Preservação do Meio Ambiente",
        p1: "O uso de blockchain na área da sustentabilidade social e ambiental têm revelado o potencial da tecnologia para revolucionar as relações entre a sociedade e as iniciativas que buscam reduzir os impactos ambientais.",
        p2: "Por ser uma tecnologia que traz segurança e rastreabilidade às transações, ela estreita a confiança entre compradores e vendedores e traz mais possibilidade ao mercado. A Plataforma de vendas das UCS conta com a segurança do registro das transações em BlockChain como um dos seus principais diferenciais",
        image_alt: "Visualização abstrata de uma rede blockchain"
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
        rank: 'Rango',
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
        title: "UCS Index",
        subtitle: "Current Quote",
        conversionRate: "Conversion rate:",
      },
      pdm: {
        title: "UCS – Unit of Sustainability Credits",
        subtitle: "Transforming conservation into measurable financial assets",
        what_is: {
          title: "What is UCS",
          p1: "The <strong>Unit of Sustainability Credits (UCS)</strong> is an <strong>Ecoasset</strong> — the financial representation of the value generated by forest conservation. It converts environmental benefits — such as carbon stocks, water protection and biodiversity — into a measurable, transparent and auditable economic asset.",
          p2: "UCS applies a methodological basis that considers both economic and socio-environmental dimensions of the forest, enabling companies and investors to support preservation with clear performance and impact metrics."
        },
        pillars_title: "The Three Pillars of the System",
        pillars: {
            vmad: {
                title: 'Economic Value of the Forest',
                definition: 'Represents the direct economic potential of the forest through sustainable timber exploitation, calculating the commercial price of the extracted and sold wood.',
                methodology: 'Based on recognized forest asset valuation models, combining opportunity cost analysis and the American appraisal method, considering species composition, logistical costs, average price per cubic meter and market variations.'
            },
            vus: {
                title: 'Territorial Transformation Value',
                definition: 'Estimates the economic value of the land if it were converted to other productive uses—agriculture, industry, or urban. It represents the opportunity cost of alternative land use.',
                methodology: 'Based on the American Method adapted for land valuation, considering potential productivity, expected return, and operational costs, plus regional variables such as access, infrastructure and logistics.'
            },
            crs: {
                title: 'Socio-environmental Conservation Value',
                definition: 'Quantifies the investment needed to maintain the ecosystem services the forest provides—such as climate regulation, water, carbon, and biodiversity.',
                methodology: 'Inspired by international references such as the TEEB (The Economics of Ecosystems and Biodiversity) model, combining quantification of ecosystem services with conservation costs and social/environmental impact metrics adjusted to local reality.'
            }
        },
        methodology: "Valuation Methodology",
        applications_title: "Practical Applications",
        applications: {
            compensation: 'Environmental Compensation',
            carbon_credits: 'Carbon Credits',
            licensing: 'Environmental Licensing',
            asset_management: 'Asset Management'
        },
        conclusion: {
          title: "Economic-Environmental Balance",
          p1: "The system quantifies the balance between exploiting and preserving. Based on concrete financial data, the model demonstrates that preservation also has economic value, allowing decision-makers to compare scenarios and investors to identify opportunities in the green economy."
        }
      },
      ucs: {
        badge: "The Final Asset",
        title: "Unit of Sustainability Credits – UCS",
        p1: "The Units of Sustainability Credits (UCS) are the materialization of the value generated by environmental monitoring. They allow corporations to contribute to the protection and restoration of biomes, aligning with the guidelines of the Paris Agreement.",
        p2: "Companies with emission liabilities can purchase UCS credits to offset their impact, directly financing projects that maintain carbon stocks and reduce GHG emissions, balancing the level of GHG emissions in the atmosphere.",
        image_alt: "Hands holding a young plant"
      },
      ucs_section: {
        title: "The Evolution of the UCS Index",
        description: "Track the historical performance of the Sustainability Credit Unit (UCS) Index. The chart below illustrates the asset's trajectory and stability over time, reflecting the growing value of environmental conservation."
      },
      blockchain: {
        badge: "Technology and Security",
        title: "Blockchain in Environmental Preservation",
        p1: "The use of blockchain in social and environmental sustainability is revealing the technology's potential to revolutionize the relationship between society and initiatives aimed at reducing environmental impacts.",
        p2: "By providing security and traceability to transactions, it strengthens trust between buyers and sellers and opens up new possibilities for the market. The UCS platform relies on the security of Blockchain registration as one of its main differentiators, ensuring the integrity and origin of each sustainability credit.",
        image_alt: "Abstract visualization of a blockchain network"
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
        title: "Índice UCS",
        subtitle: "Cotización Actual",
        conversionRate: "Tasa de conversión:",
      },
      pdm: {
        title: "UCS – Unidad de Créditos de Sostenibilidad",
        subtitle: "Transformando la conservación en activos financieros mensurables",
        what_is: {
          title: "¿Qué es la UCS?",
          p1: "La <strong>Unidad de Créditos de Sostenibilidad (UCS)</strong> es un <strong>Ecoasset</strong> — la representación financiera del valor generado por la conservación del bosque. Convierte beneficios ambientales — como stocks de carbono, protección del agua y biodiversidad — en un activo económico medible, transparente y auditable.",
          p2: "La UCS utiliza una base metodológica que considera dimensiones económicas y socioambientales del bosque, permitiendo a empresas e inversores apoyar la preservação con métricas claras de desempeño e impacto."
        },
        pillars_title: "Los Tres Pilares del Sistema",
        pillars: {
            vmad: {
                title: 'Valor Económico del Bosque',
                definition: 'Representa el potencial económico directo del bosque a través de la explotación maderera sostenible, calculando el precio comercial de la madera extraída y vendida.',
                methodology: 'Basado en modelos de valoración de activos forestales reconocidos, combinando el análisis de costes de oportunidad y el método de tasación americano, considerando la composición de especies, costes logísticos, precio medio por metro cúbico y variaciones del mercado.'
            },
            vus: {
                title: 'Valor de Transformación Territorial',
                definition: 'Estima el valor económico de la tierra si se convirtiera a otros usos productivos (agrícola, industrial o urbano). Representa el costo de oportunidad del uso alternativo del suelo.',
                methodology: 'Basado en el Método Americano adaptado a la valoración de tierras, considerando la productividad potencial, el rendimiento esperado y los costes operativos, además de variables regionales como el acceso, la infraestructura y la logística.'
            },
            crs: {
                title: 'Valor Socioambiental de la Conservación',
                definition: 'Cuantifica la inversión necesaria para mantener los servicios ecosistémicos que ofrece el bosque, como la regulación climática, el agua, el carbono y la biodiversidad.',
                methodology: 'Inspirado en referencias internacionales como el modelo TEEB (The Economics of Ecosystems and Biodiversity), combina la cuantificación de los servicios ecosistémicos con los costes de conservación y métricas de impacto social/ambiental ajustadas a la realidad local.'
            }
        },
        methodology: "Metodología de Valoración",
        applications_title: "Aplicaciones Prácticas",
        applications: {
            compensation: 'Compensación Ambiental',
            carbon_credits: 'Créditos de Carbono',
            licensing: 'Licenciamiento Ambiental',
            asset_management: 'Gestión de Ativos'
        },
        conclusion: {
          title: "Equilibrio Económico-Ambiental",
          p1: "El sistema cuantifica el equilibrio entre explotar y preservar. Basado en datos financieros concretos, el modelo demuestra que la preservación también tiene valor económico, permitiendo comparar escenarios e identificar oportunidades en la economía verde."
        }
      },
      ucs: {
        badge: "El Activo Final",
        title: "Unidad de Créditos de Sostenibilidad – UCS",
        p1: "Las Unidades de Crédito de Sostenibilidad (UCS) son la materialización del valor generado por el monitoreo ambiental. Permiten a las corporaciones contribuir a la protección y restauración de biomas, alineándose con las directrices del Acuerdo de París.",
        p2: "Las empresas con pasivos de emisiones pueden comprar créditos UCS para compensar su impacto, financiando directamente proyectos que mantienen las reservas de carbono y reducen las emisiones de GEI, equilibrando el nivel de emisiones de GEI en la atmósfera.",
        image_alt: "Manos sosteniendo una planta joven"
      },
      ucs_section: {
        title: "La Evolución del Índice UCS",
        description: "Siga el rendimiento histórico del Índice de la Unidad de Crédito de Sostenibilidad (UCS). El siguiente gráfico ilustra la trayectoria y estabilidad del activo a lo largo del tiempo, reflejando el valor creciente de la conservación ambiental."
      },
      blockchain: {
        badge: "Tecnología y Seguridad",
        title: "Blockchain en la Preservación del Medio Ambiente",
        p1: "El uso de blockchain en la sostenibilidad social e ambiental está revelando el potencial de la tecnología para revolucionar la relación entre la sociedad y las iniciativas que buscan reducir los impactos ambientales.",
        p2: "Al proporcionar seguridad y trazabilidad a las transacciones, fortalece la confianza entre compradores y vendedores y abre nuevas posibilidades para el mercado. La plataforma UCS se basa en la seguridad del registro en Blockchain como uno de sus principales diferenciadores, garantizando la integridad y el origen de cada crédito de sostenibilidad.",
        image_alt: "Visualización abstracta de una red blockchain"
      },
      footer: {
        rights: "Todos los derechos reservados.",
        source: "Fuente de datos:",
      }
    },
    excelPreview: {
      title: 'Vista Previa del Reporte Excel',
      subtitle: 'Dados para',
      totalAssets: 'Total de Ativos',
      rising: 'En Alza',
      falling: 'En Baja',
      stable: 'Estables',
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
  ru: {
    home: {
      hero: {
        title: "UCS: Кредит, который превращает сохраненные леса в финансовые активы",
        subtitle: "Инновация, которая экономически признает охрану окружающей среды и создает ценность для сельских производителей, инвесторов и планеты.",
        cta: "Узнать больше",
      },
      quote: {
        title: "Индекс UCS",
        subtitle: "Текущая котировка",
        conversionRate: "Курс обмена:",
      },
       pdm: {
        title: "UCS – Единица кредитов на устойчивое развитие",
        subtitle: "Преобразование сохранения в измеримые финансовые активы",
        what_is: {
          title: "Что такое UCS",
          p1: "The <strong>Единица кредитов на устойчивое развитие (UCS)</strong> — это <strong>Ecoasset</strong> — финансовое представление ценности, создаваемой сохранением леса. Она конвертирует экологические выгоды — запасы углерода, защиту воды и биоразнообразие — в измеряемый, прозрачный и поддающийся аудиту экономический актив.",
          p2: "UCS опирается на методологическую базу, учитывающую экономические и социально-экологические измерения леса, что позволяет компаниям и инвесторам поддерживать сохранение с понятными метриками эффективности и воздействия."
        },
        pillars_title: "Три столпа Системы",
        pillars: {
            vmad: {
                title: 'Экономическая ценность леса',
                definition: 'Представляет прямой экономический потенциал леса за счет устойчивой лесозаготовки, рассчитывая коммерческую цену добытой и проданной древесины.',
                methodology: 'На основе признанных моделей оценки лесных активов, сочетающих анализ альтернативных издержек и американский метод оценки, с учетом видового состава, логистических затрат, средней цены за кубический метр и рыночных колебаний.'
            },
            vus: {
                title: 'Ценность территориальной трансформации',
                definition: 'Оценивает экономическую стоимость земли, если бы она была преобразована для других производственных целей — сельского хозяйства, промышленности или городского строительства. Представляет собой альтернативную стоимость использования земли.',
                methodology: 'На основе американского метода, адаптированного для оценки земель, с учетом потенциальной производительности, ожидаемой доходности и эксплуатационных расходов, а также региональных переменных, таких как доступ, инфраструктура и логистика.'
            },
            crs: {
                title: 'Социально-экологическая ценность сохранения',
                definition: 'Количественно определяет инвестиции, необходимые для поддержания экосистемных услуг, которые предоставляет лес, — таких как регулирование климата, вода, углерод и биоразнообразие.',
                methodology: 'Вдохновленный международными рекомендациями, такими как модель TEEB (The Economics of Ecosystems and Biodiversity), он сочетает количественную оценку экосистемных услуг с затратами на сохранение и показателями социального/экологического воздействия, адаптированными к местным реалиям.'
            }
        },
        methodology: "Методология оценки",
        applications_title: "Практическое применение",
        applications: {
            compensation: 'Экологическая компенсация',
            carbon_credits: 'Углеродные кредиты',
            licensing: 'Экологическое лицензирование',
            asset_management: 'Управление активами'
        },
        conclusion: {
          title: "Экономико-экологический баланс",
          p1: "Система количественно определяет баланс между эксплуатацией и сохранением. На основе конкретных финансовых данных модель демонстрирует экономическую ценность сохранения, позволяя сравнивать сценарии и выявлять возможности зеленой экономики."
        }
      },
      ucs: {
        badge: "Конечный актив",
        title: "Единица кредитов на устойчивое развитие – UCS",
        p1: "Единицы кредитов на устойчивое развитие (UCS) являются материализацией ценности, создаваемой экологическим мониторингом. Они позволяют корпорациям вносить вклад в защиту и восстановление биомов, соответствуя руководящим принципам Парижского соглашения.",
        p2: "Компании с обязательствами по выбросам могут приобретать кредиты UCS для компенсации своего воздействия, напрямую финансируя проекты, которые поддерживают запасы углерода и сокращают выбросы ПГ, балансируя уровень выбросов ПГ в атмосфере.",
        image_alt: "Руки, держащие молодое растение"
      },
      ucs_section: {
        title: "Эволюция индекса UCS",
        description: "Отслеживайте историческую динамику Индекса единиц кредита на устойчивое развитие (UCS). Приведенный ниже график иллюстрирует траекторию и стабильность актива с течением времени, отражая растущую ценность сохранения окружающей среды."
      },
      blockchain: {
        badge: "Технологии и безопасность",
        title: "Блокчейн в охране окружающей среды",
        p1: "Использование блокчейна в области социальной и экологической устойчивости раскрывает потенциал технологии для революционизации отношений между обществом и инициативами, направленными на снижение воздействия на окружающую среду.",
        p2: "Обеспечивая безопасность и отслеживаемость транзакций, он укрепляет доверие между покупателями и продавцами и открывает новые возможности для рынка. Платформа UCS опирается на безопасность регистрации в блокчейне как на одно из своих основных преимуществ, обеспечивая целостность и происхождение каждого кредита на устойчивое развитие.",
        image_alt: "Абстрактное изображение сети блокчейн"
      },
      footer: {
        rights: "Все права защищены.",
        source: "Источник данных:",
      }
    },
    excelPreview: {
      title: 'Предварительный просмотр отчета Excel',
      subtitle: 'Данные за',
      totalAssets: 'Всего активов',
      rising: 'Растущие',
      falling: 'Падающие',
      stable: 'Стабильные',
      tabs: {
        mainData: '📊 Основные данные',
        distribution: '🍕 Распределение',
        topVariations: '📈 Топ изменений',
      },
      table: {
        asset: 'Актив',
        price: 'Цена',
        variation: 'Изменение',
      },
      distribution: {
        title: 'Распределение по категориям',
        assets: 'актив(ов)',
      },
      topVariations: {
        title: 'Топ-10 самых больших изменений',
      },
      features: {
        title: 'Возможности экспортированного Excel:',
        features: [
          'Три организованные вкладки: Данные, Анализ и Сводка.',
          'Условное форматирование с цветами для роста и падения.',
          'Интерактивные круговые и столбчатые диаграммы.',
        ],
      },
      buttons: {
        cancel: 'Отмена',
        generating: 'Создание...',
        exportToExcel: 'Экспорт в Excel',
      },
    },
    excelExport: {
        buttons: {
            previewExcel: 'Предпросмотр Excel',
            exportExcel: 'Экспорт в Excel',
            exporting: 'Экспорт...',
        },
        messages: {
            exportSuccess: 'Excel успешно экспортирован!',
            exportError: 'Ошибка при экспорте в Excel',
            noDataToExport: 'Нет данных для экспорта',
        },
        headers: {
            category: '🏷️ Категория',
            asset: '📋 Актив',
            lastPrice: '💰 Последняя цена',
            variationPercent: '📊 Изменение (%)',
            absoluteVariation: '📈 Абсолютное изменение',
            unit: '📏 Единица',
            currency: '💱 Валюта',
            status: '🎯 Статус',
            lastUpdate: '🕐 Последнее обновление',
            notes: '📝 Примечания',
        },
        summary: {
            title: '📊 СТАТИСТИЧЕСКАЯ СВОДКА',
            total: 'Всего',
            rising: '📈 Рост',
            falling: '📉 Падение',
            stable: '➡️ Стабильно',
        },
        analysis: {
            title: '📈 Анализ',
            topGains: 'Лидеры роста',
            topLosses: 'Лидеры падения',
            mostVolatile: 'Самые волатильные',
        },
        executiveSummary: {
            title: '📋 Сводный отчет',
            generatedOn: 'Сгенерировано',
            dataFor: 'Данные за',
            marketOverview: 'Обзор рынка',
            keyMetrics: 'Ключевые показатели',
            recommendations: 'Рекомендации',
        },
        charts: {
            categoryDistribution: 'Распределение по категориям',
            topVariations: 'Топ-15 самых больших изменений',
            priceTrends: 'Ценовые тренды',
            category: 'Категория',
            quantity: 'Количество',
            percentage: 'Процент',
            rank: 'Ранг',
            asset: 'Актив',
            variation: 'Изменение (%)',
            date: 'Дата',
            price: 'Цена',
        },
    },
  },
  zh: {
    home: {
      hero: {
        title: "UCS：将受保护的森林转变为金融资产的信用",
        subtitle: "一项经济上认可环境保护并为农村生产者、投资者和地球创造价值的创新。",
        cta: "了解更多",
      },
      quote: {
        title: "UCS指数",
        subtitle: "当前报价",
        conversionRate: "换算率:",
      },
      pdm: {
        title: "UCS – 可持续发展信用单位",
        subtitle: "将保护转化为可衡量的金融资产",
        what_is: {
          title: "什么是UCS",
          p1: "The <strong>可持续发展信用单位 (UCS)</strong> 是一种 <strong>Ecoasset</strong> —— 对森林保护所创造价值的金融化表示。它把环境效益（碳储量、水资源保护与生物多样性）转化为可衡量、透明且可审计的经济资产。",
          p2: "UCS 采用同时考虑经济与社会—环境维度的方法学基础，使企业和投资者能够以清晰的绩效与影响指标支持保护。"
        },
        pillars_title: "系统的三大支柱",
        pillars: {
            vmad: {
                title: '森林的经济价值',
                definition: '通过可持续的木材开采，代表森林的直接经济潜力，计算提取和销售的木材的商业价格。',
                methodology: '基于公认的森林资产评估模型，结合机会成本分析和美国评估方法，考虑物种组成、物流成本、每立方米平均价格和市场波动。'
            },
            vus: {
                title: '土地转型价值',
                definition: '估算土地如果转为其他生产性用途（农业、工业或城市）的经济价值。它代表了土地替代用途的机会成本。',
                methodology: '基于适用于土地评估的美国方法，考虑潜在生产力、预期回报和运营成本，以及交通、基础设施和物流等区域变量。'
            },
            crs: {
                title: '社会环境保育价值',
                definition: '量化维持森林提供的生态系统服务（如气候调节、水、碳和生物多样性）所需的投资。',
                methodology: '受到 TEEB（生态系统和生物多样性经济学）模型等国际参考资料的启发，它将生态系统服务的量化与根据当地现实调整的保护成本和社会/环境影响指标结合起来。'
            }
        },
        methodology: "评估方法",
        applications_title: "实际应用",
        applications: {
            compensation: '环境补偿',
            carbon_credits: '碳信用',
            licensing: '环境许可',
            asset_management: '资产管理',
        },
        conclusion: {
          title: "经济—环境平衡",
          p1: "该系统量化了开发与保护之间的平衡。基于具体的财务数据，该模型表明保护也具有经济价值，使决策者能够比较各种情景、投资者能够识别绿色经济中的机会。"
        }
      },
      ucs: {
        badge: "最终资产",
        title: "可持续发展信用单位 – UCS",
        p1: "可持续发展信用单位（UCS）是由环境监测产生的价值的实体化。它使企业能够为生物群系的保护与修复做出贡献，并与《巴黎协定》的指导方针保持一致。",
        p2: "具有排放负债的公司可以购买UCS信用以抵消其影响，直接资助维持碳储量并减少温室气体排放的项目，从而平衡大气中的排放水平。",
        image_alt: "手捧幼苗"
      },
      ucs_section: {
        title: "UCS指数的演变",
        description: "跟踪可持续发展信用单位（UCS）指数的历史表现。下图说明了该资产随时间的轨迹和稳定性，反映了环境保护日益增长的价值。"
      },
      blockchain: {
        badge: "技术与安全",
        title: "区块链在环境保护中的应用",
        p1: "在社会和环境可持续性领域使用区块链，揭示了该技术在彻底改变社会与旨在减少环境影响的举措之间关系方面的潜力。",
        p2: "通过为交易提供安全性和可追溯性，它加强了买卖双方之间的信任，并为市场开辟了新的可能性。UCS平台依靠区块链注册的安全性作为其主要优势之一，确保了每个可持续发展信用的完整性和来源。",
        image_alt: "区块链网络的抽象可视化"
      },
      footer: {
        rights: "版权所有。",
        source: "数据来源:",
      }
    },
    excelPreview: {
      title: 'Excel报告预览',
      subtitle: '数据日期',
      totalAssets: '总资产',
      rising: '上涨',
      falling: '下跌',
      stable: '稳定',
      tabs: {
        mainData: '📊 主要数据',
        distribution: '🍕 分布',
        topVariations: '📈 主要变动',
      },
      table: {
        asset: '资产',
        price: '价格',
        variation: '变动',
      },
      distribution: {
        title: '按类别分布',
        assets: '项资产',
      },
      topVariations: {
        title: '前10大变动',
      },
      features: {
        title: '导出的Excel功能：',
        features: [
          '三个有组织的标签页：数据、分析和摘要。',
          '带有颜色标记高低点的条件格式。',
          '交互式饼图和条形图。',
        ],
      },
      buttons: {
        cancel: '取消',
        generating: '生成中...',
        exportToExcel: '导出到Excel',
      },
    },
    excelExport: {
        buttons: {
            previewExcel: '预览Excel',
            exportExcel: '导出Excel',
            exporting: '导出中...',
        },
        messages: {
            exportSuccess: 'Excel导出成功！',
            exportError: '导出Excel时出错',
            noDataToExport: '无数据可导出',
        },
        headers: {
            category: '🏷️ 类别',
            asset: '📋 资产',
            lastPrice: '💰 最新价格',
            variationPercent: '📊 变动(%)',
            absoluteVariation: '📈 绝对变动',
            unit: '📏 单位',
            currency: '💱 货币',
            status: '🎯 状态',
            lastUpdate: '🕐 最后更新',
            notes: '📝 备注',
        },
        summary: {
            title: '📊 统计摘要',
            total: '总计',
            rising: '📈 上涨',
            falling: '📉 下跌',
            stable: '➡️ 稳定',
        },
        analysis: {
            title: '📈 分析',
            topGains: '最大涨幅',
            topLosses: '最大跌幅',
            mostVolatile: '最不稳定',
        },
        executiveSummary: {
            title: '📋 执行摘要',
            generatedOn: '生成于',
            dataFor: '数据日期',
            marketOverview: '市场概览',
            keyMetrics: '关键指标',
            recommendations: '建议',
        },
        charts: {
            categoryDistribution: '按类别分布',
            topVariations: '前15大变动',
            priceTrends: '价格趋势',
            category: '类别',
            quantity: '数量',
            percentage: '百分比',
            rank: '排名',
            asset: '资产',
            variation: '变动(%)',
            date: '日期',
            price: '价格',
        },
    },
  },
};

export const defaultTranslations = {
    pt: { title: translations.pt.home.hero.title, subtitle: translations.pt.home.hero.subtitle },
    en: { title: translations.en.home.hero.title, subtitle: translations.en.home.hero.subtitle },
    es: { title: translations.es.home.hero.title, subtitle: translations.es.home.hero.subtitle },
    ru: { title: translations.ru.home.hero.title, subtitle: translations.ru.home.hero.subtitle },
    zh: { title: translations.zh.home.hero.title, subtitle: translations.zh.home.hero.subtitle },
};


export function getTranslations(language: SupportedLanguage): Translations {
  return translations[language] || translations.pt;
}
