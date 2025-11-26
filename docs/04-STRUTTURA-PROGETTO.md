# Struttura Progetto - Virtual Data Room

## 1. Directory Tree Completa

```
dataroom/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # CI/CD pipeline
│   │   └── deploy.yml                # Deployment automation
│   └── instructions/
│       └── copilot.instructions.md   # AI coding guidelines
│
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/                  # Protected routes
│   │   ├── documents/
│   │   │   ├── page.tsx              # List documents
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # Document detail
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   │
│   │   ├── datarooms/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── [folderId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   │
│   │   ├── links/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── analytics/
│   │   │           └── page.tsx
│   │   │
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   │
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── team/
│   │   │   │   └── page.tsx
│   │   │   ├── security/
│   │   │   │   └── page.tsx
│   │   │   └── billing/
│   │   │       └── page.tsx
│   │   │
│   │   └── layout.tsx                # Dashboard layout with sidebar
│   │
│   ├── (public)/                     # Public routes
│   │   ├── view/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx          # Public viewer
│   │   │       └── verify/
│   │   │           └── page.tsx      # Email/password verification
│   │   └── layout.tsx
│   │
│   ├── api/                          # API Routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts          # NextAuth handler
│   │   │   ├── signup/
│   │   │   │   └── route.ts
│   │   │   └── verify-email/
│   │   │       └── route.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── route.ts              # GET, POST
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts          # GET, PATCH, DELETE
│   │   │   │   └── upload/
│   │   │   │       └── route.ts      # File upload
│   │   │   └── bulk/
│   │   │       └── route.ts
│   │   │
│   │   ├── links/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── [slug]/
│   │   │       ├── route.ts          # Public link access
│   │   │       └── verify/
│   │   │           └── route.ts
│   │   │
│   │   ├── datarooms/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── folders/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── documents/
│   │   │   │   │   └── route.ts
│   │   │   │   └── viewers/
│   │   │   │       └── route.ts
│   │   │   └── [slug]/
│   │   │       └── route.ts          # Public dataroom
│   │   │
│   │   ├── teams/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── members/
│   │   │       │   └── route.ts
│   │   │       └── invites/
│   │   │           └── route.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── documents/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── links/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── datarooms/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── track/
│   │   │       └── route.ts          # Track view event
│   │   │
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   │       └── route.ts
│   │   │
│   │   └── cron/
│   │       ├── aggregate-analytics/
│   │       │   └── route.ts
│   │       └── cleanup/
│   │           └── route.ts
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home/landing page
│   ├── error.tsx                     # Global error handler
│   ├── not-found.tsx                 # 404 page
│   └── global.css                    # Global styles
│
├── components/                       # React components
│   ├── ui/                           # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   │
│   ├── layouts/                      # Layout components
│   │   ├── dashboard-layout.tsx
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── mobile-menu.tsx
│   │
│   ├── auth/                         # Auth components
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   ├── oauth-buttons.tsx
│   │   └── password-reset-form.tsx
│   │
│   ├── documents/                    # Document components
│   │   ├── document-card.tsx
│   │   ├── document-list.tsx
│   │   ├── document-grid.tsx
│   │   ├── document-upload.tsx
│   │   ├── document-upload-zone.tsx
│   │   ├── document-viewer.tsx
│   │   ├── document-preview.tsx
│   │   ├── document-settings-form.tsx
│   │   └── document-version-list.tsx
│   │
│   ├── datarooms/                    # Dataroom components
│   │   ├── dataroom-card.tsx
│   │   ├── dataroom-list.tsx
│   │   ├── dataroom-form.tsx
│   │   ├── folder-tree.tsx
│   │   ├── folder-node.tsx
│   │   ├── folder-upload.tsx
│   │   ├── permissions-manager.tsx
│   │   └── viewer-list.tsx
│   │
│   ├── links/                        # Link components
│   │   ├── link-card.tsx
│   │   ├── link-list.tsx
│   │   ├── link-config-form.tsx
│   │   ├── link-stats.tsx
│   │   ├── link-access-form.tsx
│   │   └── share-dialog.tsx
│   │
│   ├── analytics/                    # Analytics components
│   │   ├── analytics-dashboard.tsx
│   │   ├── views-chart.tsx
│   │   ├── stats-cards.tsx
│   │   ├── page-heatmap.tsx
│   │   ├── visitor-table.tsx
│   │   ├── geographic-map.tsx
│   │   └── device-breakdown.tsx
│   │
│   ├── teams/                        # Team components
│   │   ├── team-switcher.tsx
│   │   ├── team-members.tsx
│   │   ├── invite-member-dialog.tsx
│   │   └── member-role-select.tsx
│   │
│   └── shared/                       # Shared components
│       ├── loading-spinner.tsx
│       ├── skeleton-loader.tsx
│       ├── error-boundary.tsx
│       ├── empty-state.tsx
│       ├── confirm-dialog.tsx
│       ├── copy-button.tsx
│       ├── date-picker.tsx
│       └── file-icon.tsx
│
├── lib/                              # Core library code
│   ├── actions/                      # Server Actions
│   │   ├── document-actions.ts
│   │   ├── link-actions.ts
│   │   ├── dataroom-actions.ts
│   │   └── team-actions.ts
│   │
│   ├── services/                     # Business logic
│   │   ├── document-service.ts
│   │   ├── link-service.ts
│   │   ├── dataroom-service.ts
│   │   ├── analytics-service.ts
│   │   ├── auth-service.ts
│   │   ├── email-service.ts
│   │   └── notification-service.ts
│   │
│   ├── repositories/                 # Data access
│   │   ├── document-repository.ts
│   │   ├── link-repository.ts
│   │   ├── dataroom-repository.ts
│   │   ├── user-repository.ts
│   │   └── audit-repository.ts
│   │
│   ├── storage/                      # Storage abstraction
│   │   ├── storage-provider.ts       # Interface
│   │   ├── s3-provider.ts
│   │   ├── azure-provider.ts
│   │   └── factory.ts
│   │
│   ├── email/                        # Email templates & sending
│   │   ├── templates/
│   │   │   ├── welcome.tsx
│   │   │   ├── invite.tsx
│   │   │   ├── notification.tsx
│   │   │   └── reset-password.tsx
│   │   └── sender.ts
│   │
│   ├── validations/                  # Zod schemas
│   │   ├── auth-schemas.ts
│   │   ├── document-schemas.ts
│   │   ├── link-schemas.ts
│   │   ├── dataroom-schemas.ts
│   │   └── team-schemas.ts
│   │
│   ├── utils/                        # Utility functions
│   │   ├── cn.ts                     # Class name utility
│   │   ├── date.ts
│   │   ├── file.ts
│   │   ├── slug.ts
│   │   ├── hash.ts
│   │   └── format.ts
│   │
│   ├── hooks/                        # React hooks
│   │   ├── use-user.ts
│   │   ├── use-team.ts
│   │   ├── use-documents.ts
│   │   ├── use-analytics.ts
│   │   └── use-toast.ts
│   │
│   ├── middleware/                   # Middleware functions
│   │   ├── auth-middleware.ts
│   │   ├── rate-limit.ts
│   │   └── error-handler.ts
│   │
│   ├── db.ts                         # Prisma client singleton
│   ├── auth.ts                       # NextAuth config
│   ├── constants.ts                  # App constants
│   └── types.ts                      # Shared TypeScript types
│
├── prisma/                           # Prisma ORM
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Database migrations
│   │   └── ...
│   └── seed.ts                       # Seed data script
│
├── public/                           # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   └── ...
│   ├── fonts/
│   └── favicon.ico
│
├── docs/                             # Documentation
│   ├── 01-ANALISI-PAPERMARK.md
│   ├── 02-REQUISITI-FUNZIONALI.md
│   ├── 03-ARCHITETTURA-TECNICA.md
│   ├── 04-STRUTTURA-PROGETTO.md
│   ├── 05-API-DOCUMENTATION.md
│   └── 06-DEPLOYMENT-GUIDE.md
│
├── scripts/                          # Utility scripts
│   ├── generate-migration.sh
│   ├── seed-dev-data.ts
│   └── cleanup-storage.ts
│
├── tests/                            # Tests
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       └── ...
│
├── .env.example                      # Environment variables template
├── .env.local                        # Local environment (gitignored)
├── .eslintrc.json                    # ESLint config
├── .prettierrc                       # Prettier config
├── .gitignore
├── components.json                   # Shadcn config
├── docker-compose.yml                # Docker Compose config
├── Dockerfile                        # Docker image
├── next.config.js                    # Next.js config
├── package.json
├── postcss.config.js                 # PostCSS config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── vercel.json                       # Vercel config (optional)
└── README.md
```

