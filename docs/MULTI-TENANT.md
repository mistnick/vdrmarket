# Multi-Tenant Architecture Documentation

## Overview

SimpleVDR implements a comprehensive multi-tenant architecture that allows multiple organizations (tenants) to share the same application infrastructure while maintaining complete data isolation.

## Data Model

### Hierarchy

```
Plans → Tenants → DataRooms → Groups → Users
                            → Folders → Documents
```

### Core Entities

#### Plans
Define pricing tiers and feature limits:
- `name`: Plan display name (e.g., "Starter", "Professional", "Enterprise")
- `maxVdr`: Maximum data rooms allowed (-1 = unlimited)
- `maxAdminUsers`: Maximum tenant admin users (-1 = unlimited)
- `maxStorageMb`: Storage limit in MB (-1 = unlimited)
- `durationDays`: Plan duration in days (null = unlimited)
- `price`, `currency`: Pricing information
- `features`: JSON array of enabled features

#### Tenants
Organizations that own data rooms:
- `name`: Organization display name
- `slug`: URL-friendly unique identifier
- `status`: ACTIVE, INACTIVE, SUSPENDED, DELETED
- `planId`: Associated plan
- `planExpiresAt`: When the current plan expires
- `storageUsedMb`: Current storage usage
- `logo`, `website`, `settings`: Customization options

#### TenantUser (Join Table)
Maps users to tenants with roles:
- `role`: TENANT_ADMIN, MEMBER, VIEWER
- `status`: ACTIVE, INACTIVE, PENDING
- `joinedAt`: When user joined the tenant

### New Enums

```prisma
enum TenantStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}

enum TenantUserRole {
  TENANT_ADMIN
  MEMBER
  VIEWER
}

enum TenantUserStatus {
  ACTIVE
  INACTIVE
  PENDING
}
```

## Module Structure

```
lib/tenant/
├── index.ts       # Re-exports all modules
├── types.ts       # TypeScript interfaces
├── context.ts     # Tenant resolution & validation
├── service.ts     # Business logic (CRUD)
└── guards.ts      # Middleware/guards
```

## API Endpoints

### Super Admin APIs (requires isSuperAdmin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/tenants` | List all tenants |
| POST | `/api/admin/tenants` | Create new tenant |
| GET | `/api/admin/tenants/[id]` | Get tenant details |
| PUT | `/api/admin/tenants/[id]` | Update tenant |
| DELETE | `/api/admin/tenants/[id]` | Soft delete tenant |
| GET | `/api/admin/tenants/[id]/users` | List tenant users |
| POST | `/api/admin/tenants/[id]/users` | Add user to tenant |
| GET | `/api/admin/plans` | List all plans |
| POST | `/api/admin/plans` | Create plan |
| GET | `/api/admin/plans/[id]` | Get plan details |
| PUT | `/api/admin/plans/[id]` | Update plan |
| DELETE | `/api/admin/plans/[id]` | Soft delete plan |

### Tenant Selection APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants` | List user's tenants |
| POST | `/api/tenants/select` | Select current tenant |
| GET | `/api/tenants/current` | Get current tenant context |
| DELETE | `/api/tenants/current` | Clear current tenant |

### Tenant Management APIs (requires TENANT_ADMIN role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tenants/users` | List tenant users |
| POST | `/api/tenants/users` | Invite user to tenant |
| PUT | `/api/tenants/users/[id]` | Update user role/status |
| DELETE | `/api/tenants/users/[id]` | Remove user from tenant |
| GET | `/api/tenants/usage` | Get usage statistics |

## Access Control

### Levels

1. **Super Admin**: Full system access, can manage all tenants
2. **Tenant Admin**: Can manage their tenant's users and settings
3. **Member**: Standard access to tenant's data rooms
4. **Viewer**: Read-only access

### Guards

```typescript
// Require authenticated user
requireAuth(request)

// Require super admin
requireSuperAdmin(request)

// Require tenant context
requireTenantContext(request)

// Require tenant admin role
requireTenantAdmin(request)

// Higher-order guard wrapper
withTenantContext(handler)
```

## Tenant Resolution

Tenant context is resolved in this order:
1. Cookie: `current-tenant`
2. Header: `X-Tenant-ID`
3. Subdomain: `{tenant-slug}.simplevdr.com`

```typescript
const tenantId = await resolveTenantId(request);
```

## Plan Limits

### Checking Limits

```typescript
import { canCreateVdr, canAddAdminUser, canUseStorage } from "@/lib/tenant";

// Check if tenant can create another VDR
const canCreate = await canCreateVdr(tenantId);

// Check if tenant can add another admin
const canAddAdmin = await canAddAdminUser(tenantId);

// Check if tenant has storage available
const hasStorage = await canUseStorage(tenantId, fileSizeInMb);
```

### Usage Tracking

Storage is automatically tracked via database trigger on document uploads.

## React Integration

### Provider Setup

```tsx
// app/layout.tsx or app/(dashboard)/layout.tsx
import { TenantProvider } from "@/hooks/use-tenant";

export default function Layout({ children }) {
  return (
    <TenantProvider>
      {children}
    </TenantProvider>
  );
}
```

### Using Hooks

```tsx
import { useTenant, useTenantUsage, usePlanLimits } from "@/hooks/use-tenant";

function MyComponent() {
  const { currentTenant, selectTenant, clearTenant } = useTenant();
  const { usage, loading } = useTenantUsage();
  const { canCreateVdr, canAddAdmin, checkStorage } = usePlanLimits();
  
  // ...
}
```

## Migration

### Running Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name multi_tenant

# Or in production
npx prisma migrate deploy
```

### Default Plans

The migration seeds three default plans:
- **Starter**: 3 VDRs, 2 admins, 1GB storage
- **Professional**: 10 VDRs, 5 admins, 10GB storage
- **Enterprise**: Unlimited VDRs, unlimited admins, 100GB storage

## GDPR Compliance

### Soft Delete

All deletions are soft deletes:
- Tenants: `status = DELETED`, `deletedAt = now()`
- Users: `status = INACTIVE` in TenantUser

### Audit Logging

All tenant operations are logged to `TenantAuditLog`:
- User invitations
- Role changes
- Plan changes
- Tenant modifications

### Data Export

Tenant admins can export all their data via the usage API.

## Security Considerations

1. **Tenant Isolation**: All queries must include tenant ID filter
2. **Cross-Tenant Access**: Prevented at middleware and query level
3. **Role Verification**: Always verify user's role in current tenant
4. **Session Binding**: Tenant selection stored in secure cookie
5. **Audit Trail**: All sensitive operations logged

## Testing

### Test Tenant Selection

```bash
# Select tenant
curl -X POST http://localhost:3000/api/tenants/select \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "your-tenant-id"}'

# Get current tenant
curl http://localhost:3000/api/tenants/current

# Clear tenant
curl -X DELETE http://localhost:3000/api/tenants/current
```

### Test Data Room with Tenant

```bash
# List data rooms (filtered by tenant)
curl http://localhost:3000/api/datarooms

# Create data room (associated with current tenant)
curl -X POST http://localhost:3000/api/datarooms \
  -H "Content-Type: application/json" \
  -d '{"name": "My VDR", "description": "Test"}'
```
