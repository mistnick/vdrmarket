# DataRoom - Authentication System

## Overview

DataRoom usa un **sistema di autenticazione custom** basato su sessioni nel database, abbandonando NextAuth a favore di un'implementazione più semplice e affidabile.

## Architettura

### 1. Session Management (`lib/auth/session.ts`)

Il sistema di gestione sessioni fornisce:

- **createSession(user)**: Crea una nuova sessione per l'utente
- **getSession()**: Recupera i dati della sessione corrente
- **getCurrentUser()**: Recupera l'utente completo dalla sessione
- **deleteSession()**: Elimina la sessione corrente (logout)
- **verifySession()**: Verifica se la sessione è valida
- **isAuthenticated()**: Controlla se l'utente è autenticato

#### Implementazione

```typescript
// Creazione sessione
const sessionToken = await createSession(user);
// Token salvato in cookie HTTP-only

// Recupero sessione
const session = await getSession();
// Ritorna: { userId, email, name, image } o null

// Logout
await deleteSession();
// Rimuove sessione dal DB e cancella cookie
```

### 2. API Routes

#### POST `/api/auth/login`

Endpoint per l'autenticazione con email e password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "image": null
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid email or password"
}
```

#### POST/GET `/api/auth/logout`

Endpoint per il logout. Supporta sia POST che GET.

**Response:**
```json
{
  "success": true
}
```

### 3. Middleware (`middleware.ts`)

Il middleware protegge le route richiedendo autenticazione:

```typescript
// Route pubbliche (accesso libero)
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/view",  // Visualizzazione pubblica documenti
];

// Route protette (richiedono autenticazione)
// Tutte le altre route sono protette di default
```

**Comportamento:**
- Route pubbliche → accesso libero
- Route protette senza sessione → redirect a `/auth/login?callbackUrl=...`
- Route auth con sessione esistente → redirect a `/dashboard`

### 4. Login Page (`app/auth/login/page.tsx`)

Pagina di login semplificata che:

1. Raccoglie email e password
2. Chiama `/api/auth/login`
3. Gestisce errori
4. Redirect dopo login riuscito

**Features:**
- Validazione client-side
- Messaggi di errore chiari
- UI responsive e moderna
- Loading states

## Database Schema

### Session Table

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("sessions")
}
```

### User Table

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String?   // Bcrypt hashed
  name          String?
  image         String?
  sessions      Session[]
  // ... altri campi
}
```

## Password Hashing

Le password sono hashate usando **bcrypt** con cost factor 10:

```typescript
import bcrypt from "bcryptjs";

// Hashing
const hashedPassword = await bcrypt.hash(password, 10);

// Verifica
const isValid = await bcrypt.compare(password, hashedPassword);
```

## Security Features

### 1. Session Token Generation

Token sicuro a 256-bit generato con `crypto.getRandomValues()`:

```typescript
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}
```

### 2. HTTP-Only Cookies

I cookie di sessione sono configurati come:

```typescript
{
  httpOnly: true,              // Non accessibile da JavaScript
  secure: NODE_ENV === "production",  // HTTPS only in produzione
  sameSite: "lax",             // Protezione CSRF
  expires: new Date(...),      // Scadenza 7 giorni
  path: "/",                   // Disponibile su tutto il sito
}
```

### 3. Session Expiration

- **Durata:** 7 giorni
- **Verifica:** Ogni richiesta controlla scadenza
- **Cleanup:** Sessioni scadute rimosse periodicamente

### 4. Audit Logging

Ogni login/logout viene registrato:

```typescript
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: "USER_LOGIN",
    resourceType: "USER",
    resourceId: user.id,
    metadata: { method: "credentials", ip: "..." },
  },
});
```

## Usage Examples

### In Server Components

```typescript
import { getSession, getCurrentUser } from "@/lib/auth/session";

export default async function Page() {
  const session = await getSession();
  
  if (!session) {
    redirect("/auth/login");
  }
  
  const user = await getCurrentUser();
  
  return <div>Welcome {user.name}!</div>;
}
```

### In API Routes

```typescript
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // ... protected logic
}
```

### In Client Components

```typescript
"use client";

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/auth/login";
}

async function handleLogin(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  if (res.ok) {
    window.location.href = "/dashboard";
  }
}
```

## Migration from NextAuth

Questa implementazione sostituisce completamente NextAuth:

**Removed:**
- `next-auth` package
- `app/api/auth/[...nextauth]/route.ts`
- NextAuth configuration files
- OAuth providers (Google, Azure AD, Keycloak)

**Added:**
- Custom session management
- Simple login/logout API routes
- Database-backed sessions
- Direct Prisma integration

**Benefits:**
- ✅ Nessun problema con CSRF tokens
- ✅ Cookie management più semplice
- ✅ Controllo completo del flusso di autenticazione
- ✅ Più facile da debuggare
- ✅ Meno dipendenze esterne
- ✅ Migliore compatibilità con Docker

## Testing

### Test Users

Il seed script crea utenti di test:

```bash
npm run db:seed
```

**Credentials:**
- Email: `admin@dataroom.com` / Password: `Admin123!`
- Email: `manager@dataroom.com` / Password: `Manager123!`
- Email: `user@dataroom.com` / Password: `User123!`

### Manual Testing

1. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@dataroom.com","password":"Admin123!"}'
   ```

2. **Logout:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/logout
   ```

## Troubleshooting

### Session Not Persisting

1. Verifica che i cookie siano abilitati nel browser
2. Controlla che `NEXTAUTH_SECRET` sia configurato in `.env`
3. Verifica la scadenza della sessione nel database

### Password Mismatch

1. Verifica che la password sia stata hashata con bcrypt
2. Controlla il cost factor (deve essere 10)
3. Rigenera la password se necessario:
   ```bash
   docker-compose exec app node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NewPassword123!', 10, (e,h) => console.log(h));"
   ```

### Database Connection Issues

```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

## Future Enhancements

Possibili miglioramenti futuri:

1. **OAuth Support:** Re-implementare OAuth senza NextAuth
2. **2FA:** Aggiungere autenticazione a due fattori
3. **Session Management UI:** Visualizzare sessioni attive
4. **IP Whitelisting:** Limitare accesso per IP
5. **Rate Limiting:** Protezione contro brute force
6. **Remember Me:** Sessioni più lunghe con opt-in

## References

- [Session Management Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
