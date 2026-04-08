# ARCHITECTURE VISUALS & CODE EXAMPLES FOR PRESENTATION

---

## 🎨 VISUAL DIAGRAMS

### **1. COMPLETE REQUEST LIFECYCLE**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ADMIN CREATES NEW INTERN                         │
└─────────────────────────────────────────────────────────────────────┘

Step 1: FORM SUBMISSION (Browser)
┌─────────────────────────────────────────┐
│  React Component (CSR)                  │
│  ┌───────────────────────────────────┐  │
│  │ <Form onSubmit={handleCreate}>   │  │
│  │   <Input name="email" />         │  │
│  │   <Input name="name" />          │  │
│  │   <Select name="department" />   │  │
│  │   <Button type="submit" />       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  handleCreate():                        │
│  - dispatch(setLoading(true))         │ ← Redux: Show spinner
│  - fetch('/api/interns', {POST data}) │ ← Network request
└─────────────────────────────────────────┘
           │
           │ HTTP POST /api/interns
           ▼

Step 2: BACKEND PROCESSING (Node.js)
┌─────────────────────────────────────────┐
│  Next.js API Route                      │
│  app/api/interns/route.ts               │
│                                         │
│  async function POST(request) {         │
│    const session = await auth()  ◄─────┼─ Validate JWT from cookie
│    if (!session?.user) return 401 Error│
│    if (role !== "admin") return 403     │ ← Check authorization
│                                         │
│    const body = await request.json()    │
│    const email = body.email?.toLowerCase()
│    if (!email) return 400 Error         │ ← Validate input
│                                         │
│    const existing = await hasuraQuery( │
│      EXISTING_USER_BY_EMAIL, {email}   │ ← Check uniqueness
│    )                                    │
│    if (existing.users.length) return409 │
│                                         │
│    const plainPassword =                │
│      `Intern@${randomSuffix}` ◄────────┼─ Generate password
│    const hashedPassword =               │
│      await hash(plainPassword, 10)      │ ← Hash with bcryptjs
│                                         │
│    const inserted = await              │
│      hasuraMutation(CREATE_..., {...}) │ ← Call GraphQL
└─────────────────────────────────────────┘
           │
           │ GraphQL Mutation
           ▼

Step 3: GRAPHQL EXECUTION (Hasura)
┌─────────────────────────────────────────┐
│  Hasura GraphQL Engine                  │
│                                         │
│  Mutation CREATE_INTERN_AND_USER {      │
│    insert_users_one({                   │
│      id: UUID,                          │
│      email: "intern@mail.com",          │
│      password_hash: "$2a$10$...",       │
│      role: "intern"                     │
│    })                                   │
│    insert_profiles_one({                │
│      user_id: UUID,                     │
│      name: "John",                      │
│      department: "AI"                   │
│    })                                   │
│    insert_interns_one({                 │
│      user_id: UUID,                     │
│      mentor_id: UUID,                   │
│      admin_id: UUID,                    │
│      college_name: "XYZ",               │
│      status: "active"                   │
│    })                                   │
│  }                                      │
│                                         │
│  [Hasura auto-validates permissions]   │
│  [Hasura converts to SQL]               │
└─────────────────────────────────────────┘
           │
           │ SQL Transaction
           ▼

Step 4: DATABASE INSERT (PostgreSQL)
┌─────────────────────────────────────────┐
│  PostgreSQL 15                          │
│                                         │
│  BEGIN TRANSACTION;                     │
│                                         │
│  INSERT INTO users (                    │
│    id, email, password_hash,            │
│    role, created_at                     │
│  ) VALUES ('uuid-123', ...) ◄──────────┼─ Row 1: New user
│                                         │
│  INSERT INTO profiles (                 │
│    user_id, name, department, phone     │
│  ) VALUES ('uuid-123', ...) ◄──────────┼─ Row 2: Profile
│                                         │
│  INSERT INTO interns (                  │
│    user_id, mentor_id, admin_id,        │
│    college_name, start_date, status     │
│  ) VALUES ('uuid-123', ...) ◄──────────┼─ Row 3: Intern data
│                                         │
│  COMMIT; ◄─────────────────────────────┼─ All or nothing
│                                         │
│  Returns: IDs, timestamps, created rows│
└─────────────────────────────────────────┘
           │
           │ Response
           ▼

Step 5: DATA & EMAIL (Backend Response)
┌─────────────────────────────────────────┐
│  App/api/interns/route.ts (continued)  │
│                                         │
│    // Send credentials email            │
│    await sendCredentialsEmail({         │
│      to: "intern@mail.com",             │
│      credentials: {                     │
│        id: "uuid-123",                  │
│        password: "Intern@abcd1234"      │
│      }                                  │
│    })                                   │
│                                         │
│    // Return success response            │
│    return NextResponse.json({           │
│      intern: { ...newIntern },          │
│      credentials: { ...creds },         │
│      emailSent: true,                   │
│      message: "Account created"         │
│    }, { status: 201 })                  │
│  }                                      │
└─────────────────────────────────────────┘
           │
           │ HTTP 201 + JSON Response
           ▼

