-- ===============================================
-- Medical Specialties & Areas of Expertise Table
-- ===============================================
CREATE TABLE IF NOT EXISTS public.medical_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'Especialidade', -- 'Especialidade' or 'Área de Atuação'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Comprehensive List (Resolução CFM nº 2.380/2024)
INSERT INTO public.medical_specialties (name, category) VALUES 
-- 55 Especialidades
('Acupuntura', 'Especialidade'), ('Alergia e Imunologia', 'Especialidade'), ('Anestesiologia', 'Especialidade'), 
('Angiologia', 'Especialidade'), ('Cardiologia', 'Especialidade'), ('Cirurgia Cardiovascular', 'Especialidade'), 
('Cirurgia da Mão', 'Especialidade'), ('Cirurgia de Cabeça e Pescoço', 'Especialidade'), ('Cirurgia do Aparelho Digestivo', 'Especialidade'), 
('Cirurgia Geral', 'Especialidade'), ('Cirurgia Oncológica', 'Especialidade'), ('Cirurgia Pediátrica', 'Especialidade'), 
('Cirurgia Plástica', 'Especialidade'), ('Cirurgia Torácica', 'Especialidade'), ('Cirurgia Vascular', 'Especialidade'), 
('Clínica Médica', 'Especialidade'), ('Coloproctologia', 'Especialidade'), ('Dermatologia', 'Especialidade'), 
('Endocrinologia e Metabologia', 'Especialidade'), ('Endoscopia', 'Especialidade'), ('Gastroenterologia', 'Especialidade'), 
('Genética Médica', 'Especialidade'), ('Geriatria', 'Especialidade'), ('Ginecologia e Obstetrícia', 'Especialidade'), 
('Hematologia e Hemoterapia', 'Especialidade'), ('Homeopatia', 'Especialidade'), ('Infectologia', 'Especialidade'), 
('Mastologia', 'Especialidade'), ('Medicina de Emergência', 'Especialidade'), ('Medicina de Família e Comunidade', 'Especialidade'), 
('Medicina do Trabalho', 'Especialidade'), ('Medicina de Tráfego', 'Especialidade'), ('Medicina Esportiva', 'Especialidade'), 
('Medicina Física e Reabilitação', 'Especialidade'), ('Medicina Intensiva', 'Especialidade'), ('Medicina Legal e Perícia Médica', 'Especialidade'), 
('Medicina Nuclear', 'Especialidade'), ('Medicina Preventiva e Social', 'Especialidade'), ('Nefrologia', 'Especialidade'), 
('Neurocirurgia', 'Especialidade'), ('Neurologia', 'Especialidade'), ('Nutrologia', 'Especialidade'), 
('Oftalmologia', 'Especialidade'), ('Oncologia Clínica', 'Especialidade'), ('Ortopedia e Traumatologia', 'Especialidade'), 
('Otorrinolaringologia', 'Especialidade'), ('Patologia', 'Especialidade'), ('Patologia Clínica/Medicina Laboratorial', 'Especialidade'), 
('Pediatria', 'Especialidade'), ('Pneumologia', 'Especialidade'), ('Psiquiatria', 'Especialidade'), 
('Radiologia e Diagnóstico por Imagem', 'Especialidade'), ('Radioterapia', 'Especialidade'), ('Reumatologia', 'Especialidade'), 
('Urologia', 'Especialidade'),

