# Configuração do Vercel para Firebase Admin SDK

## Problema
O build no Vercel pode falhar com erros como `Failed to parse private key` ou `Invalid PEM formatted message`. Isso ocorre porque as credenciais do Firebase, especialmente a chave privada com suas quebras de linha, são difíceis de serem tratadas como variáveis de ambiente padrão.

## Solução (Método Recomendado: Base64)

A solução mais robusta e à prova de falhas é codificar o **arquivo de conta de serviço JSON inteiro** em Base64. Isso transforma todo o conteúdo em uma única linha de texto, eliminando qualquer problema de formatação.

### 1. Obtenha sua Chave de Serviço Firebase
1.  Vá para o **Firebase Console**.
2.  Selecione seu projeto.
3.  Clique no ícone de engrenagem ao lado de "Visão geral do projeto" e selecione **Configurações do projeto**.
4.  Vá para a aba **Contas de serviço**.
5.  Clique em **Gerar nova chave privada** e confirme. Um arquivo JSON será baixado no seu computador.

### 2. Codifique o Arquivo JSON em Base64
1.  Abra o arquivo JSON que você baixou em um editor de texto.
2.  Copie **todo o conteúdo** do arquivo (de `{` até `}`).
3.  Vá para um codificador Base64 online, como o [Base64 Encode](https://www.base64encode.org/).
4.  Cole o conteúdo JSON completo no campo de texto e clique em **Encode**.
5.  Copie a string Base64 resultante. Será uma longa string de texto sem espaços ou quebras de linha.

### 3. Configure as Variáveis de Ambiente no Vercel
No painel do seu projeto no Vercel, vá para **Settings > Environment Variables**. Adicione as seguintes variáveis:

| Nome da Variável                    | Valor                                                | Ambiente(s) |
|-------------------------------------|------------------------------------------------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64`   | A string completa que você **codificou em Base64** na etapa 2. | Todos       |
| `GEMINI_API_KEY`                    | Sua API Key do Gemini (Google AI Studio).            | Todos       |

**Atenção:** Você só precisa de `FIREBASE_SERVICE_ACCOUNT_BASE64`. Não adicione `FIREBASE_PROJECT_ID` ou `FIREBASE_CLIENT_EMAIL` separadamente, pois elas já estão incluídas no JSON codificado.

### 4. Verifique a Configuração
1.  Após configurar as variáveis, acione um novo deploy no Vercel.
2.  Verifique se o build é concluído sem erros relacionados ao Firebase.
3.  Teste as funcionalidades da aplicação que dependem do acesso ao banco de dados ou autenticação no servidor.