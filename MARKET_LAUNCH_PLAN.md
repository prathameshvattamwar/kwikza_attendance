# AttendMS — Market-Launch Roadmap
## From Current State → HROne-Level Production Product

**Research basis:** HROne, Keka HR, Darwinbox, GreytHR, BambooHR, Truein  
**Date created:** 2026-05-16  
**Current state:** ~35% of a production HR product  
**Goal:** Ship a product that organizations of 10–500 employees would pay for

---

## CRITICAL BUGS TO FIX FIRST (Before ANY new feature)

### BUG-001 🔴 Dashboard 500 Error — Wrong Column Name
- **File:** `server/src/services/dashboard.service.js`
- **Problem:** References `attendance_records.check_in` but DB column is `check_in_time`
- **Fix:** Replace all `check_in` → `check_in_time`, `check_out` → `check_out_time`

### BUG-002 🔴 Check-In Geofence Never Works for New Orgs
- **Problem:** `organizations.office_latitude` / `office_longitude` are NULL for new orgs because there's no UI to set them
- **Fix:** Block check-in with a clear message if org has no office location configured; add setup prompt

### BUG-003 🔴 `work_start_time` Column Does Not Exist
- **File:** `server/src/services/attendance.service.js`
- **Problem:** References `organizations.work_start_time` which isn't in schema
- **Fix:** Remove this field reference; use constants or org settings table

### BUG-004 🔴 No Real Admin/HR/Employee Setup Flow
- **Problem:** After login, no wizard guides admin to configure the system
- **Fix:** Setup wizard before accessing dashboard

### BUG-005 🔴 Hardcoded Credentials / No Real Signup
- **Problem:** No public registration — only way to create users is via admin panel
- **Fix:** Super admin seeding + organization onboarding invite system

---

## SPRINT 1 — Foundation Fixes (Week 1–2)
**Goal:** Fix all critical bugs. Make existing features actually work reliably.

### 1.1 Fix Dashboard Service Column Names
- `check_in` → `check_in_time`
- `check_out` → `check_out_time`
- Test all admin dashboard queries

### 1.2 Organization Settings Page (Admin)
Full page at `/admin/settings` with tabs:
- **General:** Company name, logo upload (Supabase storage), address, timezone, financial year start
- **Attendance Policy:** Work start time (replaces hardcoded 09:30), grace period minutes (default 15), half-day minimum hours (default 4), work hours per day (default 8)
- **Office Location:** Interactive map (Google Maps or Leaflet) to pin office location, geofence radius slider (50m–1000m), save lat/lng/radius to organizations table
- **Notifications:** Toggle which events send email, SMTP test button
- **Compliance:** PAN, GST, PF number fields (stored, not validated)

### 1.3 Database Migration
Add to `organizations` table:
```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:30';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS half_day_hours NUMERIC(4,2) DEFAULT 4.0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS work_hours_per_day NUMERIC(4,2) DEFAULT 8.0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Kolkata';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 4;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS gst_number VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pf_number VARCHAR(30);
```

### 1.4 Fix Attendance Service
- Use `work_start_time` from `organizations` table (fetched via JOIN)
- Use `grace_period_minutes` from org settings for late threshold calculation
- Remove all hardcoded time values

### 1.5 First-Login Setup Wizard (Admin)
When `org.setup_complete = false` (add this column), redirect admin to `/setup` wizard with 4 steps:
1. **Company Profile** — Name, logo, timezone, address
2. **Office Location** — Map picker + geofence radius
3. **Work Policy** — Start time, grace period, work hours
4. **Done** — "Your workspace is ready" CTA to dashboard

---

## SPRINT 2 — Real Multi-User System (Week 3–4)
**Goal:** Any HR admin can add real employees who can log in and use the system.

### 2.1 Employee Onboarding Flow (Admin)
Complete flow:
- Admin fills: Name, email, employee ID, department, designation, role, date of joining
- System auto-generates a secure temp password (shown once to admin, emailed to employee)
- Employee receives welcome email with login link + temp password
- On first login → forced password change (setup-password page, already exists)
- Admin can see "Pending first login" badge on employee list

### 2.2 Department Management (Admin)
Full CRUD for departments:
- Create/edit/delete departments
- Assign department head
- View employees per department
- Bulk move employees between departments

