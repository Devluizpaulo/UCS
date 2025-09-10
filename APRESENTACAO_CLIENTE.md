
# Apresentação do Projeto: Monitor do Índice UCS

## 1. Visão Geral e Objetivo do Projeto

O **Monitor do Índice UCS** é uma plataforma de software robusta e especializada, concebida como uma ferramenta de *business intelligence* para o setor agroambiental e financeiro. O seu principal objetivo é fornecer uma visão clara, unificada e em tempo real sobre a performance econômica de ativos ambientais e agrícolas, consolidada no "Índice de Unidade de Conservação Sustentável" (UCS).

A plataforma foi projetada para atender a três públicos principais:
- **Gestores e Diretores:** Para tomada de decisão estratégica baseada em dados consolidados e tendências de mercado.
- **Analistas Financeiros:** Para análises aprofundadas de risco, correlação e projeção de cenários.
- **Produtores Rurais e Investidores:** Para compreender o valor intrínseco de seus ativos e o impacto de variáveis de mercado sobre eles.

Em suma, o projeto transforma dados brutos de commodities e parâmetros complexos de sustentabilidade em inteligência acionável.

---

## 2. Funcionalidades Implementadas e Entregues

A versão atual da plataforma conta com um conjunto completo de funcionalidades prontas para uso, oferecendo uma experiência de ponta a ponta para o monitoramento e análise do Índice UCS.

### a. Dashboard Principal (Painel)
O coração da plataforma. Oferece uma visão imediata e consolidada dos indicadores mais importantes.
- **Visualização do Índice UCS:** Exibe o valor atual do índice, calculado em tempo real com base nos dados mais recentes.
- **Gráfico de Tendência:** Um gráfico interativo mostra a evolução do índice, permitindo uma análise visual rápida de sua performance.
- **Tabela de Ativos Subjacentes:** Lista todas as commodities que compõem o índice (Dólar, Euro, Soja, Milho, etc.), com seus preços atuais e a variação das últimas 24 horas. Clicar em um ativo abre um modal com detalhes históricos.

### b. Análise Estratégica
Uma seção dedicada a análises mais profundas, dividida em três ferramentas poderosas:
- **Tendências de Mercado:** Permite analisar a performance histórica do índice em diferentes janelas de tempo (diário, semanal, anual), ajudando a identificar padrões e sazonalidades.
- **Análise de Risco:** Calcula e exibe a volatilidade de cada ativo e sua correlação com o Índice UCS, fornecendo insights cruciais sobre quais ativos mais influenciam o índice e quais são mais instáveis.
- **Análise de Cenários:** Uma ferramenta de simulação que permite ao usuário projetar o impacto de mudanças no preço de um ativo sobre o valor final do índice. Por exemplo, é possível responder à pergunta: "O que aconteceria com o índice se o preço da soja subisse 10%?".

### c. Calculadora UCS
Uma ferramenta transparente que permite ao usuário calcular manualmente o valor da Unidade de Crédito de Sustentabilidade (UCS), inserindo ou ajustando todos os parâmetros da fórmula oficial, desde cotações de commodities até produtividades e fatores de conversão.

### d. Geração de Relatórios com IA
Funcionalidade avançada para exportar os dados da plataforma em formatos profissionais, enriquecidos com análises geradas por Inteligência Artificial.
- **Exportação Flexível:** Permite gerar relatórios em PDF ou Excel (XLSX).
- **Análise Executiva Automatizada:** A IA gera um texto coeso e profissional em português, analisando a performance do período, os principais fatores de influência e o cenário geral, com base nos dados e em observações fornecidas pelo usuário.
- **Pré-visualização e Compartilhamento:** Antes de baixar, o usuário pode pré-visualizar o relatório completo e, em seguida, fazer o download ou usar a função de compartilhamento nativo do sistema operacional para enviá-lo por e-mail, WhatsApp, etc.

### e. Gestão de Usuários e Perfis
Sistema completo para administração da plataforma e personalização da experiência do usuário.
- **Autenticação Segura:** Sistema de login robusto com e-mail e senha.
- **Gerenciamento de Usuários (Painel Admin):** Uma área restrita para administradores, onde é possível criar, visualizar e (futuramente) editar/remover usuários do sistema, além de atribuir funções (Admin/Usuário).
- **Fluxo de Primeiro Login:** Um novo usuário recebe uma senha temporária e é obrigado a criar uma senha definitiva e segura no primeiro acesso, garantindo a segurança da conta.
- **Gestão de Perfil:** Cada usuário pode atualizar suas informações pessoais, como nome, telefone, e alterar sua própria senha.

### f. Configurações do Sistema (Painel Admin)
Área central para o administrador ajustar o comportamento de todo o sistema.
- **Gestão da Fórmula do Índice:** Interface completa para ajustar todos os parâmetros, pesos e fatores que compõem a fórmula de cálculo do UCS. Qualquer alteração aqui é refletida em tempo real nos cálculos de toda a plataforma.
- **Gestão dos Ativos do Índice:** Interface para adicionar, editar ou remover as commodities que servem como fonte de dados para o cálculo do índice.
- **Sistema de Conversão de Moedas:** Uma tela que demonstra e permite testar a conversão de preços entre BRL, USD e EUR, utilizando as taxas de câmbio atuais.

---

## 3. Funcionalidades Pendentes (Próximos Passos)

As funcionalidades abaixo foram contempladas na visão original do projeto, mas sua implementação ainda não foi concluída.

### a. Alertas de Preço por E-mail
- **O que falta:** A interface para configurar os alertas está pronta e funcional, mas a lógica de backend para monitorar os preços e disparar os e-mails ainda precisa ser implementada. Atualmente, os alertas são apenas salvos no estado local do navegador.

### b. Coleta de Dados Automatizada (Cron Job)
- **O que falta:** A plataforma está estruturada para receber dados de preços de uma fonte externa (n8n). No entanto, o processo de automação que busca esses dados periodicamente (o "cron job") ainda não foi implementado. Atualmente, os dados são carregados a partir de um conjunto de teste ou dependem de uma inserção manual no banco de dados. A implementação do cron job garantirá que os preços estejam sempre atualizados sem intervenção humana.

### c. Edição e Exclusão de Usuários
- **O que falta:** Na tela de "Gerenciamento de Usuários", a funcionalidade de criar e listar usuários está 100% funcional. No entanto, as ações de **editar** as informações de um usuário existente e **excluir** um usuário ainda não foram implementadas no backend.
