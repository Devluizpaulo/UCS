
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
          methodology: string;
        };
        vus: {
          title: string;
          definition: string;
          methodology: string;
        };
        crs: {
          title: string;
          definition: string;
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
        subtitle: "Uma inovação que reconhece economicamente a conservação ambiental e gera valor para produtores rurais, investidores e para o planeta.",
        cta: "Saiba mais",
      },
      quote: {
        title: "Índice UCS",
        subtitle: "Cotação Atual",
        conversionRate: "Taxa de conversão:",
      },
      pdm: {
        title: "PDM – Potencial Desflorestador Monetizado",
        subtitle: "Transformando o valor da floresta em ativos econômicos mensuráveis",
        what_is: {
          title: "O que é o PDM",
          p1: "O **Potencial Desflorestador Monetizado (PDM)** é um modelo inovador de **valoração econômica ambiental** que quantifica, em termos financeiros, o valor das áreas de floresta a partir de três dimensões complementares: ganho direto pela exploração, oportunidade perdida ao preservar e o investimento necessário para manter os serviços ambientais.",
          p2: "Ele transforma a floresta em um **ativo financeiro mensurável**, capaz de expressar tanto o lucro potencial da exploração quanto o retorno econômico da conservação."
        },
        pillars_title: "Os Três Pilares do PDM",
        pillars: {
            vmad: {
                title: 'Valor Econômico da Floresta (VMAD)',
                definition: 'Representa o potencial econômico direto da floresta por meio da exploração madeireira sustentável, calculando o preço comercial da madeira extraída e vendida.',
                methodology: 'Combina o Método Americano de avaliação de ativos com a análise de Custo de Oportunidade, considerando: espécies, custos e preço médio por espécie.'
            },
            vus: {
                title: 'Valor de Transformação Territorial (VUS)',
                definition: 'Estima o valor econômico da terra caso fosse convertida para outros usos produtivos — agropecuário, industrial ou urbano. Representa o valor de oportunidade do uso alternativo.',
                methodology: 'Baseada no Método Americano adaptado à valoração de terras, considerando: produtividade potencial, retorno esperado e custos operacionais.'
            },
            crs: {
                title: 'Valor Socioambiental da Conservação (CRS)',
                definition: 'Quantifica o investimento necessário para manter os serviços ecossistêmicos que a floresta oferece — como regulação climática, água, carbono e biodiversidade.',
                methodology: 'Fundamentada no modelo internacional TEEB (The Economics of Ecosystems and Biodiversity), contemplando: sequestro de carbono, ciclagem de água e proteção da biodiversidade.'
            }
        },
        methodology: "Metodologia de Avaliação",
        applications_title: "Aplicações Práticas do PDM",
        applications: {
            compensation: 'Compensação Ambiental',
            carbon_credits: 'Créditos de Carbono',
            licensing: 'Licenciamento Ambiental',
            asset_management: 'Gestão de Ativos'
        },
        conclusion: {
          title: "Equilíbrio Econômico-Ambiental",
          p1: "O PDM quantifica o equilíbrio entre explorar e preservar. Com base em dados financeiros concretos, o modelo demonstra que a preservação também tem valor econômico, permitindo que tomadores de decisão comparem cenários e investidores identifiquem oportunidades na economia verde."
        }
      },
      ucs: {
        badge: "O Ativo Final",
        title: "Unidade de Créditos de Sustentabilidade – UCS",
        p1: "As Unidades de Crédito de Sustentabilidade (UCS) são a materialização do valor gerado pelo PDM. Elas permitem que corporações contribuam com a proteção e restauração de biomas, alinhando-se às diretrizes do Acordo de Paris.",
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
        title: "PDM – Monetized Deforestation Potential",
        subtitle: "Transforming the value of the forest into measurable economic assets",
        what_is: {
          title: "What is PDM",
          p1: "The **Monetized Deforestation Potential (PDM)** is an innovative model of **environmental economic valuation** that quantifies, in financial terms, the value of forest areas from three complementary dimensions: direct gain from exploitation, opportunity cost of preservation, and the investment needed to maintain environmental services.",
          p2: "It transforms the forest into a **measurable financial asset**, capable of expressing both the potential profit from exploitation and the economic return from conservation."
        },
        pillars_title: "The Three Pillars of PDM",
        pillars: {
            vmad: {
                title: 'Economic Value of the Forest (VMAD)',
                definition: 'Represents the direct economic potential of the forest through sustainable timber exploitation, calculating the commercial price of the extracted and sold wood.',
                methodology: 'Combines the American Method of asset valuation with Opportunity Cost analysis, considering: species, costs, and average price per species.'
            },
            vus: {
                title: 'Territorial Transformation Value (VUS)',
                definition: 'Estimates the economic value of the land if it were converted to other productive uses—agriculture, industry, or urban. It represents the opportunity cost of alternative land use.',
                methodology: 'Based on the American Method adapted for land valuation, considering: potential productivity, expected return, and operational costs.'
            },
            crs: {
                title: 'Socio-environmental Conservation Value (CRS)',
                definition: 'Quantifies the investment needed to maintain the ecosystem services the forest provides—such as climate regulation, water, carbon, and biodiversity.',
                methodology: 'Based on the international TEEB (The Economics of Ecosystems and Biodiversity) model, contemplating: carbon sequestration, water cycling, and biodiversity protection.'
            }
        },
        methodology: "Valuation Methodology",
        applications_title: "Practical Applications of PDM",
        applications: {
            compensation: 'Environmental Compensation',
            carbon_credits: 'Carbon Credits',
            licensing: 'Environmental Licensing',
            asset_management: 'Asset Management'
        },
        conclusion: {
          title: "Economic-Environmental Balance",
          p1: "PDM quantifies the balance between exploiting and preserving. Based on concrete financial data, the model demonstrates that preservation also has economic value, allowing decision-makers to compare scenarios and investors to identify opportunities in the green economy."
        }
      },
      ucs: {
        badge: "The Final Asset",
        title: "Unit of Sustainability Credits – UCS",
        p1: "The Units of Sustainability Credits (UCS) are the materialization of the value generated by the PDM. They allow corporations to contribute to the protection and restoration of biomes, aligning with the guidelines of the Paris Agreement.",
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
        title: "PDM – Potencial de Deforestación Monetizado",
        subtitle: "Transformando el valor del bosque en activos económicos medibles",
        what_is: {
          title: "¿Qué es el PDM?",
          p1: "El **Potencial de Deforestación Monetizado (PDM)** es un modelo innovador de **valoración económica ambiental** que cuantifica, en términos financieros, el valor de las áreas forestales a partir de tres dimensiones complementarias: ganancia directa por explotación, costo de oportunidad de la preservación y la inversión necesaria para mantener los servicios ambientales.",
          p2: "Transforma el bosque en un **activo financiero medible**, capaz de expresar tanto el beneficio potencial de la explotación como el retorno económico de la conservación."
        },
        pillars_title: "Los Tres Pilares del PDM",
        pillars: {
            vmad: {
                title: 'Valor Económico del Bosque (VMAD)',
                definition: 'Representa el potencial económico directo del bosque a través de la explotación maderera sostenible, calculando el precio comercial de la madera extraída y vendida.',
                methodology: 'Combina el Método Americano de valoración de activos con el análisis de Costo de Oportunidad, considerando: especies, costos y precio promedio por especie.'
            },
            vus: {
                title: 'Valor de Transformación Territorial (VUS)',
                definition: 'Estima el valor económico de la tierra si se convirtiera a otros usos productivos (agrícola, industrial o urbano). Representa el costo de oportunidad del uso alternativo del suelo.',
                methodology: 'Basado en el Método Americano adaptado a la valoración de tierras, considerando: productividad potencial, retorno esperado y costos operativos.'
            },
            crs: {
                title: 'Valor Socioambiental de la Conservación (CRS)',
                definition: 'Cuantifica la inversión necesaria para mantener los servicios ecosistémicos que ofrece el bosque, como la regulación climática, el agua, el carbono y la biodiversidad.',
                methodology: 'Basado en el modelo internacional TEEB (La Economía de los Ecosistemas y la Biodiversidad), contemplando: secuestro de carbono, ciclo del agua y protección de la biodiversidad.'
            }
        },
        methodology: "Metodología de Valoración",
        applications_title: "Aplicaciones Prácticas del PDM",
        applications: {
            compensation: 'Compensación Ambiental',
            carbon_credits: 'Créditos de Carbono',
            licensing: 'Licenciamiento Ambiental',
            asset_management: 'Gestión de Activos'
        },
        conclusion: {
          title: "Equilibrio Económico-Ambiental",
          p1: "El PDM cuantifica el equilibrio entre explotar y preservar. Basado en datos financieros concretos, el modelo demuestra que la preservación también tiene valor económico, permitiendo a los responsables de la toma de decisiones comparar escenarios y a los inversores identificar oportunidades en la economía verde."
        }
      },
      ucs: {
        badge: "El Activo Final",
        title: "Unidad de Créditos de Sostenibilidad – UCS",
        p1: "Las Unidades de Crédito de Sostenibilidad (UCS) son la materialización del valor generado por el PDM. Permiten a las corporaciones contribuir a la protección y restauración de biomas, alineándose con las directrices del Acuerdo de París.",
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
        p1: "El uso de blockchain en la sostenibilidad social y ambiental está revelando el potencial de la tecnología para revolucionar la relación entre la sociedad y las iniciativas que buscan reducir los impactos ambientales.",
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
        title: "PDM – Монетизированный потенциал обезлесения",
        subtitle: "Превращение ценности леса в измеримые экономические активы",
        what_is: {
          title: "Что такое PDM",
          p1: "**Монетизированный потенциал обезлесения (PDM)** — это инновационная модель **экологической экономической оценки**, которая в финансовых терминах количественно определяет ценность лесных территорий по трем взаимодополняющим аспектам: прямая выгода от эксплуатации, упущенная выгода от сохранения и инвестиции, необходимые для поддержания экологических услуг.",
          p2: "Он превращает лес в **измеримый финансовый актив**, способный выразить как потенциальную прибыль от эксплуатации, так и экономическую отдачу от сохранения."
        },
        pillars_title: "Три столпа PDM",
        pillars: {
            vmad: {
                title: 'Экономическая ценность леса (VMAD)',
                definition: 'Представляет прямой экономический потенциал леса за счет устойчивой лесозаготовки, рассчитывая коммерческую цену добытой и проданной древесины.',
                methodology: 'Сочетает американский метод оценки активов с анализом альтернативных издержек, учитывая: виды, затраты и среднюю цену за вид.'
            },
            vus: {
                title: 'Ценность территориальной трансформации (VUS)',
                definition: 'Оценивает экономическую стоимость земли, если бы она была преобразована для других производственных целей — сельского хозяйства, промышленности или городского строительства. Представляет собой альтернативную стоимость использования земли.',
                methodology: 'Основано на американском методе, адаптированном для оценки земель, с учетом: потенциальной производительности, ожидаемой доходности и операционных расходов.'
            },
            crs: {
                title: 'Социально-экологическая ценность сохранения (CRS)',
                definition: 'Количественно определяет инвестиции, необходимые для поддержания экосистемных услуг, которые предоставляет лес, — таких как регулирование климата, вода, углерод и биоразнообразие.',
                methodology: 'Основано на международной модели TEEB (Экономика экосистем и биоразнообразия), включая: поглощение углерода, круговорот воды и защиту биоразнообразия.'
            }
        },
        methodology: "Методология оценки",
        applications_title: "Практическое применение PDM",
        applications: {
            compensation: 'Экологическая компенсация',
            carbon_credits: 'Углеродные кредиты',
            licensing: 'Экологическое лицензирование',
            asset_management: 'Управление активами'
        },
        conclusion: {
          title: "Экономико-экологический баланс",
          p1: "PDM количественно определяет баланс между эксплуатацией и сохранением. На основе конкретных финансовых данных модель демонстрирует, что сохранение также имеет экономическую ценность, что позволяет лицам, принимающим решения, сравнивать сценарии, а инвесторам — выявлять возможности в зеленой экономике."
        }
      },
      ucs: {
        badge: "Конечный актив",
        title: "Единица кредитов на устойчивое развитие – UCS",
        p1: "Единицы кредитов на устойчивое развитие (UCS) являются материализацией ценности, создаваемой PDM. Они позволяют корпорациям вносить вклад в защиту и восстановление биомов, соответствуя руководящим принципам Парижского соглашения.",
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
        title: "PDM – 货币化毁林潜力",
        subtitle: "将森林的价值转化为可衡量的经济资产",
        what_is: {
          title: "什么是PDM",
          p1: "**货币化毁林潜力 (PDM)** 是一种创新的 **环境经济评估** 模型，它从三个互补的维度（直接开采收益、保护的机会成本以及维持环境服务所需的投资）以金融术语量化森林区域的价值。",
          p2: "它将森林转化为一个 **可衡量的金融资产**，能够表达开采的潜在利润和保护的经济回报。"
        },
        pillars_title: "PDM的三大支柱",
        pillars: {
            vmad: {
                title: '森林的经济价值 (VMAD)',
                definition: '通过可持续的木材开采，代表森林的直接经济潜力，计算提取和销售的木材的商业价格。',
                methodology: '将美国资产评估方法与机会成本分析相结合，考虑：物种、成本和每种物种的平均价格。'
            },
            vus: {
                title: '土地转型价值 (VUS)',
                definition: '估算土地如果转为其他生产性用途（农业、工业或城市）的经济价值。它代表了土地替代用途的机会成本。',
                methodology: '基于适用于土地评估的美国方法，考虑：潜在生产力、预期回报和运营成本。'
            },
            crs: {
                title: '社会环境保育价值 (CRS)',
                definition: '量化维持森林提供的生态系统服务（如气候调节、水、碳和生物多样性）所需的投资。',
                methodology: '基于国际TEBB（生态系统和生物多样性经济学）模型，包括：碳封存、水循环和生物多样性保护。'
            }
        },
        methodology: "评估方法",
        applications_title: "PDM的实际应用",
        applications: {
            compensation: '环境补偿',
            carbon_credits: '碳信用',
            licensing: '环境许可',
            asset_management: '资产管理'
        },
        conclusion: {
          title: "经济-环境平衡",
          p1: "PDM量化了开发与保护之间的平衡。基于具体的财务数据，该模型表明保护也具有经济价值，使决策者能够比较各种情景，投资者能够识别绿色经济中的机会。"
        }
      },
      ucs: {
        badge: "最终资产",
        title: "可持续发展信用单位 – UCS",
        p1: "可持续发展信用单位 (UCS) 是PDM所产生价值的体现。它们允许企业为保护和恢复生物群落做出贡献，符合《巴黎协定》的指导方针。",
        p2: "有排放负债的公司可以购买UCS信用额度来抵消其影响，直接资助维持碳储量和减少温室气体排放的项目，从而平衡大气中的温室气体排放水平。",
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
