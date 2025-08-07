-- Advanced User Management Database Schema
-- Multi-tenant architecture with enhanced role system

-- Organizations table (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier
    domain VARCHAR(255), -- Custom domain (optional)
    business_id VARCHAR(50), -- IČO
    tax_id VARCHAR(50), -- DIČ
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    
    -- Subscription & billing
    subscription_plan VARCHAR(50) DEFAULT 'basic', -- basic, premium, enterprise
    subscription_status VARCHAR(30) DEFAULT 'active', -- active, suspended, cancelled
    subscription_expires_at TIMESTAMP,
    max_users INTEGER DEFAULT 10,
    max_vehicles INTEGER DEFAULT 50,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    
    -- Indexes
    CONSTRAINT organizations_slug_check CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    manager_id UUID, -- Will reference users(id)
    
    -- Budget and limits
    monthly_budget DECIMAL(12,2),
    vehicle_limit INTEGER,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(organization_id, name)
);

-- Enhanced roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Role hierarchy
    level INTEGER DEFAULT 1, -- 1=lowest, 10=highest
    parent_role_id UUID REFERENCES roles(id),
    
    -- Permissions
    permissions JSONB NOT NULL DEFAULT '{}',
    
    -- System roles cannot be deleted
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(organization_id, name)
);

-- Enhanced users table
CREATE TABLE IF NOT EXISTS users_advanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    
    -- Basic info
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal info
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    middle_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Employment info
    employee_number VARCHAR(50),
    job_title VARCHAR(255),
    hire_date DATE,
    termination_date DATE,
    salary DECIMAL(12,2),
    
    -- Manager hierarchy
    manager_id UUID REFERENCES users_advanced(id),
    
    -- Role and permissions
    role_id UUID NOT NULL REFERENCES roles(id),
    custom_permissions JSONB DEFAULT '{}',
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    
    -- Login tracking
    last_login_at TIMESTAMP,
    last_login_ip INET,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[],
    
    -- Preferences
    language VARCHAR(10) DEFAULT 'sk',
    timezone VARCHAR(100) DEFAULT 'Europe/Bratislava',
    theme VARCHAR(20) DEFAULT 'light',
    preferences JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(organization_id, username),
    UNIQUE(organization_id, email),
    UNIQUE(organization_id, employee_number)
);

-- Add foreign key for manager_id in departments
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
    FOREIGN KEY (manager_id) REFERENCES users_advanced(id);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_advanced(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    
    -- Session info
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location JSONB, -- Country, city, etc.
    
    -- Timing
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX(user_id),
    INDEX(token_hash),
    INDEX(expires_at)
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_advanced(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activity details
    action VARCHAR(100) NOT NULL, -- login, logout, create_rental, etc.
    resource_type VARCHAR(100), -- rental, vehicle, customer
    resource_id UUID,
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    method VARCHAR(10), -- GET, POST, PUT, DELETE
    endpoint TEXT,
    
    -- Data changes (for audit)
    old_values JSONB,
    new_values JSONB,
    
    -- Result
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Timing
    created_at TIMESTAMP DEFAULT NOW(),
    duration_ms INTEGER, -- Request duration
    
    -- Indexes for performance
    INDEX(user_id, created_at),
    INDEX(organization_id, created_at),
    INDEX(action, created_at),
    INDEX(resource_type, resource_id)
);

-- Team memberships (for project-based work)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_lead_id UUID REFERENCES users_advanced(id),
    
    -- Team settings
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(organization_id, name)
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users_advanced(id) ON DELETE CASCADE,
    
    -- Membership details
    role VARCHAR(100) DEFAULT 'member', -- member, lead, admin
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(team_id, user_id)
);

-- User permissions cache (for performance)
CREATE TABLE IF NOT EXISTS user_permissions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_advanced(id) ON DELETE CASCADE,
    
    -- Cached permissions
    permissions JSONB NOT NULL,
    
    -- Cache metadata
    computed_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    
    UNIQUE(user_id)
);

