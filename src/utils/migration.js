import { supabase } from '../lib/supabase';

export const migrateData = async (user) => {
    if (!user) throw new Error('Usuário não autenticado');

    const localDataString = localStorage.getItem('remedios-app-data');
    if (!localDataString) {
        return { success: false, message: 'Nenhum dado local encontrado.' };
    }

    let localData;
    try {
        localData = JSON.parse(localDataString);
    } catch (_e) {
        return { success: false, message: 'Erro ao ler dados locais.' };
    }

    const stats = {
        patients: 0,
        medications: 0,
        prescriptions: 0,
        logs: 0
    };

    const idMap = {
        patients: {},
        medications: {},
        prescriptions: {}
    };

    try {
        // 1. Migrate Patients
        if (localData.patients && localData.patients.length > 0) {
            for (const p of localData.patients) {
                const { data, error } = await supabase
                    .from('patients')
                    .insert([{
                        name: p.name,
                        birth_date: p.birthDate || null,
                        weight: p.weight || null,
                        notes: p.notes || '',
                        user_id: user.id
                    }])
                    .select()
                    .single();

                if (error) throw error;
                idMap.patients[p.id] = data.id;
                stats.patients++;
            }
        }

        // 2. Migrate Medications
        if (localData.medications && localData.medications.length > 0) {
            for (const m of localData.medications) {
                const { data, error } = await supabase
                    .from('medications')
                    .insert([{
                        name: m.name,
                        dosage: m.dosage,
                        type: m.type || 'comprimido',
                        notes: m.notes || '',
                        user_id: user.id
                    }])
                    .select()
                    .single();

                if (error) throw error;
                idMap.medications[m.id] = data.id;
                stats.medications++;
            }
        }

        // 3. Migrate Prescriptions
        if (localData.prescriptions && localData.prescriptions.length > 0) {
            for (const p of localData.prescriptions) {
                const newPatientId = idMap.patients[p.patientId];
                const newMedicationId = idMap.medications[p.medicationId];

                // Skip if dependencies are missing (e.g. deleted locally but kept in prescription)
                if (!newPatientId || !newMedicationId) continue;

                const { data, error } = await supabase
                    .from('prescriptions')
                    .insert([{
                        patient_id: newPatientId,
                        medication_id: newMedicationId,
                        frequency_type: p.frequency?.type || 'fixed',
                        frequency_value: p.frequency?.value || null,
                        times: p.times || [],
                        start_date: p.startDate,
                        end_date: p.endDate || null,
                        notes: p.notes || '',
                        active: p.active !== false,
                        user_id: user.id
                    }])
                    .select()
                    .single();

                if (error) throw error;
                idMap.prescriptions[p.id] = data.id;
                stats.prescriptions++;
            }
        }

        // 4. Migrate Consumption Log
        if (localData.consumptionLog && localData.consumptionLog.length > 0) {
            const logsToInsert = [];
            for (const log of localData.consumptionLog) {
                const newPrescriptionId = idMap.prescriptions[log.prescriptionId];
                if (!newPrescriptionId) continue;

                logsToInsert.push({
                    prescription_id: newPrescriptionId,
                    taken_at: log.timestamp || new Date().toISOString(),
                    scheduled_time: log.scheduledTime,
                    date: log.date,
                    status: log.status || 'taken',
                    notes: log.notes || '',
                    user_id: user.id
                });
            }

            if (logsToInsert.length > 0) {
                // Insert in batches of 50 to avoid limits
                const batchSize = 50;
                for (let i = 0; i < logsToInsert.length; i += batchSize) {
                    const batch = logsToInsert.slice(i, i + batchSize);
                    const { error } = await supabase
                        .from('consumption_log')
                        .insert(batch);

                    if (error) throw error;
                    stats.logs += batch.length;
                }
            }
        }

        return {
            success: true,
            message: `Migração concluída! ${stats.patients} pacientes, ${stats.medications} medicamentos, ${stats.prescriptions} prescrições e ${stats.logs} registros importados.`
        };

    } catch (error) {
        console.error('Migration error:', error);
        return { success: false, message: `Erro na migração: ${error.message}` };
    }
};
