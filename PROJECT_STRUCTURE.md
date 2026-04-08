# 📂 Project Structure Guide

Welcome to the **Intern Management System**! This guide explains how the project is organized in a simple, easy-to-understand way.

---

## 🏗️ The Big Picture

The system is split into three main parts:
1.  **Frontend & API (Next.js)**: The website you see and the "brain" that handles data requests.
2.  **Backend Services**: API routes for all business logic and database operations.
3.  **AI Assistant (ims-vannaAI)**: A special Python power-up that lets you ask questions about the data in plain English.

---

## 📁 Main Folders

### 1. `app/` (The Application Heart)
This is where the Next.js code lives. It's organized using the "App Router" pattern.
-   **`api/`**: The backend endpoints organized by feature:
    -   `auth/` - Authentication and user management
    -   `interns/` - Intern CRUD and operations
    -   `mentors/` - Mentor management
    -   `tasks/` - Task management
    -   `reports/` - Report management
    -   `attendance/` - Attendance tracking
    -   `events/` - Event management
    -   `admin/` - Admin operations (stats, import)
    -   `activity/` - Activity logging
    -   `search/` - Search functionality
    -   `profile/` - User profile updates
    -   `email/` - Email services
-   **`auth/`**: Contains the Login and forgotten password pages.
-   **`dashboard/`**: The main screens for Admins, Mentors, and Interns:
    -   `admin/` - Admin dashboard with interns, mentors, tasks, reports, logs, import pages
    -   `mentor/` - Mentor dashboard with interns, tasks, reports pages
    -   `intern/` - Intern dashboard with tasks, reports, attendance pages
    -   `calendar/` - Calendar view for events
-   **`profile/`**: Where users can update their account settings.
-   **`components/`**: Reusable building blocks:
    -   `ui/`: Base elements like buttons, inputs, cards, modals, etc.
    -   `layout/`: Large structures like the sidebar, headers, and dashboard layout.
    -   `features/`: Complex modules like Task Board (Kanban), Attendance table, Activity feed.
    -   `providers/`: "Invisible" helpers that handle things like global state (Redux) and authentication.

### 2. `lib/` (The Toolbox)
Shared logic and helpers used across the entire application.
-   **`services/`**: The real "work" logic (e.g., how to calculate stats, how to send emails).
-   **`auth.ts`**: Configuration for how users log in (NextAuth).
-   **`db.ts`**: The connection to the PostgreSQL database.
-   **`hasura.ts`**: Helps the app talk to the GraphQL engine (Hasura).
-   **`apolloClient.ts`**: Apollo Client configuration for GraphQL.
-   **`constants.ts`**: A single place for all "fixed" values like status names and roles.
-   **`redux/`**: Redux store configuration and slices.
-   **`graphql/`**: GraphQL queries and mutations.
-   **`email/`**: Email service utilities.

### 3. `ims-vannaAI/` (AI Powerhouse)
A separate Python-based Text-to-SQL system using Vanna 2.0 and Groq LLM.
-   **`app.py`**: FastAPI server with REST endpoints for natural language queries.
-   **`vanna_setup.py`**: Vanna configuration and PostgreSQL connection setup.
-   **`train_agent.py`**: Primary training script with DDL and sample queries.
-   **`train_agent2.py`**: Additional training data and queries.
-   **`generate_token.py`**: JWT token generation utility.
-   **`chroma_db/`**: ChromaDB vector store (the "memory" of the AI).
-   **`requirements.txt`**: Python dependencies.
-   **`README.md`**: Dedicated documentation for the AI module.

### 4. `sql/` (Database Blueprint)
Contains `schema.sql`, which defines all database tables (Users, Tasks, Reports, Attendance, Events, etc.).

### 5. `types/` (TypeScript Definitions)
TypeScript type definitions for data models and API responses.

### 6. `docs/` (Additional Documentation)
Extended documentation files for presentations and architecture details.

---

## 📄 Key Configuration Files

-   **`.env`**: Your "Secret Box." It stores passwords and database links. **Never share this!**
-   **`.env.example`**: Template for environment variables configuration.
-   **`package.json`**: A list of all the "ingredients" (libraries) needed to run the app.
-   **`docker-compose.yml`**: Instructions to start the database and Hasura engine automatically using Docker.
-   **`middleware.ts`**: The "Security Guard." It checks if a user is logged in before letting them see certain pages.
-   **`next.config.mjs`**: Settings for how the Next.js server should behave.
-   **`tsconfig.json`**: TypeScript configuration.

---

## 📊 New Features Overview

| Feature | Location | Description |
|---------|----------|-------------|
| **Attendance** | `app/api/attendance/`, `app/dashboard/*/attendance/` | Track intern attendance daily |
| **Events** | `app/api/events/`, `app/dashboard/calendar/` | Create and manage system events |
| **Activity Log** | `app/api/activity/` | Audit trail of all user actions |
| **Bulk Import** | `app/api/admin/import/`, `app/dashboard/admin/import/` | Import multiple users from CSV |
| **Search** | `app/api/search/` | Global search across data |
| **Reminders** | `app/api/interns/reminders/` | Send reminders to interns |
| **Admin Stats** | `app/api/admin/stats/` | Dashboard statistics and analytics |
| **Admin Logs** | `app/dashboard/admin/logs/` | View system activity logs |

---

## 💡 Summary for Developers

| Folder | Responsibility |
| :--- | :--- |
| **`app/`** | UI Screens + API Routes + Pages |
| **`lib/`** | Logic, Helpers, DB Connection, Redux, GraphQL |
| **`components/`** | Visual elements (UI, Layout, Features) |
| **`ims-vannaAI/`** | Python AI Assistant |
| **`sql/`** | Database Schema |
| **`types/`** | TypeScript type definitions |
| **`docs/`** | Extended documentation |

---

## 🔄 Request Flow Example

```
User Action (Click button)
    ↓
Page Component (app/dashboard/admin/interns/)
    ↓
API Route (app/api/interns/route.ts)
    ↓
Backend Logic (lib/services/)
    ↓
GraphQL Query/Mutation (lib/hasura.ts)
    ↓
Hasura GraphQL Engine
    ↓
PostgreSQL Database
    ↓
Response (back up the chain)
    ↓
Redux Store Update (if needed)
    ↓
UI Re-render
```

*This file was created to help you navigate the codebase quickly. Happy coding!* 🚀