-- Notification preferences (enhanced)
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_advanced(id) ON DELETE CASCADE,
    
    -- Notification channels
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    
    -- Notification types
    rental_requests BOOLEAN DEFAULT TRUE,
    rental_approvals BOOLEAN DEFAULT TRUE,
    rental_reminders BOOLEAN DEFAULT TRUE,
    maintenance_alerts BOOLEAN DEFAULT TRUE,
    payment_reminders BOOLEAN DEFAULT TRUE,
    team_mentions BOOLEAN DEFAULT TRUE,
    system_updates BOOLEAN DEFAULT TRUE,
    
    -- Timing preferences
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    weekend_notifications BOOLEAN DEFAULT FALSE,
    
    -- Digest preferences
    daily_digest BOOLEAN DEFAULT FALSE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_advanced_organization_id ON users_advanced(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_advanced_department_id ON users_advanced(department_id);
CREATE INDEX IF NOT EXISTS idx_users_advanced_manager_id ON users_advanced(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_advanced_role_id ON users_advanced(role_id);
CREATE INDEX IF NOT EXISTS idx_users_advanced_email ON users_advanced(email);
CREATE INDEX IF NOT EXISTS idx_users_advanced_active ON users_advanced(is_active);
CREATE INDEX IF NOT EXISTS idx_users_advanced_last_login ON users_advanced(last_login_at);

CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);

CREATE INDEX IF NOT EXISTS idx_roles_organization_id ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_parent_id ON roles(parent_role_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Create default system roles for new organizations
CREATE OR REPLACE FUNCTION create_default_roles(org_id UUID) 
RETURNS VOID AS $$
BEGIN
    -- Super Admin (level 10)
    INSERT INTO roles (organization_id, name, display_name, description, level, permissions, is_system)
    VALUES (
        org_id, 
        'super_admin', 
        'Super Admin', 
        'Full system access with all permissions', 
        10,
        '{"*": {"actions": ["*"], "conditions": {}}}',
        TRUE
    );
    
    -- Admin (level 9)
    INSERT INTO roles (organization_id, name, display_name, description, level, permissions, is_system)
    VALUES (
        org_id,
        'admin',
        'Administrator', 
        'Full access to organization data and settings',
        9,
        '{
            "vehicles": {"actions": ["read", "create", "update", "delete"]},
            "rentals": {"actions": ["read", "create", "update", "delete"]},
            "customers": {"actions": ["read", "create", "update", "delete"]},
            "finances": {"actions": ["read", "create", "update", "delete"]},
            "users": {"actions": ["read", "create", "update"]},
            "companies": {"actions": ["read", "create", "update", "delete"]},
            "maintenance": {"actions": ["read", "create", "update", "delete"]},
            "protocols": {"actions": ["read", "create", "update", "delete"]},
            "expenses": {"actions": ["read", "create", "update", "delete"]},
            "insurances": {"actions": ["read", "create", "update", "delete"]}
        }',
        TRUE
    );
    
    -- Manager (level 7)
    INSERT INTO roles (organization_id, name, display_name, description, level, permissions, is_system)
    VALUES (
        org_id,
        'manager',
        'Manager',
        'Management access with approval permissions',
        7,
        '{
            "vehicles": {"actions": ["read", "create", "update"]},
            "rentals": {"actions": ["read", "create", "update", "delete"]},
            "customers": {"actions": ["read", "create", "update"]},
            "finances": {"actions": ["read", "create", "update"]},
            "users": {"actions": ["read"]},
            "companies": {"actions": ["read", "update"]},
            "maintenance": {"actions": ["read", "create", "update"]},
            "protocols": {"actions": ["read", "create", "update"]},
            "expenses": {"actions": ["read", "create", "update"]},
            "insurances": {"actions": ["read", "create", "update"]}
        }',
        TRUE
    );
    
    -- Employee (level 5)
    INSERT INTO roles (organization_id, name, display_name, description, level, permissions, is_system)
    VALUES (
        org_id,
        'employee',
        'Employee',
        'Standard employee access',
        5,
        '{
            "vehicles": {"actions": ["read"]},
            "rentals": {"actions": ["read", "create", "update"]},
            "customers": {"actions": ["read", "create", "update"]},
            "finances": {"actions": ["read"]},
            "protocols": {"actions": ["read", "create", "update"]},
            "expenses": {"actions": ["read", "create"]},
            "insurances": {"actions": ["read"]}
        }',
        TRUE
    );
    
    -- Sales Representative (level 4)
    INSERT INTO roles (organization_id, name, display_name, description, level, permissions, is_system)
    VALUES (
        org_id,
        'sales_rep',
        'Sales Representative',
        'Customer-focused role with rental management',
        4,
        '{
            "vehicles": {"actions": ["read"]},
            "rentals": {"actions": ["read", "create", "update"]},
            "customers": {"actions": ["read", "create", "update"]},
            "finances": {"actions": ["read"], "conditions": {"ownOnly": true}},
            "protocols": {"actions": ["read", "create"]}
        }',
        TRUE
    );
    
    -- Mechanic (level 3)
    INSERT INTO roles (organization_id, name, display_name, description, level, permissions, is_system)
    VALUES (
        org_id,
        'mechanic',
        'Mechanic',
        'Vehicle maintenance focused role',
        3,
        '{
            "vehicles": {"actions": ["read", "update"]},
            "maintenance": {"actions": ["read", "create", "update", "delete"]},
            "expenses": {"actions": ["read", "create"], "conditions": {"companyOnly": true}},
            "protocols": {"actions": ["read", "create"]}
        }',
        TRUE
    );
    
    -- Viewer (level 1)
    INSERT INTO roles (organization_id, name, display_name, description, level, permissions, is_system)
    VALUES (
        org_id,
        'viewer',
        'Viewer',
        'Read-only access to basic information',
        1,
        '{
            "vehicles": {"actions": ["read"]},
            "rentals": {"actions": ["read"]},
            "customers": {"actions": ["read"]},
            "protocols": {"actions": ["read"]}
        }',
        TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_advanced_updated_at BEFORE UPDATE ON users_advanced FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for easier querying
