# Guia da Camada de Abstração de Dados

Este documento detalha a estratégia de design por trás da camada de abstração de dados da aplicação, implementada principalmente no arquivo `src/lib/data-service.ts`.

## 1. O Problema: Acoplamento ao Banco de Dados

Em muitas aplicações, a lógica para acessar o banco de dados (queries, conexões, etc.) é espalhada por vários componentes, rotas de API e páginas. Por exemplo, um componente de gráfico pode conter código para se conectar diretamente ao Firestore e buscar seus próprios dados.

Isso cria um **forte acoplamento** entre a aplicação e a tecnologia de banco de dados específica (neste caso, o Firestore).

**As desvantagens dessa abordagem são:**
- **Difícil Manutenção:** Se a estrutura de uma coleção no Firestore mudar, é preciso "caçar" e atualizar todas as partes do código que a acessam.
- **Migração Quase Impossível:** Mudar de banco de dados (ex: do Firestore para o PostgreSQL) se torna uma tarefa monumental, pois exigiria reescrever a lógica de acesso a dados em dezenas ou centenas de arquivos.
- **Inconsistência:** Diferentes partes da aplicação podem implementar a mesma lógica de busca de maneiras ligeiramente diferentes, levando a inconsistências e bugs.
- **Dificuldade em Testar:** Testar componentes de UI se torna mais difícil, pois eles têm uma dependência direta e real do banco de dados.

## 2. A Solução: O Padrão de Repositório (Abstraído)

Para resolver esses problemas, implementamos uma forma do **Padrão de Repositório**. A ideia é simples:

> **Toda a lógica de acesso ao banco de dados é centralizada em um único local: o `data-service.ts`.**

Este arquivo atua como o **único intermediário** entre a aplicação e o banco de dados.

- **O Contrato:** O `data-service.ts` exporta um conjunto de funções com nomes claros e objetivos, como `getCommodityPrices()`, `getCotacoesHistorico(assetId, days)`, `saveCommodityConfig(id, config)`. Este conjunto de funções é o **"contrato"** que o serviço oferece ao resto da aplicação.

- **A Implementação:** Dentro de cada uma dessas funções está a lógica específica do Firestore para cumprir o que o "contrato" promete (ex: `db.collection(...).where(...).get()`).

- **Os Consumidores:** Componentes React, páginas do Next.js e fluxos de IA nunca importam o `db` do Firebase diretamente. Eles importam e chamam as funções do `data-service.ts`. Eles não sabem (e não precisam saber) se os dados vêm do Firestore, de um cache, de um arquivo local ou de outro banco de dados.

## 3. Benefícios e Exemplo de Migração Futura

### Benefícios
- **Desacoplamento:** A lógica de negócio está separada da lógica de persistência.
- **Ponto Único de Modificação:** Se precisarmos otimizar uma query ou adaptar a uma mudança no schema do Firestore, só precisamos alterar um único arquivo.
- **Facilidade de Cache:** Como todos os dados passam pelo `data-service`, foi fácil implementar uma camada de cache (`cache-service.ts`) para melhorar a performance.
- **Facilidade de Migração:** Este é o benefício mais significativo para o futuro.

### Exemplo: Migrando do Firestore para PostgreSQL

Suponha que no futuro a decisão seja migrar para um banco de dados SQL como o PostgreSQL.

**O plano seria o seguinte:**

1.  **Não tocar na UI:** Nenhuma alteração seria necessária em `src/app`, `src/components`, ou `src/ai`.
2.  **Criar um Novo Serviço:** Criar um novo arquivo, talvez `src/lib/data-service-postgres.ts`.
3.  **Reimplementar as Funções:** Dentro deste novo arquivo, a equipe de backend reimplementaria cada função do "contrato", mas usando um cliente SQL (como o `node-postgres` ou um ORM como o Prisma).

    ```typescript
    // Exemplo de reimplementação em data-service-postgres.ts
    
    import { pool } from './postgres-config'; // Configuração da conexão com o Postgres
    
    export async function getCommodityPrices(): Promise<CommodityPriceData[]> {
      // A lógica aqui usaria SQL em vez de Firestore
      const query = `
        SELECT DISTINCT ON (c.asset_id) 
               c.asset_id as id, c.name, c.currency, c.category, c.description, c.unit,
               q.price, q.change, q.absolute_change, q.last_updated
        FROM commodities c
        JOIN quotes q ON c.asset_id = q.asset_id
        ORDER BY c.asset_id, q.timestamp DESC;
      `;
      const result = await pool.query(query);
      return result.rows; // Retorna os dados no formato esperado (CommodityPriceData[])
    }

    // ... reimplementar todas as outras funções (getCotacoesHistorico, etc.)
    ```
4.  **Substituir:** Por fim, o `data-service.ts` atual poderia ser renomeado para `data-service-firestore.ts` e o novo `data-service-postgres.ts` seria renomeado para `data-service.ts`.

Como o nome do arquivo e as funções exportadas permanecem os mesmos, a aplicação inteira começaria a usar o PostgreSQL sem que nenhum componente precisasse ser alterado. O esforço fica 100% contido na camada de acesso a dados.

Esta abordagem garante que a aplicação seja robusta, manutenível e preparada para evoluir tecnologicamente no futuro.
