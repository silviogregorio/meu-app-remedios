-- Fix for Security Advisor Warning: Function Search Path Mutable
-- Description: Sets a fixed search_path to prevent malicious search_path hijacking.

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
