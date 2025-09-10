# Configuração do Vercel para Firebase Admin SDK

## Problema
O build no Vercel pode falhar com erros relacionados à inicialização do Firebase Admin SDK, como `Failed to parse FIREBASE_SERVICE_ACCOUNT` ou `Could not refresh access token`. Isso ocorre porque o Vercel não lida bem com variáveis de ambiente JSON de múltiplas linhas.

## Solução (Método Recomendado)

A solução mais robusta é usar variáveis de ambiente individuais para cada parte da sua chave de serviço do Firebase.

### 1. Obtenha sua Chave de Serviço Firebase
1.  Vá para o **Firebase Console**.
2.  Selecione seu projeto.
3.  Clique no ícone de engrenagem ao lado de "Visão geral do projeto" e selecione **Configurações do projeto**.
4.  Vá para a aba **Contas de serviço**.
5.  Clique em **Gerar nova chave privada** e confirme. Um arquivo JSON será baixado.

### 2. Configure as Variáveis de Ambiente no Vercel
No painel do seu projeto no Vercel, vá para **Settings > Environment Variables**. Adicione as seguintes variáveis, copiando os valores do seu arquivo JSON:

| Nome da Variável | Valor do JSON | Ambiente(s) |
|---|---|---|
| `FIREBASE_PROJECT_ID` | `project_id` | Todos |
| `FIREBASE_CLIENT_EMAIL` | `client_email` | Todos |
| `FIREBASE_PRIVATE_KEY` | `private_key` | Todos |
| `GEMINI_API_KEY` | `Sua_API_Key_do_Gemini` | Todos |


**IMPORTANTE para `FIREBASE_PRIVATE_KEY`:**
Copie o valor completo da chave privada, incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`. O Vercel irá formatar a string em uma única linha, substituindo as quebras de linha por `\n`. **Isso é esperado**, e o código da aplicação está preparado para lidar com isso. Não tente remover as quebras de linha manualmente.

### 3. Verifique a Configuração
1.  Após configurar as variáveis, acione um novo deploy no Vercel.
2.  Verifique se o build é concluído sem erros relacionados ao Firebase.
3.  Teste as funcionalidades da aplicação que dependem do acesso ao banco de dados ou autenticação no servidor.

### 4. Segurança
- Nunca commite seu arquivo de chave privada (o `.json`) ou seu arquivo `.env.local` no repositório Git.
- Use um arquivo `.env.example` como template para outros desenvolvedores.
- Mantenha suas chaves seguras e rotacione-as periodicamente.
