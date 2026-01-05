-- Create Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'medication', 'health', 'usage'
    points INTEGER DEFAULT 10,
    criteria JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create User Achievements Table (Unlock history)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_code TEXT REFERENCES public.achievements(code) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, achievement_code)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for Achievements (Public read, Admin write)
CREATE POLICY "Achievements are viewable by everyone" 
ON public.achievements FOR SELECT 
USING (true);

-- Policies for User Achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Seed Initial Achievements (in Portuguese)
INSERT INTO public.achievements (code, title, description, icon, category, points, criteria)
VALUES 
    (
        'first_step', 
        'Primeiro Passo', 
        'Registre seu primeiro medicamento ou diário de saúde.', 
        'footsteps', 
        'general', 
        50,
        '{"type": "count", "target": 1, "action": "any_log"}'
    ),
    (
        'perfect_week', 
        'Semana Perfeita', 
        'Tome 100% dos seus medicamentos por 7 dias seguidos.', 
        'star', 
        'medication', 
        100,
        '{"type": "streak", "days": 7, "action": "medication_adherence", "threshold": 1.0}'
    ),
    (
        'month_warrior', 
        'Guerreiro Mensal', 
        'Use o aplicativo por 30 dias consecutivos.', 
        'shield', 
        'usage', 
        500,
        '{"type": "streak", "days": 30, "action": "app_usage"}'
    ),
    (
        'vigilante', 
        'Vigilante', 
        'Monitore sua pressão ou glicose por 7 dias seguidos.', 
        'activity', 
        'health', 
        150,
        '{"type": "streak", "days": 7, "action": "health_log"}'
    ),
    (
        'early_bird', 
        'Madrugador', 
        'Tome um medicamento antes das 8:00 da manhã.', 
        'sunrise', 
        'medication', 
        20,
        '{"type": "time", "before": "08:00"}'
    )
ON CONFLICT (code) DO UPDATE 
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    points = EXCLUDED.points,
    criteria = EXCLUDED.criteria;
