import { supabase } from '../lib/supabase';

export const SpecialtyService = {
    fetchAll: async () => {
        const { data, error } = await supabase
            .from('medical_specialties')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }
};
