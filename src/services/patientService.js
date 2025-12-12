import { supabase } from '../lib/supabase';

export const PatientService = {
    transform: (p) => ({
        ...p,
        userId: p.user_id,
        birthDate: p.birth_date,
        sharedWith: p.patient_shares ? p.patient_shares.map(s => ({
            email: s.shared_with_email,
            permission: s.permission,
            status: s.accepted_at ? 'accepted' : 'pending'
        })) : []
    }),

    add: async (patientData, userId) => {
        const dbData = {
            user_id: userId,
            name: patientData.name,
            email: patientData.email,
            birth_date: patientData.birthDate,
            phone: patientData.phone,
            condition: patientData.condition,
            cep: patientData.cep,
            street: patientData.street,
            number: patientData.number,
            complement: patientData.complement,
            neighborhood: patientData.neighborhood,
            city: patientData.city,
            state: patientData.state,
            observations: patientData.observations
        };

        const { data, error } = await supabase
            .from('patients')
            .insert([dbData])
            .select();

        if (error) throw error;
        return PatientService.transform(data[0]);
    },

    update: async (id, updatedData) => {
        const dbData = {};
        if (updatedData.name) dbData.name = updatedData.name;
        if (updatedData.email !== undefined) dbData.email = updatedData.email;
        if (updatedData.birthDate) dbData.birth_date = updatedData.birthDate;
        if (updatedData.phone) dbData.phone = updatedData.phone;
        if (updatedData.condition) dbData.condition = updatedData.condition;
        if (updatedData.cep) dbData.cep = updatedData.cep;
        if (updatedData.street) dbData.street = updatedData.street;
        if (updatedData.number) dbData.number = updatedData.number;
        if (updatedData.complement) dbData.complement = updatedData.complement;
        if (updatedData.neighborhood) dbData.neighborhood = updatedData.neighborhood;
        if (updatedData.city) dbData.city = updatedData.city;
        if (updatedData.state) dbData.state = updatedData.state;
        if (updatedData.observations) dbData.observations = updatedData.observations;

        const { data, error } = await supabase
            .from('patients')
            .update(dbData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return PatientService.transform(data[0]);
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
