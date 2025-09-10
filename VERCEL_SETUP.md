# Configuração do Vercel para Firebase Admin SDK

## Problema
O build no Vercel pode falhar com erros relacionados à inicialização do Firebase Admin SDK, como `Failed to parse private key` ou `Invalid PEM formatted message`. Isso ocorre porque a variável de ambiente para a chave privada (`FIREBASE_PRIVATE_KEY`) contém quebras de linha, que não são bem tratadas pela Vercel.

## Solução (Método Recomendado: Base64)

A solução mais robusta é codificar a chave privada em Base64. Isso a transforma em uma única linha de texto, eliminando qualquer problema de formatação.

### 1. Obtenha sua Chave de Serviço Firebase
1.  Vá para o **Firebase Console**.
2.  Selecione seu projeto.
3.  Clique no ícone de engrenagem ao lado de "Visão geral do projeto" e selecione **Configurações do projeto**.
4.  Vá para a aba **Contas de serviço**.
5.  Clique em **Gerar nova chave privada** e confirme. Um arquivo JSON será baixado.

### 2. Codifique a Chave Privada em Base64
1.  Abra o arquivo JSON que você baixou.
2.  Copie **apenas o valor** da propriedade `"private_key"`. O valor começa com `-----BEGIN PRIVATE KEY-----` e termina com `-----END PRIVATE KEY-----\n`.
3.  Vá para um codificador Base64 online, como o [Base64 Encode](https://www.base64encode.org/).
4.  Cole a chave privada no campo de texto e clique em **Encode**.
5.  Copie a string Base64 resultante. Será uma longa string de texto sem espaços ou quebras de linha.

### 3. Configure as Variáveis de Ambiente no Vercel
No painel do seu projeto no Vercel, vá para **Settings > Environment Variables**. Adicione as seguintes variáveis, copiando os valores do seu arquivo JSON e do codificador Base64:

| Nome da Variável | Valor | Ambiente(s) |
|---|---|---|
| `FIREBASE_PROJECT_ID` | O valor de `project_id` do seu arquivo JSON | Todos |
| `FIREBASE_CLIENT_EMAIL` | O valor de `client_email` do seu arquivo JSON | Todos |
| `FIREBASE_PRIVATE_KEY_BASE64` | A chave privada que você **codificou em Base64** na etapa 2 | Todos |
| `GEMINI_API_KEY` | Sua API Key do Gemini | Todos |

### 4. Verifique a Configuração
1.  Após configurar as variáveis, acione um novo deploy no Vercel.
2.  Verifique se o build é concluído sem erros relacionados ao Firebase.
3.  Teste as funcionalidades da aplicação que dependem do acesso ao banco de dados ou autenticação no servidor.

### 5. Segurança
- Nunca commite seu arquivo de chave privada (o `.json`) ou seu arquivo `.env.local` no repositório Git.
- Mantenha suas chaves seguras e rotacione-as periodicamente.
