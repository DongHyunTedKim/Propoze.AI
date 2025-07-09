-- RBAC (Role-Based Access Control) Tables

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
    ('admin', '시스템 관리자 - 모든 권한'),
    ('user', '일반 사용자 - 기본 권한'),
    ('premium', '프리미엄 사용자 - 확장 기능 접근')
ON CONFLICT (name) DO NOTHING;

-- 2. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(resource, action)
);

-- Insert default permissions
INSERT INTO permissions (resource, action, description) VALUES 
    ('proposal', 'create', '제안서 생성'),
    ('proposal', 'read', '제안서 조회'),
    ('proposal', 'update', '제안서 수정'),
    ('proposal', 'delete', '제안서 삭제'),
    ('proposal', 'export', '제안서 내보내기'),
    ('ai_analysis', 'create', 'AI 분석 요청'),
    ('ai_analysis', 'read', 'AI 분석 결과 조회'),
    ('workspace', 'manage', '워크스페이스 관리'),
    ('user', 'manage', '사용자 관리'),
    ('billing', 'manage', '결제 관리')
ON CONFLICT (resource, action) DO NOTHING;

-- 3. Role-Permission Mapping Table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- 4. User-Role Mapping Table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    workspace_id UUID DEFAULT '00000000-0000-0000-0000-000000000000'::uuid, -- Default workspace for global roles
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, role_id, workspace_id),
    -- Unique constraint to prevent duplicate role assignments
    UNIQUE(user_id, role_id, workspace_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_workspace_id ON user_roles(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Add triggers for updated_at (only for new tables)
DROP TRIGGER IF EXISTS touch_roles ON roles;
CREATE TRIGGER touch_roles BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS touch_permissions ON permissions;
CREATE TRIGGER touch_permissions BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS touch_user_roles ON user_roles;
CREATE TRIGGER touch_user_roles BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Setup default role permissions
DO $$
DECLARE
    admin_role_id UUID;
    user_role_id UUID;
    premium_role_id UUID;
    permission_rec RECORD;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO user_role_id FROM roles WHERE name = 'user';
    SELECT id INTO premium_role_id FROM roles WHERE name = 'premium';
    
    -- Admin gets all permissions
    FOR permission_rec IN SELECT id FROM permissions
    LOOP
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (admin_role_id, permission_rec.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- User gets basic permissions
    FOR permission_rec IN SELECT id FROM permissions 
    WHERE (resource = 'proposal' AND action IN ('create', 'read', 'update'))
       OR (resource = 'ai_analysis' AND action IN ('create', 'read'))
    LOOP
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (user_role_id, permission_rec.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Premium gets user permissions plus export
    FOR permission_rec IN SELECT id FROM permissions 
    WHERE (resource = 'proposal' AND action IN ('create', 'read', 'update', 'export'))
       OR (resource = 'ai_analysis' AND action IN ('create', 'read'))
    LOOP
        INSERT INTO role_permissions (role_id, permission_id) 
        VALUES (premium_role_id, permission_rec.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- Function to check user permission
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR,
    p_workspace_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
          AND p.resource = p_resource
          AND p.action = p_action
          AND (p_workspace_id IS NULL OR ur.workspace_id = p_workspace_id OR ur.workspace_id IS NULL)
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can manage roles and permissions
CREATE POLICY "Admins can manage roles" ON roles
    FOR ALL USING (has_permission(auth.uid(), 'user', 'manage'));

CREATE POLICY "Admins can manage permissions" ON permissions
    FOR ALL USING (has_permission(auth.uid(), 'user', 'manage'));

CREATE POLICY "Admins can manage role_permissions" ON role_permissions
    FOR ALL USING (has_permission(auth.uid(), 'user', 'manage'));

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all user roles
CREATE POLICY "Admins can manage user_roles" ON user_roles
    FOR ALL USING (has_permission(auth.uid(), 'user', 'manage')); 