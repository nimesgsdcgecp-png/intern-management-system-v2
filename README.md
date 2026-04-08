# 🎓 Intern Management System

A complete, production-ready Intern Management System built with modern web technologies. Designed to manage internship workflows with role-based access control for Admins, Mentors, and Interns.

## 🌟 Key Features

### ✅ Role-Based Dashboards
- **Admin**: Manage interns, mentors, create tasks, view analytics
- **Mentor**: Manage assigned interns, assign tasks, review reports, access profile settings
- **Intern**: View tasks, submit reports, track progress, manage profile settings

### 🔐 Secure Authentication
- Email/UUID login with bcryptjs hashing
- NextAuth.js session management with JWT
- Automatic role-based redirects
- Protected routes with middleware

### 📊 Complete Feature Set
- User management (Admin, Mentor, Intern CRUD operations)
- Task assignment and tracking with priority levels
- Report submission and feedback system
- Profile management (email/password updates)
- Email notifications for user credentials
- Statistics and analytics dashboard
- Redux state management for notifications and UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional, for Hasura)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd intern-management-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up PostgreSQL database
# Create database 'intern_management'
psql -U postgres -c "CREATE DATABASE intern_management;"

# Run the schema
psql -U postgres -d intern_management -f sql/schema.sql

# Start Hasura (if using Docker)
# Update docker-compose.yml with your database URL
docker-compose up -d

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@internship.com | password |
| **Mentor** | mentor@internship.com | password |
| **Intern** | intern@internship.com | password |

## 📁 Project Structure

