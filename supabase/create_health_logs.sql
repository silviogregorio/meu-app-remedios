-- Create health_logs table
DROP TABLE IF EXISTS public.health_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.health_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('pressure', 'glucose', 'weight', 'temperature', 'heart_rate', 'other')),
    value DECIMAL(10,2) NOT NULL,
    value_secondary DECIMAL(10,2), -- Used for Diastolic Pressure (e.g. 120/80 -> val=120, sec=80)
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- RLS Policies
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

-- Shared Access Logic using has_patient_access
CREATE POLICY "Users can view health logs (Owner & Shared)"
    ON public.health_logs
    FOR SELECT
    USING (public.has_patient_access(patient_id));

CREATE POLICY "Users can insert health logs (Owner & Shared)"
    ON public.health_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        AND public.has_patient_access(patient_id)
    );

CREATE POLICY "Users can update health logs (Owner & Shared)"
    ON public.health_logs
    FOR UPDATE
    USING (public.has_patient_access(patient_id));

CREATE POLICY "Users can delete health logs (Owner & Shared)"
    ON public.health_logs
    FOR DELETE
    USING (public.has_patient_access(patient_id));

-- Index for performance
CREATE INDEX IF NOT EXISTS health_logs_patient_id_idx ON public.health_logs(patient_id);
CREATE INDEX IF NOT EXISTS health_logs_measured_at_idx ON public.health_logs(measured_at);