## 2. Convenzioni di Naming

### 2.1 Files e Directory

- **Componenti React**: PascalCase (`DocumentCard.tsx`, `LinkList.tsx`)
- **Utilities e Services**: kebab-case (`document-service.ts`, `format-date.ts`)
- **Route files**: lowercase (`page.tsx`, `layout.tsx`, `route.ts`)
- **Costanti**: SCREAMING_SNAKE_CASE nel contenuto, kebab-case per file (`constants.ts`)

### 2.2 Codice

#### TypeScript/JavaScript
```typescript
// Interfaces e Types: PascalCase
interface UserProfile {}
type DocumentType = 'pdf' | 'docx'

// Variables e Functions: camelCase
const userName = 'John'
function calculateTotal() {}

// Classes: PascalCase
class DocumentService {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 100 * 1024 * 1024

// Enums: PascalCase
enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
}
```

#### React Components
```typescript
// Component names: PascalCase
export function DocumentCard() {}

// Props interface: ComponentNameProps
interface DocumentCardProps {
  document: Document
}

// Event handlers: handleEventName
const handleClick = () => {}
const handleSubmit = () => {}
```

#### Database (Prisma)
```prisma
// Model names: PascalCase singular
model User {}
model Document {}

// Field names: camelCase
model Document {
  fileName    String
  createdAt   DateTime
}

// Enum names: PascalCase
enum Role {
  OWNER
  ADMIN
}
```

