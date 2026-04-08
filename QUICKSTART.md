# Quick Start Guide

Get up and running with the Intern Management System in 2 minutes!

## Prerequisites

This system requires a **PostgreSQL database** and **Hasura GraphQL Engine**.

**Quick Setup:**
- Follow the [README.md](./README.md) installation instructions for database setup
- Ensure PostgreSQL and Hasura are running before starting the Next.js app
- The system uses environment variables from `.env` (copy from `.env.example`)

## Step 1: Start the Development Server

```bash
npm run dev
```

You should see:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Step 2: Open in Browser

Navigate to: **http://localhost:3000**

You'll be automatically redirected to the login page.

## Step 3: Login with Demo Credentials

Try each role to see different dashboards:

### Option 1: Admin Login
- Email: `admin@internship.com`
- Password: `password`

**Admin Dashboard Features:**
- ✅ View all interns
- ✅ Add new interns (click "+ Add Intern")
- ✅ Assign mentors to interns
- ✅ Create tasks for interns
- ✅ View report analytics and statistics
- ✅ Manage mentors

### Option 2: Mentor Login
- Email: `mentor@internship.com`
- Password: `password`

**Mentor Dashboard Features:**
- 👥 View assigned interns
- 📋 Assign tasks to your interns
- 📊 Review intern reports
- ✨ Provide feedback on reports

### Option 3: Intern Login
- Email: `intern@internship.com`
- Password: `password`

**Intern Dashboard Features:**
- 📝 View assigned tasks
- 📤 Submit daily reports
- 💬 View mentor feedback
- 📈 Track your progress

## Step 4: Explore Features

### As Admin:
1. Go to "Manage Interns" and add a new intern
2. Assign a mentor
3. Go to "Create Tasks" and assign a task
4. View "Report Analytics" to see all submitted reports
5. Check dashboard statistics

### As Mentor:
1. View "My Interns"
2. Go to "Manage Tasks" and assign tasks to interns
3. Go to "View Reports" to see intern submissions

### As Intern:
1. View "My Tasks" to see what you need to do
2. Click "Submit Daily Report" to submit work
3. View "My Reports & Feedback" to see mentor comments

## Database & Architecture

This system uses a modern **PostgreSQL + Hasura GraphQL** stack:

- **Database**: PostgreSQL with UUID primary keys
- **API Layer**: Hasura GraphQL Engine for real-time data access
- **Frontend**: Next.js App Router with Apollo Client
- **Authentication**: NextAuth.js with JWT sessions

### Database Tables:
- **users** - User accounts with role-based access (admin, mentor, intern)
- **profiles** - User profiles (name, department, phone, etc.)
- **interns** - Intern-specific data (mentor assignments, college info, dates)
- **tasks** - Task assignments with priorities and deadlines
- **reports** - Daily/weekly reports with mentor feedback
- **task_assignments** - Many-to-many task-intern relationships

## Useful Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Troubleshooting

### Page shows "Loading..." indefinitely
- Clear browser cache (Ctrl+Shift+Del)
- Refresh page (F5)
- Check browser console (F12) for errors

### Login not working
- Verify you typed the correct email
- Check password is exactly: `password`
- Try clearing cookies

### Tasks not showing
- Make sure you're logged in as the correct role
- As mentor, only tasks for your interns show up
- As intern, only your assigned tasks show up

## Next Steps

### 1. Explore the Code
- Browse `app/components/ui/` to see reusable atomic components
- Browse `app/components/features/` for complex domain-specific logic
- Check `app/api/` to see backend route handlers
- Look at `lib/auth.ts` to see authentication configuration

### 2. Customize
- Change colors in `app/globals.css`
- Add new roles via database modifications
- Create new API endpoints following existing patterns

### 3. Learn More
- Read [DOCUMENTATION.md](./DOCUMENTATION.md) for complete feature list
- Check [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for technical details
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

### 4. Deploy
- Push to GitHub
- Deploy on Vercel (one-click deployment)
- Or use your preferred hosting

## Common Actions

### Add a New Intern (Admin)
1. Login as admin
2. Click "Manage Interns"
3. Click "+ Add Intern"
4. Fill in the form
5. Select a mentor
6. Click "Create"
✅ Done! Intern is created

### Assign a Task (Mentor)
1. Login as mentor
2. Click "Manage Tasks"
3. Click "+ Assign Task"
4. Fill in:
   - Title: "Learn React Basics"
   - Description: "Complete React tutorial"
   - Assign to: (select an intern)
   - Deadline: pick a date
   - Priority: select from dropdown
5. Click "Assign Task"
✅ Done! Task is assigned

### Submit a Report (Intern)
1. Login as intern
2. Click "Submit Daily Report"
3. Fill in:
   - Date: today's date
   - Work Description: describe what you did
   - Hours Worked: enter hours
4. Click "Submit Report"
✅ Done! Report is submitted

### Review Report & Give Feedback (Mentor)
1. Login as mentor
2. Click "View Reports"
3. Review intern's report
4. Type feedback in the textbox
5. Click "Submit Feedback"
✅ Done! Feedback is sent

## Tips & Tricks

💡 **Pro Tips:**
- You can logout and login as different roles to test workflows
- Check your browser's DevTools (F12) → Network tab to see API calls
- All data is persisted in PostgreSQL database - changes are permanent
- Try exploring different features before deploying

🎯 **Learning Path:**
1. First: Explore all dashboards as each role
2. Then: Try creating/editing data
3. Next: Look at the code and understand how it works
4. Finally: Customize and add new features

## Support

If you encounter issues:

1. **Check the logs** - Look at terminal output when `npm run dev` is running
2. **Read documentation** - Check DOCUMENTATION.md for detailed info
3. **Inspect network** - Use DevTools to see API responses
4. **Clear browser data** - Try clearing cache and cookies

## What's Next?

After exploring the demo:
- ✅ Understand how all features work
- ✅ Read the architecture documentation
- ✅ Try modifying the code
- ✅ Deploy to production
- ✅ Connect to a real database

---

**Enjoy exploring the Intern Management System! 🚀**
