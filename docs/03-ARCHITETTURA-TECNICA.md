# Architettura Tecnica - Virtual Data Room

## 1. Architettura Generale

### 1.1 Diagramma High-Level

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js 14+ App Router (React Server/Client Components)│  │
│  │  - Pages & Layouts                                        │  │
│  │  - Shadcn UI Components                                   │  │
│  │  - Tailwind CSS Styling                                   │  │
│  │  - Client State (React Context, Zustand)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js API Routes & Server Actions                     │  │
│  │  - REST API Endpoints                                     │  │
│  │  - Server Actions (mutations)                            │  │
│  │  - Middleware (auth, rate limiting)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↕                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer                                     │  │
│  │  - Services (DocumentService, LinkService, etc.)         │  │
│  │  - Validators (Zod schemas)                              │  │
│  │  - Utils & Helpers                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      DATA & STORAGE LAYER                        │
│                                                                   │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │  File Storage   │  │  Redis Cache     │  │
│  │  (Prisma)    │  │  (S3/Azure)     │  │  (Optional)      │  │
│  │              │  │                 │  │                  │  │
│  │  - Users     │  │  - Documents    │  │  - Sessions      │  │
│  │  - Teams     │  │  - Images       │  │  - Rate Limits   │  │
│  │  - Documents │  │  - Previews     │  │  - Cache         │  │
│  │  - Links     │  │                 │  │                  │  │
│  │  - Views     │  │                 │  │                  │  │
│  │  - Audit     │  │                 │  │                  │  │
│  └──────────────┘  └─────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│                                                                   │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Auth        │  │  Email Service  │  │  Analytics       │  │
│  │  Providers   │  │  (Resend/SES)   │  │  (Custom/Posthog)│  │
│  │  (Google,    │  │                 │  │                  │  │
│  │   Microsoft) │  │                 │  │                  │  │
│  └──────────────┘  └─────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Principi Architetturali

#### Monorepo Semplificato
- **Un singolo repository** contenente frontend e backend
- **Nessuna separazione microservizi**: tutto in Next.js per semplicità
- **Deployment unificato**: single build, single deploy

#### Layered Architecture
```
┌─────────────────────────────────┐
│  Presentation Layer             │  ← Pages, Components, UI
├─────────────────────────────────┤
│  API Layer                      │  ← API Routes, Server Actions
├─────────────────────────────────┤
│  Business Logic Layer           │  ← Services, Domain Logic
├─────────────────────────────────┤
│  Data Access Layer              │  ← Prisma Client, Repositories
├─────────────────────────────────┤
│  External Services Layer        │  ← Auth, Storage, Email
└─────────────────────────────────┘
```

#### Design Patterns
- **Repository Pattern**: per data access
- **Service Layer Pattern**: per business logic
- **Factory Pattern**: per creazione oggetti complessi (es: storage provider)
- **Strategy Pattern**: per storage abstraction (S3 vs Azure)
- **Middleware Pattern**: per cross-cutting concerns (auth, logging, rate limiting)

## 2. Frontend Architecture

### 2.1 Next.js App Router Structure

```
app/
├── (auth)/                      # Auth group route
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── signup/
│   │   └── page.tsx            # Signup page
│   └── layout.tsx              # Auth layout (centered, no sidebar)
├── (dashboard)/                 # Dashboard group route
│   ├── documents/
│   │   ├── page.tsx            # Documents list
│   │   ├── [id]/
│   │   │   └── page.tsx        # Document detail
│   │   └── new/
│   │       └── page.tsx        # Upload document
│   ├── datarooms/
│   │   ├── page.tsx            # Data rooms list
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Data room detail
│   │   │   └── [folderId]/
│   │   │       └── page.tsx    # Folder view
│   │   └── new/
│   │       └── page.tsx        # Create data room
│   ├── links/
│   │   └── page.tsx            # Links list
│   ├── analytics/
│   │   └── page.tsx            # Analytics dashboard
│   ├── settings/
│   │   ├── page.tsx            # Settings home
│   │   ├── profile/
│   │   ├── team/
│   │   └── billing/
│   └── layout.tsx              # Dashboard layout (with sidebar)
├── (public)/                    # Public routes
│   ├── view/
│   │   └── [slug]/
│   │       └── page.tsx        # Public document viewer
│   └── layout.tsx              # Minimal layout
├── api/                         # API routes
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts        # NextAuth.js handler
│   ├── documents/
│   │   ├── route.ts            # GET, POST documents
│   │   └── [id]/
│   │       ├── route.ts        # GET, PATCH, DELETE document
│   │       └── upload/
│   │           └── route.ts    # Upload endpoint
│   ├── links/
│   ├── datarooms/
│   ├── analytics/
│   └── webhooks/
├── layout.tsx                   # Root layout
├── page.tsx                     # Home/landing page
└── global.css                   # Global styles
```

