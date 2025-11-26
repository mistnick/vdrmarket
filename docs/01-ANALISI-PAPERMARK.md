# Analisi Approfondita di Papermark

## 1. Overview del Progetto Papermark

Papermark è una piattaforma open-source per la condivisione sicura di documenti con analytics integrate, posizionata come alternativa a DocSend. Il progetto si concentra su Virtual Data Rooms per fundraising, M&A, vendite e collaborazione aziendale.

### Stack Tecnologico Attuale di Papermark

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Linguaggio**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI**: Tailwind CSS + Shadcn/ui (Radix UI)
- **Autenticazione**: NextAuth.js v4
- **Storage**: AWS S3 / Vercel Blob
- **Email**: Resend
- **Analytics**: Tinybird (real-time analytics)
- **Pagamenti**: Stripe
- **Background Jobs**: Upstash QStash, Trigger.dev v3
- **Rate Limiting**: Upstash Redis
- **Hosting**: Vercel

## 2. Funzionalità Core di Papermark

### 2.1 Gestione Utenti e Workspace

#### Autenticazione
- OAuth2/OIDC con Google
- Email/Password tradizionale
- Passkey support (via Hanko)
- 2FA (Two-Factor Authentication)
- SSO aziendale (Enterprise)

#### Organizzazione
- **User**: Utente singolo con account
- **Team/Workspace**: Organizzazione multi-utente
- Ruoli e permessi gerarchici
- Inviti via email
- Gestione membri team

### 2.2 Gestione Documenti

#### Upload e Storage
- Upload singolo documento (PDF, immagini, presentazioni)
- Bulk upload multipli documenti
- Upload progressivo TUS protocol per file grandi
- Versioning documenti
- Supporto formati: PDF, PPT, DOCX, immagini, fogli calcolo
- Preview documenti inline

#### Organizzazione
- Cartelle e sottocartelle
- Tag e categorizzazione
- Ricerca full-text
- Ordinamento e filtri

### 2.3 Virtual Data Room (VDR)

Le Data Room sono collezioni strutturate di documenti con permessi e accesso controllato.

#### Caratteristiche VDR
- Creazione data room con struttura a cartelle
- Assegnazione documenti a cartelle
- Permessi granulari per utente/gruppo
- Link di accesso condiviso
- Watermarking dinamico
- Download control
- Scadenza accesso

#### Permessi e Ruoli
- **Owner**: Controllo completo
- **Admin**: Gestione utenti e contenuti
- **Editor**: Modifica contenuti
- **Viewer**: Solo visualizzazione
- **Custom roles**: Permessi personalizzati

### 2.4 Condivisione Documenti e Link

#### Link Sharing
- Generazione link univoci per documento/data room
- Link pubblici o protetti
- Configurazione per link:
  - **Password protection**: Richiesta password
  - **Email verification**: Verifica email viewer
  - **Domain restriction**: Accesso solo da domini specifici
  - **Expiration date**: Scadenza temporale
  - **Download control**: Permetti/blocca download
  - **Watermark**: Watermark dinamico con email viewer
  - **Screenshot protection**: Blocco screenshot (browser support)
  - **View limits**: Numero massimo visualizzazioni

#### Custom Branding
- Custom domain per link condivisi
- Logo aziendale
- Colori brand
- Metatag personalizzati

### 2.5 Tracking e Analytics

#### Page-by-Page Analytics
- Visualizzazioni per pagina
- Tempo speso per pagina
- Scroll depth
- Identificazione viewer (se autenticato)
- Geolocalizzazione
- Device/browser info
- Referrer tracking

#### Real-Time Notifications
- Notifica quando documento viene aperto
- Notifica per milestone (50%, 100% visualizzato)
- Email digest giornaliero/settimanale
- Webhook per eventi

#### Dashboard Analytics
- Overview visualizzazioni totali
- Engagement rate
- Most viewed pages
- Funnel di visualizzazione
- Time series analytics
- Export dati (CSV, Excel)

### 2.6 Audit Trail e Compliance

#### Audit Log
- Log completo di tutte le azioni:
  - Accesso documenti
  - Modifiche permessi
  - Upload/delete documenti
  - Inviti utenti
  - Modifiche configurazione