CREATE OR REPLACE VIEW user_details AS
SELECT 
    u.id,
    u.organization_id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.phone,
    u.job_title,
    u.employee_number,
    u.is_active,
    u.last_login_at,
    u.created_at,
    
    -- Organization info
    o.name as organization_name,
    o.slug as organization_slug,
    
    -- Department info
    d.name as department_name,
    
    -- Role info
    r.name as role_name,
    r.display_name as role_display_name,
    r.level as role_level,
    r.permissions as role_permissions,
    
    -- Manager info
    m.first_name as manager_first_name,
    m.last_name as manager_last_name,
    m.email as manager_email
    
FROM users_advanced u
JOIN organizations o ON u.organization_id = o.id
LEFT JOIN departments d ON u.department_id = d.id
JOIN roles r ON u.role_id = r.id
LEFT JOIN users_advanced m ON u.manager_id = m.id;

-- Create organization statistics view
CREATE OR REPLACE VIEW organization_stats AS
SELECT 
    o.id,
    o.name,
    o.subscription_plan,
    o.subscription_status,
    o.max_users,
    o.max_vehicles,
    
    -- User counts
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = TRUE) as active_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '30 days') as monthly_active_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.last_login_at >= NOW() - INTERVAL '7 days') as weekly_active_users,
    
    -- Department counts
    COUNT(DISTINCT d.id) as total_departments,
    
    -- Team counts
    COUNT(DISTINCT t.id) as total_teams
    
FROM organizations o
LEFT JOIN users_advanced u ON o.id = u.organization_id
LEFT JOIN departments d ON o.id = d.organization_id
LEFT JOIN teams t ON o.id = t.organization_id
GROUP BY o.id, o.name, o.subscription_plan, o.subscription_status, o.max_users, o.max_vehicles;
