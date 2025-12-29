-- =====================================================
-- AUDIT LOGS TABLE
-- Tracks all significant user actions for security monitoring
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Who did it
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    
    -- What happened
    action TEXT NOT NULL,  -- 'login', 'logout', 'create_patient', 'delete_prescription', 'share_patient', 'export_data', 'failed_login', etc.
    resource_type TEXT,    -- 'patient', 'prescription', 'medication', 'health_log', etc.
    resource_id UUID,      -- ID of the affected resource
    
    -- Context
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,        -- Additional context (e.g., { "patient_name": "João", "shared_with": "maria@example.com" })
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_suspicious ON audit_logs(is_suspicious) WHERE is_suspicious = TRUE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk ON audit_logs(risk_level) WHERE risk_level IN ('high', 'critical');

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only system (service role) can insert audit logs
-- No policy needed - defaults to deny for regular users, allow for service role

-- Example usage:
-- INSERT INTO audit_logs (user_id, user_email, action, resource_type, resource_id, ip_address, metadata)
-- VALUES (
--   auth.uid(),
--   'user@example.com',
--   'delete_prescription',
--   'prescription',
--   '123e4567-e89b-12d3-a456-426614174000',
--   '192.168.1.1',
--   '{"prescription_name": "Enalapril 10mg", "patient_name": "João Silva"}'::jsonb
-- );

-- =====================================================
-- SECURITY VIEWS
-- =====================================================

-- View for suspicious activities (for admin monitoring)
CREATE OR REPLACE VIEW suspicious_activities AS
SELECT 
    al.*,
    COUNT(*) OVER (PARTITION BY user_id, DATE(created_at)) as daily_action_count,
    COUNT(*) OVER (PARTITION BY ip_address, DATE(created_at)) as daily_ip_count
FROM audit_logs al
WHERE is_suspicious = TRUE 
   OR risk_level IN ('high', 'critical')
   OR action IN ('failed_login', 'unauthorized_access', 'data_export')
ORDER BY created_at DESC;

-- Grant access to authenticated users for their own logs
GRANT SELECT ON suspicious_activities TO authenticated;

COMMENT ON TABLE audit_logs IS 'Security audit log tracking all significant user actions';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (login, create, delete, share, etc.)';
COMMENT ON COLUMN audit_logs.is_suspicious IS 'Flag for potentially suspicious activity requiring review';
COMMENT ON COLUMN audit_logs.risk_level IS 'Severity level: low, medium, high, critical';
