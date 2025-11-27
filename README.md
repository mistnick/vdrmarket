# DataRoom - Virtual Data Room Platform

A modern, secure Virtual Data Room platform built with Next.js, inspired by Papermark. Manage and share documents securely with advanced tracking, permissions, and audit capabilities.

## 📊 Project Status

**Current Phase**: ✅ Core Features Implemented  
**Progress**: 60% (Authentication, Documents, Data Rooms, Sharing)  
**Build Status**: ✅ Passing (45 routes)  
**Next Milestone**: Email Service, WebSocket, Testing Expansion

### 📚 Planning Documents
- [📋 Task List](docs/00-PROJECT-STATUS.md) - Current roadmap and progress tracking
- [🎯 Implementation Plan](docs/00-PROJECT-STATUS.md) - Detailed technical plan with code examples
- [📖 Technical Documentation](docs/) - Architecture, requirements, and analysis

## 🚀 Features

- **Document Management**: Upload, organize, and manage documents with folder structure
- **Virtual Data Rooms**: Create secure data rooms with granular permissions
- **Secure Sharing**: Generate secure links with password protection, expiration, and email verification
- **Advanced Tracking**: Track views, downloads, engagement metrics, and user behavior
- **Team Collaboration**: Multi-user teams with role-based access control
- **Audit Trail**: Complete audit log of all activities
- **OAuth Authentication**: Google and Microsoft authentication support
- **Flexible Storage**: Support for AWS S3 and Azure Blob Storage

## 🛠️ Technology Stack

- **Frontend & Backend**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js)
- **UI Components**: Shadcn UI + Tailwind CSS
- **Storage**: AWS S3 / Azure Blob Storage (configurable)
- **Deployment**: Docker + Docker Compose

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- PostgreSQL 16+ (if running without Docker)

## 🚢 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dataroom
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - DATABASE_URL (PostgreSQL)
   # - NEXTAUTH_SECRET & AUTH_SECRET
   # - STORAGE_PROVIDER (s3 or azure)
   # - RESEND_API_KEY (for email notifications)
   # - EMAIL_FROM (sender email)
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Application: http://localhost:3000
   - MinIO Console (S3): http://localhost:9001 (minioadmin/minioadmin)
   - PostgreSQL: localhost:5432 (postgres/postgres)

5. **Create MinIO bucket** (first time only)
   - Go to http://localhost:9001
   - Login with minioadmin/minioadmin
   - Create a bucket named "dataroom"

## 💻 Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL** (if not using Docker)
   ```bash
   # Using Docker for PostgreSQL only
   docker-compose up postgres -d
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🗄️ Database Management

### Create a migration
```bash
npx prisma migrate dev --name your_migration_name
```

### View database in Prisma Studio
```bash
npx prisma studio
```

### Reset database (⚠️ destroys all data)
```bash
npx prisma migrate reset
```

## 🔐 Authentication Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI: `http://localhost:3000/api/auth/callback/microsoft`
4. Create a client secret
5. Copy Application ID and Client Secret to `.env`

## 📦 Storage Configuration

### AWS S3
```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
```

### Azure Blob Storage
```env
STORAGE_PROVIDER=azure
AZURE_STORAGE_ACCOUNT_NAME=your_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_account_key
AZURE_STORAGE_CONTAINER_NAME=your_container_name
```

### MinIO (Local Development)
```env
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=dataroom
AWS_ENDPOINT=http://localhost:9000
```

### Aruba Cloud Object Storage (or OpenStack Swift S3-compatible)
```env
STORAGE_PROVIDER=s3
AWS_REGION=r1-it
AWS_ACCESS_KEY_ID=your_username
AWS_SECRET_ACCESS_KEY=your_password
AWS_S3_BUCKET=dataroom
AWS_ENDPOINT=http://r1-it.storage.cloud.it
AWS_S3_FORCE_PATH_STYLE=true
```

## 🏗️ Project Structure

```
dataroom/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── auth/                 # Authentication pages
│   └── (dashboard)/          # Protected dashboard routes
├── components/               # React components
│   ├── ui/                   # Shadcn UI components
│   ├── layouts/              # Layout components
│   └── features/             # Feature-specific components
├── lib/                      # Utility libraries
│   ├── auth/                 # Authentication logic
│   ├── db/                   # Database client
│   ├── storage/              # Storage abstraction
│   └── utils/                # Helper functions
├── prisma/                   # Database schema and migrations
│   └── schema.prisma         # Prisma schema
├── types/                    # TypeScript type definitions
├── public/                   # Static assets
└── docs/                     # Documentation
```

## 📚 API Documentation

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/[id]` - Get team details
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Upload document
- `GET /api/documents/[id]` - Get document details
- `PATCH /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document

### Links
- `GET /api/links` - List share links
- `POST /api/links` - Create share link
- `GET /api/links/[slug]` - Get link details
- `PATCH /api/links/[slug]` - Update link
- `DELETE /api/links/[slug]` - Delete link

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# Access database
docker-compose exec postgres psql -U postgres -d dataroom
```

## 📊 Monitoring & Logs

View application logs:
```bash
docker-compose logs -f app
```

View database logs:
```bash
docker-compose logs -f postgres
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as a template
2. **Use strong secrets** - Generate random strings for `NEXTAUTH_SECRET`
3. **Enable HTTPS in production** - Use a reverse proxy like nginx
4. **Implement rate limiting** - Protect API endpoints
5. **Regular updates** - Keep dependencies up to date
6. **Backup database** - Regular automated backups

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [Papermark](https://github.com/mfts/papermark)
- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn UI](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Made with ❤️ by the DataRoom team