### 2.3 API Routes

```
GET    /api/documents              # List resources
POST   /api/documents              # Create resource
GET    /api/documents/[id]         # Get single resource
PATCH  /api/documents/[id]         # Update resource
DELETE /api/documents/[id]         # Delete resource
POST   /api/documents/[id]/upload  # Action on resource
```

## 3. File Templates

### 3.1 API Route Template

```typescript
// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { documentService } from '@/lib/services/document-service'
import { createDocumentSchema } from '@/lib/validations/document-schemas'
import { z } from 'zod'

/**
 * GET /api/documents
 * List all documents for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    const documents = await documentService.getUserDocuments(
      session.user.id,
      teamId
    )

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/documents
 * Create a new document
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createDocumentSchema.parse(body)

    const document = await documentService.create({
      ...validated,
      userId: session.user.id,
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3.2 Service Template

```typescript
// lib/services/document-service.ts
import { PrismaClient, Document } from '@prisma/client'
import { StorageProvider } from '@/lib/storage/storage-provider'
import { createDocumentSchema } from '@/lib/validations/document-schemas'
import { z } from 'zod'

export interface CreateDocumentParams {
  name: string
  file: File
  userId: string
  teamId?: string
  folderId?: string
}

export class DocumentService {
  constructor(
    private prisma: PrismaClient,
    private storage: StorageProvider
  ) {}

  /**
   * Create a new document
   */
  async create(params: CreateDocumentParams): Promise<Document> {
    // 1. Validate input
    const validated = createDocumentSchema.parse(params)

    // 2. Upload file to storage
    const fileKey = `documents/${validated.userId}/${Date.now()}-${validated.file.name}`
    const fileUrl = await this.storage.upload(validated.file, fileKey)

    // 3. Create database record
    const document = await this.prisma.document.create({
      data: {
        name: validated.name,
        file: fileUrl,
        fileKey,
        type: validated.file.type,
        size: validated.file.size,
        userId: validated.userId,
        teamId: validated.teamId,
        folderId: validated.folderId,
      },
    })

    // 4. Queue background job for preview generation
    // await queueService.enqueue('generate-preview', { documentId: document.id })

    return document
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(
    userId: string,
    teamId?: string | null
  ): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        userId,
        ...(teamId && { teamId }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        user: true,
        team: true,
        folder: true,
      },
    })
  }

  /**
   * Update a document
   */
  async update(
    id: string,
    data: Partial<CreateDocumentParams>
  ): Promise<Document> {
    return this.prisma.document.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.folderId && { folderId: data.folderId }),
      },
    })
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    const document = await this.getById(id)
    if (!document) throw new Error('Document not found')

    // Delete from storage
    await this.storage.delete(document.fileKey)

    // Delete from database
    await this.prisma.document.delete({
      where: { id },
    })
  }
}

