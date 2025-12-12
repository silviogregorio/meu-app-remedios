import { supabase } from '../lib/supabase';

export const PrescriptionService = {
    transform: (p) => ({
        ...p,
        userId: p.user_id,
        patientId: p.patient_id,
        medicationId: p.medication_id,
        startDate: p.start_date,
        endDate: p.end_date,
        times: Array.isArray(p.times) ? p.times : (typeof p.times === 'string' ? JSON.parse(p.times) : []),
        doseAmount: p.dose_amount || 1
    }),

    add: async (prescriptionData, userId) => {
        const dbData = {
            user_id: userId,
            patient_id: prescriptionData.patientId,
            medication_id: prescriptionData.medicationId,
            frequency: prescriptionData.frequency,
            start_date: prescriptionData.startDate,
            end_date: prescriptionData.endDate,
            times: prescriptionData.times,
            instructions: prescriptionData.instructions,
            dose_amount: prescriptionData.doseAmount
        };

        const { data, error } = await supabase
            .from('prescriptions')
            .insert([dbData])
            .select();

        if (error) throw error;
        return PrescriptionService.transform(data[0]);
    },

    update: async (id, updatedData) => {
        const dbData = {};
        if (updatedData.patientId) dbData.patient_id = updatedData.patientId;
        if (updatedData.medicationId) dbData.medication_id = updatedData.medicationId;
        if (updatedData.frequency) dbData.frequency = updatedData.frequency;
        if (updatedData.startDate) dbData.start_date = updatedData.startDate;
        if (updatedData.endDate) dbData.end_date = updatedData.endDate;
        if (updatedData.times) dbData.times = updatedData.times;
        if (updatedData.instructions) dbData.instructions = updatedData.instructions;
        if (updatedData.doseAmount) dbData.dose_amount = updatedData.doseAmount;

        const { data, error } = await supabase
            .from('prescriptions')
            .update(dbData)
            .eq('id', id)
            .select();

        if (error) throw error;
        return PrescriptionService.transform(data[0]);
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('prescriptions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
