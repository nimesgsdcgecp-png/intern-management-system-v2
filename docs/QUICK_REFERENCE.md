# QUICK REFERENCE - INTERN MANAGEMENT SYSTEM

## 🎯 ONE-LINER
A full-stack role-based intern management system with React frontend, Next.js backend, GraphQL API layer, and PostgreSQL database using modern security and state management patterns.

---

## 📊 QUICK STATS

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 16.1.7 (React 19, TypeScript) |
| **Database** | PostgreSQL 15 + Hasura GraphQL 2.33.4 |
| **Authentication** | NextAuth.js 4.24.13 (JWT + Credentials) |
| **State Management** | Redux Toolkit 2.11.2 |
| **Styling** | Tailwind CSS 4 + Framer Motion 12 |
| **API Routes** | 23+ endpoints (Auth, CRUD, Email, Events, Attendance, Admin, Activity, Search) |
| **UI Components** | 20+ reusable components |
| **Pages** | 23+ dashboard and feature pages |
| **Roles** | Admin, Mentor, Intern (3-tier) |
| **Security** | bcryptjs hashing, HttpOnly cookies, role-based access control, JWT tokens |
| **Deployment** | Docker (local), cloud-ready (Vercel, AWS EC2) |

---

## 🏗️ ARCHITECTURE AT A GLANCE

```
User Browser → Next.js (SSR/CSR) → API Routes → Hasura GraphQL → PostgreSQL
                     ↓
                Redux Store (UI state only)
```

**Three Tiers:**
1. **Frontend (45%)**: React components, pages, UI state (Redux)
2. **Backend (30%)**: Next.js API routes, auth, validation
3. **Data (25%)**: Hasura GraphQL layer + PostgreSQL

---

## 🔐 SECURITY SUMMARY

| Layer | Technology | Protection |
|-------|-----------|-----------|
| **Transport** | HTTPS | Encrypted data in transit |
| **Authentication** | JWT + NextAuth | Secure session tokens |
| **Password** | bcryptjs (10 rounds) | Hashed, never plaintext |
| **Authorization** | Role-based access | Admin/Mentor/Intern checks |
| **Database** | Hasura permissions | Row-level security |
| **Secrets** | Environment variables | Never committed to repo |

---

## 🌐 SSR vs CSR BREAKDOWN

| Aspect | SSR | CSR |
|--------|-----|-----|
| **When** | Page load | After JavaScript loads |
| **What** | HTML rendered on server | HTML rendered in browser |
| **Where Used** | Initial layout, metadata | Dashboards, forms, auth |
| **Speed** | Slower first load | Faster interactions |
| **SEO** | Better (content in HTML) | Worse (JS-dependent) |

**This Project:** Uses both - SSR for initial page structure, CSR for interactive dashboards

---

## 📁 FOLDER STRUCTURE

```
app/
├── api/                 # Backend API routes (23+ endpoints)
│   ├── auth/            # Authentication
│   ├── interns/         # Intern operations
│   ├── mentors/         # Mentor operations
│   ├── tasks/           # Task operations
│   ├── reports/         # Report management
│   ├── attendance/      # Attendance tracking
│   ├── events/          # Event management
│   ├── admin/           # Admin operations
│   ├── activity/        # Activity logging
│   ├── search/          # Search functionality
│   ├── profile/         # Profile management
│   └── email/           # Email services
├── auth/                # Login, password reset pages (CSR)
├── dashboard/           # Role-based dashboards (CSR)
│   ├── admin/           # Admin dashboard with interns, mentors, tasks, reports, logs, import
│   ├── mentor/          # Mentor dashboard with interns, tasks, reports
│   ├── intern/          # Intern dashboard with tasks, reports, attendance
│   └── calendar/        # Calendar view for events
├── profile/             # Profile management page
├── components/          # 20+ reusable UI components
├── lib/                 # Redux store, design tokens, services
├── globals.css          # Tailwind styles
├── layout.tsx           # Root layout (SSR)
└── page.tsx             # Home redirect (CSR)

lib/
├── auth.ts              # NextAuth configuration
├── hasura.ts            # GraphQL client wrapper
├── apolloClient.ts      # Apollo configuration
├── graphql/             # Queries & mutations
├── db.ts                # Database utilities
├── email/               # Email service
└── redux/               # Redux store configuration

sql/
└── schema.sql           # PostgreSQL schema

types/
└── *.ts                 # TypeScript type definitions
```

