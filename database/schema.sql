-- ============================================================================
-- Office Attendance Management System - PostgreSQL Schema
-- ============================================================================
-- Version: 1.0.0
-- PostgreSQL: 13+ (uses gen_random_uuid())
-- Description: Complete database schema for managing office attendance,
--              leave management, user authentication, and audit logging.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- gen_random_uuid(), crypt(), gen_salt()
CREATE EXTENSION IF NOT EXISTS "citext";       -- case-insensitive text for emails


-- ============================================================================
-- SECTION 2: CUSTOM ENUM TYPES
-- ============================================================================

CREATE TYPE attendance_status AS ENUM (
    'present',
    'half_day',
    'late',
    'absent',
    'on_leave',
    'holiday',
    'weekend'
);
COMMENT ON TYPE attendance_status IS 'Possible attendance statuses for a given day.';

CREATE TYPE leave_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);
COMMENT ON TYPE leave_status IS 'Workflow states for leave requests.';

CREATE TYPE holiday_type AS ENUM (
    'national',
    'regional',
    'company',
    'optional'
);
COMMENT ON TYPE holiday_type IS 'Classification of holidays.';

CREATE TYPE otp_purpose AS ENUM (
    'email_verification',
    'password_reset',
    'first_login'
);
COMMENT ON TYPE otp_purpose IS 'Purpose for which an OTP was generated.';


-- ============================================================================
-- SECTION 3: UTILITY FUNCTIONS (triggers, calculations)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3a. Auto-update updated_at timestamp
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_updated_at() IS
    'Trigger function: automatically sets updated_at to current timestamp on row update.';

-- ---------------------------------------------------------------------------
-- 3b. Auto-calculate work_hours when check_out_time is set
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_work_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
        NEW.work_hours = ROUND(
            EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600.0,
            2
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_calculate_work_hours() IS
    'Trigger function: computes work_hours as the difference between check_out and check_in in hours.';

-- ---------------------------------------------------------------------------
-- 3c. Update leave balance when leave request status changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- When a leave request is approved, increment used_days
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
        UPDATE leave_balances
        SET used_days = used_days + NEW.total_days
        WHERE user_id = NEW.user_id
          AND leave_type_id = NEW.leave_type_id
          AND year = EXTRACT(YEAR FROM NEW.start_date);
    END IF;

    -- When a previously approved leave is cancelled or rejected, decrement used_days
    IF OLD.status = 'approved' AND NEW.status IN ('cancelled', 'rejected') THEN
        UPDATE leave_balances
        SET used_days = GREATEST(0, used_days - OLD.total_days)
        WHERE user_id = OLD.user_id
          AND leave_type_id = OLD.leave_type_id
          AND year = EXTRACT(YEAR FROM OLD.start_date);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_update_leave_balance() IS
    'Trigger function: adjusts leave_balances.used_days when a leave request is approved or cancelled.';


-- ============================================================================
-- SECTION 4: TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 4a. organizations
-- ---------------------------------------------------------------------------
CREATE TABLE organizations (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(255)    NOT NULL,
    slug                    VARCHAR(100)    NOT NULL UNIQUE,
    address                 TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    country                 VARCHAR(100)    DEFAULT 'India',
    zip_code                VARCHAR(20),
    phone                   VARCHAR(20),
    email                   CITEXT,
    logo_url                TEXT,
    office_latitude         DECIMAL(10,8),
    office_longitude        DECIMAL(11,8),
    geofence_radius_meters  INTEGER         NOT NULL DEFAULT 100,
    timezone                VARCHAR(50)     NOT NULL DEFAULT 'Asia/Kolkata',
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_org_geofence_radius CHECK (geofence_radius_meters > 0),
    CONSTRAINT chk_org_latitude  CHECK (office_latitude  BETWEEN -90  AND 90),
    CONSTRAINT chk_org_longitude CHECK (office_longitude BETWEEN -180 AND 180)
);

COMMENT ON TABLE organizations IS
    'Tenant organizations. Each organization has its own departments, users, holidays, and leave policies.';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization.';
COMMENT ON COLUMN organizations.geofence_radius_meters IS 'Radius in meters within which check-in is allowed from the office coordinates.';

-- ---------------------------------------------------------------------------
-- 4b. departments
-- ---------------------------------------------------------------------------
CREATE TABLE departments (
    id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID            NOT NULL,
    name              VARCHAR(255)    NOT NULL,
    description       TEXT,
    is_active         BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_dept_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT uq_dept_org_name
        UNIQUE (organization_id, name)
);

COMMENT ON TABLE departments IS
    'Departments within an organization. A user belongs to exactly one department.';

-- ---------------------------------------------------------------------------
-- 4c. roles
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50)     NOT NULL UNIQUE,
    description     TEXT,
    permissions     JSONB           NOT NULL DEFAULT '{}',
    is_system_role  BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE roles IS
    'Application roles with JSONB permissions. System roles (is_system_role=true) cannot be deleted.';
