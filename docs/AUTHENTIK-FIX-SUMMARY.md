# Risoluzione Problemi Autenticazione Authentik

## Stato Attuale

✅ **Codice sorgente Authentik configurato correttamente**

Il progetto ora include:

1. **Provider Authentik configurato** in `lib/auth/auth.config.ts`
   - Tipo: OIDC (OpenID Connect)
   - Scope: `openid email profile`
   - wellKnown endpoint configurato
   - Profile mapper implementato
   - Supporto per email linking

2. **Configurazione condizionale**
   - Authentik si attiva solo se tutte e 3 le variabili sono configurate:
     - `AUTHENTIK_ISSUER`
     - `AUTHENTIK_CLIENT_ID`
     - `AUTHENTIK_CLIENT_SECRET`
   - Se non configurato, il provider non viene caricato (nessun errore)

3. **Route API corrette**
   - Signin: `GET /api/auth/signin/authentik`
   - Callback: `GET /api/auth/callback/authentik`
   - Providers list: `GET /api/auth/providers`

4. **Middleware aggiornato**
   - `/api/auth/*` è pubblico (necessario per OAuth callback)
   - `/auth/callback` aggiunto ai percorsi pubblici
   - Gestione redirect corretta

5. **UI aggiornata**
   - Pulsante "Continue with Authentik" appare solo se configurato
   - Pagina di errore `/auth/error` per gestire problemi OAuth

6. **Documentazione completa**
   - Guida setup: `docs/AUTHENTIK-SETUP.md`
   - Troubleshooting dettagliato
   - Script di test: `test-auth.sh`

## Come Attivare Authentik

### 1. Configurare Authentik Server

Segui la guida completa in `docs/AUTHENTIK-SETUP.md`

### 2. Aggiornare .env

Decommentare e configurare nel file `.env`:

```bash
# Authentik OAuth Provider
AUTHENTIK_ISSUER="https://your-authentik-domain.com/application/o/dataroom/"
AUTHENTIK_CLIENT_ID="your-client-id"
AUTHENTIK_CLIENT_SECRET="your-client-secret"
```

### 3. Riavviare il server

```bash
npm run dev
```

### 4. Verificare

```bash
# Controllare che Authentik sia tra i provider
curl http://localhost:3000/api/auth/providers | python3 -m json.tool

# Dovrebbe mostrare:
# {
#   "credentials": {...},
#   "authentik": {...}
# }
```

### 5. Testare il login

1. Vai su `http://localhost:3000/auth/login`
2. Clicca su "Continue with Authentik"
3. Completa l'autenticazione su Authentik
4. Verrai reindirizzato a `/dashboard`

## URL Corretti

- **Signin**: `http://localhost:3000/api/auth/signin/authentik`  
  (Non `/signin/` ma `/api/auth/signin/`)
  
- **Callback**: `http://localhost:3000/api/auth/callback/authentik`  
  (Configurare questo in Authentik come Redirect URI)

## Verifica Stato Attuale

### Provider Disponibili

Senza Authentik configurato (stato attuale):
- ✅ Email/Password (credentials)
- ❌ Google OAuth (non configurato)
- ❌ Microsoft OAuth (non configurato)
- ❌ Authentik (non configurato)

Con Authentik configurato:
- ✅ Email/Password (credentials)
- ✅ Authentik OAuth

## Test Rapido

```bash
# 1. Avvia il server
npm run dev

# 2. In un altro terminale, esegui:
./test-auth.sh

# Output atteso:
# ✅ Server is running
# ✅ Providers endpoint is working
# Available providers: credentials
```

## File Modificati

```
lib/auth/auth.config.ts          - Configurazione Authentik + fix provider condizionali
middleware.ts                     - Aggiunta route /auth/callback ai percorsi pubblici
app/auth/login/page.tsx           - Pulsante Authentik condizionale
app/auth/error/page.tsx           - Nuova pagina errori OAuth
.env                              - Variabili Authentik commentate (da configurare)
docs/AUTHENTIK-SETUP.md           - Guida completa setup
test-auth.sh                      - Script test automatico
```

## Commit Message

```
fix(auth): implement complete Authentik OAuth provider integration

- Add Authentik OIDC provider with proper configuration
  * wellKnown endpoint for auto-discovery
  * Authorization params with required scopes
  * Profile mapper for user data transformation
  * Conditional loading (requires all 3 env vars)

- Fix provider registration for Google and Microsoft
  * Check both CLIENT_ID and CLIENT_SECRET before loading
  * Remove unnecessary object wrapping causing errors
  * Prevents "configuration error" when credentials empty

- Update middleware for OAuth callbacks
  * Add /auth/callback to public routes
  * Add /api/public for future public APIs
  * Maintain security for protected routes

- Add comprehensive error handling
  * New /auth/error page with user-friendly messages
  * Redirect callback to handle OAuth flow properly
  * Debug mode enabled in development

- Create documentation and tooling
  * docs/AUTHENTIK-SETUP.md with complete setup guide
  * test-auth.sh script for automated testing
  * Troubleshooting section for common issues

Breaking changes: None
Migration: Update .env file with Authentik credentials if needed

Fixes #issue-number
```

## Note Tecniche

### wellKnown Endpoint

L'URL wellKnown è stato corretto da:
```
${AUTHENTIK_ISSUER}/.well-known/openid-configuration
```

a:
```
${AUTHENTIK_ISSUER}.well-known/openid-configuration
```

Perché `AUTHENTIK_ISSUER` deve già terminare con `/`.

### Strategia Sessione

- **Strategy**: `database` (con Prisma Adapter)
- **Non utilizzare** jwt callback con database strategy
- Session callback riceve `user` dal database, non dal token

### NextAuth v5 Beta

Questo progetto usa `next-auth@5.0.0-beta.30`:
- Nuovo sistema di configurazione
- `auth()` helper per server components
- `signIn()` per server actions
- Route handler automatico via `handlers`

## Prossimi Passi

1. **Configurare Authentik** seguendo `docs/AUTHENTIK-SETUP.md`
2. **Aggiornare .env** con credenziali reali
3. **Testare il flusso OAuth** completo
4. **Opzionale**: Configurare Google/Microsoft OAuth

## Supporto

Per problemi:
1. Controllare i log del server con `npm run dev`
2. Verificare le variabili d'ambiente
3. Consultare `docs/AUTHENTIK-SETUP.md`
4. Abilitare debug: `NODE_ENV=development` nel `.env`
