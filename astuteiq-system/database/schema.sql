-- AstuteIQ PostgreSQL schema.sql
-- Recommended for Supabase / PostgreSQL 15+
 
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
 
-- =========================================================
-- ENUMS
-- =========================================================
 
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'practice_admin', 'reviewer');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'practice_status') THEN
        CREATE TYPE practice_status AS ENUM ('active', 'inactive', 'suspended');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_mode') THEN
        CREATE TYPE review_mode AS ENUM ('quick', 'full');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
        CREATE TYPE review_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
        CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('new_soa', 'reference_soa', 'supporting');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_area') THEN
        CREATE TYPE review_area AS ENUM ('consistency', 'structure', 'compliance', 'personalisation');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'check_status') THEN
        CREATE TYPE check_status AS ENUM ('pass', 'warning', 'fail', 'na');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_type') THEN
        CREATE TYPE billing_type AS ENUM ('per_review', 'monthly');
    END IF;
 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usage_action_type') THEN
        CREATE TYPE usage_action_type AS ENUM (
            'quick_review',
            'full_review',
            'reopen_review',
            'export_word',
            'login',
            'logout'
        );
    END IF;
END $$;
 
-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================================
 
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
-- =========================================================
-- PRACTICES
-- =========================================================
 
CREATE TABLE IF NOT EXISTS practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    licensee_name VARCHAR(200),
    afsl_number VARCHAR(50),
    billing_email VARCHAR(255),
    status practice_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE UNIQUE INDEX IF NOT EXISTS idx_practices_name_unique
    ON practices (LOWER(name));
 
CREATE TRIGGER trg_practices_updated_at
BEFORE UPDATE ON practices
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
 
-- =========================================================
-- USERS
-- Supabase auth.users id can map into supabase_user_id
-- =========================================================
 
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE RESTRICT,
    supabase_user_id UUID UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'reviewer',
    job_title VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email UNIQUE (email)
);
 
CREATE INDEX IF NOT EXISTS idx_users_practice_id ON users(practice_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
 
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
 
-- =========================================================
-- OPTIONAL: PRACTICE MEMBERSHIPS
-- Keep this only if one user can belong to multiple practices.
-- If not needed, users.practice_id is enough.
-- =========================================================
 
CREATE TABLE IF NOT EXISTS practice_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'reviewer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_practice_memberships_user_practice UNIQUE (user_id, practice_id)
);
 
CREATE INDEX IF NOT EXISTS idx_practice_memberships_user_id ON practice_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_memberships_practice_id ON practice_memberships(practice_id);
 
-- =========================================================
-- REVIEWS
-- Stores the completed review metadata and full results JSON
-- =========================================================
 
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 
    review_mode review_mode NOT NULL,
    status review_status NOT NULL DEFAULT 'queued',
 
    client_name VARCHAR(255),
    adviser_name VARCHAR(255),
    practice_name_extracted VARCHAR(255),
    advice_type VARCHAR(100),
    soa_date DATE,
    risk_level risk_level,
 
    summary TEXT,
    docs_reviewed_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    results_json JSONB NOT NULL DEFAULT '{}'::jsonb,
 
    pass_count INTEGER NOT NULL DEFAULT 0,
    warning_count INTEGER NOT NULL DEFAULT 0,
    fail_count INTEGER NOT NULL DEFAULT 0,
    na_count INTEGER NOT NULL DEFAULT 0,
 
    processing_seconds INTEGER,
    stage1_tokens_in INTEGER,
    stage1_tokens_out INTEGER,
    stage2_tokens_in INTEGER,
    stage2_tokens_out INTEGER,
 
    error_message TEXT,
 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
 
CREATE INDEX IF NOT EXISTS idx_reviews_practice_id ON reviews(practice_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_mode ON reviews(review_mode);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_client_name ON reviews(LOWER(client_name));
CREATE INDEX IF NOT EXISTS idx_reviews_results_json_gin ON reviews USING GIN (results_json);
CREATE INDEX IF NOT EXISTS idx_reviews_docs_reviewed_json_gin ON reviews USING GIN (docs_reviewed_json);
 
-- =========================================================
-- REVIEW DOCUMENTS
-- Metadata only. Do NOT store actual file binary/content.
-- =========================================================
 
CREATE TABLE IF NOT EXISTS review_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120),
    file_size_bytes BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    token_estimate INTEGER,
    included_in_stage1 BOOLEAN NOT NULL DEFAULT FALSE,
    included_in_stage2 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_review_documents_review_id ON review_documents(review_id);
CREATE INDEX IF NOT EXISTS idx_review_documents_type ON review_documents(document_type);
 
-- =========================================================
-- REVIEW CHECKS
-- Row-per-check storage for filtering, dashboard stats, analytics
-- =========================================================
 
CREATE TABLE IF NOT EXISTS review_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    check_code VARCHAR(20) NOT NULL,
    area review_area NOT NULL,
    label TEXT NOT NULL,
    status check_status NOT NULL,
    note TEXT,
    page_references TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review_checks_review_check_code UNIQUE (review_id, check_code)
);
 
CREATE INDEX IF NOT EXISTS idx_review_checks_review_id ON review_checks(review_id);
CREATE INDEX IF NOT EXISTS idx_review_checks_area ON review_checks(area);
CREATE INDEX IF NOT EXISTS idx_review_checks_status ON review_checks(status);
CREATE INDEX IF NOT EXISTS idx_review_checks_check_code ON review_checks(check_code);
 
