# 🛠️ Implementation Guide

## Table of Contents

1. [Development Setup](#development-setup)
2. [Database Configuration](#database-configuration)
3. [Environment Setup](#environment-setup)
4. [Authentication Implementation](#authentication-implementation)
5. [GraphQL Integration](#graphql-integration)
6. [Component Architecture](#component-architecture)
7. [State Management](#state-management)
8. [Email Configuration](#email-configuration)
9. [New Features Implementation](#new-features-implementation)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)

## Development Setup

### 🚀 Initial Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd intern-management-system
npm install
```

2. **IDE Configuration**
- Install TypeScript extension
- Enable ESLint and Prettier
- Configure Tailwind CSS IntelliSense

### 🛠️ Development Tools

- **Next.js Dev Server**: Hot reload with file watching
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Tailwind CSS**: Real-time class generation

## Database Configuration

### 🐘 PostgreSQL Setup

1. **Install PostgreSQL**
```bash
# macOS
brew install postgresql

# Windows
# Download from https://postgresql.org/download/

# Ubuntu
sudo apt-get install postgresql postgresql-contrib
```

2. **Create Database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE intern_management;

# Create user (optional)
CREATE USER intern_admin WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE intern_management TO intern_admin;
```

3. **Run Schema**
```bash
psql -U postgres -d intern_management -f sql/schema.sql
```

### 📊 Hasura Setup

1. **Docker Installation (Recommended)**
```yaml
# docker-compose.yml
version: '3.6'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: intern_management
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  hasura:
    image: hasura/graphql-engine:v2.33.4
    ports:
      - "8081:8080"
    depends_on:
      - postgres
    environment:
      HASURA_GRAPHQL_DATABASE_URL: postgres://postgres:postgres@postgres:5432/intern_management
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_DEV_MODE: "true"
      HASURA_GRAPHQL_ENABLED_LOG_TYPES: startup, http-log, webhook-log, websocket-log, query-log
      HASURA_GRAPHQL_ADMIN_SECRET: hasura

volumes:
  db_data:
```

2. **Start Services**
```bash
docker-compose up -d
```

3. **Access Hasura Console**
- URL: http://localhost:8081/console
- Admin Secret: hasura

## Environment Setup

### 📝 Environment Variables

1. **Copy Template**
```bash
cp .env.example .env
```

2. **Configure Variables**
```bash
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=intern_management
POSTGRES_PORT=5433

# Hasura GraphQL Configuration
HASURA_PORT=8081
HASURA_GRAPHQL_ADMIN_SECRET=hasura
HASURA_GRAPHQL_ENDPOINT=http://localhost:8081/v1/graphql
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT=http://localhost:8081/v1/graphql

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 🔐 Security Considerations

- **Generate secure NEXTAUTH_SECRET**: Use a random 32+ character string
- **SMTP Credentials**: Use app passwords for Gmail, not regular passwords
- **Database Passwords**: Use strong passwords in production
- **Environment Isolation**: Never commit .env files to version control

## Authentication Implementation

### 🔑 NextAuth.js Configuration

Key configuration points in `lib/auth.ts`:
- **Credentials Provider**: Email/ID + password authentication
- **Password Verification**: bcrypt comparison
- **JWT Callbacks**: Role and user data inclusion
- **Session Strategy**: JWT with 24-hour expiry

### 🛡️ Route Protection

Middleware setup in `middleware.ts`:
- Public routes: `/` and `/auth/login`
- Protected routes: All dashboard paths
- Client-side auth handling to avoid Edge Runtime issues

## GraphQL Integration

### 🔗 Apollo Client Setup

Apollo Client configuration in `lib/apolloClient.ts`:
- **Admin Client**: Uses Hasura admin secret for server-side operations
- **HTTP Link**: Configured with Hasura endpoint
- **In-Memory Cache**: For GraphQL response caching

### 📝 GraphQL Operations

Query and mutation files are structured in `lib/graphql/`:
- `queries.ts`: User lookups, data retrieval
- `mutations.ts`: CRUD operations for all entities

### 🔄 Database Utilities

Helper functions in `lib/db.ts`:
- Type-safe user operations
- Data transformation utilities
- GraphQL query wrappers

## Component Architecture

### 🧩 Component Structure

```
app/components/
├── ui/                    # Atomic UI components with standardized styling (Button, Card, Input)
├── layout/                # Structural layout components (DashboardLayout, Sidebar, Header)
├── features/              # Complex, domain-specific feature logic (KanbanBoard, AttendanceTable)
└── providers/             # Context providers and session wrappers (SessionProviderWrapper)
```

### 📱 Design Patterns

1. **Tailwind CSS**: Utility-first styling approach
2. **Component Variants**: Support for multiple visual states
3. **TypeScript Props**: Strongly typed component interfaces
4. **Responsive Design**: Mobile-first breakpoints
5. **Accessibility**: ARIA labels and keyboard navigation

## State Management

### 🏪 Redux Store Configuration

Redux Toolkit setup in `lib/redux/store.ts`:
- **Store Slices**: UI, loading, notifications, auth
- **Middleware**: Default with serializable check configuration
- **Type Safety**: TypeScript integration for RootState and AppDispatch

### 🔔 Notification Management

Notification system features:
- **Toast Notifications**: Success, error, warning, info types
- **Auto Dismissal**: Configurable duration with default 5 seconds
- **Queue Management**: Maximum 5 notifications displayed
- **Action Integration**: Easy Redux dispatch for notifications

## Email Configuration

### 📧 Nodemailer Setup

Email service configuration in `lib/email/emailService.ts`:
- **SMTP Transport**: Configurable with environment variables
- **Credential Emails**: Automated user account notifications
- **Connection Verification**: SMTP connection testing
- **Error Handling**: Graceful failure with error responses

### 📬 Email Provider Configuration

**Gmail Setup**
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use app password in SMTP_PASS

**Outlook/Hotmail Setup**
```bash
SMTP_HOST=smtp.live.com
SMTP_PORT=587
```

**Custom SMTP Setup**
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
```

## New Features Implementation

### 🎫 Attendance System

**Setup Location**: `app/api/attendance/route.ts` and `app/dashboard/*/attendance/`

- Attendance marking API endpoint
- Attendance view and management pages
- Integration with Redux state management
- Role-based access control for view permissions

**Key Components**:
- Attendance form for marking daily presence
- Attendance table with filters and date range selection
- Admin attendance management page
- Attendance statistics in admin dashboard

### 📅 Events Management

**Setup Location**: `app/api/events/` and `app/dashboard/calendar/`

- Event creation endpoint for admins
- Calendar view for all events
- Event CRUD operations
- Global visibility for all users

**Key Components**:
- Event creation form
- Calendar component
- Event listing with details
- Event edit/delete functionality

### 📝 Activity Logging

**Setup Location**: `app/api/activity/` and activity tracking middleware

- Activity logging for all user actions
- Activity feed display
- Audit trail functionality
- Search and filter capabilities

**Key Components**:
- Activity middleware for request tracking
- Activity display component
- Activity search and filtering
- Admin activity management page

### 📥 Admin Bulk Import

**Setup Location**: `app/api/admin/import/` and `app/dashboard/admin/import/`

- Bulk user import from CSV/Excel
- Data validation before import
- Error reporting and handling
- Automatic password generation
- Credential email delivery

**Key Components**:
- CSV upload component
- Data preview before import
- Progress tracking for bulk operations
- Import history and logs

### 🔍 Search Functionality

**Setup Location**: `app/api/search/` endpoints

- Global search across interns, mentors, tasks, reports
- Detailed search results with filters
- Advanced filtering options by role, status, date
- SearchBar component integration

**Key Implementation**:
- Debounced search queries
- Index-based search for performance
- Role-based filtering in results
- Elasticsearch-ready architecture

### 📧 Reminder System

**Setup Location**: `app/api/interns/reminders/` endpoint

- Send reminders to interns about pending tasks
- Scheduled reminder emails
- Customizable reminder messages
- Admin control panel for reminders

**Key Implementation**:
- Reminder scheduling logic
- Email template for reminders
- Admin reminder management page
- Tracking of sent reminders

## Testing Strategy

### 🧪 Testing Approach

Test files should be organized in `__tests__/` directory:
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: API endpoint and database operations
- **Authentication Tests**: Login flow and session handling

### 📋 Manual Testing Checklist

**Authentication Flow**
- [ ] Admin login with correct credentials
- [ ] Invalid credentials rejection
- [ ] Session persistence and automatic logout
- [ ] Role-based dashboard redirects

**User Management**
- [ ] Admin can create mentor/intern accounts
- [ ] Email notifications sent (if configured)
- [ ] Secure password generation and user profile creation

**Task Management**
- [ ] Mentors can create and assign tasks
- [ ] Interns can view and update task status
- [ ] Priority levels and filtering work

**Report System**
- [ ] Intern report submissions
- [ ] Mentor feedback system
- [ ] Date filtering and hours validation

## Deployment Guide

### 🚀 Production Deployment

**Environment Setup**
```bash
# Production environment variables
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret-key
HASURA_GRAPHQL_ENDPOINT=https://your-hasura-instance.hasura.app/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=your-production-admin-secret
```

**Database Migration**
```bash
# Set up production PostgreSQL
# Run schema migration
psql -h your-db-host -U username -d database_name -f sql/schema.sql
```

**Hasura Cloud Setup**
1. Create Hasura Cloud project
2. Connect to production database
3. Configure environment variables

**Vercel Deployment (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

**Alternative Deployments**

Docker deployment using standard Node.js image with production dependencies and optimized build process.

---

For detailed feature documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)
For system architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)