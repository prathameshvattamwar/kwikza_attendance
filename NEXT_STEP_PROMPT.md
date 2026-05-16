# Paste everything below this line into Windsurf Claude terminal

---

You are continuing development of an **Attendance Management System** — a production-grade monorepo web app. The project is already 80% functional. Your job is to take it to production quality with real integrations, polish remaining placeholder pages, add missing features, and deploy it.

---

## PROJECT OVERVIEW

**Tech Stack:**
- **Frontend:** React 18 + Vite + TailwindCSS + React Router DOM 6 + @tanstack/react-query + react-hook-form + Zod + Recharts + lucide-react + sonner (toasts)
- **Backend:** Express.js 4 + Knex.js (query builder) + PostgreSQL (Supabase) + JWT (access + refresh with httpOnly cookies) + Zod validation + nodemailer
- **Database:** Supabase PostgreSQL — 12 tables: organizations, users, roles, departments, attendance_records, leave_types, leave_balances, leave_requests, holidays, sessions, otp_verifications, audit_logs

**Folder Structure:**
```
/client                  → React frontend (Vite)
  /src
    /api                 → Axios API layer (auth, attendance, leave, holiday, employee, dashboard)
    /components          → Reusable UI (common/, layout/, attendance/, leave/)
    /contexts            → AuthContext, ThemeContext
    /hooks               → React Query hooks (useAttendance, useLeaves, useHolidays, useAuth, useGeolocation)
    /lib                 → utils.js, constants.js, helpers.js
    /pages               → Route pages (admin/, employee/, auth/)
    /routes              → React Router setup (index.jsx, ProtectedRoute, AdminRoute)
    /schemas             → Zod form schemas
/server                  → Express.js backend
  /src
    /config              → env.js, database.js (Knex), constants.js, cors.js
    /controllers         → auth, attendance, dashboard, employee, leave, holiday
    /middleware           → auth, rbac, validate, errorHandler, rateLimiter, asyncHandler
    /models              → Knex query functions (user, attendance, leave, holiday, session, department, auditLog)
    /routes              → Express routers
    /services            → Business logic layer
    /utils               → AppError, response helpers, pagination, haversine, logger, tokenHelper
    /validators          → Zod schemas for request validation
```

**What's Already Working:**
- JWT auth with refresh token rotation (httpOnly cookies)
- Login page, forgot password, OTP verification, setup password pages
- Employee dashboard with check-in/check-out (geofence-based), attendance history, monthly calendar
- Admin dashboard with org-wide attendance stats
- Employee CRUD management (admin)
- Leave management — employee can apply/cancel, admin can approve/reject
- Holiday management — admin CRUD
- RBAC with 5 roles: super_admin, org_admin, hr_manager, team_lead, employee
- Responsive UI — mobile and desktop layouts with premium styling
- Rate limiting, error handling, request logging

**What's Still Placeholder / Missing (these are the pages that just show "Coming Soon"):**
1. `client/src/pages/employee/ApplyLeave.jsx` — placeholder (leave apply form already exists inside MyLeaves.jsx, so this page should redirect there or have its own standalone form)
2. `client/src/pages/employee/HolidayCalendar.jsx` — placeholder (should show org holidays in a beautiful calendar view using data from GET /holidays)
3. `client/src/pages/admin/ReportsPage.jsx` — placeholder (needs real reports: attendance reports, leave reports, exportable to CSV/PDF)
4. Profile page exists but is read-only — needs edit profile functionality (name, phone, profile picture upload)

**Current Environment:**
```
# server/.env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:KwikzaAttend2026!@db.iruermkyiblkkrtegejg.supabase.co:5432/postgres
SUPABASE_URL=https://iruermkyiblkkrtegejg.supabase.co
JWT_ACCESS_SECRET=d3cd589092a253651bd0561dfa5be0ec4d03dbd5bb4b64c2a8c4a3e3c35c10539eed71c4be2568d5ac17aabb17f203c7
JWT_REFRESH_SECRET=664ef6a6efa9466bd83d2036b1acf26232c175508d3a60664a9c91dfed1e7ffb7e7658a8c96cdbbb7ca86b69fc4de58f
CORS_ORIGIN=http://localhost:5173
```