### 2.2 Component Architecture

#### Component Structure
```
components/
├── ui/                          # Shadcn UI base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   └── ...
├── layouts/                     # Layout components
│   ├── dashboard-layout.tsx
│   ├── sidebar.tsx
│   └── header.tsx
├── documents/                   # Document-specific components
│   ├── document-card.tsx
│   ├── document-list.tsx
│   ├── document-upload.tsx
│   ├── document-viewer.tsx
│   └── document-settings.tsx
├── datarooms/                   # Data room components
│   ├── dataroom-card.tsx
│   ├── folder-tree.tsx
│   ├── folder-upload.tsx
│   └── permissions-manager.tsx
├── links/                       # Link components
│   ├── link-card.tsx
│   ├── link-config-form.tsx
│   └── link-stats.tsx
├── analytics/                   # Analytics components
│   ├── views-chart.tsx
│   ├── stats-cards.tsx
│   ├── page-heatmap.tsx
│   └── visitor-table.tsx
├── auth/                        # Auth components
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   └── oauth-buttons.tsx
└── shared/                      # Shared components
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    ├── empty-state.tsx
    └── confirm-dialog.tsx
```

#### State Management

**Server State**: React Server Components + Next.js caching
- Fetch data in server components
- Pass to client components as props
- Leverage Next.js automatic caching

**Client State**: React Context + Zustand (optional)
```typescript
// contexts/auth-context.tsx
export const AuthContext = createContext<AuthContextType>()

// stores/ui-store.ts
export const useUIStore = create<UIStore>((set) => ({
  sidebar: true,
  toggleSidebar: () => set((state) => ({ sidebar: !state.sidebar }))
}))
```

**Form State**: React Hook Form + Zod
```typescript
const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
})
```

### 2.3 Styling Strategy

#### Tailwind CSS + Shadcn UI
- **Utility-first**: Tailwind per styling rapido
- **Component library**: Shadcn UI per componenti base
- **Customization**: Tailwind config per tema brand
- **Dark mode**: Class-based dark mode (future)

```typescript
// tailwind.config.ts
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          // ... color scale
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

## 3. Backend Architecture

### 3.1 API Layer

#### API Routes Structure
```typescript
// app/api/documents/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const documents = await documentService.getUserDocuments(session.user.id)
  return NextResponse.json(documents)
}

export async function POST(request: NextRequest) {
  // Upload document
}
```

#### Server Actions (per mutations)
```typescript
// app/actions/document-actions.ts
'use server'

export async function createDocument(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  
  const result = await documentService.create({
    userId: session.user.id,
    file: formData.get('file'),
  })
  
  revalidatePath('/documents')
  return result
}
```

### 3.2 Business Logic Layer

#### Services Pattern
```typescript
// lib/services/document-service.ts
export class DocumentService {
  constructor(
    private prisma: PrismaClient,
    private storage: StorageProvider,
  ) {}

