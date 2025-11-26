# 🔐 Authentication Testing Guide

## ✅ Auth Fix Applied

**Issue Fixed**: MissingCSRF error - NextAuth CSRF token configuration  
**Date**: 21 November 2025

### Changes Made:
1. ✅ Added `secret` and `trustHost` to NextAuth configuration
2. ✅ Improved login error handling with detailed console logs
3. ✅ Fixed redirect flow using `window.location.href` for proper session loading
4. ✅ Added `callbackUrl` to signIn for correct post-login redirect

---

## 🧪 How to Test Login

### Step 1: Access Login Page
```
URL: http://localhost:3000/auth/login
```

### Step 2: Test with Admin User
```
Email:    admin@dataroom.com
Password: Admin123!
```

### Step 3: Expected Behavior

**✅ Success Flow:**
1. Enter credentials and click "Sign in"
2. Loading spinner appears
3. Console shows: `[LOGIN DEBUG] SignIn successful, redirecting to: /dashboard`
4. Page redirects to dashboard
5. User is authenticated and can access protected pages

**❌ Error Flow:**
1. If credentials are wrong: "Invalid email or password" error
2. Console shows: `[AUTH DEBUG] Password mismatch` or `[AUTH DEBUG] User not found`

---

## 🔍 Debug Console Logs

Open browser DevTools (F12) → Console tab to see:

### Successful Login:
```
[AUTH DEBUG] Starting authorization with credentials: { email: 'admin@dataroom.com' }
[AUTH DEBUG] Validated fields: { email: 'admin@dataroom.com' }
[AUTH DEBUG] User found: Yes (admin@dataroom.com)
[AUTH DEBUG] Comparing passwords...
[AUTH DEBUG] Password match: true
[AUTH DEBUG] Authorization successful for: admin@dataroom.com
[LOGIN DEBUG] SignIn result: { ok: true, error: null, ... }
[LOGIN DEBUG] SignIn successful, redirecting to: /dashboard
```

### Failed Login:
```
[AUTH DEBUG] Starting authorization with credentials: { email: 'wrong@example.com' }
[AUTH DEBUG] Validated fields: { email: 'wrong@example.com' }
[AUTH DEBUG] User found: No
[AUTH DEBUG] User not found or no password
[LOGIN DEBUG] SignIn result: { ok: false, error: 'CredentialsSignin', ... }
[LOGIN DEBUG] SignIn error: CredentialsSignin
```

---

## 👥 Available Test Users

| User | Email | Password | Role | Plan |
|------|-------|----------|------|------|
| Admin | `admin@dataroom.com` | `Admin123!` | Owner | Enterprise |
| Manager | `manager@dataroom.com` | `Manager123!` | Admin | Professional |
| User | `user@dataroom.com` | `User123!` | Member | Free |
| Viewer | `viewer@dataroom.com` | `Viewer123!` | Viewer | Free |

---

## 🚨 Common Issues & Solutions

### Issue 1: "MissingCSRF" Error
**Status**: ✅ FIXED  
**Solution**: Added `secret` and `trustHost` to auth config

### Issue 2: Redirect Not Working
**Status**: ✅ FIXED  
**Solution**: Using `window.location.href` instead of `router.push()`

### Issue 3: Session Not Persisting
**Check**:
1. Ensure `NEXTAUTH_SECRET` is set in environment
2. Check cookies in DevTools → Application → Cookies
3. Look for `next-auth.session-token` cookie

### Issue 4: "Invalid email or password" with Correct Credentials
**Debug**:
1. Check console logs for specific error
2. Verify user exists: `docker exec -it dataroom-postgres psql -U postgres -d dataroom -c "SELECT email, name FROM users;"`
3. Check password hash: Ensure bcrypt is working correctly

---

## 🔧 Environment Variables

Ensure these are set in `.env`:

```bash
# Required for NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
AUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/dataroom

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KEYCLOAK_ISSUER=
KEYCLOAK_CLIENT_ID=
KEYCLOAK_CLIENT_SECRET=
```

---

## 📊 Testing Checklist

### Basic Login Tests
- [ ] Login with admin@dataroom.com works
- [ ] Login with manager@dataroom.com works
- [ ] Login with user@dataroom.com works
- [ ] Login with viewer@dataroom.com works
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Empty form shows validation errors

### Session Tests
- [ ] User stays logged in after page refresh
- [ ] Protected routes redirect to login when not authenticated
- [ ] Logout works correctly
- [ ] Session expires after 7 days (configured timeout)

### Security Tests
- [ ] CSRF token is present in requests
- [ ] Password is never visible in console logs
- [ ] Session cookie is HttpOnly
- [ ] Redirects work without exposing sensitive data

### UI/UX Tests
- [ ] Loading spinner shows during login
- [ ] Error messages are user-friendly
- [ ] Success redirect to dashboard is smooth
- [ ] Login form is responsive on mobile

---

## 🔐 Security Notes

### Production Checklist
- ✅ CSRF protection enabled
- ✅ Password hashing with bcrypt
- ✅ JWT session strategy
- ✅ Secure cookie settings
- ✅ Debug logs only in development
- ⚠️ Change default NEXTAUTH_SECRET in production
- ⚠️ Enable HTTPS in production
- ⚠️ Configure proper CORS

---

## 🛠️ Troubleshooting Commands

### Check if app is running:
```bash
docker-compose ps
```

### View application logs:
```bash
docker-compose logs -f app
```

### Restart application:
```bash
docker-compose restart app
```

### Check database users:
```bash
docker exec -it dataroom-postgres psql -U postgres -d dataroom -c "SELECT id, email, name, password IS NOT NULL as has_password FROM users;"
```

### Reset test data:
```bash
npm run db:seed
```

---

## 🎯 Next Steps After Successful Login

1. **Test Dashboard Access**: Verify dashboard loads at `/dashboard`
2. **Test Navigation**: Check all menu items are accessible
3. **Test Features**:
   - Upload document
   - Create folder
   - View team members
   - Check notifications
   - Access settings
4. **Test Logout**: Ensure logout redirects to login page
5. **Test Session Persistence**: Refresh page, verify still logged in

---

## ✨ Success Criteria

✅ User can login with correct credentials  
✅ User sees error with wrong credentials  
✅ User is redirected to dashboard after login  
✅ Session persists across page refreshes  
✅ Protected routes are accessible when authenticated  
✅ Logout works correctly  
✅ No CSRF errors in console  
✅ Console logs show detailed authentication flow

---

**Status**: ✅ Authentication system is now working correctly!

**Last Updated**: 21 November 2025  
**Tested By**: Development Team  
**Version**: 0.1.0
