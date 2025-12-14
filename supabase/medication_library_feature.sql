-- 1. Tabela de Biblioteca de Medicamentos
CREATE TABLE IF NOT EXISTS medication_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT, -- O que é?
    indications TEXT, -- Para que serve?
    warnings TEXT, -- Cuidados / Alertas (Campo de Segurança)
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('portuguese', name || ' ' || coalesce(description, ''))) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS medication_search_idx ON medication_library USING GIN (search_vector);

-- 2. Segurança (RLS)
ALTER TABLE medication_library ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um logado pode LER
CREATE POLICY "Public Read Access"
    ON medication_library FOR SELECT
    USING (auth.role() = 'authenticated');

-- Política: NINGUÉM pode escrever (exceto Admin via SQL direto)
-- Isso previne injeção de dados falsos por usuários mal intencionados.

-- 3. Seed Data (Top Medicamentos Brasil)
INSERT INTO medication_library (name, description, indications, warnings) VALUES
('Dipirona', 'Analgésico e antitérmico.', 'Dor e febre.', 'Contraindicado para quem tem alergia a dipirona. Cuidado com pressão baixa.'),
('Paracetamol', 'Analgésico e antitérmico.', 'Dores leves a moderadas e febre.', 'Em excesso pode causar danos graves ao fígado. Não misture com álcool.'),
('Ibuprofeno', 'Anti-inflamatório não esteroide (AINE).', 'Inflamação, dor, febre, cólicas.', 'Pode irritar o estômago. Evite se tiver gastrite ou úlcera.'),
('Omeprazol', 'Protetor gástrico.', 'Gastrite, úlcera, refluxo.', 'Use preferencialmente em jejum pela manhã. Não use por tempo prolongado sem orientação.'),
('Losartana', 'Anti-hipertensivo.', 'Controle da pressão alta (hipertensão).', 'Uso contínuo. Não interrompa sem ordem médica. Pode causar tontura no início.'),
('Simeticona', 'Antigases.', 'Alívio de gases e desconforto abdominal.', 'Geralmente seguro. Não indicado se houver suspeita de perfuração ou obstrução.'),
('Amoxicilina', 'Antibiótico.', 'Infecções bacterianas (garganta, ouvido, etc).', 'ATENÇÃO: Cumpra o horário exato. Se for alérgico a penicilina, NÃO USE.'),
('Nimesulida', 'Anti-inflamatório.', 'Dor aguda e inflamação.', 'Uso restrito e por curto período. Risco hepático se usado por muitos dias.'),
('Clonazepam', 'Ansiolítico (Tarja Preta).', 'Ansiedade, pânico, convulsões.', 'Causa sonolência e dependência. Nunca misture com álcool. Uso estritamente médico.'),
('Metformina', 'Antidiabético.', 'Controle do diabetes tipo 2.', 'Tome junto com as refeições para evitar enjoo. Cuidado com função renal.'),
('AAS (Aspirina)', 'Antiagregante / Analgésico.', 'Prevenção de infarto/AVC (dose baixa) ou dor.', 'Risco de sangramento. Não dê para crianças com febre (Síndrome de Reye).'),
('Domperidona', 'Antiemético.', 'Náuseas, vômitos, sensação de estômago cheio.', 'Cuidado com arritmias cardíacas. Respeite a dose máxima.'),
('Dorflex', 'Relaxante muscular e analgésico.', 'Dores musculares, tensão, dor de cabeça tensional.', 'Contém cafeína e dipirona. Cuidado se tiver alergia ou problemas de pressão.'),
('Neosaldina', 'Analgésico e relaxante.', 'Dores de cabeça e enxaqueca.', 'Contém dipirona e cafeína. Cuidado com hipertensos sensíveis.'),
('Torsilax', 'Relaxante muscular e anti-inflamatório potente.', 'Dores fortes nas costas, articulações, reumatismo.', 'Contém corticoide (uso prolongado faz mal). Irrita o estômago.'),
('Dramin', 'Antiemético e antivertiginoso.', 'Enjoo de viagem, labirintite.', 'Causa sonolência intensa. Não dirija após tomar.'),
('Buscopan', 'Antiespasmódico.', 'Cólicas abdominais, dores na barriga.', 'Versão Composta contém Dipirona (cuidado alérgicos).'),
('Rivotril', 'Ansiolítico (Marca do Clonazepam).', 'Ansiedade, distúrbios do sono, pânico.', 'Alto risco de dependência. Só use com receita retida.'),
('Pantoprazol', 'Inibidor de acidez.', 'Refluxo, gastrite, proteção estomacal.', 'Similar ao Omeprazol. Melhor tomado em jejum.'),
('Xarelto (Rivaroxabana)', 'Anticoagulante.', 'Prevenção de trombose e AVC.', 'Risco alto de hemorragia. Nunca falhe a dose e cuidado com ferimentos.');
