-- Base Tables for Propoze.AI

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash TEXT,
    provider VARCHAR(20),   -- 'google' OR NULL
    provider_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK (
      (provider IS NULL AND password_hash IS NOT NULL) OR
      (provider IS NOT NULL AND provider_id IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Client Companies Table
CREATE TABLE IF NOT EXISTS client_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    summary TEXT,                        -- entered manually
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_companies_user ON client_companies(user_id);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_company_id UUID REFERENCES client_companies(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',   -- 'draft','in_progress','completed'
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- 4. AI Analysis Reports Table
CREATE TABLE IF NOT EXISTS ai_analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    analysis_json JSONB NOT NULL,      -- LLM output
    model VARCHAR(50) NOT NULL,        -- 'gpt-4o','claude-3',…
    prompt_tokens INT,
    completion_tokens INT,
    cost NUMERIC(10,4),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    current_version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Proposal Versions Table
CREATE TABLE IF NOT EXISTS proposal_versions (
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    version_number INT,
    content_json JSONB NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (proposal_id, version_number)
);

-- 7. Read-only Share Links Table
CREATE TABLE IF NOT EXISTS proposal_share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. updated_at auto-refresh function
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER touch_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_companies BEFORE UPDATE ON client_companies FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_projects BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_proposals BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION touch_updated_at(); 