- Timestamp precisi
- Identificazione utente/viewer
- IP address e geolocalizzazione

#### Compliance e Security
- SOC 2 compliant (in progress)
- GDPR e CCPA compliant
- HIPAA compliant
- Data encryption (AES-256)
- Data residency (EU, US, UAE)
- Export compliance data

### 2.7 Funzionalità Avanzate

#### AI-Powered Features
- Q&A con documenti (chat con AI)
- Document summarization
- Intelligent search
- Auto-tagging

#### Collaboration
- Comments su documenti
- Q&A threads (conversazioni)
- Internal notes
- @mentions per team

#### Integrations
- Notion page sharing
- Slack notifications
- Zapier/Make.com
- API REST pubblica
- Webhooks

#### NDAs e Legal
- One-Click NDA signature
- E-signature integrazione
- Terms acceptance tracking

## 3. User Journey Principali

### 3.1 Onboarding Utente

1. **Signup/Login**
   - Scelta metodo autenticazione
   - Creazione account
   - Email verification (opzionale)

2. **Setup Workspace**
   - Creazione team/workspace
   - Invito membri team
   - Configurazione brand (logo, colori)
   - Setup custom domain (opzionale)

3. **First Document Upload**
   - Upload primo documento
   - Creazione primo link condiviso
   - Test sharing

### 3.2 Condivisione Documento

1. **Upload Documento**
   - Drag & drop o selezione file
   - Processing e conversione
   - Preview generata

2. **Configurazione Link**
   - Generazione link univoco
   - Scelta protezioni (password, email, ecc.)
   - Configurazione analytics
   - Custom branding

3. **Invio Link**
   - Copia link
   - Invio email integrato (opzionale)
   - Condivisione social/messaging

4. **Tracking**
   - Real-time notifications
   - Dashboard analytics
   - Export report

### 3.3 Virtual Data Room Setup

1. **Creazione Data Room**
   - Nome e descrizione
   - Configurazione generale (watermark, download, ecc.)

2. **Struttura Cartelle**
   - Creazione cartelle/sottocartelle
   - Organizzazione logica (es: Financial, Legal, Product, ecc.)

3. **Upload Documenti**
   - Bulk upload
   - Assegnazione a cartelle
   - Metadata e tag

4. **Configurazione Accesso**
   - Generazione link data room
   - Permessi per utente/gruppo
   - Scadenze e limitazioni

5. **Invio e Gestione**
   - Invio link a stakeholder
   - Monitoraggio accessi
   - Gestione permessi dinamica
   - Q&A e comunicazioni

### 3.4 Viewer Experience

1. **Accesso Link**
   - Click su link condiviso
   - Autenticazione (se richiesta):
     - Email verification
     - Password
     - Login account

2. **Visualizzazione Documento**
   - Viewer inline
   - Navigazione pagine
   - Zoom e scroll
   - Download (se permesso)

3. **Interazione** (se abilitata)
   - Lasciare domande/commenti
   - Chat con AI
   - Scaricare file

4. **Tracking Automatico**
   - Tutte le azioni vengono tracciate
   - Owner riceve notifiche

## 4. Modello Dati (Schema Database Inferito)

### 4.1 Entità Principali

#### User
```typescript
{
  id: string
  email: string
  emailVerified: DateTime?
  name: string?
  image: string?
  hashedPassword: string?
  createdAt: DateTime
  updatedAt: DateTime
  // Relations
  accounts: Account[]
  sessions: Session[]
  teams: TeamMember[]
  documents: Document[]
  datarooms: Dataroom[]
  views: View[]
  // Features
  subscriptionStatus: string?
  trialEndsAt: DateTime?
}
```

#### Team/Workspace
```typescript
{
  id: string
  name: string
  slug: string
  logo: string?
  createdAt: DateTime
  updatedAt: DateTime
  // Settings
  customDomain: string?
  brandColor: string?
  // Relations
  members: TeamMember[]
  documents: Document[]
  datarooms: Dataroom[]
  // Subscription
  plan: string
  subscriptionId: string?
}
```

#### TeamMember
```typescript
{
  id: string
  userId: string
  teamId: string
  role: Role // OWNER, ADMIN, MEMBER, VIEWER
  invitedAt: DateTime
  acceptedAt: DateTime?
  // Relations
  user: User
  team: Team
}
```

