-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    sender_email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb, -- Armazena JSON com idade, telefone, shares
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can INSERT their own messages
CREATE POLICY "Users can insert own support messages" 
ON support_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can VIEW ALL messages
-- Lista de emails de admin permitidos
CREATE POLICY "Admins can view all support messages" 
ON support_messages FOR SELECT 
USING (
    auth.jwt() ->> 'email' IN ('sigsis@gmail.com', 'sigremedios@gmail.com', 'silviogregorio@gmail.com')
);

-- Policy: Admins can UPDATE messages (para dar baixa)
CREATE POLICY "Admins can update support messages" 
ON support_messages FOR UPDATE
USING (
    auth.jwt() ->> 'email' IN ('sigsis@gmail.com', 'sigremedios@gmail.com', 'silviogregorio@gmail.com')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);