**Frontend runs on:** `http://localhost:5173` (Vite dev server)
**Backend runs on:** `http://localhost:5001`
**Vite proxy:** `/api/v1` proxied to `http://localhost:5001/api/v1`

---

## YOUR TASKS — Do them in this exact order:

### PHASE 1: Google OAuth Login (Real Social Login)

**Goal:** Add "Sign in with Google" button on the login page so users can authenticate via Google.

**Steps:**

1. **Create a Google OAuth Client:**
   - I will create credentials at https://console.cloud.google.com (give me the exact step-by-step instructions in extremely simple language — assume I've never used Google Cloud Console before)
   - After I give you the Client ID and Client Secret, add them to `server/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

2. **Backend — Google OAuth endpoint:**
   - Install `google-auth-library` in the server
   - Add `POST /auth/google` endpoint in `server/src/routes/auth.routes.js`
   - In `server/src/controllers/auth.controller.js`, add a `googleLogin` controller that:
     - Receives `{ credential }` (the Google ID token from frontend)
     - Verifies it with Google using `google-auth-library`
     - Extracts email, name, picture from the token payload
     - Checks if a user with that email already exists — if yes, log them in (issue JWT tokens)
     - If no user exists, create a new user with `is_first_login: false`, `is_email_verified: true`, and the employee role, then log them in
     - Return the same response format as the regular login: `{ user, accessToken }` + refresh token cookie
   - Add the logic in `server/src/services/auth.service.js`

3. **Frontend — Google Sign-In button:**
   - Install `@react-oauth/google` in the client
   - Wrap the app with `<GoogleOAuthProvider clientId={...}>` in `App.jsx`
   - Add the Google Client ID to `client/.env` as `VITE_GOOGLE_CLIENT_ID`
   - On `LoginPage.jsx`, add a styled "Sign in with Google" button using `useGoogleLogin` or `<GoogleLogin>` component
   - On success, send the credential to `POST /auth/google`, then handle the response exactly like regular login (store token, navigate to dashboard)
   - Style it to match the existing premium login page design — Google button below the regular login form with an "or" divider

4. **Database — add google fields:**
   - Add `google_id` (varchar, nullable) and `avatar_url` (text, nullable) columns to the `users` table
   - Instruction: Tell me the exact SQL to run in Supabase SQL Editor (step by step, very simple)

### PHASE 2: Fix Remaining Placeholder Pages

5. **Employee Holiday Calendar (`HolidayCalendar.jsx`):**
   - Replace the "Coming Soon" placeholder with a real calendar view
   - Use the existing `useHolidays` hook from `client/src/hooks/useHolidays.js` to fetch data from `GET /holidays`
   - Show a full-month calendar grid (similar style to AttendanceSummary.jsx calendar)
   - Holidays highlighted with color-coded dots by type (national=blue, regional=purple, company=green, optional=yellow)
   - Upcoming holidays list below the calendar
   - Year selector at the top

6. **Apply Leave page (`ApplyLeave.jsx`):**
   - Since `MyLeaves.jsx` already has an apply-leave panel, make this page either redirect to `/employee/my-leaves` with a query param to auto-open the apply panel, OR build a standalone full-page leave application form that looks premium

7. **Reports Page (`ReportsPage.jsx`):**
   - Build a real reports page for admins
   - Three report types with tabs: Attendance Report, Leave Report, Employee Report
   - **Attendance Report:** Date range picker → table of all employees' attendance for that period → Download CSV button
   - **Leave Report:** Month/year selector → leave usage by employee → Download CSV button
   - **Employee Report:** Full employee directory export → Download CSV
   - Backend: Add `GET /reports/attendance`, `GET /reports/leaves`, `GET /reports/employees` endpoints in a new `reports.routes.js`, `reports.controller.js`, `reports.service.js`
   - Use proper pagination and the existing response utilities

8. **Profile Edit:**
   - On `ProfilePage.jsx`, add an "Edit Profile" button that opens an edit form/modal
   - Allow editing: first_name, last_name, phone, date_of_birth
   - Backend: Add `PATCH /auth/profile` endpoint that updates the user's own profile
   - Profile picture upload: Use Supabase Storage to upload avatar images, store the URL in `avatar_url` column

### PHASE 3: Real Email Notifications

9. **SMTP Email Setup:**
   - The backend already has `server/src/services/email.service.js` and env vars for SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
   - Tell me step-by-step how to set up a free email sending service (like Gmail SMTP with app password, or Resend, or Brevo) in extremely simple language
   - After I provide SMTP credentials, update the `.env` file
   - Make sure these emails actually send:
     - OTP emails for forgot password
     - Leave request submitted (to the employee)
     - Leave approved/rejected notification (to the employee)
     - New employee welcome email with temporary password

### PHASE 4: Polish and Production Readiness

10. **Error Boundaries:** Add a React Error Boundary component that catches frontend crashes and shows a friendly "Something went wrong" page instead of a white screen

11. **404 Page:** Create a proper styled 404 page for unknown routes instead of redirecting to root

12. **Dark Mode:** The ThemeContext already exists at `client/src/contexts/ThemeContext.jsx`. Wire it up properly so the toggle in the navbar switches between light and dark themes across the entire app. Use Tailwind's `dark:` classes.

13. **Loading Skeleton:** Replace plain spinners with skeleton loading animations on the dashboard and list pages for a more premium feel

14. **Toast Notifications:** Make sure every user action (check-in, check-out, leave apply, leave approve/reject, holiday create/edit/delete, profile update) shows proper success/error toast notifications using sonner

15. **Audit Log:** The `audit_logs` table already exists. Wire up the `auditLog.model.js` to log important actions: login, logout, leave approve/reject, employee create/update, holiday create/delete. Show a simple audit log viewer in the admin panel.

### PHASE 5: Deployment

16. **Vercel Deployment:**
    - The root already has a `vercel.json` and `api/index.js` entry point
    - Tell me the exact step-by-step to deploy on Vercel (extremely simple language):
      - How to connect the GitHub repo
      - What build settings to use
      - What environment variables to add
      - How to set the correct CORS_ORIGIN for production
    - Make sure the Vite frontend builds to `/client/dist` and is served correctly
    - Make sure the API routes work at `/api/v1/*`

---

## CODE QUALITY RULES — Follow these strictly:

1. **No hardcoded data.** Every piece of data must come from the API. No fake users, no mock charts, no placeholder numbers.

2. **Match existing patterns exactly:**
   - Backend response: `success(res, 'Message', data)` — message before data
   - Backend created: `created(res, data, 'Message')` — data before message
   - Models: `db(TABLE).where(...).returning('*')`, updates include `updated_at: db.fn.now()`
   - Controllers: Always wrap with `asyncHandler`
   - Frontend hooks: `select: (response) => response.data?.data || response.data`
   - Frontend pages: Always use `PageWrapper`, `LoadingSpinner`, `EmptyState` components

3. **Don't break existing functionality.** Before modifying any file, understand what it currently does.

4. **Database column names matter.** The organizations table uses `office_latitude` and `office_longitude` (NOT `geofence_lat`/`geofence_lon`). The attendance_records table uses `check_in` and `check_out` (NOT `check_in_time`/`check_out_time`). The `leave_balances.remaining_days` is a GENERATED column — never include it in INSERT or UPDATE.

5. **Professional structure:**
   - Every new feature gets its own model, service, controller, route, validator files
   - Reuse existing utilities (pagination, AppError, response helpers)
   - Add JSDoc comments on all exported functions
   - Keep files under 300 lines — split into smaller modules if needed

6. **Responsive design:** Every page must work on mobile (375px) and desktop (1440px). Use Tailwind responsive classes: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

7. **Error handling:** Every API call in the frontend must handle errors gracefully — show toast messages, don't crash.

---

## MANUAL STEPS — Write these for me in extremely simple language

For anything that requires me to do something outside of code (like creating Google OAuth credentials, setting up email, deploying to Vercel, running SQL in Supabase), write the instructions like this:

```
MANUAL STEP: [Title]

What you need to do:
1. Open [exact URL] in your browser
2. Click on [exact button name]
3. ...

After you're done:
- Copy [this value] and paste it here
- I'll add it to the code
```

Assume I know nothing about Google Cloud, Supabase Dashboard, Vercel, or SMTP setup. Write every click, every button, every field name.

---

## START

Begin with Phase 1 (Google OAuth). First, give me the manual instructions to create Google OAuth credentials. Then, while I'm doing that, start building the backend Google auth endpoint and frontend Google login button. Work through each phase sequentially. After each phase, verify everything works before moving to the next one.
