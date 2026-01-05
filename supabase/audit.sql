-- Create table for Access Logs
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'VIEW', 'EDIT', 'DELETE', 'EXPORT'
    resource TEXT NOT NULL, -- 'DIARY', 'MEDICATIONS', 'PROFILE'
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Owner can VIEW their own logs (See who accessed their data)
CREATE POLICY "Owners can view logs of their data"
ON access_logs FOR SELECT
USING (auth.uid() = owner_id);

-- 2. Anyone can INSERT a log (System triggers this when User A accesses User B's data)
-- Use a check to ensure 'accessed_by' matches the authenticated user to preventing spoofing used by the service
CREATE POLICY "Authenticated users can insert logs"
ON access_logs FOR INSERT
WITH CHECK (auth.uid() = accessed_by);

-- 3. No one can UPDATE or DELETE logs (Immutable Audit Trail)
-- (No policies created for UPDATE/DELETE implies they are forbidden by default)

-- Indexes for performance
CREATE INDEX idx_access_logs_owner_id ON access_logs(owner_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);