-- =========================================================
-- REVIEW FEEDBACK
-- Stores reviewer override / comments for AI findings
-- =========================================================
 
CREATE TABLE IF NOT EXISTS review_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    review_check_id UUID NOT NULL REFERENCES review_checks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 
    is_flagged_incorrect BOOLEAN NOT NULL DEFAULT TRUE,
    original_status check_status NOT NULL,
    override_status check_status NOT NULL,
    comment TEXT,
 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 
    CONSTRAINT uq_review_feedback_review_check_user UNIQUE (review_check_id, user_id)
);
 
CREATE INDEX IF NOT EXISTS idx_review_feedback_review_id ON review_feedback(review_id);
CREATE INDEX IF NOT EXISTS idx_review_feedback_review_check_id ON review_feedback(review_check_id);
CREATE INDEX IF NOT EXISTS idx_review_feedback_user_id ON review_feedback(user_id);
 
CREATE TRIGGER trg_review_feedback_updated_at
BEFORE UPDATE ON review_feedback
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
 
-- =========================================================
-- USAGE LOGS
-- Tracks billable and operational activity
-- =========================================================
 
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
 
    action_type usage_action_type NOT NULL,
    billable_units INTEGER NOT NULL DEFAULT 1 CHECK (billable_units >= 0),
    meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_usage_logs_practice_id ON usage_logs(practice_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_review_id ON usage_logs(review_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_meta_json_gin ON usage_logs USING GIN (meta_json);
 
-- =========================================================
-- BILLING PLANS
-- Optional for v1, but useful if billing is added early
-- =========================================================
 
CREATE TABLE IF NOT EXISTS billing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(100) NOT NULL,
    billing_type billing_type NOT NULL,
    monthly_review_limit INTEGER,
    price_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'AUD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_billing_plans_plan_name UNIQUE (plan_name)
);
 
CREATE TRIGGER trg_billing_plans_updated_at
BEFORE UPDATE ON billing_plans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
 
-- =========================================================
-- PRACTICE SUBSCRIPTIONS
-- =========================================================
 
CREATE TABLE IF NOT EXISTS practice_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    billing_plan_id UUID NOT NULL REFERENCES billing_plans(id) ON DELETE RESTRICT,
    status subscription_status NOT NULL DEFAULT 'trial',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_practice_subscriptions_practice_id ON practice_subscriptions(practice_id);
CREATE INDEX IF NOT EXISTS idx_practice_subscriptions_billing_plan_id ON practice_subscriptions(billing_plan_id);
CREATE INDEX IF NOT EXISTS idx_practice_subscriptions_status ON practice_subscriptions(status);
 
CREATE TRIGGER trg_practice_subscriptions_updated_at
BEFORE UPDATE ON practice_subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
 
-- =========================================================
-- API AUDIT LOGS
-- For support/debugging/traceability
-- =========================================================
 
CREATE TABLE IF NOT EXISTS api_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_id VARCHAR(100),
    status_code INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_api_audit_logs_user_id ON api_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_audit_logs_review_id ON api_audit_logs(review_id);
CREATE INDEX IF NOT EXISTS idx_api_audit_logs_endpoint ON api_audit_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_audit_logs_created_at ON api_audit_logs(created_at DESC);
 
-- =========================================================
-- HELPFUL VIEW: MONTHLY USAGE BY PRACTICE
-- =========================================================
 
CREATE OR REPLACE VIEW vw_monthly_practice_usage AS
SELECT
    p.id AS practice_id,
    p.name AS practice_name,
    DATE_TRUNC('month', ul.created_at) AS usage_month,
    COUNT(*) AS total_actions,
    SUM(CASE WHEN ul.action_type = 'quick_review' THEN 1 ELSE 0 END) AS quick_reviews,
    SUM(CASE WHEN ul.action_type = 'full_review' THEN 1 ELSE 0 END) AS full_reviews,
    SUM(CASE WHEN ul.action_type = 'export_word' THEN 1 ELSE 0 END) AS exports,
    SUM(ul.billable_units) AS total_billable_units
FROM usage_logs ul
JOIN practices p ON p.id = ul.practice_id
GROUP BY p.id, p.name, DATE_TRUNC('month', ul.created_at);
 
-- =========================================================
-- HELPFUL VIEW: COMMON FAILURES PER PRACTICE
-- =========================================================
 
CREATE OR REPLACE VIEW vw_common_failures_by_practice AS
SELECT
    r.practice_id,
    rc.check_code,
    rc.label,
    rc.area,
    COUNT(*) AS fail_count
FROM review_checks rc
JOIN reviews r ON r.id = rc.review_id
WHERE rc.status = 'fail'
GROUP BY r.practice_id, rc.check_code, rc.label, rc.area;
 
-- =========================================================
-- OPTIONAL SEED DATA
-- =========================================================
 
-- INSERT INTO practices (name, billing_email)
-- VALUES ('Astute Business Partners', 'billing@abp.example');
 
-- INSERT INTO billing_plans (plan_name, billing_type, monthly_review_limit, price_amount)
-- VALUES ('Starter', 'monthly', 100, 0.00),
--        ('Growth', 'monthly', 1000, 299.00),
--        ('Per Review', 'per_review', NULL, 7.50);