-- Create table to track sent alerts
CREATE TABLE IF NOT EXISTS public.alert_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    alert_date DATE NOT NULL,
    alert_time TIME NOT NULL, -- Scheduled time of the dose
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    sent_to TEXT[] -- Array of emails sent to
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS alert_logs_lookup_idx ON public.alert_logs(prescription_id, alert_date, alert_time);

-- Enable RLS (System only, basically)
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

-- Allow read for debugging, but mostly this is backend
CREATE POLICY "Users can view alerts for their patients"
    ON public.alert_logs
    FOR SELECT
    USING (public.has_patient_access(patient_id));