---

## 🔄 DATA FLOW FOR EACH OPERATION

### **User Login**
1. User enters email + password → Login form
2. Form submits to `/api/auth/callback/credentials`
3. NextAuth validates against database (GraphQL query)
4. Password compared with bcryptjs
5. JWT token created, stored in HttpOnly cookie
6. User redirected to `/dashboard/{role}`

### **Create Intern (Admin)**
1. Admin fills form → Submits to `/api/interns` (POST)
2. Backend checks: JWT valid + role = admin
3. Validates email uniqueness (GraphQL query)
4. Generates password: `Intern@{random8chars}`
5. Calls Hasura mutation: `CREATE_INTERN_AND_USER`
6. Hasura inserts into `users`, `profiles`, `interns` tables
7. Backend sends credentials email (SMTP)
8. Returns success response
9. Frontend shows notification + refreshes list

### **View Tasks (Intern)**
1. Intern navigates to `/dashboard/intern/tasks`
2. Component loads, calls GET `/api/tasks`
3. Backend checks JWT + role = intern
4. Queries Hasura: `GET_TASK_ASSIGNMENTS_BY_INTERN_ID`
5. Hasura filters tasks for this intern only
6. Returns tasks with assignments
7. Frontend displays in table with Redux loading state
8. No Redux data caching (fresh from API each time)

---

## 🎨 FRONTEND BREAKDOWN

**Layout Hierarchy:**
```
RootLayout (SSR)
  ├─ ReduxProvider
  │   └─ SessionProviderWrapper (NextAuth)
  │       └─ NotificationCenter (Global toasts)
  │           └─ Page/Dashboard
  │               └─ DashboardLayout
  │                   ├─ Sidebar (Navigation)
  │                   └─ Content
```

**Key Components:**
- **Button, Card, Input, Select**: Basic UI building blocks
- **Sidebar**: Navigation with role-based routing
- **DashboardLayout**: Wrapper for all dashboards
- **SearchHeader, StatsGrid**: Dashboard features
- **ChatWidget**: AI integration (external service)
- **NotificationCenter**: Toast notifications from Redux

---

## 🔗 REDUX STATE STRUCTURE

```javascript
{
  auth: {
    user: { id, name, email, role, department },
    isAuthenticated: true,
    rememberMe: false,
    lastLogin: timestamp
  },
  ui: {
    sidebarCollapsed: false,
    theme: 'dark' | 'light' | 'auto',
    deviceType: 'mobile' | 'tablet' | 'desktop',
    animationsEnabled: true
  },
  notifications: [
    { id, type: 'success', message, timestamp },
    ...
  ],
  loading: {
    isLoading: false
  }
}
```

**Important:** Redux stores **UI state only**
- Business data (interns, tasks, reports) is **NOT** in Redux
- Fetched on-demand from API routes
- Hasura is the source of truth for data

---

## 📡 API ENDPOINTS QUICK REFERENCE

**Authentication:**
```
POST   /api/auth/[...nextauth]      Login/logout (NextAuth handles)
GET    /api/auth/users              Get all users
POST   /api/auth/users              Create user (admin)
POST   /api/auth/forgot-password    Request password reset
POST   /api/auth/reset-password     Confirm password reset
POST   /api/auth/verify-otp         Verify OTP
```

**Interns:**
```
GET    /api/interns                 Get all/filtered interns
POST   /api/interns                 Create intern (admin)
GET    /api/interns/[id]            Get specific intern
PUT    /api/interns/[id]            Update intern
DELETE /api/interns/[id]            Delete intern
POST   /api/interns/reminders       Send reminders
```

**Mentors:**
```
GET    /api/mentors                 Get all mentors
PUT    /api/mentors/[id]            Update mentor
DELETE /api/mentors/[id]            Delete mentor
```

**Tasks:**
```
GET    /api/tasks                   Get all/filtered tasks
POST   /api/tasks                   Create task (admin/mentor)
GET    /api/tasks/[id]              Get task details
PUT    /api/tasks/[id]              Update task
DELETE /api/tasks/[id]              Delete task
```

**Reports:**
```
GET    /api/reports                 Get reports (filtered by role)
POST   /api/reports                 Submit report (intern)
PUT    /api/reports/[id]            Add feedback (mentor)
GET    /api/reports/[id]            Get specific report
```