  async create(params: CreateDocumentParams) {
    // 1. Validate input
    const validated = createDocumentSchema.parse(params)
    
    // 2. Upload file to storage
    const fileUrl = await this.storage.upload(validated.file)
    
    // 3. Create DB record
    const document = await this.prisma.document.create({
      data: {
        name: validated.name,
        file: fileUrl,
        userId: validated.userId,
      },
    })
    
    // 4. Queue background job (preview generation)
    await queueService.enqueue('generate-preview', { documentId: document.id })
    
    return document
  }

  async getUserDocuments(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }
  
  // ... other methods
}

// Singleton instance
export const documentService = new DocumentService(
  prisma,
  getStorageProvider(),
)
```

#### Validation Layer (Zod)
```typescript
// lib/validations/document-schemas.ts
export const createDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  file: z.instanceof(File).refine(
    (file) => file.size <= 100 * 1024 * 1024,
    'File must be less than 100MB'
  ),
  userId: z.string(),
  teamId: z.string().optional(),
  folderId: z.string().optional(),
})

export type CreateDocumentParams = z.infer<typeof createDocumentSchema>
```

### 3.3 Middleware

#### Authentication Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')
  const path = request.nextUrl.pathname
  
  // Public routes
  if (path.startsWith('/view/')) return NextResponse.next()
  
  // Protected routes
  if (path.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

#### Rate Limiting Middleware
```typescript
// lib/middleware/rate-limit.ts
const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
})