```
intern-management-system/
├── app/
│   ├── components/             # Managed component architecture
│   │   ├── ui/                 # Atomic UI components (Buttons, Cards, Inputs, Modals)
│   │   ├── layout/             # Shell components (Sidebars, Headers, DashboardLayout)
│   │   ├── features/           # Domain-specific modules (KanbanBoard, AttendanceTable)
│   │   └── providers/          # Functional context wrappers (Redux, Auth, Themes)
│   ├── api/                    # API Routes (CRUD operations)
│   ├── auth/                   # Authentication pages
│   ├── dashboard/              # Role-specific dashboard pages
│   ├── profile/                # Profile management pages
│   └── lib/redux/              # Redux store and slice definitions
├── lib/
│   ├── services/               # Centralized business logic and data services
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Database utilities
│   ├── hasura.ts               # GraphQL client
│   └── graphql/                # Shared GraphQL operations
├── sql/
│   └── schema.sql              # Standardized PostgreSQL schema
├── DOCUMENTATION.md            # Feature & API reference
├── IMPLEMENTATION_GUIDE.md     # Engineering & setup guide
└── ARCHITECTURE.md             # System design & architecture details
```

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Database**: [PostgreSQL](https://postgresql.org/) with UUID primary keys
- **GraphQL**: [Hasura](https://hasura.io/) GraphQL Engine
- **Client**: [Apollo Client](https://www.apollographql.com/docs/react/) for GraphQL
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) v4
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) with RTK Query
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with modern utilities
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) with strict type checking
- **Security**: bcryptjs for password hashing
- **Email**: [Nodemailer](https://nodemailer.com/) SMTP integration
- **Icons**: [Lucide React](https://lucide.dev/) icon library

## 📚 Documentation

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete feature documentation and API reference
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation details
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design patterns
- **[ims-vannaAI/README.md](./ims-vannaAI/README.md)** - AI Text-to-SQL module documentation

## 🎯 Core Workflows

### Admin Workflow
1. Login to admin dashboard
2. Manage users (interns, mentors - add, edit, delete)
3. Assign mentors to interns
4. Create and monitor tasks
5. View system statistics and analytics
6. Send credential emails to new users

### Mentor Workflow
1. Login to mentor dashboard
2. View assigned interns
3. Assign tasks to interns
4. Review intern reports
5. Provide constructive feedback
6. Update profile settings (email, password)

### Intern Workflow
1. Login to intern dashboard
2. View assigned tasks
3. Submit daily/weekly reports
4. View mentor feedback
5. Track personal progress
6. Update profile settings (email, password)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints
- `GET /api/auth/users` - Get all users (Admin)
- `POST /api/auth/users` - Create user (Admin)
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-otp` - Verify OTP code

### User Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile (email/password)

### Mentors (Admin Only)
- `GET /api/mentors` - Get all mentors
- `PUT /api/mentors/[id]` - Update mentor
- `DELETE /api/mentors/[id]` - Delete mentor

### Interns (Admin/Mentor)
- `GET /api/interns` - Get all interns (filtered by role)
- `POST /api/interns` - Create intern (Admin)
- `PUT /api/interns/[id]` - Update intern
- `DELETE /api/interns/[id]` - Delete intern
- `POST /api/interns/reminders` - Send reminders to interns

### Tasks (Role-based)
- `GET /api/tasks` - Get tasks (filtered by role)
- `POST /api/tasks` - Create task (Admin/Mentor)
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Reports (Role-based)
- `GET /api/reports` - Get reports (filtered by role)
- `POST /api/reports` - Submit report (Interns)
- `PUT /api/reports/[id]` - Add feedback (Mentors)
- `GET /api/reports/[id]` - Get specific report

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (Interns)

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (Admin)
- `GET /api/events/[id]` - Get event details
- `DELETE /api/events/[id]` - Delete event

### Admin Operations
- `GET /api/admin/stats` - Get dashboard statistics
- `POST /api/admin/import` - Bulk import users

### Activity & Logs
- `GET /api/activity` - Get activity logs
- `GET /api/search` - Search across entities
- `GET /api/search/details` - Get detailed search results

### Email Services
- `POST /api/email/test` - Test email configuration (Admin)

## 📊 Data Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_role ENUM: 'admin', 'mentor', 'intern'
```

### Profiles
```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Interns
```sql
CREATE TABLE interns (
  user_id UUID PRIMARY KEY,
  mentor_id UUID,
  admin_id UUID,
  start_date DATE,
  end_date DATE,
  status intern_status DEFAULT 'active',
  college_name VARCHAR(255),
  university VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- intern_status ENUM: 'active', 'inactive'
```

### Tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_by UUID NOT NULL,
  assigned_to_all BOOLEAN DEFAULT FALSE,
  deadline DATE,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- task_priority ENUM: 'low', 'medium', 'high'
-- task_status ENUM: 'pending', 'in-progress', 'completed'
```

### Reports
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL,
  report_date DATE NOT NULL,
  work_description TEXT NOT NULL,
  hours_worked NUMERIC(4,2) NOT NULL,
  mentor_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (intern_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🛡️ Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Protected API routes
- ✅ Middleware route protection
- ✅ Secure session management

## 🚢 Production Deployment

### Build and Run
```bash
npm run build
npm run start
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=intern_management
POSTGRES_PORT=5433

# Hasura GraphQL Configuration
HASURA_GRAPHQL_ADMIN_SECRET=hasura
HASURA_GRAPHQL_ENDPOINT=http://localhost:8081/v1/graphql
NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT=http://localhost:8081/v1/graphql

# NextAuth.js Configuration (Required)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Deployment Platforms
- Vercel (recommended for Next.js)
- Netlify
- AWS
- Digital Ocean
- Heroku

### Production Considerations
- Configure production PostgreSQL database
- Set up Hasura Cloud or deploy Hasura
- Implement caching (Redis)
- Configure email service (SMTP)
- Add monitoring and logging
- Configure SSL/TLS
- Set up database backups
- Configure environment secrets

## 📈 Future Enhancements

- [x] Database integration (PostgreSQL + Hasura)
- [x] Email notifications for user credentials
- [x] Redux state management
- [x] Profile management system
- [x] Attendance tracking
- [x] Bulk import/export
- [x] Performance ratings & Feedback
- [ ] File upload support
- [ ] PDF report generation
- [ ] Advanced analytics dashboard (enhanced)
- [ ] Real-time notifications (WebSocket)
- [ ] Mobile app (React Native)
- [ ] Calendar integration (enhanced)
- [ ] Document management system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is provided as an educational example. Feel free to use and modify for your needs.

## 🆘 Support & Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running and accessible
- Check database connection string in `.env`
- Ensure database `intern_management` exists
- Verify Hasura is connected to the database
- Run `psql -U postgres -d intern_management -f sql/schema.sql` to set up schema

### Login Issues
- Verify admin user exists: `admin@internship.com` / `password`
- Check password hash in database matches bcrypt format
- Review browser console for authentication errors
- Clear browser cache and cookies

### API Errors
- Check user authentication status
- Verify role-based permissions in Hasura
- Review server logs for GraphQL errors
- Ensure Hasura admin secret matches `.env`

### Build Issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `npm install`
- Check TypeScript errors: `npm run build`
- Verify all environment variables are set

### Email Issues
- Check SMTP configuration in `.env`
- Test email connectivity with `POST /api/email/test`
- Verify Gmail app passwords or SMTP credentials
- Check network firewall settings

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Hasura Documentation](https://hasura.io/docs/latest/index/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🙏 Acknowledgments

Built with modern best practices using:
- Next.js 16 with App Router
- PostgreSQL with UUID primary keys
- Hasura GraphQL Engine
- NextAuth.js v4 for authentication
- Tailwind CSS v4 for styling
- Redux Toolkit for state management
- TypeScript for type safety
- Framer Motion for animations

---

**Happy coding! 🚀**

For more detailed information, see the [DOCUMENTATION.md](./DOCUMENTATION.md), [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md), and [ARCHITECTURE.md](./ARCHITECTURE.md) files.