#### Document
```typescript
{
  id: string
  name: string
  description: string?
  file: string // URL storage
  fileKey: string // Key S3
  type: string // pdf, ppt, docx, etc
  numPages: int?
  size: int
  // Ownership
  ownerId: string
  teamId: string?
  // Folder organization
  folderId: string?
  dataroomId: string?
  // Versioning
  versionNumber: int
  parentDocumentId: string?
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  // Relations
  owner: User
  team: Team?
  folder: Folder?
  dataroom: Dataroom?
  links: Link[]
  versions: Document[]
  views: View[]
}
```

#### Folder
```typescript
{
  id: string
  name: string
  path: string
  parentId: string?
  dataroomId: string?
  teamId: string
  createdAt: DateTime
  updatedAt: DateTime
  // Relations
  parent: Folder?
  children: Folder[]
  documents: Document[]
  dataroom: Dataroom?
  team: Team
}
```

#### Dataroom
```typescript
{
  id: string
  name: string
  description: string?
  slug: string
  // Ownership
  teamId: string
  ownerId: string
  // Settings
  settings: Json // { watermark, download, screenshot, etc }
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  // Relations
  team: Team
  owner: User
  folders: Folder[]
  documents: Document[]
  links: Link[]
  viewers: DataroomViewer[]
}
```

#### Link
```typescript
{
  id: string
  slug: string // short unique identifier
  // Target
  documentId: string?
  dataroomId: string?
  // Ownership
  userId: string
  teamId: string?
  // Settings
  name: string?
  password: string?
  expiresAt: DateTime?
  emailProtected: boolean
  emailAuthenticated: boolean
  domainRestriction: string[]?
  allowDownload: boolean
  allowNotifications: boolean
  enableWatermark: boolean
  enableScreenshotProtection: boolean
  enableTracking: boolean
  viewLimit: int?
  // Branding
  customDomain: string?
  metaTitle: string?
  metaDescription: string?
  metaImage: string?
  // Timestamps
  createdAt: DateTime
  updatedAt: DateTime
  // Relations
  document: Document?
  dataroom: Dataroom?
  user: User
  team: Team?
  views: View[]
}
```

#### View
```typescript
{
  id: string
  linkId: string
  documentId: string?
  dataroomId: string?
  // Viewer info
  viewerEmail: string?
  viewerId: string? // If authenticated
  // Session
  viewedAt: DateTime
  duration: int? // seconds
  completionRate: float?
  // Technical info
  ipAddress: string?
  country: string?
  city: string?
  device: string?
  browser: string?
  os: string?
  referrer: string?
  // Page-by-page tracking
  pageViews: Json // { pageNum: duration }
  // Relations
  link: Link
  document: Document?
  dataroom: Dataroom?
  viewer: User?
}
```

#### DataroomViewer
```typescript
{
  id: string
  dataroomId: string
  email: string
  name: string?
  // Access control
  permissions: Json // custom permissions object
  expiresAt: DateTime?
  // Tracking
  firstViewedAt: DateTime?
  lastViewedAt: DateTime?
  // Relations
  dataroom: Dataroom
}
```

#### AuditLog
```typescript
{
  id: string
  action: string // VIEW, UPLOAD, DELETE, SHARE, etc
  entityType: string // DOCUMENT, DATAROOM, USER, etc
  entityId: string
  // Actor
  userId: string?
  email: string?
  // Context
  ipAddress: string?
  userAgent: string?
  metadata: Json
  // Timestamp
  createdAt: DateTime
  // Relations
  user: User?
}
```

## 5. API e Integrazioni

### 5.1 API Routes Principali (Next.js App Router)

#### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`

#### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/[id]` - Get document
- `PATCH /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document
- `POST /api/documents/[id]/versions` - Create version

#### Links
- `POST /api/links` - Create link
- `GET /api/links` - List links
- `GET /api/links/[slug]` - Get link (public)
- `PATCH /api/links/[id]` - Update link
- `DELETE /api/links/[id]` - Delete link
- `POST /api/links/[slug]/verify` - Verify access (password/email)

#### Data Rooms
- `POST /api/datarooms` - Create dataroom
- `GET /api/datarooms` - List datarooms
- `GET /api/datarooms/[id]` - Get dataroom
- `PATCH /api/datarooms/[id]` - Update dataroom
- `DELETE /api/datarooms/[id]` - Delete dataroom
- `POST /api/datarooms/[id]/folders` - Create folder
- `POST /api/datarooms/[id]/documents` - Add document

#### Analytics
- `GET /api/analytics/documents/[id]` - Document analytics
- `GET /api/analytics/links/[id]` - Link analytics
- `GET /api/analytics/datarooms/[id]` - Dataroom analytics
- `POST /api/analytics/track` - Track view event

#### Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - List teams
- `GET /api/teams/[id]` - Get team
- `PATCH /api/teams/[id]` - Update team
- `POST /api/teams/[id]/members` - Invite member
- `DELETE /api/teams/[id]/members/[userId]` - Remove member

#### Webhooks
- `POST /api/webhooks/stripe` - Stripe events
- `POST /api/webhooks/tinybird` - Tinybird events

### 5.2 Storage Abstraction

Papermark implementa un'astrazione per lo storage che supporta:
- **Vercel Blob Storage** (default)
- **AWS S3** (con CloudFront opzionale)

Configurazione tramite env:
```
NEXT_PUBLIC_UPLOAD_TRANSPORT="s3" | "vercel"
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="..."
NEXT_PRIVATE_UPLOAD_BUCKET="..."
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="..."
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="..."
```

## 6. Architettura Tecnica Attuale

### 6.1 Frontend
- Next.js App Router (`/app` directory)
- Server Components per rendering
- Client Components per interattività
- Shadcn/ui + Radix UI per componenti
- Tailwind CSS per styling
- React Hook Form + Zod per form validation

### 6.2 Backend
- Next.js API Routes
- Server Actions per mutations
- Middleware per auth e rate limiting
- Background jobs con Trigger.dev e QStash

### 6.3 Database
- PostgreSQL su Vercel Postgres
- Prisma ORM
- Migrazioni versionate

### 6.4 Deployment
- Vercel platform
- Edge Functions per performance
- CDN globale
- Continuous deployment da GitHub

## 7. Opportunità di Semplificazione

Per il nuovo progetto, possiamo semplificare:

### 7.1 Storage
- Supporto Azure Blob Storage al posto di Vercel Blob
- Mantenere supporto S3
- Interfaccia unificata per entrambi

### 7.2 Analytics
- Sostituire Tinybird con soluzione più semplice
- PostgreSQL per analytics base
- Aggregazioni pre-calcolate
- Export su richiesta invece di real-time

### 7.3 Background Jobs
- Ridurre dipendenza da Trigger.dev e QStash
- Implementare job queue più semplice (BullMQ + Redis)
- Oppure Next.js API routes con cron jobs

### 7.4 Email
- Mantenere Resend (ottimo rapporto qualità/costo)
- Oppure alternativa con AWS SES

### 7.5 Pagamenti
- Stripe (già ottimale)
- Oppure rimuovere se non necessario inizialmente

### 7.6 Hosting
- Vercel (ottimale per Next.js)
- Oppure Docker self-hosted per costi zero
- AWS ECS/Fargate per produzione

## 8. Considerazioni sui Costi

### 8.1 Costi Attuali Papermark (stima)
- Vercel Pro: ~$20/mese
- Vercel Postgres: ~$20-100/mese (scalabile)
- Vercel Blob: variabile (storage + bandwidth)
- Tinybird: ~$50-200/mese
- Trigger.dev: ~$20-100/mese
- Upstash Redis: ~$10-50/mese
- Resend: ~$20/mese (10k emails)
- Stripe: % su transazioni

**Totale: ~$160-500/mese** (senza considerare traffico)

### 8.2 Ottimizzazione Costi Nuovo Progetto
- Docker su VPS: $10-40/mese
- PostgreSQL gestito: $10-50/mese (DigitalOcean, Supabase)
- S3/Azure Storage: ~$5-20/mese
- Email (SES): ~$1-10/mese
- Redis gestito: ~$5-20/mese (opzionale)

**Totale: ~$30-140/mese** (risparmio 50-70%)

