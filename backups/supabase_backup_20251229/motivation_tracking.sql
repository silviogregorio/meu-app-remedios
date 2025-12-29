-- 1. Create table to track seen messages
CREATE TABLE IF NOT EXISTS user_seen_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES motivation_messages(id) ON DELETE CASCADE,
    seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, message_id)
);

-- 2. RLS
ALTER TABLE user_seen_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own seen logs"
    ON user_seen_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own seen logs"
    ON user_seen_messages FOR SELECT
    USING (auth.uid() = user_id);


-- 3. Function to get a random UNSEEN message for a specific period
-- This runs on the server side to be efficient and secure
CREATE OR REPLACE FUNCTION get_daily_motivation(p_period TEXT)
RETURNS SETOF motivation_messages AS $$
DECLARE
    v_user_id UUID;
    v_count INT;
BEGIN
    v_user_id := auth.uid();
    
    -- Check if we have unseen messages for this period
    SELECT COUNT(*) INTO v_count
    FROM motivation_messages m
    WHERE (m.period = p_period OR m.period = 'any')
    AND m.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM user_seen_messages s 
        WHERE s.message_id = m.id 
        AND s.user_id = v_user_id
    );

    -- If we have unseen messages, return one random unseen
    IF v_count > 0 THEN
        RETURN QUERY
        SELECT *
        FROM motivation_messages m
        WHERE (m.period = p_period OR m.period = 'any')
        AND m.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_seen_messages s 
            WHERE s.message_id = m.id 
            AND s.user_id = v_user_id
        )
        ORDER BY random()
        LIMIT 1;
    ELSE
        -- FALLBACK: If user saw EVERYTHING, return the ONE watched longest ago (Recycling)
        -- This technically violates "never twice", but ensures "never empty".
        -- To truly fix "never twice", we simply need infinite content.
        -- This logic ensures the app doesn't crash/blank.
        RETURN QUERY
        SELECT m.*
        FROM motivation_messages m
        JOIN user_seen_messages s ON s.message_id = m.id
        WHERE s.user_id = v_user_id
        AND (m.period = p_period OR m.period = 'any')
        ORDER BY s.seen_at ASC -- Oldest seen first
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
