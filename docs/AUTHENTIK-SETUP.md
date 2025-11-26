# Authentik OAuth Configuration Guide

Questa guida spiega come configurare Authentik come provider OAuth per DataRoom.

## Prerequisiti

- Istanza Authentik funzionante (self-hosted o cloud)
- Accesso amministratore ad Authentik
- DataRoom installato e configurato

## Configurazione Authentik

### 1. Creare un Provider OAuth2/OIDC

1. Accedi ad Authentik come amministratore
2. Vai su **Applications** → **Providers**
3. Clicca su **Create** e seleziona **OAuth2/OpenID Provider**
4. Configura i seguenti parametri:

   - **Name**: `DataRoom`
   - **Authorization flow**: Seleziona il flow di autenticazione desiderato (es. `default-authentication-flow`)
   - **Client type**: `Confidential`
   - **Redirect URIs**: Aggiungi i seguenti URI (uno per riga):
     ```
     http://localhost:3000/api/auth/callback/authentik
     http://localhost:3001/api/auth/callback/authentik
     https://your-production-domain.com/api/auth/callback/authentik
     ```
   - **Signing Key**: Seleziona una chiave di firma valida
   - **Scopes**: Assicurati che siano inclusi almeno:
     - `openid`
     - `email`
     - `profile`

5. Salva il provider e annota:
   - **Client ID**: Verrà mostrato dopo il salvataggio
   - **Client Secret**: Clicca su "Show Secret" per visualizzarlo

### 2. Creare un'Applicazione

1. Vai su **Applications** → **Applications**
2. Clicca su **Create**
3. Configura:
   - **Name**: `DataRoom`
   - **Slug**: `dataroom` (verrà usato nell'URL)
   - **Provider**: Seleziona il provider creato al passo 1
   - **Launch URL**: `http://localhost:3000` (o il tuo dominio)

4. Salva l'applicazione

### 3. Ottenere l'Issuer URL

L'issuer URL ha il formato:
```
https://your-authentik-domain.com/application/o/dataroom/
```

Dove:
- `your-authentik-domain.com` è il dominio della tua istanza Authentik
- `dataroom` è lo slug dell'applicazione creato al passo 2

**Importante**: L'URL deve terminare con `/`

## Configurazione DataRoom

### 1. Aggiornare il file .env

Modifica il file `.env` nella root del progetto DataRoom:

```bash
# Authentik OAuth Provider
AUTHENTIK_ISSUER="https://your-authentik-domain.com/application/o/dataroom/"
AUTHENTIK_CLIENT_ID="your-client-id-from-step-1"
AUTHENTIK_CLIENT_SECRET="your-client-secret-from-step-1"
```

### 2. Aggiornare NEXTAUTH_URL

Assicurati che `NEXTAUTH_URL` corrisponda al dominio corretto:

```bash
# Development
NEXTAUTH_URL="http://localhost:3000"

# Production
NEXTAUTH_URL="https://your-production-domain.com"
```

### 3. Riavviare il server

```bash
npm run dev
```

## Verifica della Configurazione

### 1. Test dell'endpoint providers

Verifica che Authentik sia registrato:

```bash
curl http://localhost:3000/api/auth/providers | jq
```

Dovresti vedere un oggetto con `authentik` tra i provider disponibili.

### 2. Test del login

1. Vai su `http://localhost:3000/auth/login`
2. Dovresti vedere il pulsante "Continue with Authentik"
3. Clicca sul pulsante
4. Verrai reindirizzato ad Authentik per l'autenticazione
5. Dopo il login, dovresti essere reindirizzato a `/dashboard`

## Troubleshooting

### Errore "Configuration Error"

**Causa**: Le variabili d'ambiente non sono configurate correttamente.

**Soluzione**:
- Verifica che tutte e tre le variabili `AUTHENTIK_*` siano impostate
- Riavvia il server dopo aver modificato `.env`

### Errore "redirect_uri_mismatch"

**Causa**: L'URL di callback non corrisponde a quelli configurati in Authentik.

**Soluzione**:
- Verifica che il redirect URI in Authentik includa esattamente: `http://localhost:3000/api/auth/callback/authentik`
- Controlla che non ci siano spazi o caratteri extra
- Assicurati che `NEXTAUTH_URL` nel `.env` corrisponda al dominio base

### Errore "ENOTFOUND" o "fetch failed"

**Causa**: L'issuer URL non è raggiungibile o non è corretto.

**Soluzione**:
- Verifica che l'istanza Authentik sia online e raggiungibile
- Controlla che l'URL dell'issuer termini con `/`
- Verifica che lo slug dell'applicazione sia corretto
- Testa l'endpoint well-known: `curl https://your-authentik-domain.com/application/o/dataroom/.well-known/openid-configuration`

### Il pulsante Authentik non appare

**Causa**: Le variabili d'ambiente non sono impostate o sono commentate.

**Soluzione**:
- Decommentare le variabili `AUTHENTIK_*` nel file `.env`
- Assicurarsi che almeno `AUTHENTIK_ISSUER` e `AUTHENTIK_CLIENT_ID` siano impostati
- Riavviare il server

### Errore "CallbackRouteError"

**Causa**: Problema durante il callback OAuth.

**Soluzione**:
- Abilita il debug mode: `NODE_ENV=development` nel `.env`
- Controlla i log del server per dettagli specifici
- Verifica che gli scope configurati in Authentik includano `openid email profile`

## Link Utili

- [Documentazione Authentik OAuth2/OIDC](https://goauthentik.io/docs/providers/oauth2/)
- [NextAuth.js OIDC Provider](https://next-auth.js.org/providers/oauth)
- [Troubleshooting NextAuth.js](https://next-auth.js.org/configuration/pages#error-codes)

## Supporto

Per problemi o domande:
1. Controlla i log del server (`npm run dev`)
2. Controlla i log di Authentik
3. Verifica la configurazione seguendo questa guida
4. Consulta la documentazione ufficiale di Authentik e NextAuth.js
