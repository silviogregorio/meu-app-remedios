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
                .eq('shared_with_email', user.email)
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

            // 2. Buscar Medicamentos
            const { data: medicationsData, error: medicationsError } = await supabase
                .from('medications')
                .select('*')
                .order('name');

            if (medicationsError) throw medicationsError;
            setMedications(medicationsData.map(transformMedication));

            // 3. Buscar Receitas
            const { data: prescriptionsData, error: prescriptionsError } = await supabase
                .from('prescriptions')
                .select('*');

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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patient_shares', filter: `shared_with_email=eq.${user.email}` }, fetchPendingShares)
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

            const { data, error } = await supabase
                .from('patients')
                .update(dbData)
                .eq('id', id)
                .select();

            if (error) throw error;

            const updatedPatient = transformPatient(data[0]);
            setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));
            showToast('Paciente atualizado com sucesso!');
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

                    // Atualiza estado local (optimistic/realtime vai cobrir, mas garantindo)
                    setMedications(prev => prev.map(m =>
                        m.id === medication.id ? { ...m, quantity: newQuantity } : m
                    ));
                }
            }

            showToast('Dose registrada!');
        } catch (error) {
            console.error('Erro ao registrar consumo:', error);
            showToast('Erro ao registrar dose', 'error');
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

    // Compartilhamento
    const sharePatient = async (patientId, email, permission) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('patient_shares').insert([{
                patient_id: patientId,
                owner_id: user.id,
                shared_with_email: email,
                permission: permission
            }]);

            if (error) {
                if (error.code === '23505') { // Unique violation
                    showToast('Paciente já compartilhado com este email', 'warning');
                } else {
                    throw error;
                }
            } else {
                showToast(`Convite enviado para ${email}!`, 'success');
            }
        } catch (error) {
            console.error('Erro ao compartilhar paciente:', error);
            showToast('Erro ao compartilhar paciente', 'error');
        }
    };

    const unsharePatient = async (patientId, sharedWithEmail) => {
        try {
            const { error } = await supabase
                .from('patient_shares')
                .delete()
                .match({
                    patient_id: patientId,
                    shared_with_email: sharedWithEmail
                });

            if (error) throw error;
            showToast('Compartilhamento removido.', 'info');
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
