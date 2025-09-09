# Configuração do Vercel para Firebase Admin SDK

## Problema
O build no Vercel está falhando com o erro:
```
Missing required environment variables: FIREBASE_SERVICE_ACCOUNT
```

## Solução

### 1. Configurar Variáveis de Ambiente no Vercel

No painel do Vercel:
1. Acesse seu projeto
2. Vá em **Settings** > **Environment Variables**
3. Adicione as seguintes variáveis:

| Nome da Variável | Valor | Ambiente |
|------------------|-------|----------|
| `FIREBASE_PROJECT_ID` | `ucs-index-tracker` | Production, Preview, Development |
| `FIREBASE_PRIVATE_KEY_ID` | `d2e2667336d2d393f352a172dce9c9087a796133` | Production, Preview, Development |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@ucs-index-tracker.iam.gserviceaccount.com` | Production, Preview, Development |
| `FIREBASE_SERVICE_ACCOUNT` | (ver abaixo) | Production, Preview, Development |
| `GEMINI_API_KEY` | `AIzaSyB1X6iG_PZoXbdp7JlMawalLjteFq9RF90` | Production, Preview, Development |

### 2. Configurar FIREBASE_SERVICE_ACCOUNT

Para a variável `FIREBASE_SERVICE_ACCOUNT`, use o valor completo da chave privada:

```
-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDgC/C8bdOnygqO
vvZLZDcia341ltxsl7aRvjbC5TgJo7JVhW9y8Q562MZtztr8zUiWpB1mJB7WFjfr
pDk3KPdI5HSoZXtCAURE0PYRy1xOV7e+8jl/gzfINMN3dShqXbvZamQdNSqBzuBK
8dhbpV5TgceJMfvW8kpTn8Vhe+qVdDRTMujkuQdb0KH/sPzOfeLxB44WN1b5m5Iv
ca+YW2arU5YtPJv8TtYdXyYJlubi28kfGdqmWjTy3jUKd99LoOb6c+Z/j9+MQaHe
7EUZJh9MpIWiTsBdHWG8lJRqF2r9GtvVSTJ4/7pLRCXj2jqbAm9nB5GFmrdOw1TH
4GtGONVJAgMBAAECggEANf6irqKwROp0B2ldvZciE3VA9iTMrA4XFYI4O9mWmvoc
vzAYhySxpukJz0pwK8dEdGuKW0Seut0hbnSGRnUkvWgzdib44NQh0gzjFLBEJ2xL
7+R7929V+PXAWtB9JD9BR5k0lfZrb1u+YcltqU6OEEWBY17MsQV05LjnToJY61nh
wPjJo8aOCpehS5YnSsouZ80PHPi/xtomKhZUoziUXOJxZxehBoxNPgg1ClNBHoOl
XVC8ILaoXAW0zoIpeMcmI8XBz/Uz5B3Y/Q0oATX2eTGDOAC6GXdq4Uj0EUzIkRpc
vEEMOFnev9KrQkeKyFojMGSfCCd7GI9vR2lQKLKq5QKBgQD5IFwB1L4n2WtKFnMl
8zye5CBlNu1yyqu5Dlt3LIRLMHHI8qOzUshcJNiQX3w76SijcUysR+O+4yicLdYB
9rq5pywSx5ko0eCQ5FcKlvZwQYHx5hCz8OZLwaMsfHtBXbclEZpxQerixwWMtdJ2
t2YmGerizWsulz7LV5pzbXsWPQKBgQDmOm++Am49U06/IpFLXh04GuZHFpolvJiC
PoJdCxnMtBz0KCv+j5xejIBcArPpUA3TxCSosNh22kgApigAduHXtrJX6TyzPwRZ
LUfR+n1kYHf39LJ8/LR3+ijadPX+9Kzkv/dghXfNAZ9Cky+ynNVogYmIC7YpSPas
2S9YFov3/QKBgQD2II5GENU9sYRaUgu5drJxmJiY5sd5HdrCnfinqQea8WW5Tl+F
D0h8ILsFCBFJb3WC5LEHlI7hTLQWeQJyNj0MpqjYdPJQbeobvDxybetTxKSJRO9D
l8EvH0QC84kib2A980JOmv1gx5goCIrCVzdIdVqmcKRwB2U2qHojiAqPUQKBgQC7
n4nrHo36mkbFi4U/F57WV02tR2UuNclP82NIMkC/S1WBQK/B0AWOJBCDa4x1KlFq
cCGz/BMcoP0m0kItRrT8mB41eJWIOmXvyvAJ1oqT3+5E+3zuUP89+3eJuOG0+m9g
KHWQipS8VIMWvV6UwC1G8rJDVdAJSzYEXSaxMga1fQKBgQDzkggc2xtZLFKtxOk+
zsvdQTv6Ok2TEZykZwwR4PkW6758ggTD1aIpAOVdi9jnGzuDNkRWflcEJJoyNLPJ
myg1w9eHJ9yN0KKZ2w1DLSHGEG51d/hQnqDS+pDIELQf12Ui6S7TqpbXpBfY2bVV
pBJAKS/KAIioJ7UboSUnE1wRTw==
-----END PRIVATE KEY-----
```

**IMPORTANTE:** No Vercel, cole o valor da chave privada SEM as aspas duplas e SEM os `\n`. O Vercel tratará as quebras de linha automaticamente.

### 3. Verificar Configuração

Após configurar as variáveis:
1. Faça um novo deploy
2. Verifique se o build passa sem erros
3. Teste as funcionalidades que dependem do Firebase

### 4. Troubleshooting

Se o erro persistir:
1. Verifique se todas as variáveis estão definidas para todos os ambientes (Production, Preview, Development)
2. Certifique-se de que não há espaços extras nos valores
3. Verifique se a chave privada está completa e correta
4. Tente fazer um redeploy forçado

### 5. Segurança

- Nunca commite o arquivo `.env.local` no repositório
- Use o arquivo `.env.example` como template
- Mantenha as chaves seguras e rotacione-as periodicamente