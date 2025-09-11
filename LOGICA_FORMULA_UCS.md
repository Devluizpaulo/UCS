# Lógica da Fórmula UCS - Unidade de Crédito de Sustentabilidade

## Visão Geral

O Índice UCS (Unidade de Crédito de Sustentabilidade) é calculado através de uma metodologia que combina três componentes principais: vMAD (Valor da Madeira), vUS (Valor de uso do solo) e cRS (custo da Responsabilidade socioambiental).

## Símbolos Matemáticos Utilizados

- **Σ** = Símbolo de somatório (soma de todos os elementos)
- **Δ** = Delta, representa variação ou diferença
- **×** = Multiplicação
- **Fm3** = Fator de produtividade da madeira em m³
- **Pm3mad** = Preço da madeira por m³
- **FPcn** = Fator de Ponderação da commodity n
- **Pmed** = Produção média por hectare
- **Ccn** = Cotação do produto no mercado
- **FAmed** = Fator de Arrendamento médio
- **CCc** = Cotação de Crédito de Carbono
- **ΔtCO2(n)** = Variação de tCO2 por hectare
- **FCH2O** = Fator de Conversão da água

## Fórmula Principal

```
UCS = FATOR_UCS × IVP
```

Onde:
- **IVP** = Índice de Viabilidade de Projeto = (PDM / CE) / 2
- **PDM** = Potencial Desflorestador Monetizado = vMAD + vUS + cRS
- **CE** = Carbono Estocado em equivalência à tCO2 = produtividade_carbono × area_total

## Componentes Detalhados

### 1. vMAD (Valor da Madeira)
```
vMAD = Fm3 × Pm3mad
```

**Onde:**
- **Fm3** = Produtividade da madeira (m³/ha) × área_total
- **Pm3mad** = Preço da madeira por m³

**Fórmula expandida:**
```
vMAD = produtividade_madeira × preço_madeira_m3 × area_total
```

**Parâmetros:**
- `produtividade_madeira`: 120 m³/ha (padrão)
- `preço_madeira_m3`: Cotação atual da madeira em USD (obtida do CME)
- `area_total`: 1197 ha (padrão)

### 2. vUS (Valor de uso do solo)
```
vUS = Σ (FPcn × Pmed × Ccn) × FAmed
```

**Onde:**
- **Σ** = Somatório das commodities (Pecuária, Milho, Soja)
- **FPcn** = Fator de Ponderação da commodity n
- **Pmed** = Produção média por hectare das principais commodities
- **Ccn** = Cotação do Produto no mercado
- **FAmed** = Fator de Arrendamento médio = 4,8%

**Detalhamento do somatório:**
- `Renda_Pecuária = fator_pecuaria × produtividade_boi × preço_boi × area_total`
- `Renda_Milho = fator_milho × produtividade_milho × preço_milho × area_total`
- `Renda_Soja = fator_soja × produtividade_soja × preço_soja × area_total`
- `vUS = (Renda_Pecuária + Renda_Milho + Renda_Soja) × FATOR_ARREND`

**Parâmetros:**
- Produtividades médias por hectare (Pmed): Boi (18), Milho (7.2), Soja (3.3)
- Fatores de Ponderação (FP): Pecuária (0.35), Milho (0.30), Soja (0.35)
- `Famed` (Fator de Arrendamento médio): 0.048 (4,8%)

### 3. cRS (custo da Responsabilidade socioambiental)
```
cRS = CC + cH2O
```

**Onde:**
- **CC** = Crédito de Carbono
- **cH2O** = Custo da Água

**Componentes detalhados:**

#### CC (Crédito de Carbono)
```
CC = CCc × ΔtCO2(n)
```
- **CCc** = Cotação de Crédito de Carbono Futuro
- **ΔtCO2(n)** = 2,59 Unidades de tCO2 por Hectare

#### cH2O (Crédito de Água)
```
cH2O = FCH2O
```
- **FCH2O** = Fator de Conversão da água
- **FCH2O** = 7% do PIB por Hectare (Uso da Terra)

**Fórmulas expandidas:**
```
CC = CCc × 2,59 × area_total
cH2O = (pib_por_hectare × 0,07) × area_total
```

## Fontes de Dados

### Cotações Dinâmicas
- **USD/BRL e EUR/BRL**: Taxas de câmbio
- **Madeira**: Preço em USD do CME (Chicago Mercantile Exchange)
- **Boi**: Preço da arroba em BRL
- **Milho**: Preço da saca em BRL
- **Soja**: Preço da saca em USD
- **Crédito de Carbono**: Preço em EUR

### Parâmetros Configuráveis
Todos os fatores e produtividades podem ser ajustados através da interface de configuração do sistema, permitindo calibração da fórmula conforme necessário.

## Validação e Precisão

O sistema inclui:
- Validação de inputs (valores não negativos, campos obrigatórios)
- Verificação de dados finitos
- Comparação com dados de referência
- Cálculo de precisão e sugestões de ajuste

## Fluxo de Cálculo

1. **Obtenção de Cotações**: Sistema busca preços atuais das commodities
2. **Conversão de Moedas**: Converte preços para BRL quando necessário
3. **Cálculo dos Componentes**: vMAD, vUS e cRS são calculados separadamente
4. **Cálculo do PDM**: Soma dos três componentes (vMAD + vUS + cRS)
5. **Cálculo do IVP**: PDM dividido pelo carbono estocado, dividido por 2
6. **Cálculo Final do UCS**: IVP multiplicado pelo fator UCS

## Exemplo de Resultado

O sistema retorna:
- Valor final do UCS
- Valores individuais de vMAD, vUS e cRS
- Detalhamento do vUS (pecuária, milho, soja)
- Detalhamento do cRS (CC e cH2O)
- Status de configuração
- Dados de validação

Esta metodologia permite uma avaliação econômica integrada que considera tanto o potencial produtivo da terra quanto os custos ambientais e sociais associados.