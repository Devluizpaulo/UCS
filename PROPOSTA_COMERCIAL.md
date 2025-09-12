# PROPOSTA TÉCNICA E COMERCIAL

**De:** Luiz Paulo Gonçalves Miguel de Jesus
**Para:** BVM.Global
**Data:** 18 de Julho de 2024
**Proposta Nº:** 2024-07-002
**Validade:** 15 dias

---

## 1. Objeto

Esta proposta detalha o escopo técnico e o investimento para o desenvolvimento completo da plataforma de Business Intelligence **"Monitor do Índice UCS"**. O objetivo é criar uma solução de software moderna, robusta e escalável para o cálculo, monitoramento, análise e geração de relatórios relacionados ao Índice de Unidade de Conservação Sustentável (UCS), substituindo processos manuais e fornecendo inteligência de negócio em tempo real.

## 2. Escopo Técnico do Projeto

A solução será desenvolvida e entregue contemplando as seguintes funcionalidades:

| Módulo | Funcionalidade Detalhada |
| :--- | :--- |
| **Dashboard Principal** | • Visualização em tempo real do Índice UCS.<br>• Gráfico interativo com a evolução histórica do índice.<br>• Tabela com as cotações dos ativos subjacentes e suas variações. |
| **Análise Estratégica** | • **Tendências:** Análise de performance em janelas de tempo (diário, semanal, anual).<br>• **Risco:** Cálculo de volatilidade e correlação de cada ativo com o índice.<br>• **Cenários:** Ferramenta para simular o impacto de mudanças no preço de ativos. |
| **Relatórios com IA** | • Geração de relatórios em PDF e Excel (XLSX).<br>• **Análise Executiva Automatizada:** Geração de texto por IA para sumarizar a performance, fatores de influência e cenário geral.<br>• Pré-visualização e compartilhamento nativo dos relatórios. |
| **Gestão e Segurança** | • Sistema de autenticação seguro por e-mail e senha.<br>• **Painel de Admin:** Gerenciamento completo de usuários (criar, listar, editar, ativar/desativar).<br>• **Fluxo de Primeiro Login:** Troca obrigatória de senha temporária. |
| **Configuração** | • **Gestão da Fórmula:** Interface para ajustar todos os pesos e fatores da fórmula do índice.<br>• **Gestão de Ativos:** Interface para adicionar, editar e remover as commodities que compõem o índice. |

---

## 3. Serviços Adicionais: Automação de Coleta de Dados (n8n)

Para garantir a autonomia e a precisão dos dados, será construída uma automação utilizando a plataforma **n8n**.

- **Objetivo:** Desenvolver um fluxo de trabalho (*workflow*) que realizará a coleta (*web scraping*) das cotações diárias das seguintes fontes:
    - **Moedas:** USD/BRL e EUR/BRL (Investing.com)
    - **Commodities:** Boi Gordo, Soja, Milho, Madeira Serrada e Crédito de Carbono (Investing.com)
- **Processo:** A automação buscará os dados históricos de fechamento, aplicará as conversões necessárias (ex: Madeira Serrada para Tora) e salvará as informações de forma estruturada no banco de dados Firebase.
- **Resultado:** O sistema será alimentado com dados atualizados e confiáveis, permitindo a aplicação correta das fórmulas em tempo real.

---

## 4. Inovações e Potencial Futuro

O projeto se destaca pela aplicação de tecnologias de ponta e por sua arquitetura escalável:

- **Inteligência Artificial:** O uso da IA do Google (via Genkit) para gerar análises executivas em relatórios transforma dados brutos em insights estratégicos, agregando um valor imenso ao produto final.
- **Arquitetura Moderna:** Construído com Next.js, React e Firebase, o sistema é performático, seguro e pronto para a nuvem.
- **Potencial de Expansão:** A plataforma foi projetada para evoluir. Futuramente, podem ser adicionados novos módulos, como alertas avançados, integração com outras fontes de dados, análises preditivas com IA e um portal para clientes.

## 5. Tecnologia Empregada

- **Frontend:** Next.js (App Router), React, TypeScript, ShadCN UI, Tailwind CSS.
- **Backend & IA:** Genkit (Google AI), Firebase (Authentication, Firestore).
- **Automação de Dados:** n8n.

## 6. Prazo de Entrega

O prazo para a conclusão e entrega de todas as funcionalidades descritas, incluindo a automação com n8n, é **20 de setembro de 2024**.

## 7. Investimento

O valor total para o desenvolvimento completo, entrega e implantação do projeto, conforme escopo detalhado acima, é de:

**Valor Total: R$ 3.000,00 (Três mil reais)**

## 8. Condições de Pagamento

- **50% na aprovação da proposta:** R$ 1.500,00
- **50% na entrega final do projeto:** R$ 1.500,00

O pagamento poderá ser realizado via transferência bancária (PIX ou TED). Os dados serão fornecidos mediante aprovação desta proposta.

## 9. Aprovação

Agradeço a oportunidade e a confiança depositada. Para aprovação, favor assinar abaixo.

<br><br>

_______________________________________
**Luiz Paulo Gonçalves Miguel de Jesus**

<br><br>

_______________________________________
**BVM.Global (Contratante)**
