-- Create symptom_logs table
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL, -- Optional, links to a specific patient profile
    symptom TEXT NOT NULL, -- e.g. 'Dor de Cabeça', 'Enjoo'
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5), -- 1 (Leve) to 5 (Insuportável)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Insert: Users can only insert rows for themselves
CREATE POLICY "Users can insert own symptoms"
ON public.symptom_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Select: Users can view their own symptoms
CREATE POLICY "Users can view own symptoms"
ON public.symptom_logs
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Delete: Users can delete their own symptoms
CREATE POLICY "Users can delete own symptoms"
ON public.symptom_logs
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Update: Users can update their own symptoms
CREATE POLICY "Users can update own symptoms"
ON public.symptom_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.symptom_logs TO authenticated;
GRANT ALL ON public.symptom_logs TO service_role;