**Attendance:**
```
GET    /api/attendance              Get attendance records
POST   /api/attendance              Mark attendance (intern)
```

**Events:**
```
GET    /api/events                  Get all events
POST   /api/events                  Create event (admin)
GET    /api/events/[id]             Get event details
DELETE /api/events/[id]             Delete event
```

**Admin Operations:**
```
GET    /api/admin/stats             Get dashboard statistics
POST   /api/admin/import            Bulk import users
```

**Search & Activity:**
```
GET    /api/activity                Get activity logs
GET    /api/search                  Global search
GET    /api/search/details          Detailed search results
```

**Other:**
```
GET    /api/profile                 Get my profile
PUT    /api/profile                 Update my profile
POST   /api/email/test              Test email service
```

---

## 🗄️ DATABASE SCHEMA (10+ Tables)

```sql
users (core auth)
├─ id (UUID), email (unique), password_hash, role (enum), created_at

profiles (user details)
├─ user_id (FK), name, department, phone, created_at

interns (intern-specific)
├─ user_id (FK), mentor_id (FK), admin_id (FK), college_name, start_date, status

tasks (assignments)
├─ id (UUID), title, description, assigned_by, deadline, priority, status

task_assignments (many-to-many)
├─ task_id (FK), intern_id (FK) - who gets which task

reports (progress tracking)
├─ id (UUID), intern_id (FK), report_date, work_description, hours_worked, feedback

attendance (daily attendance) [NEW]
├─ id (UUID), intern_id (FK), date, status (present/absent/leave)

events (system-wide events) [NEW]
├─ id (UUID), title, description, date, time, created_by

password_reset_tokens (recovery)
├─ id (UUID), email, token, otp_code, type (enum), expires_at

activity_logs (audit trail) [NEW]
├─ id (UUID), user_id (FK), action, entity_type, entity_id, created_at
```

---

## 🚀 DEPLOYMENT CHECKLIST

```
Development:
 ✅ PostgreSQL running in Docker
 ✅ Hasura GraphQL running in Docker
 ✅ Next.js dev server running locally
 ✅ .env configured for local testing

Production:
 ⚠️ Change NEXTAUTH_SECRET to strong random key
 ⚠️ Change HASURA_GRAPHQL_ADMIN_SECRET to strong secret
 ⚠️ Set NEXTAUTH_URL to your domain
 ⚠️ Use managed PostgreSQL (AWS RDS, DigitalOcean Managed DB)
 ⚠️ Deploy Hasura to cloud (Heroku, Railway, DigitalOcean)
 ⚠️ Deploy Next.js to (Vercel, AWS EC2, Lambda)
 ⚠️ Setup SSL/HTTPS (Let's Encrypt)
 ⚠️ Configure SMTP for production email
 ⚠️ Setup database backups
 ⚠️ Enable CORS restrictions
 ⚠️ Setup monitoring and logging
```

---

## 💡 KEY DIFFERENCES FROM COMPETITORS

| Feature | This Project | Alternative |
|---------|--------------|-------------|
| **Auth** | NextAuth JWT | Firebase (proprietary) |
| **API** | GraphQL via Hasura | REST with Express |
| **State** | Redux (UI only) | Apollo Cache (full data) |
| **Database** | PostgreSQL open-source | MongoDB (NoSQL) |
| **Rendering** | Next.js hybrid SSR/CSR | React SPA (CSR only) |
| **Deployment** | Cloud-agnostic | Locked to Firebase |
| **Cost** | Pay for compute only | Firebase subscriptions |

---

## 🎓 PRESENTATION FLOW

**Time: 15 minutes**

1. **Intro (1 min)**
   - Show homepage
   - Quick demo of all 3 dashboards
   - Highlight key features (task creation, reporting, AI chat)

2. **Architecture (3 min)**
   - Draw 3-tier architecture
   - Show database schema
   - Explain data flow

3. **Technology Stack (2 min)**
   - Next.js for SSR/CSR
   - GraphQL for API
   - Redux for state
   - NextAuth for security

4. **Security (2 min)**
   - JWT tokens in HttpOnly cookies
   - bcryptjs password hashing
   - Role-based access control
   - Input validation