Step 6: FRONTEND UPDATE (Browser)
┌─────────────────────────────────────────┐
│  React Component (Response Handler)     │
│                                         │
│  response.ok → {                        │
│    dispatch(addNotification({           │
│      type: 'success',                   │
│      message: 'Intern created!' ◄─────┼─ Redux: Show toast
│    }))                                  │
│    dispatch(setLoading(false)) ◄───────┼─ Redux: Hide spinner
│                                         │
│    // Refresh interns list              │
│    const interns =                      │
│      await fetch('/api/interns').json() │
│    setInterns(interns) ◄────────────────┼─ Update local state
│  }                                      │
│                                         │
│  UI now shows:                          │
│  ✅ Green success toast                 │
│  ✅ New intern in list                  │
│  ✅ Loading spinner gone                │
└─────────────────────────────────────────┘

TIME TAKEN: ~1-2 seconds (end-to-end)
```

---

### **2. AUTHENTICATION FLOW**

```
┌────────────────────────────────────────────────────────────┐
│            USER LOGIN AUTHENTICATION FLOW                  │
└────────────────────────────────────────────────────────────┘

CLIENT SIDE (Browser):
┌──────────────────────────────────────┐
│ User visits: localhost:3000          │
│                                      │
│ app/page.tsx (CSR) runs:             │
│  const {data, status} = useSession() │← Checks if logged in
│                                      │
│  if (status === "authenticated")     │
│    redirect("/dashboard/{role}")     │
│  else                                │
│    redirect("/auth/login")           │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ User fills login form:               │
│  Email: admin@internship.com         │
│  Password: ••••••••                  │
│  [Login Button]                      │
│                                      │
│ form.submit() calls:                 │
│ signIn("credentials", {              │
│   identifier: email,                 │
│   password: password,                │
│   redirect: true                     │
│ })                                   │
└──────────────────┬───────────────────┘
                   │
                   │ NextAuth POST
                   ▼
SERVER SIDE (Node.js):
┌──────────────────────────────────────┐
│ /api/auth/callback/credentials       │
│ (NextAuth handles this)              │
│                                      │
│ Calls: Credentials provider's        │
│        authorize() method            │
│                                      │
│ authorize({                          │
│   identifier: "admin@...",           │
│   password: "admin123"               │
│ }) {                                 │
│                                      │
│   // Find user by email              │
│   const user = await                 │
│     getUserByEmail(identifier)       │
│                                      │
│   if (!user) return null ◄───────────┼─ Not found
│                                      │
│   // Compare passwords               │
│   const valid = await compare(       │
│     password,                        │
│     user.password ◄────────────────┐ Stored hash
│   )                                │
│                                    │
│   if (!valid) return null ◄────────┼─ Wrong password
│                                    │
│   // Success! Return user          │
│   return {                          │
│     id: user.id,                    │
│     name: user.name,                │
│     email: user.email,              │
│     role: user.role,                │
│     department: user.department     │
│   }                                 │
│ }                                   │
└──────────────────┬───────────────────┘
                   │
                   │ Next Auth JWT Callback
                   ▼
┌──────────────────────────────────────┐
│ jwt({ token, user }) {               │
│   if (user) {                        │
│     token.id = user.id               │
│     token.role = user.role           │
│     token.department = user.dept     │
│   }                                  │
│   return token                       │
│ }                                    │
│                                      │
│ Creates JWT: eyJhbGc...eyJpc3M...   │
│ Stores in HttpOnly secure cookie    │
│ Cannot be accessed by JavaScript!   │
└──────────────────┬───────────────────┘
                   │
                   │ Auto-sends to client
                   ▼
