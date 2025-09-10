# Configuração do Vercel para Firebase Admin SDK

## Problema
O build no Vercel pode falhar com erros relacionados à inicialização do Firebase Admin SDK, como `Failed to parse FIREBASE_SERVICE_ACCOUNT`, `Could not refresh access token` ou `Invalid PEM formatted message`. Isso ocorre porque o Vercel não lida bem com variáveis de ambiente JSON de múltiplas linhas e, às vezes, formata mal as chaves.

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
1.  **Copie o valor completo** da chave privada, incluindo `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`.
2.  **Cole o valor no Vercel.** O Vercel pode formatar a string em uma única linha, substituindo as quebras de linha por `\n`. **Isso é esperado**, e o código da aplicação está preparado para lidar com isso.
3.  **Verifique se não há aspas extras.** Ocasionalmente, ao colar, aspas (`"`) podem ser adicionadas no início e no fim do valor. Remova-as se aparecerem.

### 3. Verifique a Configuração
1.  Após configurar as variáveis, acione um novo deploy no Vercel.
2.  Verifique se o build é concluído sem erros relacionados ao Firebase.
3.  Teste as funcionalidades da aplicação que dependem do acesso ao banco de dados ou autenticação no servidor.

### 4. Segurança
- Nunca commite seu arquivo de chave privada (o `.json`) ou seu arquivo `.env.local` no repositório Git.
- Use um arquivo `.env.example` como template para outros desenvolvedores.
- Mantenha suas chaves seguras e rotacione-as periodicamente.
