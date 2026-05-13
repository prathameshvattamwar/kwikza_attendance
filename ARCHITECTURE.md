# Office Attendance Management System - Architecture Document

**Version:** 1.0.0
**Last Updated:** 2026-05-13
**Status:** Production Architecture Reference

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Folder Structure](#2-folder-structure)
3. [Full PostgreSQL Schema](#3-full-postgresql-schema)
4. [Backend API Architecture](#4-backend-api-architecture)
5. [Authentication Flow](#5-authentication-flow)
6. [Attendance Flow](#6-attendance-flow)
7. [Leave Management Flow](#7-leave-management-flow)
8. [Admin Dashboard Planning](#8-admin-dashboard-planning)
9. [Employee Dashboard Planning](#9-employee-dashboard-planning)
10. [Middleware Structure](#10-middleware-structure)
11. [Validation Strategy](#11-validation-strategy)
12. [Error Handling Strategy](#12-error-handling-strategy)
13. [Security Best Practices](#13-security-best-practices)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Scalable Coding Practices](#15-scalable-coding-practices)
16. [Development Roadmap](#16-development-roadmap)
17. [NPM Packages](#17-npm-packages)
18. [Reusable Components](#18-reusable-components)
19. [Future Scalability Suggestions](#19-future-scalability-suggestions)
20. [Development Phases](#20-development-phases)

---

## 1. System Architecture

### Overview

The system follows a **three-tier architecture** pattern separating presentation, business logic, and data persistence into distinct layers. This enables independent scaling, testing, and deployment of each tier.

```
+--------------------------------------------------+
|                  CLIENT TIER                      |
|          React SPA (Vite + Tailwind)              |
|     Deployed on Vercel (CDN + Edge Network)       |
+-------------------------+------------------------+
                          |
                    HTTPS / REST
                          |
+-------------------------v------------------------+
|                APPLICATION TIER                   |
|           Node.js + Express REST API              |
|          Deployed on Render (Docker)              |
+-------------------------+------------------------+
                          |
                   TCP / SSL (Pool)
                          |
+-------------------------v------------------------+
|                  DATA TIER                        |
|         PostgreSQL (Neon Serverless)              |
|         PgBouncer Connection Pooling             |
+--------------------------------------------------+
```

### Backend Layered Architecture

Requests flow through a strict chain of responsibility. Each layer has a single purpose and communicates only with its adjacent layers.

```
Incoming HTTP Request
        |
        v
+----------------+
|    Routes      |  Define endpoints, attach middleware, delegate to controllers
+-------+--------+
        |
        v
+----------------+
|  Middleware     |  Auth verification, RBAC, validation, rate limiting, logging
+-------+--------+
        |
        v
+----------------+
|  Controllers   |  Parse request, call services, format HTTP response
+-------+--------+
        |
        v
+----------------+
|   Services     |  Business logic, orchestration, transaction management
+-------+--------+
        |
        v
+----------------+
|  Repositories  |  Database queries, data mapping, query building (Knex)
+-------+--------+
        |
        v
+----------------+
|   Database     |  PostgreSQL tables, indexes, constraints, triggers
+----------------+
```

**Layer Responsibilities:**

| Layer | Responsibility | Knows About |
|-------|---------------|-------------|
| Routes | URL mapping, middleware chaining | Controllers, Middleware |
| Middleware | Cross-cutting concerns (auth, validation, logging) | Services (limited) |
| Controllers | HTTP request/response handling | Services |
| Services | Business rules, orchestration, transactions | Repositories |
| Repositories | SQL queries, data access patterns | Database |
| Database | Data storage, constraints, indexes | Nothing (bottom layer) |

### Communication Patterns

- **Frontend to Backend:** RESTful HTTP/HTTPS with JSON payloads. All requests include JWT in Authorization header (except public routes).
- **Backend to Database:** Connection pool via PgBouncer. Knex query builder for SQL generation. Parameterized queries only.
- **Authentication:** Stateless JWT access tokens with server-side refresh token storage.
- **Error Propagation:** Errors bubble up through layers, caught by global error handler middleware, formatted into consistent JSON responses.

---

## 2. Folder Structure

### Production-Ready Monorepo

```
attendance-system/
|
+-- client/                          # React frontend application
|   +-- public/                      # Static public assets
|   |   +-- favicon.ico
|   |   +-- manifest.json
|   |   +-- robots.txt
|   +-- src/
|   |   +-- api/                     # API layer
|   |   |   +-- axios.js             # Axios instance with interceptors
|   |   |   +-- auth.api.js          # Auth endpoints
|   |   |   +-- attendance.api.js    # Attendance endpoints
|   |   |   +-- leave.api.js         # Leave endpoints
|   |   |   +-- holiday.api.js       # Holiday endpoints
|   |   |   +-- employee.api.js      # Employee management endpoints
|   |   |   +-- dashboard.api.js     # Dashboard data endpoints
|   |   |   +-- index.js             # Barrel export
|   |   |
|   |   +-- assets/                  # Static assets
|   |   |   +-- images/
|   |   |   +-- icons/
|   |   |   +-- fonts/
|   |   |
|   |   +-- components/              # Reusable UI components
|   |   |   +-- ui/                  # shadcn/ui base components
|   |   |   |   +-- button.jsx
|   |   |   |   +-- input.jsx
|   |   |   |   +-- dialog.jsx
|   |   |   |   +-- select.jsx
|   |   |   |   +-- table.jsx
|   |   |   |   +-- card.jsx
|   |   |   |   +-- badge.jsx
|   |   |   |   +-- calendar.jsx
|   |   |   |   +-- dropdown-menu.jsx
|   |   |   |   +-- sheet.jsx
|   |   |   |   +-- tabs.jsx
|   |   |   |   +-- toast.jsx
|   |   |   |   +-- tooltip.jsx
|   |   |   |
|   |   |   +-- layout/             # Layout components
|   |   |   |   +-- Sidebar.jsx
|   |   |   |   +-- TopNavbar.jsx
|   |   |   |   +-- PageWrapper.jsx
|   |   |   |   +-- AdminLayout.jsx
|   |   |   |   +-- EmployeeLayout.jsx
|   |   |   |   +-- AuthLayout.jsx
|   |   |   |   +-- BreadcrumbNav.jsx
|   |   |   |   +-- AvatarMenu.jsx
|   |   |   |
|   |   |   +-- attendance/         # Attendance-specific components
|   |   |   |   +-- CheckInOutCard.jsx
|   |   |   |   +-- AttendanceTable.jsx
|   |   |   |   +-- AttendanceCalendar.jsx
|   |   |   |   +-- AttendanceSummary.jsx
|   |   |   |   +-- LocationStatus.jsx
|   |   |   |
|   |   |   +-- leave/              # Leave-specific components
|   |   |   |   +-- LeaveRequestForm.jsx
|   |   |   |   +-- LeaveBalanceCard.jsx
|   |   |   |   +-- LeaveHistoryTable.jsx
|   |   |   |   +-- LeaveApprovalCard.jsx
|   |   |   |   +-- LeaveCalendarView.jsx
|   |   |   |
|   |   |   +-- common/             # Shared presentational components
|   |   |       +-- DataTable.jsx
|   |   |       +-- StatusBadge.jsx
|   |   |       +-- PageHeader.jsx
|   |   |       +-- StatsCard.jsx
|   |   |       +-- DateRangePicker.jsx
|   |   |       +-- ConfirmDialog.jsx
|   |   |       +-- LoadingSpinner.jsx
|   |   |       +-- EmptyState.jsx
|   |   |       +-- SearchInput.jsx
|   |   |       +-- FilterDropdown.jsx
|   |   |       +-- Pagination.jsx
|   |   |       +-- ErrorBoundary.jsx
|   |   |
|   |   +-- contexts/               # React context providers
|   |   |   +-- AuthContext.jsx      # Auth state, login/logout, token management
|   |   |   +-- ThemeContext.jsx     # Dark/light mode toggle
|   |   |   +-- SidebarContext.jsx   # Sidebar open/collapsed state
|   |   |
|   |   +-- hooks/                   # Custom React hooks
|   |   |   +-- useAuth.js           # Auth context consumer
|   |   |   +-- useGeolocation.js    # Browser geolocation API wrapper
|   |   |   +-- useDebounce.js       # Debounced value/callback
|   |   |   +-- usePagination.js     # Pagination state management
|   |   |   +-- useMediaQuery.js     # Responsive breakpoint detection
|   |   |   +-- useClickOutside.js   # Outside click detection
|   |   |
|   |   +-- lib/                     # Utilities and constants
|   |   |   +-- utils.js             # clsx + tailwind-merge helper
|   |   |   +-- constants.js         # App-wide constants
|   |   |   +-- formatters.js        # Date, currency, duration formatters
|   |   |   +-- validators.js        # Client-side validation helpers
|   |   |   +-- storage.js           # localStorage wrapper (tokens)
|   |   |
|   |   +-- pages/                   # Route-level page components
|   |   |   +-- auth/
|   |   |   |   +-- LoginPage.jsx
|   |   |   |   +-- ForgotPasswordPage.jsx
|   |   |   |   +-- ResetPasswordPage.jsx
|   |   |   |   +-- SetupPasswordPage.jsx
|   |   |   |   +-- VerifyOtpPage.jsx
|   |   |   |
|   |   |   +-- admin/
|   |   |   |   +-- AdminDashboard.jsx
|   |   |   |   +-- EmployeeListPage.jsx
|   |   |   |   +-- AddEmployeePage.jsx
|   |   |   |   +-- EditEmployeePage.jsx
|   |   |   |   +-- AttendanceReportPage.jsx
|   |   |   |   +-- LeaveApprovalsPage.jsx
|   |   |   |   +-- HolidayManagementPage.jsx
|   |   |   |   +-- SettingsPage.jsx
|   |   |   |
|   |   |   +-- employee/
|   |   |       +-- EmployeeDashboard.jsx
|   |   |       +-- MyAttendancePage.jsx
|   |   |       +-- ApplyLeavePage.jsx
|   |   |       +-- MyLeavesPage.jsx
|   |   |       +-- HolidayListPage.jsx
|   |   |       +-- ProfilePage.jsx
|   |   |
|   |   +-- routes/                  # Routing configuration
|   |   |   +-- index.jsx            # Route tree definition
|   |   |   +-- ProtectedRoute.jsx   # Auth guard wrapper
|   |   |   +-- AdminRoute.jsx       # Admin role guard
|   |   |   +-- PublicRoute.jsx      # Redirect if authenticated
|   |   |
|   |   +-- schemas/                 # Zod validation schemas (client-side)
|   |   |   +-- auth.schema.js
|   |   |   +-- attendance.schema.js
|   |   |   +-- leave.schema.js
|   |   |   +-- employee.schema.js
|   |   |   +-- holiday.schema.js
|   |   |
|   |   +-- store/                   # Global state (if needed beyond context)
|   |   |   +-- queryClient.js       # TanStack Query client configuration
|   |   |
|   |   +-- App.jsx                  # Root component
|   |   +-- main.jsx                 # Entry point
|   |   +-- index.css                # Tailwind directives + global styles
|   |
|   +-- .env.example
|   +-- .eslintrc.cjs
|   +-- tailwind.config.js
|   +-- postcss.config.js
|   +-- vite.config.js
|   +-- jsconfig.json                # Path aliases (@/ = src/)
|   +-- package.json
|
+-- server/                          # Express backend application
|   +-- src/
|   |   +-- config/                  # Configuration modules
|   |   |   +-- database.js          # Knex connection config
|   |   |   +-- env.js               # Environment variable validation & export
|   |   |   +-- constants.js         # Business constants (radius, limits, etc.)
|   |   |   +-- cors.js              # CORS configuration
|   |   |   +-- logger.js            # Winston/Pino logger setup
|   |   |
|   |   +-- controllers/             # HTTP request handlers
|   |   |   +-- auth.controller.js
|   |   |   +-- attendance.controller.js
|   |   |   +-- leave.controller.js
|   |   |   +-- holiday.controller.js
|   |   |   +-- employee.controller.js
|   |   |   +-- dashboard.controller.js
|   |   |
|   |   +-- middleware/               # Express middleware
|   |   |   +-- auth.middleware.js         # JWT verification
|   |   |   +-- rbac.middleware.js         # Role-based access control
|   |   |   +-- validate.middleware.js     # Zod schema validation
|   |   |   +-- errorHandler.middleware.js # Global error handler
|   |   |   +-- rateLimiter.middleware.js  # Rate limiting configs
|   |   |   +-- cors.middleware.js         # CORS setup
|   |   |   +-- requestLogger.middleware.js# Request logging
|   |   |   +-- asyncHandler.js            # Async try-catch wrapper
|   |   |
|   |   +-- models/                   # Database query layer (repositories)
|   |   |   +-- user.model.js
|   |   |   +-- attendance.model.js
|   |   |   +-- leave.model.js
|   |   |   +-- holiday.model.js
|   |   |   +-- organization.model.js
|   |   |   +-- session.model.js
|   |   |   +-- auditLog.model.js
|   |   |
|   |   +-- routes/                   # Route definitions
|   |   |   +-- index.js              # Route aggregator (/api/v1/*)
|   |   |   +-- auth.routes.js
|   |   |   +-- attendance.routes.js
|   |   |   +-- leave.routes.js
|   |   |   +-- holiday.routes.js
|   |   |   +-- employee.routes.js
|   |   |   +-- dashboard.routes.js
|   |   |
|   |   +-- services/                 # Business logic layer
|   |   |   +-- auth.service.js
|   |   |   +-- attendance.service.js
|   |   |   +-- leave.service.js
|   |   |   +-- holiday.service.js
|   |   |   +-- employee.service.js
|   |   |   +-- dashboard.service.js
|   |   |   +-- email.service.js       # Nodemailer transporter + templates
|   |   |   +-- otp.service.js         # OTP generation + verification
|   |   |   +-- geolocation.service.js  # Haversine distance calculation
|   |   |
|   |   +-- utils/                    # Helper utilities
|   |   |   +-- AppError.js           # Custom error class
|   |   |   +-- responseFormatter.js  # Consistent response structure
|   |   |   +-- paginationHelper.js   # Pagination query builder
|   |   |   +-- dateUtils.js          # Date manipulation helpers
|   |   |   +-- tokenUtils.js         # JWT sign/verify helpers
|   |   |   +-- hashUtils.js          # bcrypt hash/compare helpers
|   |   |   +-- logger.js             # Logging utility
|   |   |
|   |   +-- validators/              # Zod request schemas
|   |   |   +-- auth.validator.js
|   |   |   +-- attendance.validator.js
|   |   |   +-- leave.validator.js
|   |   |   +-- holiday.validator.js
|   |   |   +-- employee.validator.js
|   |   |   +-- common.validator.js    # Shared schemas (pagination, dates)
|   |   |
|   |   +-- app.js                    # Express app setup (middleware, routes)
|   |   +-- server.js                 # HTTP server entry point
|   |
|   +-- migrations/                   # Knex database migrations
|   |   +-- 20260501000001_create_organizations.js
|   |   +-- 20260501000002_create_departments.js
|   |   +-- 20260501000003_create_roles.js
|   |   +-- 20260501000004_create_users.js
|   |   +-- 20260501000005_create_attendance_records.js
|   |   +-- 20260501000006_create_leave_types.js
|   |   +-- 20260501000007_create_leave_balances.js
|   |   +-- 20260501000008_create_leave_requests.js
|   |   +-- 20260501000009_create_holidays.js
|   |   +-- 20260501000010_create_sessions.js
|   |   +-- 20260501000011_create_audit_logs.js
|   |   +-- 20260501000012_create_otp_verifications.js
|   |
|   +-- seeds/                        # Database seed files
|   |   +-- 01_organizations.js
|   |   +-- 02_departments.js
|   |   +-- 03_roles.js
|   |   +-- 04_users.js
|   |   +-- 05_leave_types.js
|   |   +-- 06_holidays.js
|   |
|   +-- .env.example
|   +-- knexfile.js                   # Knex configuration
|   +-- Dockerfile
|   +-- package.json
|
+-- shared/                           # Shared between client and server
|   +-- constants/
|   |   +-- roles.js                  # Role enums (SUPER_ADMIN, ADMIN, EMPLOYEE)
|   |   +-- leaveTypes.js             # Leave type enums
|   |   +-- attendanceStatus.js       # Status enums
|   +-- types/                        # TypeScript-ready type definitions
|   |   +-- index.d.ts
|
+-- docs/                             # Documentation
|   +-- ARCHITECTURE.md               # This file (can be symlinked)
|   +-- API.md                        # API documentation
|   +-- SETUP.md                      # Developer setup guide
|   +-- DEPLOYMENT.md                 # Deployment guide
|   +-- schema.sql                    # Full database schema
|
+-- .github/
|   +-- workflows/
|   |   +-- ci.yml                    # Lint + test + build
|   |   +-- deploy-frontend.yml       # Vercel deploy
|   |   +-- deploy-backend.yml        # Render deploy
|   +-- PULL_REQUEST_TEMPLATE.md
|
+-- .gitignore
+-- .nvmrc                            # Node version (20 LTS)
+-- package.json                      # Root workspace config
+-- README.md
```

---

## 3. Full PostgreSQL Schema

The complete SQL schema is maintained in `docs/schema.sql`. Below is a summary of all tables, their purpose, and key relationships.

### Entity-Relationship Overview

```
organizations
    |
    +--< departments
    |       |
    |       +--< users >--+ roles
    |             |
    |             +--< attendance_records
    |             |
    |             +--< leave_balances >--+ leave_types
    |             |
    |             +--< leave_requests >--+ leave_types
    |             |       |
    |             |       +-- approved_by --> users
    |             |
    |             +--< sessions
    |             |
    |             +--< otp_verifications
    |             |
    |             +--< audit_logs
    |
    +--< holidays
```

### Table Definitions

#### organizations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| name | VARCHAR(255) | Organization name |
| slug | VARCHAR(100) UNIQUE | URL-safe identifier |
| address | TEXT | Physical address |
| office_latitude | DECIMAL(10,8) | Office GPS latitude |
| office_longitude | DECIMAL(11,8) | Office GPS longitude |
| geofence_radius_meters | INTEGER DEFAULT 100 | Allowed check-in radius |
| timezone | VARCHAR(50) DEFAULT 'Asia/Kolkata' | Organization timezone |
| settings | JSONB DEFAULT '{}' | Flexible configuration |
| created_at | TIMESTAMPTZ | Auto-set on creation |
| updated_at | TIMESTAMPTZ | Auto-updated |

#### departments
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| organization_id | UUID (FK) | References organizations |
| name | VARCHAR(100) | Department name |
| description | TEXT | Optional description |
| is_active | BOOLEAN DEFAULT true | Soft delete flag |
| created_at | TIMESTAMPTZ | Auto-set |

#### roles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| name | VARCHAR(50) UNIQUE | Role name: super_admin, admin, manager, employee |
| description | TEXT | Role description |
| permissions | JSONB DEFAULT '[]' | Granular permission list |

#### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| organization_id | UUID (FK) | References organizations |
| department_id | UUID (FK) | References departments |
| role_id | UUID (FK) | References roles |
| employee_id | VARCHAR(20) UNIQUE | Company employee ID (e.g., EMP-001) |
| first_name | VARCHAR(100) | First name |
| last_name | VARCHAR(100) | Last name |
| email | VARCHAR(255) UNIQUE | Login email |
| password_hash | VARCHAR(255) | bcrypt hashed password |
| phone | VARCHAR(20) | Phone number |
| avatar_url | TEXT | Profile picture URL |
| is_active | BOOLEAN DEFAULT true | Account active status |
| is_password_set | BOOLEAN DEFAULT false | First-time password setup flag |
| date_of_joining | DATE | Employment start date |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Indexes:** email (unique), employee_id (unique), organization_id, department_id, (organization_id, is_active)

#### attendance_records
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK) | References users |
| organization_id | UUID (FK) | References organizations |
| date | DATE | Attendance date |
| check_in | TIMESTAMPTZ | Check-in timestamp |
| check_out | TIMESTAMPTZ | Check-out timestamp (nullable) |
| work_hours | DECIMAL(4,2) | Calculated hours worked |
| status | VARCHAR(20) | present, absent, half_day, late, on_leave |
| check_in_latitude | DECIMAL(10,8) | Check-in GPS latitude |
| check_in_longitude | DECIMAL(11,8) | Check-in GPS longitude |
| check_out_latitude | DECIMAL(10,8) | Check-out GPS latitude |
| check_out_longitude | DECIMAL(11,8) | Check-out GPS longitude |
| check_in_ip | INET | Client IP at check-in |
| check_out_ip | INET | Client IP at check-out |
| device_info | JSONB | Browser/device metadata |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Indexes:** (user_id, date) UNIQUE, organization_id, date, status
**Constraint:** UNIQUE(user_id, date) -- one record per employee per day

#### leave_types
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| organization_id | UUID (FK) | References organizations |
| name | VARCHAR(50) | casual_leave, sick_leave, earned_leave, etc. |
| display_name | VARCHAR(100) | Human-readable name |
| default_days | INTEGER | Annual entitlement |
| is_carry_forward | BOOLEAN DEFAULT false | Carry over to next year |
| max_carry_forward_days | INTEGER DEFAULT 0 | Max days carried over |
| is_active | BOOLEAN DEFAULT true | Type active status |
| color_code | VARCHAR(7) | Hex color for UI display |

#### leave_balances
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK) | References users |
| leave_type_id | UUID (FK) | References leave_types |
| year | INTEGER | Balance year (2026) |
| total_days | DECIMAL(4,1) | Total allocated days |
| used_days | DECIMAL(4,1) DEFAULT 0 | Days used |
| remaining_days | DECIMAL(4,1) | Computed: total - used |
| carried_forward | DECIMAL(4,1) DEFAULT 0 | Days from previous year |

**Constraint:** UNIQUE(user_id, leave_type_id, year)

#### leave_requests
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK) | References users |
| leave_type_id | UUID (FK) | References leave_types |
| organization_id | UUID (FK) | References organizations |
| start_date | DATE | Leave start |
| end_date | DATE | Leave end |
| total_days | DECIMAL(4,1) | Number of leave days |
| reason | TEXT | Leave reason |
| status | VARCHAR(20) DEFAULT 'pending' | pending, approved, rejected, cancelled |
| approved_by | UUID (FK) | References users (admin who acted) |
| admin_remarks | TEXT | Approval/rejection remarks |
| acted_at | TIMESTAMPTZ | When admin acted |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

**Indexes:** user_id, organization_id, status, (start_date, end_date)

#### holidays
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| organization_id | UUID (FK) | References organizations |
| name | VARCHAR(100) | Holiday name |
| date | DATE | Holiday date |
| type | VARCHAR(20) | public, restricted, optional |
| is_optional | BOOLEAN DEFAULT false | Optional holiday flag |
| year | INTEGER | Holiday year |
| created_at | TIMESTAMPTZ | Auto-set |

**Constraint:** UNIQUE(organization_id, date)

#### sessions (Refresh Tokens)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK) | References users |
| refresh_token | VARCHAR(500) | Hashed refresh token |
| device_info | JSONB | Device/browser details |
| ip_address | INET | Client IP |
| expires_at | TIMESTAMPTZ | Token expiration |
| is_revoked | BOOLEAN DEFAULT false | Manual revocation flag |
| created_at | TIMESTAMPTZ | Auto-set |

**Indexes:** user_id, refresh_token, (user_id, is_revoked)

#### audit_logs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK) | References users |
| organization_id | UUID (FK) | References organizations |
| action | VARCHAR(100) | Action performed (e.g., USER_LOGIN, LEAVE_APPROVED) |
| entity_type | VARCHAR(50) | Table name affected |
| entity_id | UUID | Row ID affected |
| old_values | JSONB | Previous state (for updates) |
| new_values | JSONB | New state (for updates) |
| ip_address | INET | Client IP |
| user_agent | TEXT | Browser user agent |
| created_at | TIMESTAMPTZ DEFAULT NOW() | Auto-set |

**Indexes:** user_id, organization_id, action, entity_type, created_at

#### otp_verifications
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| user_id | UUID (FK) | References users |
| email | VARCHAR(255) | Email OTP was sent to |
| otp_hash | VARCHAR(255) | Hashed OTP code |
| purpose | VARCHAR(50) | password_setup, password_reset, email_verify |
| attempts | INTEGER DEFAULT 0 | Failed attempt count |
| max_attempts | INTEGER DEFAULT 5 | Max allowed attempts |
| expires_at | TIMESTAMPTZ | OTP expiration (10 minutes) |
| is_used | BOOLEAN DEFAULT false | Whether OTP was consumed |
| created_at | TIMESTAMPTZ | Auto-set |

**Indexes:** (user_id, purpose, is_used), email, expires_at

---

## 4. Backend API Architecture

All endpoints are versioned under `/api/v1/` to allow non-breaking evolution.

### Base URL

```
Production:  https://api.attendance-app.com/api/v1
Development: http://localhost:5000/api/v1
```

### Route Map

#### Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /register | Admin | Register new organization + admin |
| POST | /login | Public | Login with email + password |
| POST | /verify-otp | Public | Verify email OTP |
| POST | /refresh-token | Public | Get new access token |
| POST | /logout | User | Invalidate refresh token |
| POST | /forgot-password | Public | Request password reset OTP |
| POST | /reset-password | Public | Reset password with OTP |
| POST | /setup-password | User | First-time password setup |

#### Attendance (`/api/v1/attendance`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /check-in | Employee | Record check-in with location |
| POST | /check-out | Employee | Record check-out, calculate hours |
| GET | /today | Employee | Get today's attendance record |
| GET | /history | Employee | Paginated attendance history |
| GET | /summary | Employee | Monthly summary stats |
| GET | /report | Admin | Attendance report (filterable) |

**Query Parameters for /history and /report:**
```
?page=1&limit=20&startDate=2026-01-01&endDate=2026-01-31&status=present
```

#### Leave Management (`/api/v1/leaves`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /apply | Employee | Submit leave request |
| GET | /my-leaves | Employee | My leave history (paginated) |
| GET | /balance | Employee | My leave balances (all types) |
| GET | /:id | Employee | Single leave request detail |
| PATCH | /:id/cancel | Employee | Cancel pending request |

#### Admin Leave Management (`/api/v1/admin/leaves`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /pending | Admin | All pending leave requests |
| GET | /all | Admin | All leave requests (filterable) |
| GET | /:id | Admin | Single request with employee details |
| PATCH | /:id/approve | Admin | Approve with remarks |
| PATCH | /:id/reject | Admin | Reject with remarks |

#### Holidays (`/api/v1/holidays`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | / | User | List holidays (filter by year) |
| GET | /upcoming | User | Next 5 upcoming holidays |
| POST | / | Admin | Create holiday |
| PUT | /:id | Admin | Update holiday |
| DELETE | /:id | Admin | Delete holiday |

#### Employee Management (`/api/v1/admin/employees`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | / | Admin | List employees (search, filter, paginate) |
| GET | /:id | Admin | Employee detail with attendance stats |
| POST | / | Admin | Create employee (triggers setup email) |
| PUT | /:id | Admin | Update employee details |
| PATCH | /:id/toggle-status | Admin | Activate/deactivate employee |
| GET | /departments | Admin | List departments |
| POST | /departments | Admin | Create department |

#### Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /admin | Admin | Admin dashboard stats |
| GET | /employee | Employee | Employee dashboard data |

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## 5. Authentication Flow

### JWT Token Strategy

- **Access Token:** Signed JWT, 15-minute expiry, stored in memory (React state).
- **Refresh Token:** Cryptographically random string, 7-day expiry, stored in HttpOnly cookie and hashed in `sessions` table.
- **Token Rotation:** Each refresh generates a new refresh token and invalidates the old one.

### Login Flow

```
Client                          Server                          Database
  |                               |                               |
  |-- POST /auth/login ---------->|                               |
  |   { email, password }         |                               |
  |                               |-- Find user by email -------->|
  |                               |<-- User record ---------------|
  |                               |                               |
  |                               |-- bcrypt.compare(password) -->|
  |                               |   (in memory)                 |
  |                               |                               |
  |                               |-- Generate access token (JWT) |
  |                               |-- Generate refresh token      |
  |                               |-- Hash refresh token          |
  |                               |-- Store session in DB ------->|
  |                               |                               |
  |<-- 200 OK --------------------|                               |
  |   { accessToken, user }       |                               |
  |   Set-Cookie: refreshToken    |                               |
  |                               |                               |
  |-- Store accessToken in memory |                               |
```

### Token Refresh Flow

```
Client                          Server                          Database
  |                               |                               |
  |-- POST /auth/refresh-token -->|                               |
  |   Cookie: refreshToken        |                               |
  |                               |-- Hash incoming token         |
  |                               |-- Find session by hash ------>|
  |                               |<-- Session record ------------|
  |                               |                               |
  |                               |-- Check: expired? revoked?    |
  |                               |-- Revoke old session -------->|
  |                               |-- Create new session -------->|
  |                               |                               |
  |<-- 200 OK --------------------|                               |
  |   { accessToken (new) }       |                               |
  |   Set-Cookie: refreshToken    |                               |
```

### Request Authentication Middleware

```
Every Protected Request:

1. Extract token from Authorization: Bearer <token>
2. Verify JWT signature and expiry
3. Decode payload: { userId, organizationId, role }
4. Attach user object to req.user
5. Continue to next middleware/controller

If token invalid or expired:
  Return 401 { code: "TOKEN_EXPIRED", message: "..." }
  Client catches 401, attempts refresh, retries original request
```

### Role-Based Access Control

```
rbac.middleware.js

authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "Insufficient permissions");
    }
    next();
  }
}

Usage in routes:
  router.get('/admin/employees', auth, authorize('admin', 'super_admin'), controller)
  router.post('/attendance/check-in', auth, authorize('employee'), controller)
```

### First-Time Password Setup Flow

```
1. Admin creates employee --> system generates temp password
2. System sends email: "Welcome! Set up your password"
3. Employee clicks link --> redirected to /setup-password?token=...
4. Employee enters new password
5. POST /auth/setup-password { token, newPassword }
6. Server validates token, hashes password, sets is_password_set = true
7. Employee can now login normally
```

---

## 6. Attendance Flow

### Check-In Flow (Detailed)

```
Employee                    Browser                     Server                      Database
  |                           |                           |                           |
  |-- Opens dashboard ------->|                           |                           |
  |                           |-- navigator.geolocation   |                           |
  |                           |   .getCurrentPosition()   |                           |
  |<-- Grant location? -------|                           |                           |
  |-- Grants permission ----->|                           |                           |
  |                           |-- Gets lat/lng            |                           |
  |                           |                           |                           |
  |-- Clicks "Check In" ----->|                           |                           |
  |                           |-- POST /attendance/check-in                           |
  |                           |   {                       |                           |
  |                           |     latitude: 18.5204,    |                           |
  |                           |     longitude: 73.8567,   |                           |
  |                           |     deviceInfo: {...}     |                           |
  |                           |   }                       |                           |
  |                           |                           |                           |
  |                           |                           |-- Get org settings ------>|
  |                           |                           |<-- office lat/lng, radius -|
  |                           |                           |                           |
  |                           |                           |-- Haversine distance calc |
  |                           |                           |   distance = haversine(   |
  |                           |                           |     userLat, userLng,     |
  |                           |                           |     officeLat, officeLng  |
  |                           |                           |   )                       |
  |                           |                           |                           |
  |                           |                           |-- distance <= 100m?       |
  |                           |                           |   YES: proceed            |
  |                           |                           |   NO: return 400          |
  |                           |                           |                           |
  |                           |                           |-- Check existing today -->|
  |                           |                           |<-- No record (OK) --------|
  |                           |                           |                           |
  |                           |                           |-- Determine status:       |
  |                           |                           |   before 9:30 = present   |
  |                           |                           |   after 9:30 = late       |
  |                           |                           |                           |
  |                           |                           |-- INSERT attendance ----->|
  |                           |                           |   record with:            |
  |                           |                           |   check_in, lat, lng,     |
  |                           |                           |   ip, device, status      |
  |                           |                           |                           |
  |                           |<-- 201 Created -----------|                           |
  |<-- "Checked in at 9:15am"-|                           |                           |
```

### Haversine Formula Implementation

```
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;  // Earth radius in meters
  const toRad = (deg) => deg * (Math.PI / 180);

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;  // Distance in meters
}
```

### Check-Out Flow

```
1. Employee clicks "Check Out"
2. Browser sends current lat/lng
3. Server validates:
   a. Active check-in exists for today
   b. No check-out already recorded
   c. Location within geofence (optional for check-out)
4. Calculate work_hours = (check_out - check_in) in hours
5. Update attendance record:
   - Set check_out timestamp
   - Set work_hours
   - Set check_out location/IP
   - Update status if needed (half_day if < 4 hours)
6. Return updated record
```

### Attendance Status Logic

| Condition | Status |
|-----------|--------|
| Check-in before cutoff (e.g., 9:30 AM) | `present` |
| Check-in after cutoff | `late` |
| Work hours < 4 | `half_day` |
| No check-in and on approved leave | `on_leave` |
| No check-in (end of day cron) | `absent` |

---

## 7. Leave Management Flow

### Apply Leave Flow

```
Employee                        Server                          Database
  |                               |                               |
  |-- POST /leaves/apply -------->|                               |
  |   {                           |                               |
  |     leaveTypeId: "...",       |                               |
  |     startDate: "2026-06-01",  |                               |
  |     endDate: "2026-06-03",    |                               |
  |     reason: "Family event"    |                               |
  |   }                           |                               |
  |                               |-- Validate dates              |
  |                               |   - startDate <= endDate      |
  |                               |   - startDate >= today        |
  |                               |   - Not on weekends/holidays  |
  |                               |                               |
  |                               |-- Calculate total_days        |
  |                               |   (exclude weekends/holidays) |
  |                               |                               |
  |                               |-- Check overlap -------------->|
  |                               |   (existing approved/pending   |
  |                               |    leaves for same dates)      |
  |                               |<-- No overlap ----------------|
  |                               |                               |
  |                               |-- Check balance -------------->|
  |                               |<-- remaining: 8 days ----------|
  |                               |   total_days (3) <= 8? YES    |
  |                               |                               |
  |                               |-- Create leave request ------->|
  |                               |   status: 'pending'           |
  |                               |                               |
  |                               |-- Create audit log ----------->|
  |                               |                               |
  |<-- 201 Created ----------------|                               |
  |   { leaveRequest }            |                               |
```

### Admin Approval Flow

```
Admin                           Server                          Database
  |                               |                               |
  |-- PATCH /admin/leaves/:id     |                               |
  |   /approve                    |                               |
  |   { remarks: "Approved" }     |                               |
  |                               |                               |
  |                               |-- Get leave request ---------->|
  |                               |<-- request (status: pending) --|
  |                               |                               |
  |                               |-- Verify still pending         |
  |                               |                               |
  |                               |-- BEGIN TRANSACTION            |
  |                               |                               |
  |                               |-- Update request status ------>|
  |                               |   status: approved             |
  |                               |   approved_by: admin.id        |
  |                               |   admin_remarks: "Approved"    |
  |                               |   acted_at: NOW()              |
  |                               |                               |
  |                               |-- Update leave balance ------->|
  |                               |   used_days += total_days      |
  |                               |   remaining -= total_days      |
  |                               |                               |
  |                               |-- Mark attendance dates ------>|
  |                               |   as 'on_leave'               |
  |                               |                               |
  |                               |-- Create audit log ----------->|
  |                               |                               |
  |                               |-- COMMIT TRANSACTION           |
  |                               |                               |
  |<-- 200 OK --------------------|                               |
```

### Leave Balance Rules

- Balances are initialized per year based on leave type default_days.
- On approval, used_days increments and remaining_days decrements.
- On cancellation (if pending), no balance change. If previously approved, balance is restored.
- Carry-forward is calculated at year end based on leave type settings.
- Half-day leaves deduct 0.5 from balance.

---

## 8. Admin Dashboard Planning

### Layout

```
+------------------------------------------------------------------+
| TopNavbar [Search] [Notifications Bell] [Avatar Menu]            |
+----------+-------------------------------------------------------+
| Sidebar  |  Page Content                                         |
|          |                                                        |
| Dashboard|  +------------+ +------------+ +----------+ +--------+|
| Employees|  | Total      | | Present    | | On Leave | | Pending||
| Attendance| | Employees  | | Today      | | Today    | | Leaves ||
| Leaves   |  |    156     | |    142     | |     8    | |    6   ||
| Holidays |  +------------+ +------------+ +----------+ +--------+|
| Reports  |                                                        |
| Settings |  +-----------------------------+ +--------------------+|
|          |  | Weekly Attendance Trend     | | Department-wise    ||
|          |  | (Line/Bar Chart - Recharts) | | Attendance (Pie)   ||
|          |  |                             | |                    ||
|          |  |  Mon Tue Wed Thu Fri        | | Engineering: 95%   ||
|          |  |  [===][===][===][==][===]   | | Design: 88%        ||
|          |  |                             | | Marketing: 92%     ||
|          |  +-----------------------------+ +--------------------+|
|          |                                                        |
|          |  +-----------------------------+ +--------------------+|
|          |  | Recent Attendance           | | Pending Leave      ||
|          |  | (Table with last 10)        | | Requests           ||
|          |  | Name | Time | Status        | | (Approve/Reject)   ||
|          |  | John | 9:05 | Present       | | Alice - 3 days     ||
|          |  | Jane | 9:32 | Late          | | Bob - 1 day        ||
|          |  +-----------------------------+ +--------------------+|
|          |                                                        |
|          |  [+ Add Employee]  [+ Add Holiday]                     |
+----------+-------------------------------------------------------+
```

### Admin Dashboard API Response Shape

```json
{
  "stats": {
    "totalEmployees": 156,
    "presentToday": 142,
    "onLeaveToday": 8,
    "pendingLeaveRequests": 6,
    "absentToday": 6
  },
  "weeklyTrend": [
    { "date": "2026-05-07", "present": 140, "absent": 10, "leave": 6 },
    { "date": "2026-05-08", "present": 145, "absent": 5, "leave": 6 }
  ],
  "departmentAttendance": [
    { "department": "Engineering", "present": 48, "total": 50, "percentage": 96 },
    { "department": "Design", "present": 22, "total": 25, "percentage": 88 }
  ],
  "recentAttendance": [ ... ],
  "pendingLeaves": [ ... ]
}
```

---

## 9. Employee Dashboard Planning

### Layout

```
+------------------------------------------------------------------+
| TopNavbar                              [Notifications] [Profile]  |
+----------+-------------------------------------------------------+
| Sidebar  |  Page Content                                         |
|          |                                                        |
| Dashboard|  +-------------------------------+                     |
| Attendance| |  Attendance Card              |                     |
| Apply    |  |                               |                     |
|   Leave  |  |  [Check In]    or   [Check Out]                     |
| My Leaves|  |                               |                     |
| Holidays |  |  Status: Checked in at 9:15am |                     |
| Profile  |  |  Location: Verified (15m)     |                     |
|          |  +-------------------------------+                     |
|          |                                                        |
|          |  +----------+ +----------+ +----------+ +----------+  |
|          |  | Present  | | Absent   | | Leaves   | | Late     |  |
|          |  | This Mo. | | This Mo. | | This Mo. | | This Mo. |  |
|          |  |    18    | |    1     | |    2     | |    1     |  |
|          |  +----------+ +----------+ +----------+ +----------+  |
|          |                                                        |
|          |  +-----------------------------+ +--------------------+|
|          |  | Recent Attendance           | | Leave Balances     ||
|          |  | (Last 7 days)               | |                    ||
|          |  | May 12 | 9:05-6:10 | 9.1h  | | Casual: 8/12       ||
|          |  | May 11 | 9:15-6:30 | 9.2h  | | Sick: 5/7          ||
|          |  | May 10 | Holiday           | | Earned: 10/15      ||
|          |  +-----------------------------+ +--------------------+|
|          |                                                        |
|          |  +----------------------------------------------------+|
|          |  | Upcoming Holidays                                  ||
|          |  | May 25 - Memorial Day                              ||
|          |  | Jun 15 - Company Foundation Day                    ||
|          |  +----------------------------------------------------+|
+----------+-------------------------------------------------------+
```

### Employee Dashboard API Response Shape

```json
{
  "todayAttendance": {
    "status": "checked_in",
    "checkIn": "2026-05-13T09:15:00Z",
    "checkOut": null,
    "locationVerified": true,
    "distanceFromOffice": 15
  },
  "monthlySummary": {
    "month": "2026-05",
    "present": 18,
    "absent": 1,
    "leaves": 2,
    "late": 1,
    "holidays": 1,
    "totalWorkHours": 162.5,
    "averageHours": 8.5
  },
  "recentAttendance": [ ... ],
  "leaveBalances": [
    { "type": "Casual Leave", "total": 12, "used": 4, "remaining": 8, "color": "#3B82F6" },
    { "type": "Sick Leave", "total": 7, "used": 2, "remaining": 5, "color": "#EF4444" },
    { "type": "Earned Leave", "total": 15, "used": 5, "remaining": 10, "color": "#10B981" }
  ],
  "upcomingHolidays": [
    { "name": "Memorial Day", "date": "2026-05-25", "type": "public" }
  ]
}
```

---

## 10. Middleware Structure

### Middleware Pipeline (Order Matters)

```
Request
  |
  v
+-- cors.middleware -----------> CORS headers (whitelist origins)
  |
  v
+-- helmet ----------------------> Security HTTP headers
  |
  v
+-- compression -----------------> Gzip response compression
  |
  v
+-- express.json() --------------> Parse JSON body (limit: 10kb)
  |
  v
+-- requestLogger.middleware ----> Log: method, url, duration, status
  |
  v
+-- rateLimiter.middleware ------> Global: 100 req/15min per IP
  |
  v
+-- Routes
      |
      v
      +-- auth.middleware --------> Verify JWT, attach req.user
      |
      v
      +-- rbac.middleware --------> Check role permissions
      |
      v
      +-- validate.middleware ----> Validate req.body/params/query via Zod
      |
      v
      +-- Controller logic
      |
      v
+-- errorHandler.middleware -----> Catch all errors, format response
```

### Middleware Implementations

#### auth.middleware.js
```
Purpose: Verify JWT access token from Authorization header.

Flow:
1. Extract token from "Bearer <token>"
2. If missing, throw 401 UNAUTHORIZED
3. jwt.verify(token, ACCESS_TOKEN_SECRET)
4. If expired, throw 401 TOKEN_EXPIRED
5. If invalid, throw 401 INVALID_TOKEN
6. Attach decoded payload to req.user = { id, organizationId, role, email }
7. Call next()
```

#### rbac.middleware.js
```
Purpose: Role-based route protection.

Usage: authorize('admin', 'super_admin')

Flow:
1. Check req.user exists (auth middleware ran)
2. Check req.user.role is in allowedRoles array
3. If not, throw 403 FORBIDDEN
4. Call next()
```

#### validate.middleware.js
```
Purpose: Validate request data against Zod schemas.

Usage: validate(loginSchema, 'body')

Flow:
1. Accept schema and source ('body', 'params', 'query')
2. Run schema.parse(req[source])
3. On success, replace req[source] with parsed (cleaned) data
4. On ZodError, throw 400 VALIDATION_ERROR with field-level details
```

#### errorHandler.middleware.js
```
Purpose: Global error catch-all. Last middleware in chain.

Handles:
- AppError (custom): Use statusCode and errorCode from instance
- ZodError: Map to 400 with field details
- JsonWebTokenError: Map to 401
- TokenExpiredError: Map to 401 TOKEN_EXPIRED
- PostgreSQL unique violation (23505): Map to 409 CONFLICT
- PostgreSQL foreign key violation (23503): Map to 400
- Unknown errors: 500 INTERNAL_SERVER_ERROR (hide details in production)

Response format: Always { success: false, error: { code, message, details? } }
Logging: Log stack trace for 500 errors. Log correlation ID for all errors.
```

#### rateLimiter.middleware.js
```
Purpose: Prevent abuse with per-route rate limits.

Configurations:
- Global: 100 requests per 15 minutes per IP
- Auth login: 5 requests per 15 minutes per IP
- Auth register: 3 requests per hour per IP
- OTP verify: 5 requests per 15 minutes per IP
- Password reset: 3 requests per hour per IP
- API general: 60 requests per minute per IP

Uses express-rate-limit with in-memory store (Redis in production).
```

#### asyncHandler.js
```
Purpose: Eliminate try-catch in every controller.

Implementation:
  const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

Usage:
  router.get('/today', auth, asyncHandler(attendanceController.getToday));
```

#### requestLogger.middleware.js
```
Purpose: Log every request for debugging and monitoring.

Logs:
- Timestamp
- HTTP method and URL
- Response status code
- Response time (ms)
- Client IP
- User ID (if authenticated)
- Correlation ID (UUID per request)

Uses morgan for HTTP logging + custom logger for structured JSON output.
```

---

## 11. Validation Strategy

### Dual Validation Approach

Validation runs on both client and server. The server is the source of truth; client validation provides instant feedback.

```
Client (UX)                              Server (Security)
+-----------------------------+          +-----------------------------+
| React Hook Form             |          | validate.middleware.js       |
| + Zod Resolver              |          | + Zod schemas               |
|                             |          |                             |
| - Instant field feedback    |          | - Rejects invalid data      |
| - Prevents bad submissions  |          | - Sanitizes input           |
| - Shows inline errors       |          | - Business rule validation  |
| - Disables submit if invalid|          | - Returns structured errors |
+-----------------------------+          +-----------------------------+
```

### Zod Schema Examples

#### Shared/Reusable Schemas

```javascript
// common.validator.js
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(data => data.startDate <= data.endDate, {
  message: "End date must be after start date",
});

const uuidParam = z.object({
  id: z.string().uuid("Invalid ID format"),
});
```

#### Auth Schemas

```javascript
// auth.validator.js
const loginSchema = z.object({
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const setupPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
```

#### Attendance Schemas

```javascript
// attendance.validator.js
const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.string(),
    screenResolution: z.string().optional(),
  }).optional(),
});
```

#### Leave Schemas

```javascript
// leave.validator.js
const applyLeaveSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
  isHalfDay: z.boolean().default(false),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date must be on or after start date",
  path: ["endDate"],
});
```

### Client-Side Integration

```javascript
// In React component
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applyLeaveSchema } from '@/schemas/leave.schema';

const form = useForm({
  resolver: zodResolver(applyLeaveSchema),
  defaultValues: { ... },
});
```

### Input Sanitization

- All string inputs are trimmed.
- HTML tags are stripped (xss package or manual regex).
- SQL injection prevented via parameterized queries (Knex handles this).
- Email addresses are lowercased.
- File names are sanitized (future upload feature).
- Request body size limited to 10KB via express.json({ limit: '10kb' }).

---

## 12. Error Handling Strategy

### Custom AppError Class

```javascript
class AppError extends Error {
  constructor(statusCode, errorCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Error Code Reference

| HTTP Status | Error Code | When Used |
|-------------|------------|-----------|
| 400 | VALIDATION_ERROR | Zod parse failure, invalid input |
| 400 | BAD_REQUEST | Business rule violation |
| 400 | DUPLICATE_CHECK_IN | Already checked in today |
| 400 | INSUFFICIENT_BALANCE | Not enough leave days |
| 400 | LEAVE_OVERLAP | Leave dates overlap existing request |
| 400 | OUTSIDE_GEOFENCE | Check-in location too far from office |
| 401 | UNAUTHORIZED | Missing auth token |
| 401 | INVALID_TOKEN | Malformed or tampered JWT |
| 401 | TOKEN_EXPIRED | JWT expiry passed |
| 401 | INVALID_CREDENTIALS | Wrong email or password |
| 401 | OTP_EXPIRED | OTP past expiration |
| 401 | OTP_INVALID | Wrong OTP code |
| 403 | FORBIDDEN | Role lacks permission |
| 403 | ACCOUNT_DISABLED | User is_active = false |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Unique constraint violation |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Unhandled server error |

### Error Response Flow

```
Controller/Service throws error
        |
        v
  Is it an AppError?
  /              \
YES               NO
  |                |
  v                v
Use its          Wrap in generic
statusCode       500 AppError
and code         (hide details in prod)
  |                |
  +-------+--------+
          |
          v
  errorHandler.middleware
          |
          v
  Log error (with correlation ID, stack trace for 500s)
          |
          v
  Send JSON response:
  {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid input data",
      details: [...],        // Only in development or for validation errors
      correlationId: "uuid"  // For support reference
    }
  }
```

### Correlation IDs

Every request is assigned a UUID correlation ID (via requestLogger middleware). This ID is:
- Included in all log entries for that request
- Returned in error responses
- Enables tracing a single request through all log entries

### Client-Side Error Handling

```
Axios interceptor catches errors:
- 401 TOKEN_EXPIRED --> attempt token refresh --> retry original request
- 401 other --> redirect to login
- 400 VALIDATION_ERROR --> show field-level errors on form
- 403 --> show "Access Denied" toast
- 404 --> show "Not Found" page
- 429 --> show "Too many requests, try again later"
- 500 --> show "Something went wrong" with correlationId for support
```

---

## 13. Security Best Practices

### HTTP Security Headers (Helmet.js)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self)
```

### CORS Configuration

```javascript
const corsOptions = {
  origin: [
    'https://attendance-app.vercel.app',  // Production
    'http://localhost:5173',               // Development
  ],
  credentials: true,                       // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,                           // Preflight cache: 24 hours
};
```

### Authentication Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt with 12 salt rounds |
| JWT access token | 15-minute expiry, RS256 or HS256 |
| Refresh token | 7-day expiry, stored hashed in DB |
| Token rotation | New refresh token on each refresh |
| Session invalidation | Revoke all sessions on password change |
| OTP | 6 digits, 10-minute expiry, max 5 attempts, hashed in DB |
| Brute force protection | Rate limit: 5 login attempts per 15 min per IP |

### Data Security

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Parameterized queries via Knex (never raw string interpolation) |
| XSS | Input sanitization, CSP headers, React auto-escaping |
| CSRF | SameSite cookies, CORS whitelist, no cookie-based auth for API |
| Password exposure | bcrypt hashing, never log or return passwords |
| Data leakage | Select only needed columns, strip sensitive fields from responses |
| Mass assignment | Explicit field picking in controllers (never pass req.body directly to DB) |
| Path traversal | No file uploads in MVP; when added, use UUID filenames |

### Rate Limiting Strategy

```
Route-specific limits (express-rate-limit):

/api/v1/auth/login          -->  5 req / 15 min / IP
/api/v1/auth/register       -->  3 req / 1 hour / IP
/api/v1/auth/verify-otp     -->  5 req / 15 min / IP
/api/v1/auth/forgot-password -->  3 req / 1 hour / IP
/api/v1/auth/refresh-token  --> 10 req / 15 min / IP
/api/v1/* (general)         --> 60 req / 1 min / IP
```

### Audit Trail

Every sensitive action is logged to `audit_logs`:
- User login/logout
- Employee creation/modification
- Leave approval/rejection
- Attendance modifications (admin override)
- Password changes
- Role changes
- Settings changes

Each audit entry includes: user_id, action, entity affected, old/new values, IP, timestamp.

### Environment Variables

```
# Never commit .env files. Use .env.example as template.

NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# JWT
ACCESS_TOKEN_SECRET=<random-64-char-hex>
REFRESH_TOKEN_SECRET=<random-64-char-hex>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# CORS
ALLOWED_ORIGINS=https://attendance-app.vercel.app

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=<app-password>
FROM_EMAIL=noreply@company.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 14. Deployment Architecture

### Infrastructure Diagram

```
                    +------------------+
                    |    GitHub Repo    |
                    |   (monorepo)     |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     Push to main                    Push to main
              |                             |
              v                             v
     +--------+---------+        +---------+--------+
     |   Vercel          |        |   Render          |
     |   (Frontend)      |        |   (Backend)       |
     |                   |        |                   |
     | - Auto-deploy     |        | - Docker build    |
     | - CDN + Edge      |        | - Health checks   |
     | - Preview deploys |        | - Auto-restart    |
     | - SSL automatic   |        | - SSL automatic   |
     +--------+----------+        +---------+---------+
              |                             |
              |    HTTPS REST calls         |
              +------------>-<--------------+
                                            |
                                   TCP/SSL (pooled)
                                            |
                                   +--------v---------+
                                   |   Neon PostgreSQL |
                                   |                   |
                                   | - Serverless      |
                                   | - Auto-scaling    |
                                   | - PgBouncer pool  |
                                   | - Point-in-time   |
                                   |   recovery        |
                                   | - Branch support  |
                                   +-------------------+
```

### Environment Separation

| Environment | Frontend URL | Backend URL | Database |
|-------------|-------------|-------------|----------|
| Development | localhost:5173 | localhost:5000 | Neon dev branch |
| Staging | staging.attendance-app.vercel.app | staging-api.render.com | Neon staging branch |
| Production | attendance-app.vercel.app | api.attendance-app.com | Neon main branch |

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  lint-and-test:
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install dependencies (npm ci)
      - Run ESLint (client + server)
      - Run unit tests (Vitest for client, Jest for server)
      - Run integration tests (server + test DB)
      - Build client (vite build)
      - Build server (check for errors)

  deploy-frontend:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    steps:
      - Vercel CLI deploy (automatic via Vercel GitHub integration)

  deploy-backend:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    steps:
      - Render auto-deploys on push to main (via Render GitHub integration)
      - Run database migrations (knex migrate:latest)
```

### Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY knexfile.js ./
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### Neon PostgreSQL Configuration

- **Connection pooling:** PgBouncer enabled (pool_mode: transaction).
- **Connection string:** Use pooled endpoint for application, direct endpoint for migrations.
- **Branching:** Use Neon branches for staging/dev databases (instant, zero-copy).
- **Backups:** Automatic point-in-time recovery (7-day retention on free tier, 30 days on paid).

### Monitoring and Logging

| Aspect | Tool |
|--------|------|
| Frontend errors | Sentry (free tier) |
| Backend logs | Render built-in logs + structured JSON |
| Uptime monitoring | BetterUptime or UptimeRobot (free) |
| Database monitoring | Neon dashboard |
| Performance | Render metrics + custom request timing logs |

---

## 15. Scalable Coding Practices

### Repository Pattern

Repositories encapsulate all database access. Controllers and services never write raw SQL.

```
// user.model.js (repository)
class UserRepository {
  async findById(id) { ... }
  async findByEmail(email) { ... }
  async findByOrganization(orgId, filters, pagination) { ... }
  async create(userData) { ... }
  async update(id, data) { ... }
  async toggleStatus(id) { ... }
}

// Benefits:
// - Swap database without changing business logic
// - Centralized query optimization
// - Easy to mock in tests
```

### Service Layer Pattern

Services contain business rules and orchestrate repository calls.

```
// attendance.service.js
class AttendanceService {
  constructor(attendanceRepo, organizationRepo, geolocationService) {
    this.attendanceRepo = attendanceRepo;
    this.organizationRepo = organizationRepo;
    this.geolocationService = geolocationService;
  }

  async checkIn(userId, orgId, latitude, longitude, deviceInfo, ip) {
    // 1. Get org settings (geofence)
    // 2. Validate geolocation
    // 3. Check existing record
    // 4. Create attendance record
    // 5. Return formatted result
  }
}

// Benefits:
// - Business logic isolated from HTTP layer
// - Testable without Express
// - Reusable across routes (API, cron, webhooks)
```

### Dependency Injection Ready

```
// Currently: manual injection in route files
const userRepo = new UserRepository(db);
const authService = new AuthService(userRepo, emailService, otpService);
const authController = new AuthController(authService);

// Future: use a DI container (awilix, tsyringe) for automatic resolution
```

### Pagination Helper

```javascript
// paginationHelper.js
function paginate(query, { page = 1, limit = 20 }) {
  const offset = (page - 1) * limit;
  return {
    query: query.limit(limit).offset(offset),
    meta: { page, limit },
  };
}

async function paginatedResult(baseQuery, countQuery, { page, limit }) {
  const [data, [{ count: total }]] = await Promise.all([
    baseQuery.limit(limit).offset((page - 1) * limit),
    countQuery,
  ]);
  return {
    data,
    meta: {
      page,
      limit,
      total: parseInt(total),
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### Response Formatter

```javascript
// responseFormatter.js
const success = (res, data, meta = null, statusCode = 200) => {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

const created = (res, data) => success(res, data, null, 201);

const noContent = (res) => res.status(204).send();
```

### Consistent Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | camelCase | `auth.controller.js` |
| Database tables | snake_case | `leave_requests` |
| Database columns | snake_case | `created_at` |
| API endpoints | kebab-case | `/check-in` |
| JS variables | camelCase | `leaveBalance` |
| JS classes | PascalCase | `AttendanceService` |
| Constants | UPPER_SNAKE | `MAX_LOGIN_ATTEMPTS` |
| React components | PascalCase | `StatsCard.jsx` |
| CSS classes | kebab-case (Tailwind) | `bg-blue-500` |
| Environment vars | UPPER_SNAKE | `DATABASE_URL` |

### Database Migrations

All schema changes go through Knex migrations. Never modify the database directly.

```
# Create a new migration
npx knex migrate:make add_shift_column_to_users

# Run pending migrations
npx knex migrate:latest

# Rollback last batch
npx knex migrate:rollback

# Migration file structure
exports.up = async function(knex) {
  await knex.schema.alterTable('users', table => {
    table.string('shift_id').references('id').inTable('shifts');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', table => {
    table.dropColumn('shift_id');
  });
};
```

### TypeScript Migration Path

The folder structure is TypeScript-ready. Migration steps:
1. Add `tsconfig.json` to client and server.
2. Rename `.js` to `.ts` incrementally (start with shared/, then utils/, then outward).
3. Add type definitions for models and API responses in `shared/types/`.
4. Enable strict mode gradually.

---

## 16. Development Roadmap

### Phase 1: MVP Foundation (Weeks 1-6)

**Goal:** Core authentication and basic attendance tracking.

| Week | Tasks |
|------|-------|
| 1 | Project setup: monorepo, Vite, Express, Neon DB, folder structure. Initial migrations (organizations, users, roles, sessions). |
| 2 | Auth: Registration, login, JWT tokens, refresh flow, password setup. Auth middleware, RBAC middleware. |
| 3 | Employee CRUD: Admin create/list/update/deactivate employees. Department management. |
| 4 | Basic Attendance: Check-in/check-out (without geolocation). Attendance history. Today's record. |
| 5 | Frontend: Login page, admin layout, employee list, basic dashboard shells. |
| 6 | Integration testing, bug fixes, deploy MVP to staging. |

**Deliverables:** Working auth, employee management, basic check-in/out.

### Phase 2: Core Features (Weeks 7-10)

**Goal:** Leave management, holidays, functional dashboards.

| Week | Tasks |
|------|-------|
| 7 | Leave types setup, leave balance initialization, apply leave API. |
| 8 | Leave approval flow (admin approve/reject), balance deduction, cancellation. |
| 9 | Holiday CRUD, calendar integration, admin dashboard with stats + charts. |
| 10 | Employee dashboard, leave balance cards, attendance summary, upcoming holidays. |

**Deliverables:** Full leave lifecycle, holiday management, both dashboards.

### Phase 3: Polish and Intelligence (Weeks 11-13)

**Goal:** Geolocation, reporting, data visualization.

| Week | Tasks |
|------|-------|
| 11 | Geolocation validation (haversine), device info capture, IP logging. |
| 12 | Attendance reports (date range, department filter, export). Monthly summaries. Recharts integration. |
| 13 | UI polish: responsive design, loading states, empty states, error boundaries, toast notifications. |

**Deliverables:** Location-verified attendance, exportable reports, polished UI.

### Phase 4: Hardening (Weeks 14-15)

**Goal:** Security audit, testing, production readiness.

| Week | Tasks |
|------|-------|
| 14 | Security audit: rate limiting tuning, input validation review, CORS tightening, penetration testing. Unit tests for services, integration tests for APIs. |
| 15 | Performance optimization: query optimization (EXPLAIN ANALYZE), add missing indexes, frontend bundle analysis, lazy loading. Production deployment, monitoring setup. |

**Deliverables:** Secure, tested, performant production system.

---

## 17. NPM Packages

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3 | UI library |
| react-dom | ^18.3 | React DOM renderer |
| react-router-dom | ^6.23 | Client-side routing |
| @tanstack/react-query | ^5.40 | Server state management, caching |
| axios | ^1.7 | HTTP client with interceptors |
| react-hook-form | ^7.51 | Form state management |
| @hookform/resolvers | ^3.4 | Zod resolver for react-hook-form |
| zod | ^3.23 | Schema validation |
| recharts | ^2.12 | Charts and data visualization |
| date-fns | ^3.6 | Date manipulation and formatting |
| lucide-react | ^0.378 | Icon library |
| clsx | ^2.1 | Conditional classname joining |
| tailwind-merge | ^2.3 | Tailwind class conflict resolution |
| sonner | ^1.4 | Toast notifications |
| class-variance-authority | ^0.7 | Component variant management (shadcn) |

### Frontend Dev Dependencies

| Package | Purpose |
|---------|---------|
| vite | Build tool |
| @vitejs/plugin-react | React support for Vite |
| tailwindcss | Utility CSS framework |
| postcss | CSS processing |
| autoprefixer | Vendor prefixing |
| eslint | Code linting |
| eslint-plugin-react-hooks | React hooks linting |
| prettier | Code formatting |
| vitest | Unit testing |
| @testing-library/react | Component testing |

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.19 | Web framework |
| pg | ^8.12 | PostgreSQL client |
| knex | ^3.1 | SQL query builder + migrations |
| jsonwebtoken | ^9.0 | JWT sign/verify |
| bcryptjs | ^2.4 | Password hashing |
| cors | ^2.8 | CORS middleware |
| helmet | ^7.1 | Security HTTP headers |
| express-rate-limit | ^7.2 | Rate limiting |
| morgan | ^1.10 | HTTP request logging |
| dotenv | ^16.4 | Environment variable loading |
| zod | ^3.23 | Request validation schemas |
| nodemailer | ^6.9 | Email sending (OTP, notifications) |
| uuid | ^9.0 | UUID generation |
| compression | ^1.7 | Response compression |
| cookie-parser | ^1.4 | Parse cookies (refresh token) |

### Backend Dev Dependencies

| Package | Purpose |
|---------|---------|
| nodemon | Auto-restart on file changes |
| jest | Testing framework |
| supertest | HTTP assertion testing |
| eslint | Code linting |
| prettier | Code formatting |

---

## 18. Reusable Components

### Component Library

#### DataTable
```
Props:
  columns: Array<{ key, header, render?, sortable?, width? }>
  data: Array<Object>
  loading: boolean
  pagination: { page, limit, total, totalPages }
  onPageChange: (page) => void
  onSort: (key, direction) => void
  onRowClick?: (row) => void
  emptyMessage?: string
  searchable?: boolean
  onSearch?: (query) => void

Features:
  - Column sorting (asc/desc)
  - Pagination controls
  - Loading skeleton rows
  - Empty state display
  - Optional row click handler
  - Optional search bar
  - Responsive: horizontal scroll on mobile
```

#### StatusBadge
```
Props:
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' |
          'pending' | 'approved' | 'rejected' | 'cancelled'
  size?: 'sm' | 'md'

Renders a colored badge with appropriate styling:
  present/approved  --> green
  absent/rejected   --> red
  late              --> orange
  pending           --> yellow
  on_leave          --> blue
  cancelled/half_day --> gray
```

#### PageHeader
```
Props:
  title: string
  subtitle?: string
  action?: { label, onClick, icon? }
  breadcrumbs?: Array<{ label, href? }>

Renders consistent page heading with optional action button and breadcrumbs.
```

#### StatsCard
```
Props:
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number, isPositive: boolean }
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  loading?: boolean

Renders a dashboard stats card with icon, value, optional trend indicator.
```

#### DateRangePicker
```
Props:
  startDate: Date
  endDate: Date
  onChange: ({ startDate, endDate }) => void
  presets?: Array<{ label, startDate, endDate }>
  minDate?: Date
  maxDate?: Date

Features:
  - Calendar-based date selection
  - Preset ranges (This week, This month, Last month)
  - Min/max date constraints
  - Uses shadcn/ui Calendar component
```

#### ConfirmDialog
```
Props:
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmLabel?: string (default: "Confirm")
  variant?: 'default' | 'destructive'
  loading?: boolean

Renders a modal dialog for confirming destructive or important actions.
```

#### LoadingSpinner
```
Props:
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
  text?: string

Renders a centered spinning indicator with optional text.
```

#### EmptyState
```
Props:
  icon: LucideIcon
  title: string
  description: string
  action?: { label, onClick }

Renders a centered empty state for tables and lists with optional CTA.
```

#### SearchInput
```
Props:
  value: string
  onChange: (value) => void
  placeholder?: string
  debounceMs?: number (default: 300)

Renders a search input with debounced onChange and clear button.
```

#### FilterDropdown
```
Props:
  label: string
  options: Array<{ value, label }>
  value: string | string[]
  onChange: (value) => void
  multiple?: boolean

Renders a dropdown filter using shadcn/ui Select or multi-select.
```

#### Sidebar
```
Features:
  - Collapsible (icon-only mode)
  - Active route highlighting
  - Role-based menu items (admin vs employee)
  - Organization logo/name at top
  - User info + logout at bottom
  - Mobile: overlay with backdrop
```

#### TopNavbar
```
Features:
  - Sidebar toggle button (mobile)
  - Global search (future)
  - Notification bell with count badge
  - Avatar dropdown (profile, settings, logout)
  - Breadcrumb navigation
```

#### AvatarMenu
```
Props:
  user: { name, email, avatarUrl, role }

Dropdown menu with: profile link, settings, theme toggle, logout.
```

#### BreadcrumbNav
```
Props:
  items: Array<{ label, href? }>

Renders: Home > Employees > John Doe (last item is current, no link).
```

---

## 19. Future Scalability Suggestions

### Short-Term Enhancements (V2)

#### Redis Integration
```
Purpose: Caching, session storage, rate limiting backend.

Use Cases:
- Cache dashboard stats (TTL: 5 minutes)
- Store rate limit counters (vs in-memory)
- Cache user sessions for faster auth verification
- Pub/sub for real-time notification delivery

Migration: Replace in-memory rate limit store with Redis store.
           Add cache layer in service classes with cache-aside pattern.
```

#### WebSocket (Real-Time Notifications)
```
Purpose: Instant notification delivery without polling.

Use Cases:
- Admin gets instant notification when leave request submitted
- Employee gets instant notification on leave approval/rejection
- Real-time attendance counter on admin dashboard

Implementation: Socket.IO with Redis adapter for horizontal scaling.
```

#### Background Job Queue
```
Purpose: Offload async work from request/response cycle.

Use Cases:
- Send emails (OTP, notifications) asynchronously
- End-of-day attendance marking (cron: mark absent)
- Monthly leave balance initialization
- Report generation (CSV/PDF export)
- Data cleanup (expired OTPs, old sessions)

Implementation: BullMQ with Redis backend. Separate worker process.
```

### Medium-Term Architecture (V3)

#### File Storage (S3/Cloudflare R2)
```
Use Cases:
- Employee profile photos
- Leave supporting documents (medical certificates)
- Report exports (CSV, PDF)
- Organization logos

Implementation: Presigned upload URLs from backend, store metadata in DB.
```

#### Search Engine (ElasticSearch / MeiliSearch)
```
Use Cases:
- Audit log full-text search
- Employee search across all fields
- Attendance record search with complex filters

Migration: Sync data from PostgreSQL via Change Data Capture or periodic indexing.
```

#### GraphQL API Layer
```
Purpose: Flexible querying for complex dashboard views.

Benefits:
- Frontend fetches exactly needed fields
- Reduce over-fetching for mobile clients
- Single request for related data (employee + attendance + leaves)
- Subscriptions for real-time updates

Implementation: Apollo Server alongside REST. Gradual migration.
```

### Long-Term Architecture (Enterprise)

#### Microservices Migration Path

```
Current Monolith:
+--------------------------------------------+
|  Express Server                            |
|  Auth | Attendance | Leaves | Employees    |
+--------------------------------------------+

Step 1 - Extract Shared Services:
+----------+ +----------+ +------------------+
|  Auth    | |  Email   | |  Main API        |
|  Service | |  Service | |  (Attendance,    |
|          | |          | |   Leaves, etc.)  |
+----------+ +----------+ +------------------+

Step 2 - Full Decomposition:
+------+ +----------+ +------+ +--------+ +---------+
| Auth | | Attend.  | | Leave| | Payroll| | Notif.  |
| Svc  | | Svc      | | Svc  | | Svc    | | Svc     |
+------+ +----------+ +------+ +--------+ +---------+
     \        |           |         |          /
      +-------+-----------+---------+---------+
                    API Gateway
                   (Kong / AWS ALB)
```

#### Multi-Tenant Architecture

```
Current: Single-tenant (one org per deployment)

Target: Multi-tenant with data isolation

Strategies:
1. Shared DB, Shared Schema (current): organization_id column on all tables.
   Row-level security (RLS) in PostgreSQL for enforcement.

2. Shared DB, Separate Schemas: Each tenant gets a PostgreSQL schema.
   Better isolation, slightly more complex migrations.

3. Separate Databases: Full isolation per tenant.
   Maximum security, higher infrastructure cost.

Recommendation: Start with strategy 1 (RLS), migrate to 2 if needed.
```

#### Mobile App (React Native)

```
Shared code with web:
- Zod validation schemas
- API client layer (axios)
- Business constants
- Date formatting utilities

Mobile-specific:
- Native geolocation (more accurate than browser)
- Push notifications (Firebase Cloud Messaging)
- Biometric authentication (Face ID, fingerprint)
- Offline check-in with sync
- QR code scanner (camera-based attendance)
```

---

## 20. Development Phases

### Version Roadmap: MVP to Enterprise

```
Timeline Overview:

MVP -----> V1.0 -----> V1.5 -----> V2.0 -----> V3.0 -----> Enterprise
(6 wks)    (4 wks)     (3 wks)     (6 wks)     (8 wks)     (ongoing)
```

---

### MVP (Weeks 1-6)
**Theme:** Foundation

| Feature | Details |
|---------|---------|
| Authentication | Email/password login, JWT tokens, refresh flow |
| Password Setup | First-time password via email OTP |
| Employee Management | Admin CRUD: create, list, view, edit, deactivate |
| Department Management | Create and assign departments |
| Basic Attendance | Check-in/check-out without location verification |
| Attendance History | Employee view: paginated list of past records |
| Basic Admin View | Employee list, simple attendance table |
| Role System | Admin and Employee roles with route protection |

**Exit Criteria:** An admin can create employees. Employees can log in, check in, check out, and view their history.

---

### V1.0 (Weeks 7-10)
**Theme:** Core Business Features

| Feature | Details |
|---------|---------|
| Leave Types | Configure casual, sick, earned leave with annual quotas |
| Leave Application | Employee submits requests with date range and reason |
| Leave Approval | Admin approve/reject with remarks |
| Leave Balance | Automatic tracking, deduction on approval, restore on cancel |
| Holiday Management | Admin CRUD for public/restricted holidays |
| Admin Dashboard | Stats cards, weekly trend chart, department chart, pending leaves |
| Employee Dashboard | Check-in card, monthly summary, leave balances, upcoming holidays |
| Notifications | Email notifications for leave status changes |

**Exit Criteria:** Full leave lifecycle works. Both dashboards display real data with charts.

---

### V1.5 (Weeks 11-13)
**Theme:** Intelligence and Polish

| Feature | Details |
|---------|---------|
| Geolocation | Haversine validation, configurable radius per organization |
| Device Tracking | Capture browser/OS info, IP address on check-in/out |
| Attendance Reports | Date range, department filter, status filter, CSV export |
| Monthly Reports | Automated monthly attendance summary generation |
| UI Polish | Loading skeletons, error boundaries, empty states, responsive design |
| Search and Filters | Employee search, attendance filters, leave filters |
| Pagination | Consistent pagination across all list views |
| Audit Logging | Track all sensitive actions with before/after snapshots |

**Exit Criteria:** Location-verified attendance. Exportable reports. Production-quality UI.

---

### V2.0 (Weeks 14-19)
**Theme:** Organization Features

| Feature | Details |
|---------|---------|
| Shift Management | Define shifts (morning, evening, night), assign to employees |
| Flexible Timing | Per-shift check-in windows, late/early thresholds |
| Team Hierarchy | Manager role, team leads, department heads |
| Manager Approvals | Leave requests route to direct manager first |
| In-App Notifications | Notification bell with dropdown, read/unread status |
| Email Templates | Branded email templates for all notification types |
| Organization Settings | Configurable work hours, holidays, leave policies |
| Bulk Operations | Bulk employee import (CSV), bulk leave balance reset |
| Profile Management | Employee self-service: photo, phone, emergency contact |
| Dark Mode | System-aware theme toggle |

**Exit Criteria:** Multi-shift support. Manager hierarchy. Notification system.

---

### V3.0 (Weeks 20-27)
**Theme:** Advanced Features

| Feature | Details |
|---------|---------|
| Payroll Integration | Work hours calculation, overtime tracking, monthly payroll report |
| QR Code Attendance | Generate daily rotating QR codes, employee scans to check in |
| Mobile App | React Native app for iOS/Android with native geolocation |
| Offline Support | Queue check-ins when offline, sync when connected |
| Push Notifications | Firebase Cloud Messaging for mobile alerts |
| Advanced Reports | Custom report builder, scheduled email reports, PDF export |
| Calendar View | Full-month calendar showing attendance, leaves, holidays |
| Comp-Off Management | Compensatory leave for overtime/weekend work |
| Regularization | Employee requests to correct attendance, admin approves |
| API Rate Limiting v2 | Per-user rate limits, API key support for integrations |

**Exit Criteria:** Mobile app live. QR attendance working. Payroll reports generated.

---

### Enterprise (Ongoing)
**Theme:** Scale and Compliance

| Feature | Details |
|---------|---------|
| Face Verification | Liveness detection + face match on check-in (AWS Rekognition) |
| Biometric Integration | Fingerprint scanner API integration |
| Multi-Tenant SaaS | Full tenant isolation, per-tenant customization, white-labeling |
| SSO/SAML | Enterprise SSO with Okta, Azure AD, Google Workspace |
| Advanced Analytics | Attendance trends, prediction, anomaly detection |
| Compliance Reports | Labor law compliance reports per region |
| API Marketplace | Public API with OAuth, developer portal, webhooks |
| Custom Workflows | Configurable approval chains (N-level) |
| Internationalization | Multi-language support (i18n) |
| Data Residency | Region-specific data storage for compliance |
| Horizontal Scaling | Kubernetes deployment, auto-scaling, multi-region |
| Event-Driven Architecture | Kafka/RabbitMQ for inter-service communication |

**Exit Criteria:** Enterprise contracts signed. SOC2 compliance achieved. Multi-region deployment.

---

## Appendix: Quick Reference

### Key Commands

```bash
# Development
cd client && npm run dev          # Start frontend (port 5173)
cd server && npm run dev          # Start backend with nodemon (port 5000)

# Database
cd server && npx knex migrate:latest    # Run migrations
cd server && npx knex seed:run          # Run seeds
cd server && npx knex migrate:make <name>  # Create migration

# Testing
cd client && npm run test        # Vitest
cd server && npm run test        # Jest
cd server && npm run test:e2e    # Integration tests

# Build
cd client && npm run build       # Production build
cd server && npm run build       # Check for errors (if using TS)

# Linting
npm run lint                     # ESLint across workspace
npm run format                   # Prettier format
```

### Important Ports

| Service | Port |
|---------|------|
| Vite Dev Server | 5173 |
| Express API | 5000 |
| PostgreSQL | 5432 |
| Redis (future) | 6379 |

### Key Environment Files

```
client/.env          --> VITE_API_URL, VITE_APP_NAME
server/.env          --> DATABASE_URL, JWT secrets, SMTP config
.env.example         --> Template for both (committed to git)
.env                 --> Actual values (NEVER committed)
```

---

*This document serves as the single source of truth for the Attendance Management System architecture. Update this document as the system evolves. All major architectural decisions should be documented here before implementation.*
