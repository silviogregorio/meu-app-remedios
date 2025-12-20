-- 1. Add UNIQUE constraint to text to prevent duplicates during auto-feed
ALTER TABLE motivation_messages ADD CONSTRAINT unique_text_content UNIQUE (text);

-- 2. Update RPC to REMOVE the recycling fallback.
-- Now it returns nothing if all are seen, allowing the Frontend to trigger a "Refill".
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
        -- Return EMPTY (No rows)
        -- This signals the App to "Call the Generator/Refill"
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
