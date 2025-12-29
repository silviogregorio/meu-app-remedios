-- Create stock_history table
-- RESET: Drop table first to ensure schema is updated (dev phase)
DROP TABLE IF EXISTS public.stock_history CASCADE;

CREATE TABLE IF NOT EXISTS public.stock_history (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL, -- Nullable (e.g. for Refills/Adjustments)
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    quantity_change DECIMAL(10,2) NOT NULL, -- Negative for consumption, positive for refill
    previous_balance DECIMAL(10,2), -- Snapshot before change
    new_balance DECIMAL(10,2),      -- Snapshot after change
    reason TEXT NOT NULL,           -- 'consumption', 'refill', 'adjustment', 'correction'
    notes TEXT
);

-- RLS Policies
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert stock history (Owner & Shared)"
    ON public.stock_history
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND (
            -- Allow if user has access to the linked patient (Owner or Shared)
            (patient_id IS NOT NULL AND public.has_patient_access(patient_id))
            OR
            -- Fallback: If patient_id is NULL (e.g. Refill), check if I have access to ANY patient using this medication
            (patient_id IS NULL AND EXISTS (
                SELECT 1 FROM public.prescriptions p
                WHERE p.medication_id = stock_history.medication_id
                AND public.has_patient_access(p.patient_id)
            ))
        )
    );

CREATE POLICY "Users can view stock history (Owner & Shared)"
    ON public.stock_history
    FOR SELECT
    USING (
        -- Simple check: Do I have access to this patient?
        (patient_id IS NOT NULL AND public.has_patient_access(patient_id))
        OR
        -- Fallback: Check prescriptions
        (patient_id IS NULL AND EXISTS (
            SELECT 1 FROM public.prescriptions p
            WHERE p.medication_id = stock_history.medication_id
            AND public.has_patient_access(p.patient_id)
        ))
    );

-- Add simple index for performance
CREATE INDEX IF NOT EXISTS stock_history_medication_id_idx ON public.stock_history(medication_id);