COMMENT ON COLUMN roles.permissions IS 'JSONB map of permission keys to booleans, e.g. {"attendance.view": true}.';

-- ---------------------------------------------------------------------------
-- 4d. users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID            NOT NULL,
    department_id       UUID,
    role_id             UUID            NOT NULL,
    employee_id         VARCHAR(20)     NOT NULL UNIQUE,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    email               CITEXT          NOT NULL UNIQUE,
    phone               VARCHAR(20),
    password_hash       TEXT            NOT NULL,
    avatar_url          TEXT,
    date_of_birth       DATE,
    date_of_joining     DATE,
    designation         VARCHAR(150),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN         NOT NULL DEFAULT FALSE,
    is_first_login      BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_by          UUID,

    CONSTRAINT fk_user_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_department
        FOREIGN KEY (department_id)   REFERENCES departments(id)    ON DELETE SET NULL,
    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)         REFERENCES roles(id)          ON DELETE RESTRICT,
    CONSTRAINT fk_user_created_by
        FOREIGN KEY (created_by)      REFERENCES users(id)          ON DELETE SET NULL,

    CONSTRAINT chk_user_dob_before_joining
        CHECK (date_of_birth IS NULL OR date_of_joining IS NULL OR date_of_joining > date_of_birth)
);

COMMENT ON TABLE users IS
    'All system users across organizations. Uniquely identified by email and employee_id.';
COMMENT ON COLUMN users.employee_id IS 'Human-readable employee code, e.g. EMP001.';
COMMENT ON COLUMN users.is_first_login IS 'True until user completes first-login setup (password change, profile).';

-- ---------------------------------------------------------------------------
-- 4e. attendance_records
-- ---------------------------------------------------------------------------
CREATE TABLE attendance_records (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                NOT NULL,
    date                DATE                NOT NULL,
    check_in_time       TIMESTAMPTZ         NOT NULL,
    check_out_time      TIMESTAMPTZ,
    work_hours          DECIMAL(4,2),
    status              attendance_status   NOT NULL DEFAULT 'present',
    check_in_latitude   DECIMAL(10,8),
    check_in_longitude  DECIMAL(11,8),
    check_out_latitude  DECIMAL(10,8),
    check_out_longitude DECIMAL(11,8),
    check_in_ip         INET,
    check_out_ip        INET,
    device_info         JSONB               DEFAULT '{}',
    check_in_note       TEXT,
    check_out_note      TEXT,
    is_manual_entry     BOOLEAN             NOT NULL DEFAULT FALSE,
    manual_entry_by     UUID,
    manual_entry_reason TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attendance_user
        FOREIGN KEY (user_id)         REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_attendance_manual_by
        FOREIGN KEY (manual_entry_by) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT uq_attendance_user_date
        UNIQUE (user_id, date),

    CONSTRAINT chk_attendance_checkout_after_checkin
        CHECK (check_out_time IS NULL OR check_out_time >= check_in_time),
    CONSTRAINT chk_attendance_work_hours
        CHECK (work_hours IS NULL OR work_hours >= 0),
    CONSTRAINT chk_attendance_manual_entry_reason
        CHECK (
            (is_manual_entry = FALSE)
            OR (is_manual_entry = TRUE AND manual_entry_reason IS NOT NULL)
        )
);

COMMENT ON TABLE attendance_records IS
    'Daily attendance records. One row per user per day. Tracks GPS, IP, and device for each check-in/out.';
COMMENT ON COLUMN attendance_records.work_hours IS 'Auto-calculated by trigger when check_out_time is set.';
COMMENT ON COLUMN attendance_records.is_manual_entry IS 'True if this record was created/edited manually by an admin or HR.';