### 2.3 Employee Profile — Complete
For admin view of any employee:
- Personal info, work info, emergency contact
- Attendance summary (current month stats)
- Leave balance summary
- Documents tab (offer letter upload, Aadhar, PAN)
- Action buttons: Edit, Deactivate, Resend Welcome Email, Reset Password

### 2.4 Self-Service Employee Profile
Employee editing own profile:
- Profile photo (Supabase storage upload)
- Phone, address, emergency contact
- Bank account details (for payroll — just store, don't process)
- View (read-only): employee ID, department, designation, joining date, role

### 2.5 Roles & Permissions Page (Admin)
Show all 5 system roles with their permissions in a readable table:
- What each role can view/create/edit/delete
- Assign role when creating employee
- (No custom role creation in V1 — keep it to 5 fixed roles)

---

## SPRINT 3 — Attendance Intelligence (Week 5–6)
**Goal:** Attendance data is reliable, meaningful, and actionable.

### 3.1 Attendance Regularization Request
Employee workflow:
- Employee sees a date marked "Absent" on their calendar
- Clicks "Request Regularization"
- Fills: date, actual check-in time, actual check-out time, reason (dropdown + text)
- Manager gets notification to approve/reject
- If approved: attendance record updated

Backend:
- New table: `attendance_regularization_requests`
- New API: `POST /attendance/regularize`, `GET /attendance/regularize` (admin list), `PATCH /attendance/regularize/:id/approve|reject`

### 3.2 On-Duty / Remote Work Request
Employee workflow:
- Employee is outside geofence (client visit, WFH, field work)
- Submits "On-Duty" request with: date, location description, purpose, client/site name
- Manager approves → that day marked as "On Duty / Present"

### 3.3 Multi-Location Geofence (Admin)
- Admin creates multiple "Locations" (branches, client sites, WFH)
- Each location has name, address, lat/lng, radius
- Employees assigned to a primary location
- Check-in validated against their assigned location

### 3.4 Live Attendance Dashboard (Admin)
Today's attendance at-a-glance:
- Cards: Checked In, Yet to Check In, On Leave, Absent
- Employee list grouped by status — click any employee for details
- Last refreshed X minutes ago + manual refresh button

### 3.5 Attendance Summary Improvements
- Weekend auto-detection (Saturday/Sunday = `weekend` status, not `absent`)
- Public holiday auto-detection (if date is in holidays table → `holiday`, not `absent`)
- Monthly working days count (excludes weekends + holidays)
- Percentage attendance calculation: (present + late + half_day) / working_days

---

## SPRINT 4 — Leave Management Upgrade (Week 7–8)
**Goal:** Complete leave lifecycle matching enterprise products.

### 4.1 Leave Policy Configuration (Admin)
Settings page → Leave Policies tab:
- Configure each leave type: max days per year, carry forward yes/no, max carry forward days, encashment yes/no, probation restriction yes/no
- Add new custom leave types (beyond the 4 defaults)
- Annual leave reset automation (cron job on Jan 1 or fiscal year start)

### 4.2 Leave Approval Workflow
- Multi-level: Employee → Direct Manager → HR (configurable, max 2 levels)
- Email + in-app notification at each step
- Delegation: Manager can delegate approval to another user while on leave

### 4.3 Comp-Off Management
- When employee works on holiday/weekend and admin approves, comp-off credit added
- Comp-off is a special leave type with expiry (e.g. must use within 60 days)
- Employee sees comp-off balance in leave dashboard

### 4.4 Leave Calendar (Admin)
- Calendar view showing all leaves in the organization for a month
- Color coded by department
- Filter by department, leave type, status
- Export to PDF

### 4.5 Leave Encashment (HR)
- At year end, unused Earned Leave can be encashed
- HR marks encashment, balance reset
- Export encashment report for payroll

---

## SPRINT 5 — Reports & Analytics (Week 9–10)
**Goal:** Real, useful reports that HR and managers actually need.

### 5.1 Attendance Reports
- **Daily Report:** All employees, today's status, check-in/check-out times
- **Monthly Report:** Employee-wise summary (present/absent/late/leave counts, total hours)
- **Department Report:** Department-wise attendance rate comparison
- **Exception Report:** Late arrivals, early departures, missed check-outs, outside-geofence attempts
- Export: CSV and PDF (use `jspdf` + `jspdf-autotable` for PDF)

### 5.2 Leave Reports
- **Leave Balance Report:** All employees, each leave type, used/remaining
- **Leave Utilization Report:** Which departments use the most leaves
- **Pending Approvals Report:** All unapproved leave requests by age
- Export: CSV

### 5.3 Employee Reports
- **Headcount Report:** Active/inactive employees by department, role, joining date range
- **Attrition Report:** Employees who left in a date range
- Export: CSV + Excel format

### 5.4 Analytics Dashboard
New `/admin/analytics` page:
- Attendance trend chart (last 30 days, line chart)
- Department-wise attendance rate (horizontal bar chart)
- Late arrival heatmap (day of week vs hour)
- Leave utilization by month (stacked bar chart)
- Top 5 employees with most absences (table)
- Top 5 employees with most leaves (table)

---

## SPRINT 6 — UX/UI Premium Overhaul (Week 11–12)
**Goal:** Redesign to match enterprise SaaS visual standards.

### 6.1 Design Token Migration
Replace current `primary-*` (blue) with new `primary-*` (indigo `#6366F1`):
- Update `tailwind.config.js` with full color tokens from Brand Guidelines
- Add `success`, `warning`, `danger` semantic tokens
- Update all component classes throughout the app

### 6.2 Sidebar Redesign
- Add section group headers: "OVERVIEW", "ATTENDANCE", "LEAVE", "PEOPLE", "SYSTEM"
- Add notification count badge on "Leave Approvals" when there are pending items
- Company logo/name at top instead of just "AttendMS"
- Collapse to icon-only on medium screens

### 6.3 Global Search (Cmd+K)
- Command palette accessible via Cmd+K or clicking search icon
- Search across: employees (by name/ID/email), leave requests, attendance dates
- Recent actions in search history
- Keyboard navigation in results

### 6.4 Notification Center
- Bell icon in navbar shows unread count
- Click → drawer with notifications list
- Types: leave approved/rejected, new employee added, holiday added, regularization approved
- Mark all as read button

### 6.5 Check-In UX Redesign
Current check-in is functional but not premium. New design:
- Full-screen check-in modal/page
- Large clock showing current time
- Location status: "You are 45m from Office" with distance display
- Animated ripple on the check-in button
- Selfie capture option (camera, stored as base64 or Supabase URL)
- Post check-in animation: success state with time recorded

### 6.6 Dashboard Redesign
Admin dashboard:
- Greeting with date + today's summary
- 4 large KPI cards (Present, Absent, On Leave, Late) with trend vs yesterday
- Live attendance feed (auto-refreshing every 2 minutes)
- Quick action buttons: Add Employee, Add Holiday, View Reports, Export Today's Data
- Mini attendance chart (last 7 days area chart)
- Pending approvals widget (leave requests awaiting action)

Employee dashboard:
- Today's check-in status prominently displayed
- Next meeting / shift time
- Leave balance summary (remaining days by type)
- This month's attendance: mini calendar with colored dots
- Upcoming holidays (next 2–3 dates)
- Quick action: Apply Leave button

### 6.7 Empty States Redesign
Replace generic icons + "Coming Soon" with illustrated empty states:
- SVG illustrations (or use undraw.co style)
- Clear CTA: "Add your first employee", "Create your first holiday", etc.
- Consistent across all pages

### 6.8 Mobile Optimization
- Bottom navigation bar on mobile (instead of hamburger sidebar)
- Large touch targets for check-in/check-out (min 48px)
- PWA manifest + service worker for "Add to Home Screen"
- Offline indicator when no internet

---

## SPRINT 7 — Security & Production Hardening (Week 13–14)
**Goal:** Ready for real organizations with real data.

### 7.1 Supabase RLS Policies
Add proper Row Level Security policies:
```sql
-- Users can only see their own org's data
CREATE POLICY "org_isolation" ON users
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));
```

### 7.2 Input Validation Hardening
- Add Zod validators for ALL endpoints (currently several have none)
- Sanitize all text inputs (no HTML injection)
- Rate limiting: stricter limits on check-in endpoint (once per 5 minutes per user)

### 7.3 API Documentation
- Add Swagger/OpenAPI documentation (`swagger-jsdoc` + `swagger-ui-express`)
- Document all endpoints, request/response schemas
- Deploy at `/api/docs`

### 7.4 Health Monitoring
- Backend `/api/health` endpoint returns DB connection status, memory usage, version
- Add Sentry error tracking (frontend + backend)
- Add basic metrics logging for response times

### 7.5 Data Backup & Export
- Admin can export entire organization's data as ZIP (employees, attendance, leaves)
- Data retention policy: 7 years for compliance
- Soft-delete everywhere (no hard deletes of attendance/leave data)

---

## SPRINT 8 — Launch Preparation (Week 15–16)
**Goal:** Everything needed to onboard real paying customers.

### 8.1 Multi-Tenant Organization Registration
- Public landing page (or invite-only)
- Organization signup: email → OTP verify → create org → admin account → setup wizard
- Each org is isolated (organization_id on all tables — already have this)

### 8.2 Pricing & Subscription (Simple V1)
- Free tier: up to 10 employees
- Paid tier: unlimited employees
- Track `organizations.subscription_status` (free/paid/expired)
- Stripe integration for payment (or manual for now)

### 8.3 Landing Page
Marketing page at `/` (separate from app at `/login`):
- Hero: "Smart Attendance Management for Modern Teams"
- Features section (check-in, leave, reports)
- Pricing table
- Testimonials placeholder
- CTA: "Start Free" → goes to signup

### 8.4 Super Admin Panel
Separate panel for you (the product owner) at `/superadmin`:
- View all organizations
- View subscription status
- Impersonate any org for support
- System health metrics

### 8.5 Documentation & Help Center
- In-app help tooltips on complex features
- Help articles: "How to set up your first time", "How does geofence work?"
- Video walkthrough links (Loom recordings)

---

## IMPLEMENTATION PRIORITY MATRIX

| Priority | Sprint | Feature | Effort | Impact |
|----------|--------|---------|--------|--------|
| 🔴 P0 | S1 | Fix dashboard 500 error | 1h | Unblocks everything |
| 🔴 P0 | S1 | Organization Settings page | 3d | Unblocks geofence, work policy |
| 🔴 P0 | S1 | Setup wizard | 2d | Onboarding usable |
| 🔴 P0 | S2 | Real employee invite flow | 2d | Core use case |
| 🟠 P1 | S3 | Live attendance dashboard | 2d | High daily use |
| 🟠 P1 | S3 | Weekend/holiday auto-detection | 1d | Accuracy |
| 🟠 P1 | S4 | Leave policy config | 2d | Enterprise requirement |
| 🟠 P1 | S5 | Real reports + PDF export | 3d | HR requirement |
| 🟡 P2 | S6 | Global search (Cmd+K) | 2d | UX delight |
| 🟡 P2 | S6 | Notification center | 2d | Engagement |
| 🟡 P2 | S6 | Check-in UX redesign | 2d | First impression |
| 🟡 P2 | S6 | Design token migration | 1d | Visual quality |
| 🟢 P3 | S7 | RLS policies | 1d | Security |
| 🟢 P3 | S7 | Sentry integration | 1d | Observability |
| 🟢 P3 | S8 | Multi-tenant signup | 3d | Growth |
| 🟢 P3 | S8 | Landing page | 2d | Marketing |

---

## WHAT TO DO RIGHT NOW (Next Session)

**Start with Sprint 1.2 — Organization Settings Page because it unblocks:**
- Geofence check-in (needs lat/lng configured)
- Late threshold calculation (needs work_start_time)
- Dashboard data (needs attendance policy set)
- Everything else

**Exact order for next coding session:**
1. Run Sprint 1 database migration SQL in Supabase
2. Update `attendance.service.js` to remove hardcoded `work_start_time` reference
3. Fix `dashboard.service.js` column names (check_in_time, check_out_time)
4. Build `/admin/settings` page (General + Attendance Policy + Office Location tabs)
5. Build first-login setup wizard for new admins
6. Update brand colors in tailwind.config.js (indigo primary)
7. Test the full flow: new admin → setup → add employee → employee logs in → checks in
