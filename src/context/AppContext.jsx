import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import Toast from '../components/ui/Toast';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [medications, setMedications] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [consumptionLog, setConsumptionLog] = useState([]);
    const [pendingShares, setPendingShares] = useState([]); // Compartilhamento de Paciente Específico (Legado/Granular)
    const [accountShares, setAccountShares] = useState([]); // Compartilhamento Global de Conta
    const [healthLogs, setHealthLogs] = useState([]); // Diário de Saúde (Pressão, Glicemia, etc.)
    const [toast, setToast] = useState(null);
    const [loadingData, setLoadingData] = useState(false);


    // Helper de Toast
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    // Helpers de Transformação de Dados
    const transformPatient = (p) => ({
        ...p,
        userId: p.user_id,
        birthDate: p.birth_date,
        sharedWith: p.patient_shares ? p.patient_shares.map(s => ({
            email: s.shared_with_email,
            permission: s.permission,
            status: s.accepted_at ? 'accepted' : 'pending'
        })) : []
    });

    const transformMedication = (m) => ({
        ...m,
        userId: m.user_id
    });

    const transformPrescription = (p) => ({
        ...p,
        userId: p.user_id,
        patientId: p.patient_id,
        medicationId: p.medication_id,
        startDate: p.start_date,
        endDate: p.end_date,
        times: Array.isArray(p.times) ? p.times : (typeof p.times === 'string' ? JSON.parse(p.times) : []),
        doseAmount: p.dose_amount || 1
    });

    const transformLog = (l) => ({
        ...l,
        prescriptionId: l.prescription_id,
        scheduledTime: l.scheduled_time,
        takenAt: l.taken_at,
        takenBy: l.taken_by,
        takenByName: l.profiles?.full_name
    });

    // Buscar Compartilhamentos Pendentes
    const fetchPendingShares = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('patient_shares')
                .select(`
                    id,
                    permission,
                    created_at,
                    owner:profiles!owner_id (full_name, email),
                    patient:patients!patient_id (name)
                `)
                .ilike('shared_with_email', user.email)
                .is('accepted_at', null);

            if (error) throw error;
            setPendingShares(data || []);
        } catch (error) {
            console.error('Erro ao buscar compartilhamentos pendentes:', error);
        }
    };

    // Buscar Todos os Dados
    const fetchAllData = async (isBackground = false) => {
        if (!user) return;
        if (!isBackground) setLoadingData(true);
        try {
            // 1. Buscar Pacientes (Próprios + Compartilhados)
            const { data: patientsData, error: patientsError } = await supabase
                .from('patients')
                .select(`
                    *,
                    patient_shares!patient_id (
                        shared_with_email,
                        permission,
                        accepted_at
                    )
                `)
                .order('name');

            if (patientsError) throw patientsError;
            setPatients(patientsData.map(transformPatient));

            // 2. Buscar Medicamentos (Próprios + Compartilhados)
            const { data: medicationsData, error: medicationsError } = await supabase
                .from('medications')
                .select('*')
                .order('name');

            if (medicationsError) throw medicationsError;
            setMedications(medicationsData.map(transformMedication));

            // 3. Buscar Receitas
            const { data: prescriptionsData, error: prescriptionsError } = await supabase
                .from('prescriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (prescriptionsError) throw prescriptionsError;
            setPrescriptions(prescriptionsData.map(transformPrescription));

            // 4. Buscar Histórico de Consumo
            const { data: logData, error: logError } = await supabase
                .from('consumption_log')
                .select('*, profiles:taken_by(full_name)');

            if (logError) throw logError;
            setConsumptionLog(logData.map(transformLog));

            // 5. Buscar Compartilhamentos Pendentes (Pacientes específicos)
            await fetchPendingShares();

            // 6. Buscar Compartilhamentos de Conta (Quem eu compartilhei)
            const { data: sharesData, error: sharesError } = await supabase
                .from('account_shares')
                .select('*')
                .eq('owner_id', user.id);

            if (sharesError) throw sharesError; // Se a tabela não existir ainda, vai dar erro, mas o toast avisa
            setAccountShares(sharesData || []);

            // 7. Buscar Diário de Saúde
            const { data: healthData, error: healthError } = await supabase
                .from('health_logs')
                .select('*, profiles:user_id(full_name)')
                .order('measured_at', { ascending: false });

            if (healthError) {
                console.warn('Tabela health_logs pode não existir ainda:', healthError.message);
            } else {
                setHealthLogs(healthData);
            }


        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            showToast('Erro ao carregar dados', 'error');
        } finally {
            if (!isBackground) setLoadingData(false);
        }
    };

    // Assinaturas Realtime
    useEffect(() => {
        if (!user) {
            setPatients([]);
            setMedications([]);
            setPrescriptions([]);
            setConsumptionLog([]);
            setPendingShares([]);
            setAccountShares([]);
            return;
        }

        fetchAllData();

        // Canal Único para todas as alterações (Melhor performance e estabilidade de conexão)
        const channel = supabase.channel('db_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => fetchAllData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => fetchAllData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => fetchAllData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consumption_log' }, () => fetchAllData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'health_logs' }, () => fetchAllData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_shares', filter: `shared_with_email=eq.${user.email.toLowerCase()}` }, (payload) => {
                // Se alguém me convidou, removeram meu acesso ou mudaram permissão:
                console.log('⚡ Mudança em patient_shares:', payload.eventType);
                fetchPendingShares(); // Atualiza convites (sininho)
                fetchAllData(true);   // Atualiza lista principal (remove se fui excluído)
                if (payload.eventType === 'DELETE') {
                    showToast('Um acesso compartilhado foi atualizado/removido.', 'info');
                }
            })
            .subscribe((status) => {
                // Status do canal sem logs barulhentos
                if (status === 'CHANNEL_ERROR') {
                    // console.error('❌ Erro no canal Realtime...');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // --- Operações CRUD ---

    // Pacientes
    const addPatient = async (patientData) => {
        if (!user) return;
        try {
            const dbData = {
                user_id: user.id,
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

            const newPatient = transformPatient(data[0]);
            setPatients(prev => [...prev, newPatient]);
            showToast('Paciente adicionado com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar paciente:', error);
            showToast('Erro ao adicionar paciente', 'error');
        }
    };



    const updatePatient = async (id, updatedData) => {
        try {
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
        } catch (error) {
            console.error('Erro ao atualizar paciente:', error);
            showToast('Erro ao atualizar paciente', 'error');
        }
    };

    const deletePatient = async (id) => {
        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPatients(prev => prev.filter(p => p.id !== id));
            showToast('Paciente excluído.', 'info');
        } catch (error) {
            console.error('Erro ao excluir paciente:', error);
            showToast('Erro ao excluir paciente', 'error');
        }
    };

    // Compartilhamento
    const sharePatient = async (patientId, email, permission) => {
        if (!user) return;
        try {
            await supabase.from('patient_shares').insert([
                {
                    owner_id: user.id,
                    patient_id: patientId,
                    shared_with_email: email.toLowerCase(),
                    permission: permission,
                },
            ]);
            showToast('Convite enviado com sucesso!');
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            showToast('Erro ao compartilhar paciente', 'error');
        }
    };

    const unshareAccount = async (shareId) => {
        try {
            await supabase.from('account_shares').delete().eq('id', shareId);
            setAccountShares(prev => prev.filter(s => s.id !== shareId));
            showToast('Compartilhamento removido.');
        } catch (error) {
            console.error('Erro ao remover compartilhamento:', error);
            showToast('Erro ao remover', 'error');
        }
    };

    // --- Simulação do Modo Cuidador (Para Testes) ---
    const runCaregiverCheck = async () => {
        showToast('Iniciando verificação de cuidador...', 'info');
        console.log('--- Iniciando Check de Cuidador (Simulado) ---');

        let alertsSent = 0;
        const now = new Date(); // Hora "Servidor"
        const todayStr = now.toISOString().split('T')[0];

        // Iterar prescrições ativas
        const activePrescriptions = prescriptions.filter(p => !p.endDate || new Date(p.endDate) >= new Date().setHours(0, 0, 0, 0));

        for (const p of activePrescriptions) {
            if (!p.times || !Array.isArray(p.times)) continue;

            const med = medications.find(m => m.id === p.medicationId);
            const patient = patients.find(pt => pt.id === p.patientId);

            for (const timeStr of p.times) {
                const [h, m] = timeStr.split(':').map(Number);
                const scheduledDate = new Date();
                scheduledDate.setHours(h, m, 0, 0);

                const diffMs = now.getTime() - scheduledDate.getTime();
                const diffMins = diffMs / (1000 * 60);

                // Lógica: Atraso > 30 min E < 24h
                if (diffMins > 30 && diffMins < 1440) {
                    // 1. Checar Consumo
                    const hasConsumed = consumptionLog.some(l =>
                        l.prescriptionId === p.id &&
                        l.date === todayStr &&
                        l.scheduledTime === timeStr
                    );

                    if (hasConsumed) {
                        console.log(`✅ ${patient?.name} tomou ${med?.name} das ${timeStr}`);
                        continue;
                    }

                    // 2. Checar se já alertamos (No Front simulamos verificando se já mandamos nessa sessão ou mock)
                    // Num cenário real consultaríamos tabela 'alert_logs'
                    const { data: existingAlert } = await supabase
                        .from('alert_logs')
                        .select('id')
                        .eq('prescription_id', p.id)
                        .eq('alert_date', todayStr)
                        .eq('alert_time', timeStr + ':00') // DB time often has seconds
                        .maybeSingle();

                    if (existingAlert) {
                        console.log(`⚠️ Alerta já enviado para ${patient?.name} - ${med?.name} (${timeStr})`);
                        continue;
                    }

                    // 3. Disparar Alerta
                    console.log(`🚨 ALERTA: ${patient?.name} perdeu ${med?.name} das ${timeStr}! (+${Math.floor(diffMins)}m)`);
                    alertsSent++;

                    // Enviar Email Real
                    if (user?.email) {
                        try {
                            // Tentar usar a função send-email existente
                            // Nota: Num ambiente real, isso pegaria os emails de 'patient_shares' tb
                            const recipients = [user.email]; // Demo: manda pro dono logado
                            if (patient?.sharedWith) {
                                patient.sharedWith.forEach(s => recipients.push(s.email));
                            }

                            await fetch(`${import.meta.env.VITE_API_URL || ''}/api/send-email`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: recipients.join(','),
                                    subject: `🚨 ALERTA DE ATRASO: ${patient?.name}`,
                                    text: `O paciente ${patient?.name} não tomou ${med?.name} agendado para ${timeStr}.\nAtraso de ${Math.floor(diffMins)} minutos.`,
                                    type: 'alert'
                                })
                            });

                            // Logar no DB para não repetir
                            await supabase.from('alert_logs').insert({
                                prescription_id: p.id,
                                patient_id: p.patientId,
                                alert_date: todayStr,
                                alert_time: timeStr,
                                sent_to: recipients
                            });

                            showToast(`Alerta enviado: ${patient?.name} / ${med?.name}`, 'warning');

                        } catch (err) {
                            console.error('Falha ao enviar email de alerta', err);
                        }
                    }
                }
            }
        }

        if (alertsSent === 0) {
            showToast('Verificação concluída. Nenhuns atrasos novos.', 'success');
        } else {
            showToast(`${alertsSent} alertas de atraso enviados!`, 'warning');
        }
    };

    // Medicamentos
    const addMedication = async (medicationData) => {
        if (!user) return;
        try {
            const dbData = {
                user_id: user.id,
                name: medicationData.name,
                dosage: medicationData.dosage,
                type: medicationData.type,
                quantity: parseFloat(medicationData.quantity) || 0
            };

            const { data, error } = await supabase
                .from('medications')
                .insert([dbData])
                .select();

            if (error) throw error;

            const newMedication = transformMedication(data[0]);
            setMedications(prev => [...prev, newMedication]);

            // Log Stock History (Initial Refill)
            if (newMedication.quantity > 0) {
                await supabase.from('stock_history').insert([{
                    user_id: user.id,
                    medication_id: newMedication.id,
                    quantity_change: newMedication.quantity,
                    previous_balance: 0,
                    new_balance: newMedication.quantity,
                    reason: 'refill',
                    notes: 'Cadastro inicial'
                }]);
            }

            showToast('Medicamento adicionado!');
        } catch (error) {
            console.error('Erro ao adicionar medicamento:', error);
            showToast('Erro ao adicionar medicamento', 'error');
        }
    };

    const updateMedication = async (id, updatedData) => {
        try {
            const dbData = {};
            if (updatedData.name) dbData.name = updatedData.name;
            if (updatedData.dosage) dbData.dosage = updatedData.dosage;
            if (updatedData.type) dbData.type = updatedData.type;
            if (updatedData.quantity !== undefined) dbData.quantity = parseFloat(updatedData.quantity);

            const { data, error } = await supabase
                .from('medications')
                .update(dbData)
                .eq('id', id)
                .select();

            if (error) throw error;

            const updatedMedication = transformMedication(data[0]);

            // Log Stock Adjustment if quantity changed
            const oldMed = medications.find(m => m.id === id);
            if (oldMed && updatedData.quantity !== undefined && parseFloat(updatedData.quantity) !== oldMed.quantity) {
                const oldQty = parseFloat(oldMed.quantity);
                const newQty = parseFloat(updatedData.quantity);
                const diff = newQty - oldQty;

                await supabase.from('stock_history').insert([{
                    user_id: user.id,
                    medication_id: id,
                    quantity_change: diff,
                    previous_balance: oldQty,
                    new_balance: newQty,
                    reason: 'adjustment',
                    notes: 'Ajuste manual de estoque'
                }]);
            }

            setMedications(prev => prev.map(m => m.id === id ? updatedMedication : m));
            showToast('Medicamento atualizado!');
        } catch (error) {
            console.error('Erro ao atualizar medicamento:', error);
            showToast('Erro ao atualizar medicamento', 'error');
        }
    };

    const deleteMedication = async (id) => {
        try {
            const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMedications(prev => prev.filter(m => m.id !== id));
            showToast('Medicamento excluído.', 'info');
        } catch (error) {
            console.error('Erro ao excluir medicamento:', error);
            showToast('Erro ao excluir medicamento', 'error');
        }
    };

    // Receitas
    const addPrescription = async (prescriptionData) => {
        if (!user) return;
        try {
            const dbData = {
                user_id: user.id,
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

            const newPrescription = transformPrescription(data[0]);
            setPrescriptions(prev => [...prev, newPrescription]);
            showToast('Receita criada!');
        } catch (error) {
            console.error('Erro ao adicionar receita:', error);
            showToast('Erro ao criar receita', 'error');
        }
    };

    const updatePrescription = async (id, updatedData) => {
        try {
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

            const updatedPrescription = transformPrescription(data[0]);
            setPrescriptions(prev => prev.map(p => p.id === id ? updatedPrescription : p));
            showToast('Prescrição atualizada!');
        } catch (error) {
            console.error('Erro ao atualizar receita:', error);
            showToast('Erro ao atualizar prescrição', 'error');
        }
    };

    const deletePrescription = async (id) => {
        try {
            const { error } = await supabase
                .from('prescriptions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPrescriptions(prev => prev.filter(p => p.id !== id));
            showToast('Receita excluída.', 'info');
        } catch (error) {
            console.error('Erro ao excluir receita:', error);
            showToast('Erro ao excluir receita', 'error');
        }
    };

    // Histórico de Consumo
    const logConsumption = async (logData) => {
        try {
            // 1. Registrar consumo
            const dbData = {
                prescription_id: logData.prescriptionId,
                date: logData.date,
                scheduled_time: logData.scheduledTime,
                taken_at: new Date().toISOString(),
                status: 'taken',
                taken_by: user.id
            };

            const { data, error } = await supabase
                .from('consumption_log')
                .insert([dbData])
                .select();

            if (error) throw error;

            const newLog = transformLog(data[0]);
            setConsumptionLog(prev => [...prev, newLog]);

            // 2. Decrementar estoque
            const prescription = prescriptions.find(p => p.id === logData.prescriptionId);
            if (prescription) {
                const medication = medications.find(m => m.id === prescription.medicationId);
                if (medication && medication.quantity > 0) {
                    const dose = parseFloat(prescription.doseAmount) || 1;
                    const newQuantity = (parseFloat(medication.quantity) || 0) - dose;

                    // Atualiza no banco
                    await supabase
                        .from('medications')
                        .update({ quantity: newQuantity })
                        .eq('id', medication.id);

                    // Log Stock History (Consumption)
                    await supabase.from('stock_history').insert([{
                        user_id: user.id,
                        patient_id: prescription.patientId,
                        medication_id: medication.id,
                        quantity_change: -dose,
                        previous_balance: parseFloat(medication.quantity),
                        new_balance: newQuantity,
                        reason: 'consumption',
                        // Note if taken not by owner? We are logging AS the current user (user.id).
                        // If we want detailed tracking on shared patients, we might need a distinct 'notes' field logic later.
                        notes: `Dose tomada: ${prescription.doseAmount || '1'}`
                    }]);

                    // Atualiza estado local (optimistic/realtime vai cobrir, mas garantindo)
                    setMedications(prev => prev.map(m =>
                        m.id === medication.id ? { ...m, quantity: newQuantity } : m
                    ));
                }
            }

            showToast('Dose registrada!');

            // 3. Verificar Estoque Baixo (Novo)
            if (prescription && prescription.medicationId) {
                // Pequeno delay para garantir que o estado local atualizou (embora estejamos usando vars locais)
                // Usando setTimeout para não bloquear a UI
                setTimeout(() => checkLowStock(prescription.medicationId), 1000);
            }

        } catch (error) {
            console.error('Erro ao registrar consumo:', error);
            showToast('Erro ao registrar dose', 'error');
        }
    };

    // --- Lógica de Alerta de Estoque Inteligente ---
    const calculateStockDays = (medicationId) => {
        const med = medications.find(m => m.id === medicationId);
        if (!med || !med.quantity) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activePrescriptions = prescriptions.filter(p =>
            p.medicationId === medicationId &&
            p.active !== false &&
            (!p.endDate || new Date(p.endDate) >= today)
        );

        if (activePrescriptions.length === 0) return null;

        let dailyUsage = 0;
        activePrescriptions.forEach(p => {
            const dose = parseFloat(p.doseAmount) || 1;
            const freq = p.times ? p.times.length : 0;
            dailyUsage += (dose * freq);
        });

        if (dailyUsage <= 0) return null;

        return med.quantity / dailyUsage;
    };

    const checkLowStock = async (medicationId) => {
        const daysRemaining = calculateStockDays(medicationId);
        if (daysRemaining === null) return;

        const med = medications.find(m => m.id === medicationId);

        // 3. Verificar Limite (3 dias)
        if (daysRemaining <= 3) {
            const daysDisplay = Math.floor(daysRemaining);
            const msg = `Atenção: Estoque de ${med.name} acaba em ${daysDisplay} dia(s)!`;

            // Alerta Visual (Toast)
            showToast(msg, 'warning');

            // Alerta por Email (Throttled - 1x por dia)
            const todayStr = new Date().toISOString().split('T')[0];

            // Se já alertou hoje, ignora
            if (med.last_alert_date === todayStr) {
                console.log('Email de estoque já enviado hoje para', med.name);
                return;
            }

            // Enviar Email
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const endpoint = apiUrl ? `${apiUrl}/api/send-email` : '/api/send-email';

                // Atualizar DB PRIMEIRO para evitar dupla execução em race condition
                const { error: updateError } = await supabase
                    .from('medications')
                    .update({ last_alert_date: todayStr })
                    .eq('id', med.id);

                if (updateError) throw updateError;

                // Atualizar estado local
                setMedications(prev => prev.map(m =>
                    m.id === med.id ? { ...m, last_alert_date: todayStr } : m
                ));

                // Disparar Email
                if (user && user.email) {
                    await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: user.email,
                            subject: `⚠️ Alerta de Estoque: ${med.name}`,
                            text: `Olá, ${user.user_metadata?.full_name || 'Usuário'}.\n\nO estoque do medicamento ${med.name} está baixo.\n\nRestam apenas ${med.quantity} doses/unidades, o que deve durar cerca de ${daysDisplay} dias (baseado no seu uso diário de ${dailyUsage}).\n\nRecomendamos comprar uma nova caixa em breve.\n\nSiG Remédios`,
                            observations: 'Alerta automático de estoque.',
                            type: 'contact'
                        })
                    });
                    console.log('Email de baixo estoque enviado:', med.name);
                }

            } catch (err) {
                console.error('Erro ao processar alerta de estoque:', err);
                // Não mostramos toast de erro pro usuário para não assustar, é um processo bg
            }
        }
    };

    const removeConsumption = async (prescriptionId, scheduledTime, date) => {
        try {
            // 1. Remover consumo
            const { error } = await supabase
                .from('consumption_log')
                .delete()
                .match({
                    prescription_id: prescriptionId,
                    scheduled_time: scheduledTime,
                    date: date
                });

            if (error) throw error;

            setConsumptionLog(prev => prev.filter(l =>
                !(l.prescriptionId === prescriptionId && l.scheduledTime === scheduledTime && l.date === date)
            ));

            // 2. Incrementar estoque (devolver)
            const prescription = prescriptions.find(p => p.id === prescriptionId);
            if (prescription) {
                const medication = medications.find(m => m.id === prescription.medicationId);
                if (medication) {
                    const dose = parseFloat(prescription.doseAmount) || 1;
                    const newQuantity = (parseFloat(medication.quantity) || 0) + dose;

                    // Atualiza no banco
                    await supabase
                        .from('medications')
                        .update({ quantity: newQuantity })
                        .eq('id', medication.id);

                    // Log Stock History (Correction/Return)
                    await supabase.from('stock_history').insert([{
                        user_id: user.id,
                        medication_id: medication.id,
                        quantity_change: dose,
                        previous_balance: parseFloat(medication.quantity),
                        new_balance: newQuantity,
                        reason: 'correction',
                        notes: 'Dose desmarcada (devolvida ao estoque)'
                    }]);

                    // Atualiza estado local
                    setMedications(prev => prev.map(m =>
                        m.id === medication.id ? { ...m, quantity: newQuantity } : m
                    ));
                }
            }

            showToast('Registro removido.', 'info');
        } catch (error) {
            console.error('Erro ao remover registro de consumo:', error);
            showToast('Erro ao remover registro', 'error');
        }
    };

    // Diário de Saúde
    const addHealthLog = async (logData) => {
        if (!user) return;
        try {
            const dbData = {
                user_id: user.id,
                patient_id: logData.patientId,
                category: logData.category, // 'pressure', 'glucose', 'weight', etc.
                value: parseFloat(logData.value),
                value_secondary: logData.valueSecondary ? parseFloat(logData.valueSecondary) : null,
                measured_at: logData.measuredAt || new Date().toISOString(),
                notes: logData.notes
            };

            const { data, error } = await supabase
                .from('health_logs')
                .insert([dbData])
                .select();

            if (error) throw error;

            // Optimistic update done by Realtime usually, but let's be safe
            showToast('Registro de saúde adicionado!');
        } catch (error) {
            console.error('Erro ao adicionar registro de saúde:', error);
            showToast('Erro ao salvar registro', 'error');
        }
    };

    const deleteHealthLog = async (id) => {
        try {
            const { error } = await supabase
                .from('health_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Registro excluído.', 'info');
        } catch (error) {
            console.error('Erro ao excluir registro de saúde:', error);
            showToast('Erro ao excluir registro', 'error');
        }
    };

    // Compartilhamento
    const sharePatient = async (patientId, email, permission) => {
        if (!user) return;
        try {
            // 1. Tentar Inserir (DB)
            const { data, error } = await supabase.from('patient_shares').insert([{
                patient_id: patientId,
                owner_id: user.id,
                shared_with_email: email,
                permission: permission
            }]).select();

            if (error) {
                if (error.code === '23505') { // Unique violation
                    showToast('Este paciente já está compartilhado com este email.', 'warning');
                    return; // Retorna aqui para não tentar enviar email
                } else {
                    throw error;
                }
            }

            // 2. Enviar Email (Backend)
            // Lógica copiada e adaptada de shareAccount
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '';
                const endpoint = apiUrl ? `${apiUrl}/api/send-email` : '/api/send-email';
                const patientName = patients.find(p => p.id === patientId)?.name || 'um paciente';

                const emailResponse = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: email,
                        subject: `Convite de Acesso - Paciente ${patientName}`,
                        text: `${user.user_metadata?.full_name || 'Alguém'} compartilhou o acesso ao paciente "${patientName}" com você no SiG Remédios.\n\nAcesse o app com este email para visualizar os dados.`,
                        observations: `Permissão concedida: ${permission === 'edit' ? 'Editar' : 'Visualizar'}`,
                        type: 'invite'
                    })
                });

                if (!emailResponse.ok) {
                    // Tentar ler JSON de erro
                    const errorData = await emailResponse.json().catch(() => ({ error: 'Erro ao ler resposta do servidor (provavelmente HTML)' }));

                    console.error('❌ Resposta de erro do email (RAW):', JSON.stringify(errorData, null, 2));

                    const errorMessage = errorData.error || errorData.message || 'Falha desconhecida';
                    showToast(`Erro no email: ${errorMessage}`, 'warning');
                } else {
                    showToast(`Convite enviado para ${email}!`, 'success');
                }

                // Atualizar lista localmente para refletir na UI imediatamente
                const updatedPatient = patients.find(p => p.id === patientId);
                if (updatedPatient) {
                    fetchAllData(true);
                }

            } catch (emailError) {
                console.error('Erro ao enviar email:', emailError);
                showToast(`Erro de rede ao enviar email.`, 'warning');
            }

        } catch (error) {
            console.error('Erro ao compartilhar paciente:', error);
            showToast('Erro ao compartilhar paciente', 'error');
        }
    };

    const unsharePatient = async (patientId, sharedWithEmail) => {
        try {
            const { error, count } = await supabase
                .from('patient_shares')
                .delete({ count: 'exact' })
                .eq('patient_id', patientId)
                .ilike('shared_with_email', sharedWithEmail);

            if (error) throw error;

            if (count === 0) {
                console.warn('⚠️ Nenhuma permissão removida. Verifique se o email coincide.', { patientId, sharedWithEmail });
                // Fallback: Try exact match just in case ILIKE fails for some specific reason? No, ILIKE covers equality.
            } else {
                console.log(`✅ ${count} permissão(ões) removida(s).`);
            }

            showToast('Compartilhamento removido.', 'info');

            // Atualização Otimista da UI
            setPatients(prev => prev.map(p => {
                if (p.id === patientId) {
                    return {
                        ...p,
                        sharedWith: p.sharedWith.filter(s => s.email !== sharedWithEmail)
                    };
                }
                return p;
            }));

        } catch (error) {
            console.error('Erro ao remover compartilhamento:', error);
            showToast('Erro ao remover compartilhamento', 'error');
        }
    };

    // --- Compartilhamento de Conta (NOVO) ---
    const shareAccount = async (email) => {
        if (!user) return;
        try {
            const { data, error } = await supabase.from('account_shares').insert([{
                owner_id: user.id,
                shared_with_email: email
            }]).select();

            if (error) {
                if (error.code === '23505') {
                    showToast('Esta conta já está compartilhada com este email.', 'warning');
                } else {
                    throw error;
                }
            } else {
                setAccountShares(prev => [...prev, data[0]]);

                // Enviar email de convite
                try {
                    const apiUrl = import.meta.env.VITE_API_URL || '';
                    // Se for localhost (desenvolvimento), o proxy do Vite já lida com /api
                    // Se for produção, VITE_API_URL deve estar definida ou o backend estar no mesmo domínio
                    const endpoint = apiUrl ? `${apiUrl}/api/send-email` : '/api/send-email';

                    const emailResponse = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            to: email,
                            subject: 'Convite de Acesso - SiG Remédios',
                            text: `${user.user_metadata?.full_name || 'Alguém'} compartilhou o acesso à conta do SiG Remédios com você.\n\nAgora você pode visualizar e gerenciar os pacientes, medicamentos e receitas desta conta.\n\nAcesse o app com este email para ver os dados compartilhados.`,
                            observations: 'Acesso concedido via Compartilhamento de Conta.'
                        })
                    });

                    if (!emailResponse.ok) {
                        const errorData = await emailResponse.json().catch(() => ({}));
                        throw new Error(errorData.error || `Erro HTTP: ${emailResponse.status}`);
                    }

                    // Enviar Email de Segurança para o Dono (Alerta)
                    if (user.email) {
                        try {
                            await fetch(endpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    to: user.email, // Email do dono
                                    subject: 'Alerta de Segurança - Compartilhamento de Conta',
                                    text: `Olá, ${user.user_metadata?.full_name || 'Usuário'}.\n\nSua conta do SiG Remédios acabou de ser compartilhada com: ${email}.\n\nSe você NÃO reconhece esta ação, acesse sua conta imediatamente, remova o compartilhamento e troque sua senha.\n\nData: ${new Date().toLocaleString('pt-BR')}`,
                                    observations: 'Esta é uma mensagem automática de segurança.',
                                    type: 'contact' // Usando template de "contact" ou similar para diferenciar, ou padrão
                                })
                            });
                        } catch (securityError) {
                            console.error('Falha ao enviar alerta de segurança:', securityError);
                            // Não bloqueia o fluxo principal, apenas loga
                        }
                    }

                    showToast(`Conta compartilhada e convite enviado para ${email}!`, 'success');
                } catch (emailError) {
                    console.error('Erro ao enviar email:', emailError);
                    showToast(`Conta compartilhada, mas falha no envio do email: ${emailError.message}`, 'warning');
                }
            }
        } catch (error) {
            console.error('Erro ao compartilhar conta:', error);
            showToast(`Erro ao compartilhar: ${error.message || error.error_description || 'Falha na operação'}`, 'error');
        }
    };

    const unshareAccount = async (id) => {
        try {
            const { error } = await supabase
                .from('account_shares')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setAccountShares(prev => prev.filter(s => s.id !== id));
            showToast('Compartilhamento de conta removido.', 'info');
        } catch (error) {
            console.error('Erro ao remover compartilhamento de conta:', error);
            showToast('Erro ao remover compartilhamento.', 'error');
        }
    };

    // Aceitar/Rejeitar Compartilhamento
    const acceptShare = async (shareId) => {
        try {
            const { error } = await supabase
                .from('patient_shares')
                .update({
                    accepted_at: new Date().toISOString(),
                    shared_with_id: user.id
                })
                .eq('id', shareId);

            if (error) throw error;
            showToast('Convite aceito!', 'success');
            fetchPendingShares();
            fetchAllData(); // Refresh patients list
        } catch (error) {
            console.error('Erro ao aceitar compartilhamento:', error);
            showToast('Erro ao aceitar convite', 'error');
        }
    };

    const rejectShare = async (shareId) => {
        try {
            const { error } = await supabase
                .from('patient_shares')
                .delete()
                .eq('id', shareId);

            if (error) throw error;
            showToast('Convite recusado.', 'info');
            fetchPendingShares();
        } catch (error) {
            console.error('Erro ao rejeitar compartilhamento:', error);
            showToast('Erro ao recusar convite', 'error');
        }
    };

    // Perfil
    const updateProfile = async (profileData) => {
        if (!user) return;
        try {
            // 1. Atualizar metadados do usuário (Auth)
            const { data: authData, error: authError } = await supabase.auth.updateUser({
                data: { full_name: profileData.name }
            });

            if (authError) throw authError;

            // 2. Atualizar tabela de perfis (Public)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: profileData.name })
                .eq('id', user.id);

            if (profileError) throw profileError;

            showToast('Perfil atualizado com sucesso!');

            // Forçar atualização local se necessário (embora auth listener deva pegar)
            // window.location.reload(); // Opcional, mas o AuthContext deve atualizar o user object
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showToast('Erro ao atualizar perfil', 'error');
        }
    };

    // Estado Derivado para compatibilidade de UI
    const userPatients = patients.filter(p => p.userId === user?.id);
    const accessiblePatients = patients; // Since we fetch all accessible ones
    const userMedications = medications;
    const userPrescriptions = prescriptions;

    return (
        <AppContext.Provider value={{
            user,
            loadingData,
            patients: accessiblePatients,
            userPatients,
            addPatient, updatePatient, deletePatient,
            sharePatient, unsharePatient,
            pendingShares, acceptShare, rejectShare,
            medications: userMedications, addMedication, updateMedication, deleteMedication,
            prescriptions: userPrescriptions, addPrescription, updatePrescription, deletePrescription,
            consumptionLog, logConsumption, removeConsumption,
            showToast,
            calculateStockDays,
            updateProfile,

            accountShares, shareAccount, unshareAccount,
            logout: useAuth().signOut
        }}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