-- ---------------------------------------------------------------------------
-- 4f. leave_types
-- ---------------------------------------------------------------------------
CREATE TABLE leave_types (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID            NOT NULL,
    name                    VARCHAR(100)    NOT NULL,
    description             TEXT,
    default_days_per_year   DECIMAL(5,1)    NOT NULL DEFAULT 0,
    is_paid                 BOOLEAN         NOT NULL DEFAULT TRUE,
    is_carry_forward        BOOLEAN         NOT NULL DEFAULT FALSE,
    max_carry_forward_days  DECIMAL(5,1)    DEFAULT 0,
    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_leave_type_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,

    CONSTRAINT uq_leave_type_org_name
        UNIQUE (organization_id, name),
    CONSTRAINT chk_leave_type_default_days
        CHECK (default_days_per_year >= 0),
    CONSTRAINT chk_leave_type_carry_forward
        CHECK (max_carry_forward_days IS NULL OR max_carry_forward_days >= 0)
);

COMMENT ON TABLE leave_types IS
    'Leave type definitions per organization (casual, sick, earned, etc.). Controls accrual and carry-forward rules.';

-- ---------------------------------------------------------------------------
-- 4g. leave_balances
-- ---------------------------------------------------------------------------
CREATE TABLE leave_balances (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL,
    leave_type_id   UUID            NOT NULL,
    year            INTEGER         NOT NULL,
    total_days      DECIMAL(5,1)    NOT NULL DEFAULT 0,
    used_days       DECIMAL(5,1)    NOT NULL DEFAULT 0,
    remaining_days  DECIMAL(5,1)    GENERATED ALWAYS AS (total_days - used_days) STORED,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_balance_user
        FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE RESTRICT,
    CONSTRAINT fk_balance_leave_type
        FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,

    CONSTRAINT uq_balance_user_type_year
        UNIQUE (user_id, leave_type_id, year),
    CONSTRAINT chk_balance_total_days
        CHECK (total_days >= 0),
    CONSTRAINT chk_balance_used_days
        CHECK (used_days >= 0),
    CONSTRAINT chk_balance_used_not_exceed_total
        CHECK (used_days <= total_days),
    CONSTRAINT chk_balance_year
        CHECK (year >= 2000 AND year <= 2100)
);

COMMENT ON TABLE leave_balances IS
    'Per-user per-year leave balance for each leave type. remaining_days is auto-computed.';
COMMENT ON COLUMN leave_balances.remaining_days IS 'Generated column: total_days - used_days.';