export async function rateLimit(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1'
  const { success } = await limiter.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }
  
  return NextResponse.next()
}
```

## 4. Data Layer

### 4.1 Database Schema (Prisma)

#### Schema Structure
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// User and Auth
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  teams         TeamMember[]
  documents     Document[]
  datarooms     Dataroom[]
  ownedTeams    Team[]     @relation("TeamOwner")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Team/Workspace
model Team {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  logo      String?
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner     User         @relation("TeamOwner", fields: [ownerId], references: [id])
  members   TeamMember[]
  documents Document[]
  datarooms Dataroom[]
  folders   Folder[]
}

model TeamMember {
  id         String    @id @default(cuid())
  userId     String
  teamId     String
  role       Role      @default(MEMBER)
  invitedAt  DateTime  @default(now())
  acceptedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([userId, teamId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

// Documents
model Document {
  id          String    @id @default(cuid())
  name        String
  description String?
  file        String
  fileKey     String
  type        String
  numPages    Int?
  size        Int
  
  userId   String
  teamId   String?
  folderId String?
  dataroomId String?
  
  versionNumber      Int      @default(1)
  parentDocumentId   String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id])
  team     Team?     @relation(fields: [teamId], references: [id])
  folder   Folder?   @relation(fields: [folderId], references: [id])
  dataroom Dataroom? @relation(fields: [dataroomId], references: [id])
  
  parent   Document?  @relation("DocumentVersions", fields: [parentDocumentId], references: [id])
  versions Document[] @relation("DocumentVersions")
  
  links Link[]
  views View[]

  @@index([userId])
  @@index([teamId])
  @@index([dataroomId])
}

// Folders
model Folder {
  id         String   @id @default(cuid())
  name       String
  path       String
  parentId   String?
  dataroomId String?
  teamId     String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  parent   Folder?    @relation("FolderHierarchy", fields: [parentId], references: [id])
  children Folder[]   @relation("FolderHierarchy")
  dataroom Dataroom?  @relation(fields: [dataroomId], references: [id])
  team     Team       @relation(fields: [teamId], references: [id])
  documents Document[]

  @@index([dataroomId])
  @@index([teamId])
}

// Data Rooms
model Dataroom {
  id          String   @id @default(cuid())
  name        String
  description String?
  slug        String   @unique
  settings    Json?
  
  teamId   String
  ownerId  String
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  team    Team     @relation(fields: [teamId], references: [id])
  owner   User     @relation(fields: [ownerId], references: [id])
  folders Folder[]
  documents Document[]
  links   Link[]
  viewers DataroomViewer[]

  @@index([teamId])
}

model DataroomViewer {
  id          String    @id @default(cuid())
  dataroomId  String
  email       String
  name        String?
  permissions Json?
  expiresAt   DateTime?
  
  firstViewedAt DateTime?
  lastViewedAt  DateTime?

  dataroom Dataroom @relation(fields: [dataroomId], references: [id], onDelete: Cascade)

  @@unique([dataroomId, email])
}

// Links
model Link {
  id         String    @id @default(cuid())
  slug       String    @unique
  
  documentId String?
  dataroomId String?
  userId     String
  teamId     String?
  
  name        String?
  password    String?
  expiresAt   DateTime?
  
  emailProtected           Boolean @default(false)
  emailAuthenticated       Boolean @default(false)
  domainRestriction        String[]
  allowDownload            Boolean @default(true)
  allowNotifications       Boolean @default(true)
  enableWatermark          Boolean @default(false)
  enableScreenshotProtection Boolean @default(false)
  enableTracking           Boolean @default(true)
  viewLimit                Int?
  
  customDomain     String?
  metaTitle        String?
  metaDescription  String?
  metaImage        String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  document Document? @relation(fields: [documentId], references: [id], onDelete: Cascade)
  dataroom Dataroom? @relation(fields: [dataroomId], references: [id], onDelete: Cascade)
  
  views View[]

  @@index([documentId])
  @@index([dataroomId])
  @@index([userId])
}

// Views/Analytics
model View {
  id         String   @id @default(cuid())
  linkId     String
  documentId String?
  dataroomId String?
  
  viewerEmail String?
  viewerId    String?
  
  viewedAt       DateTime @default(now())
  duration       Int?
  completionRate Float?
  
  ipAddress String?
  country   String?
  city      String?
  device    String?
  browser   String?
  os        String?
  referrer  String?
  
  pageViews Json?

  link     Link      @relation(fields: [linkId], references: [id], onDelete: Cascade)
  document Document? @relation(fields: [documentId], references: [id])
  dataroom Dataroom? @relation(fields: [dataroomId], references: [id])

  @@index([linkId])
  @@index([documentId])
  @@index([viewedAt])
}

// Audit Log
model AuditLog {
  id         String   @id @default(cuid())
  action     String
  entityType String
  entityId   String
  
  userId    String?
  email     String?
  
  ipAddress String?
  userAgent String?
  metadata  Json?
  
  createdAt DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

### 4.2 Data Access Layer

#### Repository Pattern
```typescript
// lib/repositories/document-repository.ts
export class DocumentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        user: true,
        team: true,
        folder: true,
      },
    })
  }

  async findByUser(userId: string, filters?: DocumentFilters) {
    return this.prisma.document.findMany({
      where: {
        userId,
        ...filters,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(data: CreateDocumentData) {
    return this.prisma.document.create({
      data,
    })
  }

  // ... other methods
}
```

## 5. Storage Abstraction

### 5.1 Storage Provider Interface

```typescript
// lib/storage/storage-provider.ts
export interface StorageProvider {
  upload(file: File, key: string): Promise<string>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getSignedUrl(key: string, expiresIn: number): Promise<string>
}

export interface StorageConfig {
  provider: 's3' | 'azure'
  bucket?: string
  container?: string
  region?: string
  credentials: {
    accessKeyId?: string
    secretAccessKey?: string
    connectionString?: string
  }
}
```

### 5.2 S3 Implementation

```typescript
// lib/storage/s3-provider.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export class S3StorageProvider implements StorageProvider {
  private client: S3Client
  private bucket: string

  constructor(config: StorageConfig) {
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.credentials.accessKeyId!,
        secretAccessKey: config.credentials.secretAccessKey!,
      },
    })
    this.bucket = config.bucket!
  }

  async upload(file: File, key: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    return `https://${this.bucket}.s3.amazonaws.com/${key}`
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    
    return getSignedUrl(this.client, command, { expiresIn })
  }

  // ... other methods
}
```

### 5.3 Azure Blob Implementation

```typescript
// lib/storage/azure-provider.ts
import { BlobServiceClient } from '@azure/storage-blob'

