

export type SupportedLanguage = 'pt' | 'en' | 'es' | 'ru' | 'zh';

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
          perspective: string;
          methodology: string;
        };
        vus: {
          title: string;
          definition: string;
          perspective: string;
          methodology: string;
        };
        crs: {
          title: string;
          definition: string;
          perspective: string;
          methodology: string;
        };
      };
      perspective: string;
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
    blockchain: {
      badge: string;
      title: string;
      p1: string;
      p2: string;
      image_alt: string;
    },
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
        title: "Índice UCS",
        subtitle: "Cotação Atual",
        conversionRate: "Taxa de conversão:",
      },
      whatIs: {
        title: "O que é o UCS?",
        description: "O UCS (Crédito de Sustentabilidade) é um produto financeiro inovador, lastreado na atividade rural de conservação de florestas nativas. Ele converte a preservação ambiental em um ativo econômico tangível e com amparo legal.",
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
                perspective: 'Evidencia o valor de mercado do recurso florestal — quanto vale a floresta como ativo produtivo. Serve como base para licenças, concessões e projetos de manejo sustentável.',
                methodology: 'Combina o Método Americano de avaliação de ativos com a análise de Custo de Oportunidade, considerando: espécies, custos e preço médio por espécie.'
            },
            vus: {
                title: 'Valor de Transformação Territorial (VUS)',
                definition: 'Estima o valor econômico da terra caso fosse convertida para outros usos produtivos — agropecuário, industrial ou urbano. Representa o valor de oportunidade do uso alternativo.',
                perspective: 'Demonstra o custo econômico da preservação, indicando quanto se deixaria de lucrar ao manter a floresta intacta. Essencial para planejamento territorial e compensações.',
                methodology: 'Baseada no Método Americano adaptado à valoração de terras, considerando: produtividade potencial, retorno esperado e custos operacionais.'
            },
            crs: {
                title: 'Valor Socioambiental da Conservação (CRS)',
                definition: 'Quantifica o investimento necessário para manter os serviços ecossistêmicos que a floresta oferece — como regulação climática, água, carbono e biodiversidade.',
                perspective: 'Traduz o valor da preservação como ativo econômico real, gerando benefícios como créditos de carbono e fortalecimento da imagem corporativa sustentável.',
                methodology: 'Fundamentada no modelo internacional TEEB (The Economics of Ecosystems and Biodiversity), contemplando: sequestro de carbono, ciclagem de água e proteção da biodiversidade.'
            }
        },
        perspective: "Perspectiva Comercial",
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
      blockchain: {
        badge: "Tecnologia e Segurança",
        title: "Blockchain na Preservação do Meio Ambiente",
        p1: "O uso de blockchain na área da sustentabilidade revoluciona a forma como rastreamos e validamos o impacto ambiental. A tecnologia oferece um registro imutável e transparente de todas as transações.",
        p2: "Por ser segura e rastreável, ela aumenta a confiança entre compradores e vendedores. A plataforma de UCS conta com a segurança do registro em Blockchain como um de seus principais diferenciais, garantindo a integridade e a origem de cada crédito de sustentabilidade.",
        image_alt: "Visualização abstrata de uma rede blockchain"
      },
      stakeholders: {
        producers: { title: "Produtores Rurais", description: "São remunerados por manter e conservar áreas de floresta nativa em suas propriedades." },
        investors: { title: "Investidores", description: "Adquirem créditos que representam benefícios ambientais mensuráveis." },
        institutions: { title: "Instituições Financeiras", description: "Participam de um mercado sustentável e regulado." },
        environment: { title: "Meio Ambiente", description: "Ganha com a proteção efetiva dos ecossistemas florestais." },
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
        title: "UCS Index",
        subtitle: "Current Quote",
        conversionRate: "Conversion rate:",
      },
      whatIs: {
        title: "What is UCS?",
        description: "The UCS (Sustainability Credit) is an innovative financial product, backed by the rural activity of conserving native forests. It converts environmental preservation into a tangible and legally recognized economic asset.",
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
                perspective: 'Highlights the market value of the forest resource—what the forest is worth as a productive asset. It serves as a basis for licenses, concessions, and sustainable management projects.',
                methodology: 'Combines the American Method of asset valuation with Opportunity Cost analysis, considering: species, costs, and average price per species.'
            },
            vus: {
                title: 'Territorial Transformation Value (VUS)',
                definition: 'Estimates the economic value of the land if it were converted to other productive uses—agriculture, industry, or urban. It represents the opportunity cost of alternative land use.',
                perspective: 'Demonstrates the economic cost of preservation, indicating how much profit would be forgone by keeping the forest intact. Essential for territorial planning and compensation.',
                methodology: 'Based on the American Method adapted for land valuation, considering: potential productivity, expected return, and operational costs.'
            },
            crs: {
                title: 'Socio-environmental Conservation Value (CRS)',
                definition: 'Quantifies the investment needed to maintain the ecosystem services the forest provides—such as climate regulation, water, carbon, and biodiversity.',
                perspective: 'Translates the value of preservation into a real economic asset, generating benefits like carbon credits and strengthening a sustainable corporate image.',
                methodology: 'Based on the international TEEB (The Economics of Ecosystems and Biodiversity) model, contemplating: carbon sequestration, water cycling, and biodiversity protection.'
            }
        },
        perspective: "Commercial Perspective",
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
      blockchain: {
        badge: "Technology and Security",
        title: "Blockchain in Environmental Preservation",
        p1: "The use of blockchain in social and environmental sustainability is revealing the technology's potential to revolutionize the relationship between society and initiatives aimed at reducing environmental impacts.",
        p2: "By providing security and traceability to transactions, it strengthens trust between buyers and sellers and opens up new possibilities for the market. The UCS platform relies on the security of Blockchain registration as one of its main differentiators, ensuring the integrity and origin of each sustainability credit.",
        image_alt: "Abstract visualization of a blockchain network"
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
        title: "Índice UCS",
        subtitle: "Cotización Actual",
        conversionRate: "Tasa de conversión:",
      },
      whatIs: {
        title: "¿Qué es UCS?",
        description: "El UCS (Crédito de Sostenibilidad) es un producto financiero innovador, respaldado por la actividad rural de conservación de bosques nativos. Convierte la preservación ambiental en un activo económico tangible y legalmente reconocido.",
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
                perspective: 'Destaca el valor de mercado del recurso forestal, cuánto vale el bosque como activo productivo. Sirve como base para licencias, concesiones y proyectos de manejo sostenible.',
                methodology: 'Combina el Método Americano de valoración de activos con el análisis de Costo de Oportunidad, considerando: especies, costos y precio promedio por especie.'
            },
            vus: {
                title: 'Valor de Transformación Territorial (VUS)',
                definition: 'Estima el valor económico de la tierra si se convirtiera a otros usos productivos (agrícola, industrial o urbano). Representa el costo de oportunidad del uso alternativo del suelo.',
                perspective: 'Demuestra el costo económico de la preservación, indicando cuánta ganancia se dejaría de obtener al mantener el bosque intacto. Esencial para la planificación territorial y las compensaciones.',
                methodology: 'Basado en el Método Americano adaptado a la valoración de tierras, considerando: productividad potencial, retorno esperado y costos operativos.'
            },
            crs: {
                title: 'Valor Socioambiental de la Conservación (CRS)',
                definition: 'Cuantifica la inversión necesaria para mantener los servicios ecosistémicos que ofrece el bosque, como la regulación climática, el agua, el carbono y la biodiversidad.',
                perspective: 'Traduce el valor de la preservación en un activo económico real, generando beneficios como créditos de carbono y fortaleciendo la imagen corporativa sostenible.',
                methodology: 'Basado en el modelo internacional TEEB (La Economía de los Ecosistemas y la Biodiversidad), contemplando: secuestro de carbono, ciclo del agua y protección de la biodiversidad.'
            }
        },
        perspective: "Perspectiva Comercial",
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
      blockchain: {
        badge: "Tecnología y Seguridad",
        title: "Blockchain en la Preservación del Medio Ambiente",
        p1: "El uso de blockchain en la sostenibilidad social y ambiental está revelando el potencial de la tecnología para revolucionar la relación entre la sociedad y las iniciativas que buscan reducir los impactos ambientales.",
        p2: "Al proporcionar seguridad y trazabilidad a las transacciones, fortalece la confianza entre compradores y vendedores y abre nuevas posibilidades para el mercado. La plataforma UCS se basa en la seguridad del registro en Blockchain como uno de sus principales diferenciadores, garantizando la integridad y el origen de cada crédito de sostenibilidad.",
        image_alt: "Visualización abstracta de una red blockchain"
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
      whatIs: {
        title: "Что такое UCS?",
        description: "UCS (Кредит на устойчивое развитие) — это инновационный финансовый продукт, обеспеченный сельской деятельностью по сохранению коренных лесов. Он превращает охрану окружающей среды в материальный и юридически признанный экономический актив.",
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
                perspective: 'Подчеркивает рыночную стоимость лесного ресурса — чего стоит лес как производственный актив. Служит основой для лицензий, концессий и проектов устойчивого лесопользования.',
                methodology: 'Сочетает американский метод оценки активов с анализом альтернативных издержек, учитывая: виды, затраты и среднюю цену за вид.'
            },
            vus: {
                title: 'Ценность территориальной трансформации (VUS)',
                definition: 'Оценивает экономическую стоимость земли, если бы она была преобразована для других производственных целей — сельского хозяйства, промышленности или городского строительства. Представляет собой альтернативную стоимость использования земли.',
                perspective: 'Демонстрирует экономические издержки сохранения, показывая, какая прибыль была бы упущена при сохранении леса. Важно для территориального планирования и компенсаций.',
                methodology: 'Основано на американском методе, адаптированном для оценки земель, с учетом: потенциальной производительности, ожидаемой доходности и операционных расходов.'
            },
            crs: {
                title: 'Социально-экологическая ценность сохранения (CRS)',
                definition: 'Количественно определяет инвестиции, необходимые для поддержания экосистемных услуг, которые предоставляет лес, — таких как регулирование климата, вода, углерод и биоразнообразие.',
                perspective: 'Переводит ценность сохранения в реальный экономический актив, создавая выгоды, такие как углеродные кредиты, и укрепляя устойчивый корпоративный имидж.',
                methodology: 'Основано на международной модели TEEB (Экономика экосистем и биоразнообразия), включая: поглощение углерода, круговорот воды и защиту биоразнообразия.'
            }
        },
        perspective: "Коммерческая перспектива",
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
      blockchain: {
        badge: "Технологии и безопасность",
        title: "Блокчейн в охране окружающей среды",
        p1: "Использование блокчейна в области социальной и экологической устойчивости раскрывает потенциал технологии для революционизации отношений между обществом и инициативами, направленными на снижение воздействия на окружающую среду.",
        p2: "Обеспечивая безопасность и отслеживаемость транзакций, он укрепляет доверие между покупателями и продавцами и открывает новые возможности для рынка. Платформа UCS опирается на безопасность регистрации в блокчейне как на одно из своих основных преимуществ, обеспечивая целостность и происхождение каждого кредита на устойчивое развитие.",
        image_alt: "Абстрактное изображение сети блокчейн"
      },
      stakeholders: {
        producers: { title: "Сельские производители", description: "Получают вознаграждение за поддержание и сохранение коренных лесов на своих землях." },
        investors: { title: "Инвесторы", description: "Приобретают кредиты, представляющие измеримые экологические выгоды." },
        institutions: { title: "Финансовые учреждения", description: "Участвуют в устойчивом и регулируемом рынке." },
        environment: { title: "Окружающая среда", description: "Выигрывает от эффективной защиты лесных экосистем." },
      },
      pillars: {
        title: "Почему UCS — это безопасная и инновационная инвестиция?",
        subtitle: "Наша методология включает в себя несколько уровней обеспечения, которые гарантируют прозрачность, безопасность и надежность каждого выпущенного кредита.",
        monitoring: { title: "Обеспечение мониторингом", details: ["Доступ к спутниковым изображениям в реальном времени"] },
        real: { title: "Реальное обеспечение", details: ["Материализуется в виде сохраненной коренной растительности"] },
        technological: { title: "Технологическое обеспечение", details: ["Регистрация в блокчейне при выводе/использовании UCS", "Регистрация происхождения UCS в блокчейне"] },
        financial: { title: "Финансовое обеспечение", details: ["Международный идентификационный код ISIN", "Регулируемый финансовый инструмент для сотрудничества на рынке капитала", "Регистрация на бразильской фондовой бирже (B3)"] },
        audit: { title: "Обеспечение независимым аудитом", details: ["Проверка независимой третьей стороной с международной репутацией", "Валидация независимой третьей стороной с международной репутацией"] },
        scientific: { title: "Научное обеспечение", details: ["Руководящие принципы МГЭИК", "Руководящие принципы ISO"] },
        technical: { title: "Техническое обеспечение", details: ["Международный лабораторный анализ", "Национальный лабораторный анализ", "Полевой анализ (27 экосистемных услуг)"] },
        legal: { title: "Юридическое обеспечение", details: ["Определение продукта", "Определение экономической деятельности", "Регистрация собственности в нотариальной конторе", "Договор о сельском партнерстве и присоединении"] },
        regulatory: { title: "Регуляторное обеспечение", details: ["Международное: Регламент ЕС 2020/852", "Глобальные соглашения: Парижское соглашение (статья 5), Монреальский протокол (биоразнообразие)", "Национальная политика по изменению климата", "Конституция Бразилии, право собственности, экологическое право", "Лесной кодекс Бразилии"] },
      },
      legal: {
        title: "Прочная и инновационная правовая основа",
        subtitle: "Кредит на устойчивое развитие UCS опирается на надежную нормативно-правовую базу, которая обеспечивает его безопасность и юридическую силу.",
        cnae: "Признает сельскую деятельность по сохранению коренных лесов.",
        law: "Устанавливает, что сельская продукция может быть создана в результате природоохранной деятельности.",
        decree: "Регулирует «Зеленый CPR», интегрируя сохранение как экономический актив.",
      },
      summary: {
        title: "Сохранение, создающее ценность",
        points: [
          'Превращает охрану окружающей среды в финансовый актив',
          'Обеспечивает полную прозрачность благодаря нескольким уровням обеспечения',
          'Гарантирует юридическую и нормативную безопасность',
          'Генерирует экономическую отдачу без ущерба для окружающей среды',
          'Объединяет производителей, инвесторов и учреждения в добродетельном цикле'
        ],
      },
      cta: {
        title: "Хотите узнать больше?",
        subtitle: "Присоединяйтесь к новой зеленой экономике, которая ценит сохраненные леса!",
        button: "Посетите BMV Digital",
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
      whatIs: {
        title: "什么是UCS？",
        description: "UCS（可持续发展信用）是一种创新的金融产品，以保护本地森林的农村活动为支持。它将环境保护转变为有形的、受法律承认的经济资产。",
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
                perspective: '突显森林资源的市场价值——森林作为生产性资产的价值。它作为许可证、特许权和可持续管理项目的基础。',
                methodology: '将美国资产评估方法与机会成本分析相结合，考虑：物种、成本和每种物种的平均价格。'
            },
            vus: {
                title: '土地转型价值 (VUS)',
                definition: '估算土地如果转为其他生产性用途（农业、工业或城市）的经济价值。它代表了土地替代用途的机会成本。',
                perspective: '展示了保护的经济成本，指出了如果保持森林完整会放弃多少利润。这对于土地规划和补偿至关重要。',
                methodology: '基于适用于土地评估的美国方法，考虑：潜在生产力、预期回报和运营成本。'
            },
            crs: {
                title: '社会环境保育价值 (CRS)',
                definition: '量化维持森林提供的生态系统服务（如气候调节、水、碳和生物多样性）所需的投资。',
                perspective: '将保护的价值转化为真正的经济资产，产生碳信用等效益，并加强可持续的企业形象。',
                methodology: '基于国际TEBB（生态系统和生物多样性经济学）模型，包括：碳封存、水循环和生物多样性保护。'
            }
        },
        perspective: "商业视角",
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
      blockchain: {
        badge: "技术与安全",
        title: "区块链在环境保护中的应用",
        p1: "在社会和环境可持续性领域使用区块链，揭示了该技术在彻底改变社会与旨在减少环境影响的举措之间关系方面的潜力。",
        p2: "通过为交易提供安全性和可追溯性，它加强了买卖双方之间的信任，并为市场开辟了新的可能性。UCS平台依靠区块链注册的安全性作为其主要优势之一，确保了每个可持续发展信用的完整性和来源。",
        image_alt: "区块链网络的抽象可视化"
      },
      stakeholders: {
        producers: { title: "农村生产者", description: "因在其土地上维护和保护本地森林而获得报酬。" },
        investors: { title: "投资者", description: "获得代表可衡量环境效益的信用。" },
        institutions: { title: "金融机构", description: "参与一个可持续且受监管的市场。" },
        environment: { title: "环境", description: "从森林生态系统的有效保护中受益。" },
      },
      pillars: {
        title: "为什么UCS是一项安全且创新的投资？",
        subtitle: "我们的方法论包含了多重支持支柱，确保了每个发行信用的透明度、安全性和可靠性。",
        monitoring: { title: "监控支持", details: ["通过实时卫星图像访问"] },
        real: { title: "实物支持", details: ["通过维护的本地植被实现有形化"] },
        technological: { title: "技术支持", details: ["UCS退役/消费时的区块链注册", "UCS来源的区块链注册"] },
        financial: { title: "金融支持", details: ["国际证券识别码（ISIN）", "用于资本市场合作的受监管金融工具", "在巴西证券交易所（B3）注册"] },
        audit: { title: "独立审计支持", details: ["由具有国际声誉的独立第三方进行验证", "由具有国际声誉的独立第三方进行确认"] },
        scientific: { title: "科学支持", details: ["IPCC（政府间气候变化专门委员会）指南", "ISO（国际标准化组织）指南"] },
        technical: { title: "技术支持", details: ["国际实验室分析", "国家实验室分析", "实地分析（27项生态系统服务）"] },
        legal: { title: "法律支持", details: ["产品定义", "经济活动定义", "在公证处进行财产登记", "农村合作与加入合同"] },
        regulatory: { title: "监管支持", details: ["国际：欧盟法规2020/852", "全球契约：《巴黎协定》（第5条）、《蒙特利尔议定书》（生物多样性）", "国家气候变化政策", "巴西宪法、财产权、环境法", "巴西森林法"] },
      },
      legal: {
        title: "坚实创新的法律支持",
        subtitle: "UCS可持续发展信用建立在健全的监管框架之上，为其提供了安全性和法律效力。",
        cnae: "承认保护本地森林的农村活动。",
        law: "规定农村产品可以通过保护活动产生。",
        decree: "规范绿色CPR，将保护整合为经济资产。",
      },
      summary: {
        title: "创造价值的保护",
        points: [
          '将环境保护转变为金融资产',
          '通过多重支持提供完全透明度',
          '保障法律和监管安全',
          '在不损害环境的情况下产生经济回报',
          '将生产者、投资者和机构连接成一个良性循环'
        ],
      },
      cta: {
        title: "有兴趣了解更多吗？",
        subtitle: "加入重视現存森林的新绿色经济！",
        button: "访问 BMV Digital",
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

export function getTranslations(language: SupportedLanguage): Translations {
  return translations[language] || translations.pt;
}