// Singleton export
import { prisma } from '@/lib/db'
import { getStorageProvider } from '@/lib/storage/factory'

export const documentService = new DocumentService(prisma, getStorageProvider())
```

### 3.3 Component Template

```typescript
// components/documents/document-card.tsx
'use client'

import { Document } from '@prisma/client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { FileIcon, MoreVertical } from 'lucide-react'
import { formatDate } from '@/lib/utils/date'
import { formatBytes } from '@/lib/utils/format'

interface DocumentCardProps {
  document: Document
  onView?: (document: Document) => void
  onShare?: (document: Document) => void
  onDelete?: (document: Document) => void
}

export function DocumentCard({
  document,
  onView,
  onShare,
  onDelete,
}: DocumentCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold truncate">{document.name}</h3>
        </div>
        
        <DropdownMenu>
          {/* Menu items */}
        </DropdownMenu>
      </CardHeader>

      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Size: {formatBytes(document.size)}</p>
          <p>Created: {formatDate(document.createdAt)}</p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onView?.(document)}>
          View
        </Button>
        <Button onClick={() => onShare?.(document)}>
          Share
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### 3.4 Zod Schema Template

```typescript
// lib/validations/document-schemas.ts
import { z } from 'zod'

export const createDocumentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 100 * 1024 * 1024, {
      message: 'File must be less than 100MB',
    })
    .refine(
      (file) => {
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/png',
          'image/jpeg',
        ]
        return allowedTypes.includes(file.type)
      },
      { message: 'Invalid file type' }
    ),
  userId: z.string(),
  teamId: z.string().optional(),
  folderId: z.string().optional(),
})

export const updateDocumentSchema = createDocumentSchema
  .partial()
  .omit({ file: true, userId: true })

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
```

## 4. Environment Variables

### 4.1 .env.example

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dataroom"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# Storage (choose one)
STORAGE_PROVIDER="s3" # or "azure"

# AWS S3
STORAGE_BUCKET="dataroom-documents"
STORAGE_REGION="us-east-1"
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=""
STORAGE_CONTAINER="documents"

# Email
EMAIL_PROVIDER="resend" # or "ses"
RESEND_API_KEY=""
AWS_SES_ACCESS_KEY=""
AWS_SES_SECRET_KEY=""
EMAIL_FROM="noreply@dataroom.com"

# Redis (optional, for caching and rate limiting)
REDIS_URL="redis://localhost:6379"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="DataRoom"

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST=""

# Cron Secret (for scheduled jobs)
CRON_SECRET="your-cron-secret"
```

## 5. Configuration Files

### 5.1 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.core.windows.net',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
}

module.exports = nextConfig
```

### 5.2 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 5.3 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... other colors from shadcn
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}

export default config
```

## 6. Git Workflow

### 6.1 Branch Strategy

```
main                    # Production branch
├── develop             # Development branch
│   ├── feature/...     # Feature branches
│   ├── bugfix/...      # Bug fix branches
│   └── hotfix/...      # Hotfix branches
```

### 6.2 Commit Convention

```
feat: add document upload functionality
fix: resolve authentication bug
docs: update API documentation
style: format code with prettier
refactor: reorganize service layer
test: add tests for document service
chore: update dependencies
```

## 7. Next Steps

Con questa struttura ben definita, possiamo procedere a:

1. **Inizializzare il progetto Next.js**
2. **Configurare Shadcn UI**
3. **Setup Prisma con lo schema database**
4. **Implementare l'astrazione storage**
5. **Configurare NextAuth.js**
6. **Creare i primi moduli (documenti, link)**
7. **Setup Docker per lo sviluppo e deployment**

La struttura è modulare, scalabile e segue le best practice di Next.js 14 con App Router.
