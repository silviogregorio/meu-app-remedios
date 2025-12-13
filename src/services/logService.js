import { supabase } from '../lib/supabase';

export const LogService = {
    transform: (l) => ({
        ...l,
        prescriptionId: l.prescription_id,
        scheduledTime: l.scheduled_time,
        takenAt: l.taken_at,
        takenBy: l.taken_by,
        takenByName: l.profiles?.full_name
    }),

    // Consumption Logs
    addConsumption: async (logData, userId, prescription, medication) => {
        // 1. Register Consumption
        const dbData = {
            prescription_id: logData.prescriptionId,
            date: logData.date,
            scheduled_time: logData.scheduledTime,
            taken_at: new Date().toISOString(),
            status: 'taken',
            taken_by: userId
        };

        const { data, error } = await supabase
            .from('consumption_log')
            .insert([dbData])
            .select('*, profiles:taken_by(full_name)');

        if (error) throw error;
        const newLog = LogService.transform(data[0]);
        let updatedMedication = null;

        // 2. Decrement Stock
        if (prescription && medication && medication.quantity > 0) {
            const dose = parseFloat(prescription.doseAmount) || 1;
            const newQuantity = (parseFloat(medication.quantity) || 0) - dose;

            // Update Med
            await supabase
                .from('medications')
                .update({ quantity: newQuantity })
                .eq('id', medication.id);

            // Log Stock History
            await supabase.from('stock_history').insert([{
                user_id: userId,
                patient_id: prescription.patientId,
                medication_id: medication.id,
                quantity_change: -dose,
                previous_balance: parseFloat(medication.quantity),
                new_balance: newQuantity,
                reason: 'consumption',
                notes: `Dose tomada: ${prescription.doseAmount || '1'}`
            }]);

            updatedMedication = { ...medication, quantity: newQuantity };
        }

        return { newLog, updatedMedication };
    },

    removeConsumption: async (prescriptionId, scheduledTime, date, prescription, medication) => {
        // 1. Remove consumption
        const { error } = await supabase
            .from('consumption_log')
            .delete()
            .match({
                prescription_id: prescriptionId,
                scheduled_time: scheduledTime,
                date: date
            });

        if (error) throw error;

        let updatedMedication = null;

        // 2. Increment Stock (Refund)
        // Note: This matches the "undo" logic in AppContext
        if (prescription && medication) {
            const dose = parseFloat(prescription.doseAmount) || 1;
            const newQuantity = (parseFloat(medication.quantity) || 0) + dose;

            await supabase
                .from('medications')
                .update({ quantity: newQuantity })
                .eq('id', medication.id);

            // Strictly speaking, we might want to log this refund in history too, 
            // but the original code didn't explicitely log an 'undo' history, 
            // it just updated the quantity. 
            // If we want to be rigorous, we should log it. 
            // However, to match AppContext logic EXACTLY for now, I will follow existing pattern.
            // Wait, AppContext 'removeConsumption' code (lines 799-800) updates table but doesn't seem to insert stock_history for UNDO?
            // Let's check lines 791-800 of backup...
            // Yes, it updates table. It does NOT insert into stock_history.

            updatedMedication = { ...medication, quantity: newQuantity };
        }

        return { updatedMedication };
    },

    // Health Logs (Diário de Saúde)
    addHealthLog: async (logData, userId) => {
        const { error, data } = await supabase
            .from('health_logs')
            .insert([{
                user_id: userId,
                patient_id: logData.patientId,
                category: logData.category || 'pressure',
                value: String(logData.value),
                value_secondary: logData.valueSecondary ? String(logData.valueSecondary) : null,
                measured_at: logData.measuredAt,
                notes: logData.notes
            }])
            .select('*, profiles:user_id(full_name)')
            .single();

        if (error) throw error;
        return data;
    },

    deleteHealthLog: async (id) => {
        const { error } = await supabase
            .from('health_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