5. **Code Walkthrough (4 min)**
   - Show login flow (lib/auth.ts)
   - Show API route example (app/api/interns/route.ts)
   - Show GraphQL integration (lib/hasura.ts)
   - Show Redux usage (app/lib/redux/store.ts)

6. **Deployment & Scaling (2 min)**
   - Local development with Docker
   - Production deployment options
   - Database scaling
   - Performance considerations

7. **Q&A (1 min)**
   - What's unique about this approach?
   - How secure is it?
   - Can it scale to 10K users?

---

## 📚 FILES TO SHOW IN PRESENTATION

| When Discussing | Show File |
|-----------------|-----------|
| Architecture | Draw diagram, show `docker-compose.yml` |
| Authentication | Show `lib/auth.ts` (lines 1-115) |
| API Example | Show `app/api/interns/route.ts` (lines 43-113) |
| GraphQL Integration | Show `lib/hasura.ts` (lines 24-75) |
| State Management | Show `app/lib/redux/store.ts` |
| UI Components | Show `app/components/` folder |
| Routing | Show `app/` folder structure |
| Database | Show `sql/schema.sql` |
| Deployment | Show `docker-compose.yml`, environment config |

---

## 🔍 QUICK TROUBLESHOOTING GUIDE

**Problem:** "User not found during login"
- Check: Email in database? Use Hasura console
- Check: Email is lowercase and trimmed in form
- Check: GraphQL query returns user correctly

**Problem:** "API returns 401 Unauthorized"
- Check: NextAuth JWT cookie set? Browser DevTools → Cookies
- Check: Session not expired (24h max age)
- Check: JWT_SECRET matches NEXTAUTH_SECRET env

**Problem:** "Hasura query fails"
- Check: PostgreSQL running? `docker ps`
- Check: Hasura endpoint correct in .env
- Check: Admin secret correct in hasura.ts
- Check: GraphQL query syntax valid

**Problem:** "Emails not sending"
- Check: SMTP credentials correct
- Check: Gmail needs "App Password" (not account password)
- Check: Test endpoint: `/api/email/test`

**Problem:** "Redux state not updating"
- Check: Component wrapped in `useAppSelector()`?
- Check: Dispatch action syntax correct?
- Check: Redux DevTools extension installed

---

## 📞 KEY CONTACT POINTS FOR QUESTIONS

- **Frontend Issues**: Check `app/` folder, React/Next.js documentation
- **Backend Issues**: Check `app/api/` routes, NextAuth documentation
- **Database Issues**: Check `sql/schema.sql`, PostgreSQL docs
- **GraphQL Issues**: Check Hasura console at `http://localhost:8081`
- **Auth Issues**: Check `lib/auth.ts` and NextAuth docs
- **State Issues**: Check Redux DevTools, Redux documentation

---

## 🏆 PROJECT STRENGTHS

✅ **Type-Safe**: Full TypeScript across frontend and backend
✅ **Secure**: Modern auth patterns, encrypted passwords, role-based access, JWT tokens
✅ **Scalable**: GraphQL abstraction allows easy data scaling
✅ **Maintainable**: Clear separation of concerns (frontend/backend/data)
✅ **Modern Stack**: React 19, Next.js 16.1.7, Redux Toolkit, Tailwind CSS 4
✅ **Cloud-Ready**: Docker support, cloud-agnostic deployment
✅ **Developer Experience**: Hot reloading, TypeScript errors, Redux DevTools
✅ **Role-Based**: 3-tier access control built-in
✅ **Production-Ready**: Error handling, validation, email notifications
✅ **Rich Features**: 23+ API endpoints, attendance tracking, events, activity logs, bulk import
✅ **Global Search**: Advanced search across all entities with filters
✅ **Analytics**: Admin statistics dashboard with real-time metrics
✅ **Audit Trail**: Complete activity logging for compliance

---

## 🚀 POTENTIAL IMPROVEMENTS (For Discussion)

1. **Caching**: Add Redis for session caching
2. **Real-time Updates**: Add WebSockets for live notifications
3. **File Uploads**: Add S3 for report attachments
4. **Analytics**: Add data visualization dashboard
5. **Mobile App**: React Native for iOS/Android
6. **API Documentation**: Add Swagger/OpenAPI
7. **Testing**: Add Jest + Cypress for e2e testing
8. **Monitoring**: Add Sentry for error tracking
9. **CI/CD**: GitHub Actions for automated deployment
10. **Load Testing**: Stress test with simulated users
