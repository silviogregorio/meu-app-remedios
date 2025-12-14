import { supabase } from '../lib/supabase';

export const MedicationService = {
    transform: (m) => ({
        ...m,
        userId: m.user_id
    }),

    add: async (medicationData, userId) => {
        const dbData = {
            user_id: userId,
            name: medicationData.name,
            dosage: medicationData.dosage,
            type: medicationData.type,
            quantity: parseFloat(medicationData.quantity) || 0,
            color: medicationData.color,
            shape: medicationData.shape
        };

        const { data, error } = await supabase
            .from('medications')
            .insert([dbData])
            .select();

        if (error) throw error;
        const newMed = MedicationService.transform(data[0]);

        // Log Stock History
        if (newMed.quantity > 0) {
            await supabase.from('stock_history').insert([{
                user_id: userId,
                medication_id: newMed.id,
                quantity_change: newMed.quantity,
                previous_balance: 0,
                new_balance: newMed.quantity,
                reason: 'refill',
                notes: 'Cadastro inicial'
            }]);
        }

        return newMed;
    },

    update: async (id, updatedData, userId, oldMedication) => {
        const dbData = {};
        if (updatedData.name) dbData.name = updatedData.name;
        if (updatedData.dosage) dbData.dosage = updatedData.dosage;
        if (updatedData.type) dbData.type = updatedData.type;
        if (updatedData.quantity !== undefined) dbData.quantity = parseFloat(updatedData.quantity);
        if (updatedData.color) dbData.color = updatedData.color;
        if (updatedData.shape) dbData.shape = updatedData.shape;

        const { data, error } = await supabase
            .from('medications')
            .update(dbData)
            .eq('id', id)
            .select();

        if (error) throw error;
        const updatedMed = MedicationService.transform(data[0]);

        // Stock History Logic
        if (oldMedication && updatedData.quantity !== undefined) {
            const oldQty = parseFloat(oldMedication.quantity);
            const newQty = parseFloat(updatedData.quantity);

            if (oldQty !== newQty) {
                const diff = newQty - oldQty;
                await supabase.from('stock_history').insert([{
                    user_id: userId,
                    medication_id: id,
                    quantity_change: diff,
                    previous_balance: oldQty,
                    new_balance: newQty,
                    reason: 'adjustment',
                    notes: 'Ajuste manual de estoque'
                }]);
            }
        }

        return updatedMed;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('medications')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