export class AzureStorageProvider implements StorageProvider {
  private client: BlobServiceClient
  private container: string

  constructor(config: StorageConfig) {
    this.client = BlobServiceClient.fromConnectionString(
      config.credentials.connectionString!
    )
    this.container = config.container!
  }

  async upload(file: File, key: string): Promise<string> {
    const containerClient = this.client.getContainerClient(this.container)
    const blockBlobClient = containerClient.getBlockBlobClient(key)
    
    const buffer = Buffer.from(await file.arrayBuffer())
    await blockBlobClient.upload(buffer, buffer.length)

    return blockBlobClient.url
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const containerClient = this.client.getContainerClient(this.container)
    const blockBlobClient = containerClient.getBlockBlobClient(key)
    
    // Generate SAS token
    const sasUrl = await blockBlobClient.generateSasUrl({
      expiresOn: new Date(Date.now() + expiresIn * 1000),
      permissions: BlobSASPermissions.parse('r'),
    })
    
    return sasUrl
  }

  // ... other methods
}
```

### 5.4 Storage Factory

```typescript
// lib/storage/factory.ts
export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 's3'
  
  const config: StorageConfig = {
    provider: provider as 's3' | 'azure',
    bucket: process.env.STORAGE_BUCKET,
    container: process.env.STORAGE_CONTAINER,
    region: process.env.STORAGE_REGION,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY,
      secretAccessKey: process.env.STORAGE_SECRET_KEY,
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    },
  }

  switch (provider) {
    case 's3':
      return new S3StorageProvider(config)
    case 'azure':
      return new AzureStorageProvider(config)
    default:
      throw new Error(`Unknown storage provider: ${provider}`)
  }
}
```

## 6. Authentication

### 6.1 NextAuth.js Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        return user
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

## 7. Background Jobs (Semplificato)

### 7.1 Job Queue con BullMQ (Opzionale)

```typescript
// lib/queue/queue.ts
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!)

export const documentQueue = new Queue('documents', { connection })

// Worker
const worker = new Worker(
  'documents',
  async (job) => {
    switch (job.name) {
      case 'generate-preview':
        await generatePreview(job.data.documentId)
        break
      case 'send-notification':
        await sendNotification(job.data)
        break
    }
  },
  { connection }
)
```

### 7.2 Alternative: API Routes + Vercel Cron

```typescript
// app/api/cron/process-analytics/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Process analytics
  await analyticsService.aggregateDaily()

  return NextResponse.json({ success: true })
}
```

## 8. Deployment Architecture

### 8.1 Vercel Deployment (Opzione 1)

```
┌─────────────────────────────────────────┐
│  Vercel Edge Network (CDN)              │
│  - Static assets                        │
│  - Cached pages                         │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Vercel Serverless Functions            │
│  - Next.js App                          │
│  - API Routes                           │
│  - Server Actions                       │
└─────────────────────────────────────────┘
                 ↓
┌──────────────┬──────────────┬───────────┐
│  Vercel      │  S3/Azure    │  Upstash  │
│  Postgres    │  Storage     │  Redis    │
└──────────────┴──────────────┴───────────┘
```

### 8.2 Docker Self-Hosted (Opzione 2)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/dataroom
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=dataroom
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 9. Costi Stimati

### 9.1 Scenario Vercel (1000 utenti, 10k docs)

- Vercel Pro: $20/mese
- Vercel Postgres: $20-50/mese
- S3 Storage (100GB): $2.30/mese
- S3 Transfer (50GB): $4.50/mese
- Upstash Redis: $10/mese
- Resend Email: $20/mese (10k emails)

**Totale: ~$75-110/mese**

### 9.2 Scenario Self-Hosted (1000 utenti, 10k docs)

- VPS (4 vCPU, 8GB RAM): $25/mese
- Managed Postgres: $15/mese
- S3 Storage: $2.30/mese
- S3 Transfer: $4.50/mese
- Redis (self-hosted): $0

**Totale: ~$45-50/mese**

**Risparmio: ~40-55%** rispetto a Vercel
