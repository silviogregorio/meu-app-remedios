import { supabase } from '../lib/supabase';

/**
 * Busca um patrocinador para o usuário baseado na cidade (IBGE).
 * Prioridade:
 * 1. Patrocinador Exclusivo/Rotativo da cidade (ibge_code match)
 * 2. Patrocinador Global (ibge_code is null) - Opcional, por enquanto não temos.
 * 
 * Retorna o objeto sponsor ou null.
 */
export const fetchSponsorForUser = async (ibgeCode) => {
    try {
        let query = supabase
            .from('sponsors')
            .select('*')
            .eq('active', true);

        if (ibgeCode) {
            // Tenta buscar específico da cidade
            // Como pode ter multiplos (modelo rotativo), pegamos um aleatório ou o último criado
            // Para "aleatório" no SQL puro é chato, vamos pegar todos da cidade e sortear no front por enquanto (assumindo poucos)
            query = query.eq('ibge_code', ibgeCode);
        } else {
            // Se não tem IBGE, não mostra nada ou mostra global?
            // Por enquanto, retorna vazio se não tiver cidade definida no perfil
            return null;
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching sponsor:', error);
            return null;
        }

        if (data && data.length > 0) {
            // Sorteia um se tiver mais de um (Rotativo)
            const randomIndex = Math.floor(Math.random() * data.length);
            return data[randomIndex];
        }

        return null; // Nada encontrado para essa cidade
    } catch (err) {
        console.error('Sponsor fetch error:', err);
        return null;
    }
};