-- 62 Áreas de Atuação
('Administração em Saúde', 'Área de Atuação'), ('Alergia e Imunologia Pediátrica', 'Área de Atuação'), ('Angiorradiologia e Cirurgia Endovascular', 'Área de Atuação'), 
('Atendimento ao Queimado', 'Área de Atuação'), ('Auditoria Médica', 'Área de Atuação'), ('Cardiologia Pediátrica', 'Área de Atuação'), 
('Cirurgia Bariátrica', 'Área de Atuação'), ('Cirurgia Crânio-Maxilo-Facial', 'Área de Atuação'), ('Cirurgia do Trauma', 'Área de Atuação'), 
('Cirurgia Espinhal', 'Área de Atuação'), ('Cirurgia Videolaparoscópica', 'Área de Atuação'), ('Citopatologia', 'Área de Atuação'), 
('Densitometria Óssea', 'Área de Atuação'), ('Dor', 'Área de Atuação'), ('Ecocardiografia', 'Área de Atuação'), 
('Ecografia Vascular com Doppler', 'Área de Atuação'), ('Eletrofisiologia Clínica Invasiva', 'Área de Atuação'), ('Endocrinologia Pediátrica', 'Área de Atuação'), 
('Endoscopia Digestiva', 'Área de Atuação'), ('Endoscopia Ginecológica', 'Área de Atuação'), ('Endoscopia Respiratória', 'Área de Atuação'), 
('Ergometria', 'Área de Atuação'), ('Estimulação Cardíaca Eletrônica Implantável', 'Área de Atuação'), ('Foniatria', 'Área de Atuação'), 
('Gastroenterologia Pediátrica', 'Área de Atuação'), ('Hansenologia', 'Área de Atuação'), ('Hematologia e Hemoterapia Pediátrica', 'Área de Atuação'), 
('Hemodinâmica e Cardiologia Intervencionista', 'Área de Atuação'), ('Hepatologia', 'Área de Atuação'), ('Infectologia Pediátrica', 'Área de Atuação'), 
('Mamografia', 'Área de Atuação'), ('Medicina Aeroespacial', 'Área de Atuação'), ('Medicina do Adolescente', 'Área de Atuação'), 
('Medicina do Sono', 'Área de Atuação'), ('Medicina Fetal', 'Área de Atuação'), ('Medicina Intensiva Pediátrica', 'Área de Atuação'), 
('Medicina Paliativa', 'Área de Atuação'), ('Medicina Tropical', 'Área de Atuação'), ('Nefrologia Pediátrica', 'Área de Atuação'), 
('Neonatologia', 'Área de Atuação'), ('Neurofisiologia Clínica', 'Área de Atuação'), ('Neurologia Pediátrica', 'Área de Atuação'), 
('Neurorradiologia', 'Área de Atuação'), ('Nutrologia Pediátrica', 'Área de Atuação'), ('Nutrição Parenteral e Enteral', 'Área de Atuação'), 
('Oncogenética', 'Área de Atuação'), ('Oncologia Pediátrica', 'Área de Atuação'), ('Patologia do Trato Genital Inferior e Colposcopia', 'Área de Atuação'), 
('Pneumologia Pediátrica', 'Área de Atuação'), ('Psicogeriatria', 'Área de Atuação'), ('Psicoterapia', 'Área de Atuação'), 
('Psiquiatria da Infância e da Adolescência', 'Área de Atuação'), ('Psiquiatria Forense', 'Área de Atuação'), ('Radiologia Intervencionista e Angiorradiologia', 'Área de Atuação'), 
('Reprodução Assistida', 'Área de Atuação'), ('Reumatologia Pediátrica', 'Área de Atuação'), ('Sexologia', 'Área de Atuação'), 
('Toxicologia Médica', 'Área de Atuação'), ('Transplante de Medula Óssea', 'Área de Atuação'), ('Ultrassonografia em Ginecologia e Obstetrícia', 'Área de Atuação'), 
('Ultrassonografia Geral', 'Área de Atuação'), ('Videocirurgia', 'Área de Atuação')

ON CONFLICT (name) DO NOTHING;

-- Enable RLS for Specialties
ALTER TABLE public.medical_specialties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Specialties" ON public.medical_specialties;
CREATE POLICY "Public Read Specialties" ON public.medical_specialties FOR SELECT TO authenticated USING (true);

-- ===============================================
-- Medical Appointments Table REFINEMENT
-- ===============================================

CREATE TABLE IF NOT EXISTS public.medical_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_name TEXT,
    specialty_id UUID REFERENCES public.medical_specialties(id) ON DELETE SET NULL,
    specialty_text TEXT, 
    appointment_date TIMESTAMPTZ NOT NULL,
    location_name TEXT, -- Nome do Local
    address TEXT, -- Endereço
    contact_phone TEXT, -- Telefone de Contato
    whatsapp_phone TEXT, -- Telefone ZAP
    notes TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_appointments ENABLE ROW LEVEL SECURITY;

-- Helper Function for Edit Access
CREATE OR REPLACE FUNCTION public.can_manage_patient_data(target_patient_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        exists (
            select 1 from public.patients 
            where id = target_patient_id and user_id = auth.uid()
        )
        OR
        exists (
            select 1 from public.patient_shares
            where patient_id = target_patient_id
            and lower(shared_with_email) = lower(auth.jwt() ->> 'email')
            and status = 'accepted'
            and permission = 'edit'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security Policies
DROP POLICY IF EXISTS "View appointments" ON public.medical_appointments;
DROP POLICY IF EXISTS "Insert appointments" ON public.medical_appointments;
DROP POLICY IF EXISTS "Manage appointments" ON public.medical_appointments;

CREATE POLICY "View appointments" ON public.medical_appointments
    FOR SELECT USING (public.has_patient_access(patient_id));

CREATE POLICY "Insert appointments" ON public.medical_appointments
    FOR INSERT WITH CHECK (public.can_manage_patient_data(patient_id));

CREATE POLICY "Manage appointments" ON public.medical_appointments
    FOR ALL USING (public.can_manage_patient_data(patient_id));

-- Trigger for updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_appointments') THEN
            CREATE TRIGGER set_updated_at_appointments
            BEFORE UPDATE ON public.medical_appointments
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
        END IF;
    END IF;
END $$;
