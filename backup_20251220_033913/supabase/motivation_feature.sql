-- 1. Create Table
CREATE TABLE IF NOT EXISTS motivation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    period TEXT CHECK (period IN ('morning', 'afternoon', 'night', 'any')),
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. RLS Policies
ALTER TABLE motivation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active messages"
    ON motivation_messages FOR SELECT
    USING (is_active = true);

-- 3. Seed Data (Initial Batch)
INSERT INTO motivation_messages (text, period, category) VALUES
-- MANHÃ (Morning)
('Bom dia! Que o dia de hoje traga novas forças e leve embora o que não serve mais.', 'morning', 'faith'),
('A cada manhã nascemos de novo. O que fazemos hoje é o que mais importa.', 'morning', 'motivation'),
('Comece o dia acreditando que tudo é possível. A fé move montanhas.', 'morning', 'faith'),
('Respire fundo. Agradeça por mais um dia de vida. Sua saúde é uma bênção.', 'morning', 'health'),
('Que a luz desta manhã ilumine seus caminhos e aqueça seu coração.', 'morning', 'inspiration'),
('Não se preocupe com o ontem. Hoje é uma nova oportunidade de fazer dar certo.', 'morning', 'motivation'),
('Tome seu remédio com gratidão. Ele é um instrumento de cura para o seu corpo.', 'morning', 'health'),
('A alegria do Senhor é a nossa força. Tenha um dia abençoado!', 'morning', 'faith'),
('Sorria para o dia e ele sorrirá de volta para você.', 'morning', 'inspiration'),
('Hoje é um presente, por isso se chama Presente. Aproveite cada momento.', 'morning', 'motivation'),
('Coragem! Você é mais forte do que imagina e capaz de vencer qualquer desafio.', 'morning', 'motivation'),
('Que seu café seja forte e sua fé seja mais forte ainda.', 'morning', 'faith'),
('Sua saúde é seu maior tesouro. Cuide dela com carinho hoje.', 'morning', 'health'),
('Paz na alma, amor no coração e gratidão pela vida. Bom dia!', 'morning', 'inspiration'),
('Cada novo amanhecer é um convite de Deus para recomeçarmos.', 'morning', 'faith'),

-- TARDE (Afternoon)
('Boa tarde! Continue firme. Você já venceu metade do dia.', 'afternoon', 'motivation'),
('Não desista. O cansaço é temporário, a satisfação de se cuidar é permanente.', 'afternoon', 'health'),
('Uma pausa para respirar é tão importante quanto seguir em frente.', 'afternoon', 'health'),
('Confie no tempo de Deus. Tudo acontece na hora certa.', 'afternoon', 'faith'),
('A tarde é o momento de colher os frutos da manhã e plantar novas sementes.', 'afternoon', 'inspiration'),
('Mantenha o foco na sua recuperação. Cada passo conta.', 'afternoon', 'health'),
('Que a paz de Deus envolva sua tarde e renove suas energias.', 'afternoon', 'faith'),
('Não deixe para amanhã a alegria que você pode sentir hoje.', 'afternoon', 'motivation'),
('Lembre-se de beber água. Seu corpo agradece!', 'afternoon', 'health'),
('A persistência é o caminho do êxito. Continue se cuidando.', 'afternoon', 'motivation'),
('Deus está no controle de todas as coisas. Descanse seu coração.', 'afternoon', 'faith'),
('Seja gentil com você mesmo. Você está fazendo o seu melhor.', 'afternoon', 'inspiration'),
('Pequenos progressos são grandes vitórias. Valorize cada um deles.', 'afternoon', 'motivation'),
('A tarde traz a serenidade de dever cumprido. Siga em frente.', 'afternoon', 'inspiration'),
('Sua saúde depende das suas escolhas de agora. Escolha o bem.', 'afternoon', 'health'),

-- NOITE (Night)
('Boa noite! Entregue suas preocupações a Deus e descanse em paz.', 'night', 'faith'),
('O descanso é parte fundamental da cura. Durma bem.', 'night', 'health'),
('Amanhã é um novo dia. Hoje você fez o seu melhor.', 'night', 'motivation'),
('Que os anjos zelem pelo seu sono e tragam sonhos de esperança.', 'night', 'faith'),
('Desligue os pensamentos, acalme o coração. A noite foi feita para recarregar.', 'night', 'health'),
('Gratidão pelo dia que passou, fé no dia que virá.', 'night', 'faith'),
('Seu corpo se cura enquanto você dorme. Permita-se descansar profundamente.', 'night', 'health'),
('A noite é o silêncio de Deus nos preparando para um novo espetáculo.', 'night', 'inspiration'),
('Tome seu remédio da noite e durma com a certeza de que está se cuidando.', 'night', 'health'),
('Nenhum mal dura para sempre. Confie que o amanhecer trará alegria.', 'night', 'faith'),
('Estrelas não podem brilhar sem escuridão. Tenha fé nos momentos difíceis.', 'night', 'motivation'),
('Que a paz inunde seu quarto e seu coração nesta noite.', 'night', 'faith'),
('Dormir bem é o melhor remédio. Relaxe e bonos sonhos.', 'night', 'health'),
('Obrigado, meu Deus, por mais um dia vencido com a Tua graça.', 'night', 'faith'),
('A cada noite, renovamos nossas esperanças. Até amanhã!', 'night', 'inspiration');
