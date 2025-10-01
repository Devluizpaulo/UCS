# Guia da Ferramenta de Auditoria e Recálculo

Este documento detalha o funcionamento da página de **Auditoria** (`/admin/audit`) e a lógica por trás do recálculo em cascata dos índices da plataforma.

## 1. Visão Geral da Página de Auditoria

A página de Auditoria é uma ferramenta administrativa essencial projetada para garantir a integridade e a precisão dos dados históricos. Ela permite que um administrador:

1.  **Navegue para qualquer data passada** usando o seletor de data.
2.  **Visualize todos os valores** de ativos registrados para aquele dia específico.
3.  **Diferencie** claramente entre ativos `COTADO` (valores base, de mercado) e `CALCULADO` (índices derivados de fórmulas).
4.  **Edite o valor de qualquer ativo `COTADO`**. Isso é útil para corrigir erros de importação ou dados de mercado incorretos.
5.  **Verifique a fonte da cotação**, clicando no ícone de link externo (`ExternalLink`) ao lado dos ativos cotados.
6.  **Acione um recálculo em cascata** para a data selecionada, garantindo que a correção de um valor base se propague por todos os índices dependentes.

### Fluxo de Uso

1.  Selecione a data que deseja auditar.
2.  Identifique um ativo `COTADO` (ex: Dólar) cujo valor parece incorreto.
3.  Clique no botão "Editar" (`Edit`) na linha do ativo.
4.  Insira o novo valor correto no modal. A linha na tabela ficará destacada.
5.  Repita para outros ativos cotados, se necessário.
6.  Clique no botão **"Salvar e Recalcular"**.
7.  Confirme a ação no diálogo de alerta.
8.  O sistema irá então executar o recálculo em cascata (detalhado abaixo) e salvará os novos valores para todos os ativos no banco de dados para aquela data. A página será atualizada com os novos dados.

---

## 2. Hierarquia e Dependências de Cálculo

O motor de recálculo (`recalculation-service.ts`) segue uma ordem estrita de dependências para garantir a precisão. A edição de um ativo `COTADO` no topo da cadeia afeta todos os níveis subsequentes.

### Nível 1: Ativos Base (Cotados)

Estes são os valores de entrada, normalmente obtidos de fontes de mercado externas (como o `investing.com`). São os únicos que podem ser editados manualmente na página de Auditoria.

-   **`soja`** (Soja Futuros, em USD)
-   **`milho`** (Milho Futuros, em BRL)
-   **`boi_gordo`** (Boi Gordo Futuros, em BRL)
-   **`madeira`** (Madeira Serrada Futuros, em USD)
-   **`carbono`** (Crédito de Carbono Futuros, em EUR)
-   **`usd`** (Dólar, em BRL)
-   **`eur`** (Euro, em BRL)
-   **`Agua_CRS`** (Valor da Água, tratado como valor base em BRL)

### Nível 2: Rentabilidades Médias (Cálculos Intermediários)

O sistema primeiro calcula a "rentabilidade média" para os ativos agrícolas e ambientais, convertendo-os para uma base comparável em BRL por hectare.

-   **`rent_media_soja`**
    -   Depende de: **`soja`** e **`usd`**.
-   **`rent_media_milho`**
    -   Depende de: **`milho`**.
-   **`rent_media_boi`**
    -   Depende de: **`boi_gordo`**.
-   **`rent_media_madeira`**
    -   Depende de: **`madeira`** e **`usd`**.
-   **`rent_media_carbono`**
    -   Depende de: **`carbono`** e **`eur`**.

### Nível 3: Índices de Composição (VUS, VMAD, CRS)

Estes são os primeiros índices calculados, agrupando as rentabilidades médias.

-   **`vus`** (Valor de Uso do Solo)
    -   Depende de: `rent_media_soja`, `rent_media_milho`, `rent_media_boi`.
-   **`vmad`** (Valor da Madeira)
    -   Depende de: `rent_media_madeira`.
-   **`carbono_crs`** (Custo de Responsabilidade Socioambiental - Carbono)
    -   Depende de: `rent_media_carbono`.

### Nível 4: Índice Agregador Principal

Este índice soma os valores do Nível 3 e o valor base da água.

-   **`valor_uso_solo`**
    -   Depende de: **`vus`**, **`vmad`**, **`carbono_crs`**, **`Agua_CRS`**.

### Nível 5 e 6: Índices Finais (PDM, UCS, UCS ASE)

Estes são os índices finais da plataforma, calculados em uma sequência linear.

-   **`pdm`** (Potencial Desflorestador Monetizado)
    -   Depende de: **`valor_uso_solo`**.
    -   *Observação: A fórmula atual simplifica o PDM como sendo diretamente proporcional ao `valor_uso_solo`.*

-   **`ucs`** (Unidade de Crédito de Sustentabilidade)
    -   Depende de: **`pdm`**.

-   **`ucs_ase`** (Índice Principal)
    -   Depende de: **`ucs`**.

### Resumo da Cascata

Editar **`usd`** `=>` afeta `rent_media_soja` e `rent_media_madeira` `=>` afeta `vus` e `vmad` `=>` afeta `valor_uso_solo` `=>` afeta `pdm` `=>` afeta `ucs` `=>` afeta `ucs_ase`.

Essa estrutura garante que qualquer ajuste em um dado de entrada fundamental seja refletido de forma consistente e precisa em todo o ecossistema de índices da plataforma para a data selecionada.