-- ---------------------------------------------------------------------------
-- 4h. leave_requests
-- ---------------------------------------------------------------------------
CREATE TABLE leave_requests (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL,
    leave_type_id   UUID            NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    total_days      DECIMAL(3,1)    NOT NULL,
    reason          TEXT            NOT NULL,
    status          leave_status    NOT NULL DEFAULT 'pending',
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    review_remarks  TEXT,
    applied_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_leave_req_user
        FOREIGN KEY (user_id)       REFERENCES users(id)       ON DELETE RESTRICT,
    CONSTRAINT fk_leave_req_type
        FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
    CONSTRAINT fk_leave_req_reviewer
        FOREIGN KEY (reviewed_by)   REFERENCES users(id)       ON DELETE SET NULL,

    CONSTRAINT chk_leave_req_end_after_start
        CHECK (end_date >= start_date),
    CONSTRAINT chk_leave_req_total_days
        CHECK (total_days > 0),
    CONSTRAINT chk_leave_req_review_consistency
        CHECK (
            (status IN ('pending', 'cancelled') AND reviewed_by IS NULL AND reviewed_at IS NULL)
            OR (status IN ('approved', 'rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
        )
);

COMMENT ON TABLE leave_requests IS
    'Employee leave applications with approval workflow. Status transitions: pending -> approved/rejected, pending/approved -> cancelled.';

-- ---------------------------------------------------------------------------
-- 4i. holidays
-- ---------------------------------------------------------------------------
CREATE TABLE holidays (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID            NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    date            DATE            NOT NULL,
    type            holiday_type    NOT NULL DEFAULT 'company',
    description     TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_holiday_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT,

    CONSTRAINT uq_holiday_org_date
        UNIQUE (organization_id, date)
);

COMMENT ON TABLE holidays IS
    'Organization-specific holiday calendar. One entry per date per organization.';

-- ---------------------------------------------------------------------------
-- 4j. sessions
-- ---------------------------------------------------------------------------
CREATE TABLE sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL,
    refresh_token_hash  TEXT        NOT NULL,
    device_info         JSONB       DEFAULT '{}',
    ip_address          INET,
    user_agent          TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    is_revoked          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE sessions IS
    'Active refresh-token sessions. Cascades on user deletion. Revoked sessions are kept for audit.';

-- ---------------------------------------------------------------------------
-- 4k. otp_verifications
-- ---------------------------------------------------------------------------
CREATE TABLE otp_verifications (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL,
    email       CITEXT          NOT NULL,
    otp_hash    TEXT            NOT NULL,
    purpose     otp_purpose     NOT NULL,
    expires_at  TIMESTAMPTZ     NOT NULL,
    is_used     BOOLEAN         NOT NULL DEFAULT FALSE,
    attempts    INTEGER         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_otp_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT chk_otp_attempts
        CHECK (attempts >= 0 AND attempts <= 5)
);

COMMENT ON TABLE otp_verifications IS
    'One-time password records for email verification, password reset, and first-login flows. Max 5 attempts.';

-- ---------------------------------------------------------------------------
-- 4l. audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    organization_id UUID,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft references: do not enforce FK so logs survive entity deletion
    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE SET NULL,
    CONSTRAINT fk_audit_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

COMMENT ON TABLE audit_logs IS
    'Immutable audit trail. No updated_at column. Records are append-only.';
COMMENT ON COLUMN audit_logs.action IS 'Action performed, e.g. user.login, attendance.check_in, leave.approve.';
COMMENT ON COLUMN audit_logs.entity_type IS 'Table/entity affected, e.g. users, attendance_records, leave_requests.';


-- ============================================================================
-- SECTION 5: INDEXES
-- ============================================================================

-- organizations
CREATE INDEX idx_org_is_active       ON organizations (is_active) WHERE is_active = TRUE;

-- departments
CREATE INDEX idx_dept_organization   ON departments (organization_id);

-- users
CREATE INDEX idx_user_organization   ON users (organization_id);
CREATE INDEX idx_user_department     ON users (department_id);
CREATE INDEX idx_user_role           ON users (role_id);
CREATE INDEX idx_user_email          ON users (email);
CREATE INDEX idx_user_employee_id    ON users (employee_id);
CREATE INDEX idx_user_is_active      ON users (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_created_by     ON users (created_by);

-- attendance_records
CREATE INDEX idx_attendance_user     ON attendance_records (user_id);
CREATE INDEX idx_attendance_date     ON attendance_records (date);
CREATE INDEX idx_attendance_status   ON attendance_records (status);
CREATE INDEX idx_attendance_user_date_status
    ON attendance_records (user_id, date, status);

-- leave_types
CREATE INDEX idx_leave_type_org      ON leave_types (organization_id);

-- leave_balances
CREATE INDEX idx_balance_user        ON leave_balances (user_id);
CREATE INDEX idx_balance_leave_type  ON leave_balances (leave_type_id);
CREATE INDEX idx_balance_user_year   ON leave_balances (user_id, year);

-- leave_requests
CREATE INDEX idx_leave_req_user      ON leave_requests (user_id);
CREATE INDEX idx_leave_req_type      ON leave_requests (leave_type_id);
CREATE INDEX idx_leave_req_status    ON leave_requests (status);
CREATE INDEX idx_leave_req_reviewer  ON leave_requests (reviewed_by);
CREATE INDEX idx_leave_req_dates     ON leave_requests (start_date, end_date);
CREATE INDEX idx_leave_req_user_status
    ON leave_requests (user_id, status);

-- holidays
CREATE INDEX idx_holiday_org         ON holidays (organization_id);
CREATE INDEX idx_holiday_date        ON holidays (date);
CREATE INDEX idx_holiday_org_date    ON holidays (organization_id, date);

-- sessions
CREATE INDEX idx_session_user        ON sessions (user_id);
CREATE INDEX idx_session_expires     ON sessions (expires_at) WHERE is_revoked = FALSE;

-- otp_verifications
CREATE INDEX idx_otp_user            ON otp_verifications (user_id);
CREATE INDEX idx_otp_email           ON otp_verifications (email);
CREATE INDEX idx_otp_expires         ON otp_verifications (expires_at) WHERE is_used = FALSE;

-- audit_logs
CREATE INDEX idx_audit_user          ON audit_logs (user_id);
CREATE INDEX idx_audit_organization  ON audit_logs (organization_id);
CREATE INDEX idx_audit_entity        ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_action        ON audit_logs (action);
CREATE INDEX idx_audit_created_at    ON audit_logs (created_at);


-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

-- updated_at auto-update triggers
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_attendance_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_leave_types_updated_at
    BEFORE UPDATE ON leave_types
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_leave_balances_updated_at
    BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_holidays_updated_at
    BEFORE UPDATE ON holidays
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Auto-calculate work_hours on attendance insert or update
CREATE TRIGGER trg_attendance_calc_work_hours
    BEFORE INSERT OR UPDATE OF check_in_time, check_out_time ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION fn_calculate_work_hours();

-- Auto-adjust leave balances when leave request status changes
CREATE TRIGGER trg_leave_request_balance_update
    AFTER UPDATE OF status ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION fn_update_leave_balance();


-- ============================================================================
-- SECTION 7: SEED DATA
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 7a. System Roles
-- ---------------------------------------------------------------------------
INSERT INTO roles (id, name, description, permissions, is_system_role) VALUES

(gen_random_uuid(), 'super_admin', 'Full system access across all organizations', '{
    "organizations.create": true,
    "organizations.read": true,
    "organizations.update": true,
    "organizations.delete": true,
    "users.create": true,
    "users.read": true,
    "users.update": true,
    "users.delete": true,
    "users.impersonate": true,
    "departments.create": true,
    "departments.read": true,
    "departments.update": true,
    "departments.delete": true,
    "attendance.read": true,
    "attendance.update": true,
    "attendance.manual_entry": true,
    "attendance.reports": true,
    "leave_types.create": true,
    "leave_types.read": true,
    "leave_types.update": true,
    "leave_types.delete": true,
    "leave_requests.approve": true,
    "leave_requests.read_all": true,
    "holidays.create": true,
    "holidays.read": true,
    "holidays.update": true,
    "holidays.delete": true,
    "roles.manage": true,
    "audit_logs.read": true,
    "settings.manage": true
}'::jsonb, TRUE),

(gen_random_uuid(), 'org_admin', 'Organization-level administrator', '{
    "users.create": true,
    "users.read": true,
    "users.update": true,
    "users.delete": true,
    "departments.create": true,
    "departments.read": true,
    "departments.update": true,
    "departments.delete": true,
    "attendance.read": true,
    "attendance.update": true,
    "attendance.manual_entry": true,
    "attendance.reports": true,
    "leave_types.create": true,
    "leave_types.read": true,
    "leave_types.update": true,
    "leave_requests.approve": true,
    "leave_requests.read_all": true,
    "holidays.create": true,
    "holidays.read": true,
    "holidays.update": true,
    "holidays.delete": true,
    "audit_logs.read": true,
    "settings.manage": true
}'::jsonb, TRUE),

(gen_random_uuid(), 'hr_manager', 'Human Resources manager with attendance and leave management', '{
    "users.create": true,
    "users.read": true,
    "users.update": true,
    "departments.read": true,
    "attendance.read": true,
    "attendance.update": true,
    "attendance.manual_entry": true,
    "attendance.reports": true,
    "leave_types.read": true,
    "leave_types.update": true,
    "leave_requests.approve": true,
    "leave_requests.read_all": true,
    "holidays.create": true,
    "holidays.read": true,
    "holidays.update": true,
    "audit_logs.read": true
}'::jsonb, TRUE),

(gen_random_uuid(), 'team_lead', 'Team lead with limited management of team members', '{
    "users.read": true,
    "departments.read": true,
    "attendance.read": true,
    "attendance.read_team": true,
    "attendance.reports": true,
    "leave_requests.approve_team": true,
    "leave_requests.read_team": true,
    "holidays.read": true
}'::jsonb, TRUE),

(gen_random_uuid(), 'employee', 'Regular employee with self-service access', '{
    "attendance.check_in": true,
    "attendance.check_out": true,
    "attendance.read_own": true,
    "leave_requests.create": true,
    "leave_requests.read_own": true,
    "leave_requests.cancel_own": true,
    "leave_balances.read_own": true,
    "holidays.read": true,
    "profile.read": true,
    "profile.update": true
}'::jsonb, TRUE);

-- ---------------------------------------------------------------------------
-- 7b. Sample Organization
-- ---------------------------------------------------------------------------
INSERT INTO organizations (
    id, name, slug, address, city, state, country, zip_code,
    phone, email, logo_url,
    office_latitude, office_longitude, geofence_radius_meters, timezone
) VALUES (
    gen_random_uuid(),
    'Kwikza Technologies Pvt. Ltd.',
    'kwikza-technologies',
    '123, Tech Park, Hinjewadi Phase 1',
    'Pune',
    'Maharashtra',
    'India',
    '411057',
    '+91-20-12345678',
    'admin@kwikza.com',
    NULL,
    18.59174500,    -- Hinjewadi, Pune approximate latitude
    73.73895700,    -- Hinjewadi, Pune approximate longitude
    150,
    'Asia/Kolkata'
);

-- ---------------------------------------------------------------------------
-- 7c. Sample Departments (for the sample org)
-- ---------------------------------------------------------------------------
INSERT INTO departments (id, organization_id, name, description)
SELECT
    gen_random_uuid(),
    o.id,
    d.name,
    d.description
FROM organizations o
CROSS JOIN (
    VALUES
        ('Engineering',      'Software development and QA'),
        ('Human Resources',  'People operations and recruitment'),
        ('Finance',          'Accounts, payroll, and compliance'),
        ('Marketing',        'Brand, growth, and communications'),
        ('Operations',       'Facilities, admin, and IT support')
) AS d(name, description)
WHERE o.slug = 'kwikza-technologies';

-- ---------------------------------------------------------------------------
-- 7d. Default Leave Types (for the sample org)
-- ---------------------------------------------------------------------------
INSERT INTO leave_types (
    id, organization_id, name, description,
    default_days_per_year, is_paid, is_carry_forward, max_carry_forward_days
)
SELECT
    gen_random_uuid(),
    o.id,
    lt.name,
    lt.description,
    lt.default_days,
    lt.is_paid,
    lt.is_carry_forward,
    lt.max_carry_forward
FROM organizations o
CROSS JOIN (
    VALUES
        ('Casual Leave',       'For personal or casual reasons',           12, TRUE,  FALSE, 0),
        ('Sick Leave',         'For medical reasons with documentation',   12, TRUE,  FALSE, 0),
        ('Earned Leave',       'Accrued based on service, can encash',     15, TRUE,  TRUE,  10),
        ('Maternity Leave',    'As per Maternity Benefit Act',             182, TRUE,  FALSE, 0),
        ('Paternity Leave',    'Paternity benefit',                        15, TRUE,  FALSE, 0),
        ('Unpaid Leave',       'Leave without pay',                        0,  FALSE, FALSE, 0),
        ('Compensatory Off',   'Against extra working days/weekends',      0,  TRUE,  FALSE, 0)
) AS lt(name, description, default_days, is_paid, is_carry_forward, max_carry_forward)
WHERE o.slug = 'kwikza-technologies';

-- ---------------------------------------------------------------------------
-- 7e. Sample Holidays for 2026 (for the sample org)
-- ---------------------------------------------------------------------------
INSERT INTO holidays (id, organization_id, name, date, type, description)
SELECT
    gen_random_uuid(),
    o.id,
    h.name,
    h.date::DATE,
    h.type::holiday_type,
    h.description
FROM organizations o
CROSS JOIN (
    VALUES
        ('Republic Day',          '2026-01-26', 'national',  'National holiday'),
        ('Holi',                  '2026-03-17', 'national',  'Festival of colors'),
        ('Good Friday',           '2026-04-03', 'national',  'Christian observance'),
        ('Eid ul-Fitr',           '2026-03-31', 'national',  'End of Ramadan'),
        ('Independence Day',      '2026-08-15', 'national',  'National holiday'),
        ('Gandhi Jayanti',        '2026-10-02', 'national',  'National holiday'),
        ('Dussehra',              '2026-10-20', 'national',  'Victory of good over evil'),
        ('Diwali',                '2026-11-08', 'national',  'Festival of lights'),
        ('Christmas Day',         '2026-12-25', 'national',  'Christian observance'),
        ('Company Foundation Day','2026-06-15', 'company',   'Annual company celebration')
) AS h(name, date, type, description)
WHERE o.slug = 'kwikza-technologies';


-- ============================================================================
-- SECTION 8: ROW-LEVEL SECURITY (optional, for multi-tenant isolation)
-- ============================================================================

-- Enable RLS on key tables (policies would be added per application role)
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies are not defined here as they depend on the application's
-- authentication mechanism (e.g., setting app.current_organization_id via
-- SET LOCAL). Define policies in a separate migration once auth is integrated.


COMMIT;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