BROWSER (After Auth):
┌──────────────────────────────────────┐
│ NextAuth stores JWT in HttpOnly     │
│ cookie automatically                 │
│                                      │
│ Browser DevTools → Cookies:          │
│ ┌────────────────────────────────┐  │
│ │ Name:   next-auth.session-token│  │
│ │ Value:  eyJhbGc...             │  │
│ │ Domain: localhost              │  │
│ │ Path:   /                      │  │
│ │ Secure: true                   │  │
│ │ HttpOnly: ✓ (can't JS access)  │  │
│ │ SameSite: Lax                  │  │
│ └────────────────────────────────┘  │
│                                      │
│ app/dashboard/admin/page.tsx runs:  │
│  const {data: session} = useSession()│← Reads from cookie
│                                      │
│  Now has:                            │
│  session.user = {                    │
│    id: "uuid-123",                   │
│    role: "admin",                    │
│    email: "admin@...",               │
│    department: "HR"                  │
│  }                                   │
│                                      │
│  Can show: Admin Dashboard           │
└──────────────────┬───────────────────┘
                   │
                   ▼
NEXT API CALL:
┌──────────────────────────────────────┐
│ Component calls:                     │
│ fetch('/api/interns')                │
│                                      │
│ Browser AUTOMATICALLY includes       │
│ JWT cookie in request headers        │
│ (because it's HttpOnly + same domain)│
│                                      │
│ Server receives:                     │
│ Cookie: next-auth.session-token=...  │
└──────────────────┬───────────────────┘
                   │
                   ▼
API ROUTE VALIDATION:
┌──────────────────────────────────────┐
│ async function GET() {               │
│   const session = await auth()       │
│                                      │
│   NextAuth reads cookie              │
│   Validates JWT signature            │
│   Checks expiry (24 hours)           │
│   Decodes role, id, etc.             │
│                                      │
│   if (!session?.user)                │
│     return 401 Unauthorized          │
│                                      │
│   if (session.user.role !== "admin")│
│     return 403 Forbidden              │
│                                      │
│   // Safe to proceed!                │
│   return fetchInterns()              │
│ }                                    │
└──────────────────┬───────────────────┘
                   │
                   ▼
SUCCESS:
✅ User authenticated
✅ Secure session established
✅ Role-based access granted
✅ Can now use API endpoints
```

---

### **3. STATE MANAGEMENT ARCHITECTURE**

```
┌─────────────────────────────────────────────────────┐
│           REDUX STATE STRUCTURE                     │
└─────────────────────────────────────────────────────┘

REDUX STORE (app/lib/redux/store.ts)
│
├─ UI State (app/lib/redux/slices/uiSlice.ts)
│  │
│  ├─ sidebarCollapsed: false
│  │  └─ User clicks hamburger menu
│  │     → dispatch(toggleSidebar())
│  │     → Redux updates state
│  │     → Sidebar re-renders collapsed
│  │
│  ├─ theme: "dark" | "light" | "auto"
│  │  └─ User toggles dark mode
│  │     → dispatch(setTheme("dark"))
│  │     → Saved to localStorage
│  │     → All components subscribe to theme
│  │     → Tailwind classes update
│  │
│  ├─ deviceType: "mobile" | "tablet" | "desktop"
│  │  └─ On window resize
│  │     → dispatch(setDeviceType("mobile"))
│  │     → Responsive layout adjusts
│  │
│  └─ animationsEnabled: true
│     └─ User disables animations
│        → dispatch(setAnimationsEnabled(false))
│        → Framer Motion variants disabled
│
├─ Auth State (app/lib/redux/slices/authSlice.ts)
│  │
│  ├─ user: { id, name, email, role, avatar }
│  │  └─ Set when session loads (from JWT)
│  │     dispatch(setUser(session.user))
│  │
│  ├─ isAuthenticated: true | false
│  │  └─ Boolean flag for guards
│  │
│  ├─ rememberMe: true | false
│  │  └─ User preference on login
│  │
│  └─ lastLogin: timestamp
│     └─ Tracking for activity monitoring
│
├─ Notifications (app/lib/redux/slices/notificationSlice.ts)
│  │
│  └─ notifications: [
│     {
│       id: "uuid",
│       type: "success" | "error" | "info" | "warning",
│       message: "Intern created successfully",
│       timestamp: 1234567890
│     },
│     ...max 5 toasts
│   ]
│   │
│   └─ When user action completes:
│      → dispatch(addNotification({...}))
│      → NotificationCenter displays toast
│      → Auto-removes after 3-5s
│      → User can close manually
│
└─ Loading (app/lib/redux/slices/loadingSlice.ts)
   │
   └─ isLoading: true | false
      └─ API call in progress?
         → dispatch(setLoading(true))
         → Show spinner/disable buttons
         → dispatch(setLoading(false))
         → Hide spinner/enable buttons

─────────────────────────────────────────────────────

COMPONENT SUBSCRIPTION PATTERN:

┌──────────────────────────┐
│  React Component         │
│                          │
│  const isLoading =       │
│    useAppSelector(       │
│      state =>            │
│        state.loading.    │
│          isLoading       │
│    )                     │
│                          │
│  if (isLoading)          │
│    return <Spinner />    │
│  else                    │
│    return <Content />    │
│                          │
└──────────────────────────┘
     │
     │ subscribes to Redux
     │
     ▼
┌──────────────────────────┐
│  Redux Store             │
│                          │
│  loading: {              │
│    isLoading: true       │
│  }                       │
│                          │
│  When Redux state        │
│  changes:                │
│  → Component re-renders  │
│  → Selector re-runs      │
│  → New value compared    │
│  → UI updates if changed │
└──────────────────────────┘

─────────────────────────────────────────────────────

IMPORTANT: Redux NOT used for business data!

❌ NOT in Redux:
   - List of interns
   - Tasks assigned
   - Reports submitted
   - User profiles

✅ WHY?
   - Hasura is already a state manager
   - GraphQL handles queries efficiently
   - Easier to keep data fresh
   - Avoids duplication + sync issues

✅ HOW to fetch data:
   Component needs interns:
   → useEffect()
   → fetch('/api/interns')
   → setInterns(data)
   → Return in JSX

   OR use SWR/React Query:
   → const {data: interns} = useSWR('/api/interns')
   → Automatic caching + revalidation

─────────────────────────────────────────────────────

REDUX HOOKS USAGE:

import { useAppSelector, useAppDispatch } from '@/app/lib/redux/hooks'
import { setLoading } from '@/app/lib/redux/slices/loadingSlice'

export function MyComponent() {
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector(state => state.loading.isLoading)

  async function handleClick() {
    dispatch(setLoading(true))
    try {
      await fetchData()
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Submit'}
    </button>
  )
}
```

---

## 💻 KEY CODE EXAMPLES

### **Example 1: Complete Auth Flow (3 files)**

**File 1: Login Form (app/auth/login/page.tsx)**
```typescript
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Call NextAuth's signIn function
    const result = await signIn("credentials", {
      identifier: email,
      password,
      redirect: false
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else if (result?.ok) {
      // NextAuth handles redirect internally
      window.location.href = "/dashboard";
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email or User ID"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

**File 2: Auth Config (lib/auth.ts - simplified)**
```typescript
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getUserByEmail } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        identifier: { label: "Email or ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Find user in database
        const user = await getUserByEmail(credentials?.identifier || "");
        if (!user) return null;

        // Compare passwords
        const passwordMatch = await compare(
          credentials?.password || "",
          user.password || ""
        );
        if (!passwordMatch) return null;

        // Return user object (will be encoded in JWT)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department
        };
      }
    })
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.role = token.role;
      session.user.id = token.id;
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 24 hours
  }
};

export default NextAuth(authOptions);
```

**File 3: Protected API Route (app/api/interns/route.ts - simplified)**
```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { hasuraQuery } from "@/lib/hasura";
import { GET_ALL_INTERNS } from "@/lib/graphql/queries";

export async function GET() {
  // This is called AFTER user logs in
  // JWT token is in HttpOnly cookie
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Safe to query - user is authenticated admin
  const data = await hasuraQuery(GET_ALL_INTERNS);
  return NextResponse.json(data);
}
```

---

### **Example 2: GraphQL Integration**

**File 1: GraphQL Query (lib/graphql/queries.ts)**
```typescript
import { gql } from '@apollo/client';

export const GET_ALL_INTERNS = gql`
  query GetAllInterns {
    users(where: { role: { _eq: "intern" } }) {
      id
      email
      password
      role
      profiles {
        name
        department
        phone
      }
      interns {
        college_name
        university
        start_date
        end_date
        status
        mentor_id
      }
    }
  }
`;
```

**File 2: Hasura Client (lib/hasura.ts - core logic)**
```typescript
import { print, DocumentNode } from 'graphql';

export async function hasuraCall<T = any>(
  query: string | DocumentNode,
  variables: Record<string, any> = {}
): Promise<T> {
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT ||
                   'http://localhost:8081/v1/graphql';
  const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET || 'hasura';

  // Convert DocumentNode to string
  const queryString = typeof query === 'string' ? query : print(query);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': adminSecret
    },
    body: JSON.stringify({
      query: queryString,
      variables
    })
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'GraphQL failed');
  }

  return result.data as T;
}

// Used like:
const data = await hasuraCall(GET_ALL_INTERNS);
```

**How it works:**
1. GraphQL query passed to `hasuraCall()`
2. Query converted to string
3. Sent as HTTP POST to Hasura endpoint
4. Hasura converts to SQL
5. PostgreSQL executes
6. Results returned as JSON
7. TypeScript ensures type safety

---

### **Example 3: Redux State Management**

**File 1: Redux Slice (app/lib/redux/slices/loadingSlice.ts)**
```typescript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload; // true or false
    },
    clearLoading: (state) => {
      state.isLoading = false;
    }
  }
});

export const { setLoading, clearLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
```

**File 2: Using Redux (React Component)**
```typescript
"use client";

import { useAppDispatch, useAppSelector } from '@/app/lib/redux/hooks';
import { setLoading } from '@/app/lib/redux/slices/loadingSlice';
import { addNotification } from '@/app/lib/redux/slices/notificationSlice';

export function CreateInternForm() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.loading.isLoading);

  async function handleSubmit(formData) {
    dispatch(setLoading(true)); // ← Show spinner

    try {
      const response = await fetch('/api/interns', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        dispatch(addNotification({
          type: 'success',
          message: 'Intern created successfully!'
        }));
        // Reset form, refresh list, etc.
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to create intern'
      }));
    } finally {
      dispatch(setLoading(false)); // ← Hide spinner
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" placeholder="Email" required />
      <input name="name" placeholder="Name" required />
      <button disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Intern'}
      </button>
    </form>
  );
}
```

**Result:**
- User clicks button
- Redux sets `isLoading = true`
- Button shows "Creating..." and disables
- API call happens
- Response returns
- Redux sets `isLoading = false`
- Button re-enables and shows "Create Intern"
- Success notification appears

---

### **Example 4: Role-Based Authorization**

**API Route with Role Check:**
```typescript
// app/api/interns/route.ts

export async function POST(request: NextRequest) {
  // 1. Check authentication (JWT valid)
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Check authorization (role == admin)
  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    return NextResponse.json(
      { error: "Only admins can create interns" },
      { status: 403 }
    );
  }

  // 3. Safe to proceed - user has permission
  const body = await request.json();

  // Create intern...

  return NextResponse.json({ intern });
}
```

**Three-layer authorization:**
1. JWT valid? → 401 if not
2. Role correct? → 403 if not
3. Data ownership? (e.g., Intern can only see own tasks)

---

## 🎯 KEY TAKEAWAYS FOR PRESENTATION

1. **Full-Stack Architecture**: Frontend (React) → Backend (Next.js) → Data (GraphQL) → Database (PostgreSQL)

2. **Security**: JWT auth + bcryptjs + role-based access control at every layer

3. **State Management**: Redux for UI only, Hasura for data

4. **SSR/CSR Hybrid**: Initial load is SSR, interactive features are CSR

5. **Scalability**: GraphQL abstraction, cloud-ready Docker deployment

6. **Type Safety**: TypeScript everywhere (frontend + backend)

7. **Developer Experience**: Hot reloading, clear folder structure, Redux DevTools
