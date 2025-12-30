-- Add INSERT policy for audit_logs table
-- Allows authenticated users to insert their own audit log entries

CREATE POLICY "Users can insert own audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Also allow service role to insert for any user (already works by default)
