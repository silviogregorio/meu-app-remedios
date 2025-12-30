import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import Toast from '../components/ui/Toast';

import { PatientService } from '../services/patientService';
import { MedicationService } from '../services/medicationService';
import { PrescriptionService } from '../services/prescriptionService';
import { AppointmentService } from '../services/appointmentService';
import { SpecialtyService } from '../services/specialtyService';
import { LogService } from '../services/logService';
import * as SharingService from '../services/sharingService';
import { AlertService } from '../services/alertService';
import { SOSService } from '../services/sosService';
import { requestForToken } from '../utils/firebase';
import { setBadge } from '../utils/badge';
import { getISODate, parseISODate } from '../utils/dateFormatter';


const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const { user, signOut: authSignOut } = useAuth();

    // Estados principais
    const [patients, setPatients] = useState([]);
    const [medications, setMedications] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [consumptionLog, setConsumptionLog] = useState([]);

    // Dados 'menos críticos' ou que mudam muito rápido podem ficar sem cache ou cache simples
    const [pendingShares, setPendingShares] = useState([]);
    const [accountShares, setAccountShares] = useState([]);
    const [healthLogs, setHealthLogs] = useState([]);
    const [symptomLogs, setSymptomLogs] = useState([]); // New state for symptoms
    const [toast, setToast] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [accessibility, setAccessibility] = useState({
        highContrast: false,
        largeText: false,
        voiceEnabled: false,
        fontSize: 100
    });
    const [vacationMode, setVacationMode] = useState(false);
    const [userPreferences, setUserPreferences] = useState({});

    // Update User Preferences (Generic)
    const updateUserPreferences = async (newPrefs) => {
        if (!user) return;
        try {
            // Optimistic Update
            setUserPreferences(prev => ({ ...prev, ...newPrefs }));

            const { error } = await supabase
                .from('profiles')
                .update({
                    preferences: { ...userPreferences, ...newPrefs }
                })
                .eq('id', user.id);

            if (error) throw error;
            showToast('Preferências atualizadas!');
        } catch (error) {
            console.error('Erro ao salvar preferências:', error);
            showToast('Erro ao salvar preferências', 'error');
            // Revert on error could be implemented here
        }
    };


    // Helper de Toast (supports optional duration)
    const showToast = (message, type = 'success', duration = 5000) => {
        setToast({ message, type, duration });
    };

    // Helpers de Transformação de Dados
    // Services now handle transformation
    // Kept here momentarily if needed, but fetchAllData will use Services.

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
            setPatients(patientsData.map(PatientService.transform));

            // 2. Buscar Medicamentos (Próprios + Compartilhados)
            const { data: medicationsData, error: medicationsError } = await supabase
                .from('medications')
                .select('*')
                .order('name');

            if (medicationsError) throw medicationsError;
            setMedications(medicationsData.map(MedicationService.transform));

            // 3. Buscar Receitas
            const { data: prescriptionsData, error: prescriptionsError } = await supabase
                .from('prescriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (prescriptionsError) throw prescriptionsError;
            setPrescriptions(prescriptionsData.map(PrescriptionService.transform));

            // 4. Buscar Histórico de Consumo
            const { data: logData, error: logError } = await supabase
                .from('consumption_log')
                .select('*, profiles:taken_by(full_name)');

            if (logError) throw logError;
            setConsumptionLog(logData.map(LogService.transform));

            // 5. Buscar Consultas Médicas e Especialidades
            try {
                const [appointmentsData, specialtiesData] = await Promise.all([
                    AppointmentService.fetchAll(),
                    SpecialtyService.fetchAll()
                ]);
                setAppointments(appointmentsData);
                setSpecialties(specialtiesData);
            } catch (appError) {
                console.warn('Erro ao buscar consultas ou especialidades:', appError.message);
            }

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

            // 7.1 Buscar Diário de Sintomas
            const { data: symptomData, error: symptomError } = await supabase
                .from('symptom_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (symptomError) {
                console.warn('Tabela symptom_logs pode não existir ainda:', symptomError.message);
            } else {
                setSymptomLogs(symptomData);
            }

            // 8. Buscar Configurações de Acessibilidade (Safe Fetch)
            if (user?.id) {
                try {
                    // Buscando configurações de acessibilidade silenciosamente
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        throw profileError;
                    }

                    if (profileData) {
                        if (profileData.accessibility_settings) {
                            setAccessibility(prev => ({ ...prev, ...profileData.accessibility_settings }));
                        }
                        if (profileData.vacation_mode !== undefined) {
                            setVacationMode(profileData.vacation_mode);
                        }
                        // Load User Preferences (Elderly Mode, etc)
                        if (profileData.preferences) {
                            setUserPreferences(profileData.preferences);
                        }
                    }
                } catch (accError) {
                    console.warn('Aviso: Erro ao carregar perfil extra.', accError);
                    // Silently fail to defaults
                }
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

    // Registrar Token FCM para Notificações Push
    useEffect(() => {
        const setupNotifications = async () => {
            if (user?.id) {
                try {
                    const token = await requestForToken();
                    if (!token) return;

                    // Estratégia Robusta: Tentar salvar diretamente
                    const { error: upsertError } = await supabase
                        .from('fcm_tokens')
                        .upsert({
                            user_id: user.id,
                            token: token,
                            last_seen: new Date().toISOString()
                        }, { onConflict: 'token' });

                    if (upsertError) {
                        // Se erro de RLS ou Conflito (token pertence a outro usuário)
                        if (upsertError.code === '42501' || upsertError.code === 'P0001' || upsertError.message.includes('row-level security')) {
                            console.log('🔄 Token em uso por outro perfil. Reassolvendo vínculo...');

                            // 1. Limpar vínculo antigo (permitido por política DELETE USING true na coluna token)
                            await supabase
                                .from('fcm_tokens')
                                .delete()
                                .eq('token', token);

                            // 2. Tentar inserir novamente para o usuário atual
                            await supabase
                                .from('fcm_tokens')
                                .insert({
                                    user_id: user.id,
                                    token: token,
                                    last_seen: new Date().toISOString()
                                });

                            console.log('✅ Token FCM reassinado com sucesso');
                        } else {
                            console.warn('Aviso: Falha ao registrar token FCM:', upsertError.message);
                        }
                    } else {
                        console.log('✅ Token FCM registrado com sucesso');
                    }
                } catch (err) {
                    console.error('Erro geral no setup de notificações:', err);
                }
            }
        };

        setupNotifications();
    }, [user?.id]);

    // Atualizar Badge com doses pendentes
    useEffect(() => {
        if (!user) return;

        const updateBadge = () => {
            const now = new Date();
            const today = getISODate();
            const currentTime = now.toTimeString().slice(0, 5);

            let pendingCount = 0;

            prescriptions.forEach(presc => {
                const start = parseISODate(presc.startDate);
                const end = presc.endDate ? parseISODate(presc.endDate) : null;
                const target = parseISODate(today);

                if (target < start) return;
                if (end && target > end) return;

                // Check frequency - treat undefined/null as 'daily' (default)
                let isDue = false;
                const freq = presc.frequency || 'daily';

                if (freq === 'daily') {
                    isDue = true;
                } else if (freq === 'specific_days') {
                    const weekMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
                    const dayStr = weekMap[target.getDay()];
                    if (presc.weekDays && presc.weekDays.includes(dayStr)) isDue = true;
                } else if (freq === 'interval') {
                    const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24));
                    if (presc.intervalDays && diffDays % presc.intervalDays === 0) isDue = true;
                } else {
                    // Unknown frequency type, treat as daily
                    isDue = true;
                }

                if (isDue) {
                    presc.times.forEach(time => {
                        const log = consumptionLog.find(l =>
                            (l.prescriptionId === presc.id || l.prescription_id === presc.id) &&
                            (l.scheduledTime === time || l.scheduled_time === time) &&
                            (l.date === today || (l.taken_at && l.taken_at.startsWith(today)))
                        );

                        if (!log) {
                            pendingCount++;
                        }
                    });
                }
            });

            setBadge(pendingCount);
        };

        updateBadge();
    }, [user, prescriptions, consumptionLog]);

    // --- Operações CRUD ---


    // Pacientes
    // Pacientes
    const addPatient = async (patientData) => {
        if (!user) return;
        try {
            const newPatient = await PatientService.add(patientData, user.id);
            setPatients(prev => [...prev, newPatient]);
            showToast('Paciente adicionado com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar paciente:', error);
            showToast('Erro ao adicionar paciente', 'error');
        }
    };



    const updatePatient = async (id, updatedData) => {
        try {
            const updatedPatient = await PatientService.update(id, updatedData);
            setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));
            showToast('Paciente atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar paciente:', error);
            showToast('Erro ao atualizar paciente', 'error');
        }
    };

    const deletePatient = async (id) => {
        try {
            await PatientService.delete(id);
            setPatients(prev => prev.filter(p => p.id !== id));
            showToast('Paciente excluído.', 'info');
        } catch (error) {
            console.error('Erro ao excluir paciente:', error);
            showToast('Erro ao excluir paciente', 'error');
        }
    };


    // --- Simulação do Modo Cuidador (Para Testes) ---
    const runCaregiverCheck = async () => {
        if (!user) return;
        return await AlertService.runCaregiverCheck(user, prescriptions, medications, patients, consumptionLog, showToast);
    };

    // Medicamentos
    // Medicamentos
    const addMedication = async (medicationData) => {
        if (!user) return;
        try {
            const newMedication = await MedicationService.add(medicationData, user.id);
            setMedications(prev => [...prev, newMedication]);
            showToast('Medicamento adicionado!');
        } catch (error) {
            console.error('Erro ao adicionar medicamento:', error);
            showToast('Erro ao adicionar medicamento', 'error');
        }
    };

    const updateMedication = async (id, updatedData) => {
        try {
            const oldMed = medications.find(m => m.id === id);
            const updatedMedication = await MedicationService.update(id, updatedData, user.id, oldMed);
            setMedications(prev => prev.map(m => m.id === id ? updatedMedication : m));
            showToast('Medicamento atualizado!');
        } catch (error) {
            console.error('Erro ao atualizar medicamento:', error);
            showToast('Erro ao atualizar medicamento', 'error');
        }
    };

    const deleteMedication = async (id) => {
        try {
            await MedicationService.delete(id);
            setMedications(prev => prev.filter(m => m.id !== id));
            showToast('Medicamento excluído.', 'info');
        } catch (error) {
            console.error('Erro ao excluir medicamento:', error);
            showToast('Erro ao excluir medicamento', 'error');
        }
    };

    // Refresh medications from database (used after stock updates)
    const refreshMedications = async () => {
        try {
            const { data, error } = await supabase
                .from('medications')
                .select('*')
                .order('name');
            if (error) throw error;
            setMedications(data.map(m => MedicationService.transform(m)));
        } catch (error) {
            console.error('Erro ao recarregar medicamentos:', error);
        }
    };

    // Receitas
    // Receitas
    const addPrescription = async (prescriptionData) => {
        if (!user) return;
        try {
            const newPrescription = await PrescriptionService.add(prescriptionData, user.id);
            setPrescriptions(prev => [...prev, newPrescription]);
            showToast('Receita criada!');
        } catch (error) {
            console.error('Erro ao adicionar receita:', error);
            showToast('Erro ao criar receita', 'error');
        }
    };

    const updatePrescription = async (id, updatedData) => {
        try {
            const updatedPrescription = await PrescriptionService.update(id, updatedData);
            setPrescriptions(prev => prev.map(p => p.id === id ? updatedPrescription : p));
            showToast('Prescrição atualizada!');
        } catch (error) {
            console.error('Erro ao atualizar receita:', error);
            showToast('Erro ao atualizar prescrição', 'error');
        }
    };

    const deletePrescription = async (id) => {
        try {
            await PrescriptionService.delete(id);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
            showToast('Receita excluída.', 'info');
        } catch (error) {
            console.error('Erro ao excluir receita:', error);
            showToast('Erro ao excluir receita', 'error');
        }
    };

    // Histórico de Consumo
    // Histórico de Consumo
    const logConsumption = async (logData) => {
        try {
            // Find related data from Context state
            const prescription = prescriptions.find(p => p.id === logData.prescriptionId);
            const medication = prescription ? medications.find(m => m.id === prescription.medicationId) : null;

            const { newLog, updatedMedication } = await LogService.addConsumption(
                logData, user.id, prescription, medication
            );

            setConsumptionLog(prev => [...prev, newLog]);

            if (updatedMedication) {
                setMedications(prev => prev.map(m =>
                    m.id === updatedMedication.id ? updatedMedication : m
                ));
            }

            showToast('Dose registrada!');

            // 3. Verificar Estoque Baixo (Novo)
            if (prescription && prescription.medicationId) {
                setTimeout(() => checkLowStock(prescription.medicationId), 1000);
            }

        } catch (error) {
            console.error('Erro ao registrar consumo:', error);
            showToast('Erro ao registrar dose', 'error');
        }
    };

    // --- Lógica de Alerta de Estoque Inteligente ---
    const calculateStockDays = (medicationId) => {
        return AlertService.calculateStockDays(medicationId, medications, prescriptions);
    };

    const checkLowStock = async (medicationId) => {
        if (!user) return;
        const result = await AlertService.checkLowStock(medicationId, user, medications, prescriptions, patients, showToast);
        if (result?.lastAlertDate) {
            setMedications(prev => prev.map(m =>
                m.id === medicationId ? { ...m, last_alert_date: result.lastAlertDate } : m
            ));
        }
    };
    const removeConsumption = async (prescriptionId, scheduledTime, date) => {
        try {
            const prescription = prescriptions.find(p => p.id === prescriptionId);
            const medication = prescription ? medications.find(m => m.id === prescription.medicationId) : null;

            const { updatedMedication } = await LogService.removeConsumption(
                prescriptionId, scheduledTime, date, prescription, medication
            );

            // Update local state with robust field matching (camelCase and snake_case)
            setConsumptionLog(prev => prev.filter(l => {
                const matchPrescription = (l.prescriptionId === prescriptionId || l.prescription_id === prescriptionId);
                const matchTime = (l.scheduledTime === scheduledTime || l.scheduled_time === scheduledTime);
                const matchDate = (l.date === date || (l.taken_at && l.taken_at.startsWith(date)));
                return !(matchPrescription && matchTime && matchDate);
            }));

            if (updatedMedication) {
                setMedications(prev => prev.map(m =>
                    m.id === updatedMedication.id ? updatedMedication : m
                ));
            }

            showToast('Dose desmarcada.', 'warning');
        } catch (error) {
            console.error('Erro ao remover registro de consumo:', error);
            showToast('Erro ao remover registro', 'error');
        }
    };

    // Diário de Saúde
    const addHealthLog = async (logData) => {
        if (!user) return;
        try {
            const newHealthLog = await LogService.addHealthLog(logData, user.id);
            // Manual State Update for immediate UI reflection (Realtime backup)
            setHealthLogs(prev => [newHealthLog, ...prev]);
            showToast('Registro de saúde adicionado!');
        } catch (error) {
            console.error('Erro ao adicionar registro de saúde:', error);
            showToast('Erro ao salvar registro', 'error');
        }
    };
    // --- Symptom Logs ---
    const logSymptom = async (symptomData) => {
        try {
            const newLog = { ...symptomData, user_id: user.id };
            // Optimistic
            setSymptomLogs(prev => [newLog, ...prev]);

            const { data, error } = await supabase
                .from('symptom_logs')
                .insert([newLog])
                .select()
                .single();

            if (error) throw error;
            // Update with real ID
            setSymptomLogs(prev => prev.map(l => l === newLog ? data : l));
            showToast('Sintoma registrado!');
            return data;
        } catch (error) {
            console.error('Erro ao registrar sintoma:', error);
            showToast('Erro ao registrar sintoma', 'error');
            // Revert
            setSymptomLogs(prev => prev.filter(l => l !== symptomData)); // Basic revert strategy
        }
    };

    const removeSymptom = async (id) => {
        try {
            setSymptomLogs(prev => prev.filter(l => l.id !== id));
            const { error } = await supabase
                .from('symptom_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Sintoma removido.');
        } catch (error) {
            console.error('Erro ao remover sintoma:', error);
            showToast('Erro ao remover sintoma', 'error');
            fetchAllData(true); // Refresh to restore
        }
    };

    const deleteHealthLog = async (id) => {
        try {
            await LogService.deleteHealthLog(id);
            // Optimistic update
            setHealthLogs(prev => prev.filter(l => l.id !== id));
            showToast('Registro excluído.', 'info');
        } catch (error) {
            console.error('Erro ao excluir registro de saúde:', error);
            showToast('Erro ao excluir registro', 'error');
        }
    };

    const updateHealthLog = async (id, updates) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('health_logs')
                .update({
                    category: updates.category,
                    value: String(updates.value),
                    value_secondary: updates.valueSecondary ? String(updates.valueSecondary) : null,
                    measured_at: updates.measuredAt,
                    notes: updates.notes
                })
                .eq('id', id);

            if (error) throw error;

            setHealthLogs(prev => prev.map(log =>
                log.id === id ? { ...log, ...updates, value_secondary: updates.valueSecondary, measured_at: updates.measuredAt } : log
            ));
            showToast('Registro atualizado!');
        } catch (error) {
            console.error('Erro ao atualizar registro de saúde:', error);
            showToast('Erro ao atualizar registro', 'error');
        }
    };

    // === COMPARTILHAMENTO (usando SharingService) ===
    const sharePatient = async (patientId, email, permission) => {
        if (!user) return;
        try {
            const result = await SharingService.sharePatient(patientId, email, permission, user, patients);
            if (result.alreadyShared) {
                showToast('Este paciente já está compartilhado com este email.', 'warning');
                return;
            }
            if (result.success) {
                showToast(result.emailSent ? `Convite enviado para ${email}!` : 'Compartilhado (email não enviado)', result.emailSent ? 'success' : 'warning');
                fetchAllData(true);
            }
        } catch (error) {
            console.error('Erro ao compartilhar paciente:', error);
            showToast('Erro ao compartilhar paciente', 'error');
        }
    };

    const unsharePatient = async (patientId, sharedWithEmail) => {
        try {
            const result = await SharingService.unsharePatient(patientId, sharedWithEmail);
            if (result.success) {
                showToast('Compartilhamento removido.', 'info');
                setPatients(prev => prev.map(p => {
                    if (p.id === patientId) {
                        return { ...p, sharedWith: p.sharedWith.filter(s => s.email !== sharedWithEmail) };
                    }
                    return p;
                }));
            }
        } catch (error) {
            console.error('Erro ao remover compartilhamento:', error);
            showToast('Erro ao remover compartilhamento', 'error');
        }
    };

    const shareAccount = async (email) => {
        if (!user) return;
        try {
            const result = await SharingService.shareAccount(email, user);
            if (result.alreadyShared) {
                showToast('Esta conta já está compartilhada com este email.', 'warning');
                return;
            }
            if (result.success) {
                setAccountShares(prev => [...prev, result.data]);
                showToast(`Conta compartilhada e convite enviado para ${email}!`, 'success');
            }
        } catch (error) {
            console.error('Erro ao compartilhar conta:', error);
            showToast(`Erro ao compartilhar: ${error.message}`, 'error');
        }
    };

    const unshareAccount = async (id) => {
        try {
            await SharingService.unshareAccount(id);
            setAccountShares(prev => prev.filter(s => s.id !== id));
            showToast('Compartilhamento de conta removido.', 'info');
        } catch (error) {
            console.error('Erro ao remover compartilhamento de conta:', error);
            showToast('Erro ao remover compartilhamento.', 'error');
        }
    };

    const acceptShare = async (shareId) => {
        try {
            await SharingService.acceptShare(shareId, user.id);
            showToast('Convite aceito!', 'success');
            fetchPendingShares();
            fetchAllData();
        } catch (error) {
            console.error('Erro ao aceitar compartilhamento:', error);
            showToast('Erro ao aceitar convite', 'error');
        }
    };

    const rejectShare = async (shareId) => {
        try {
            await SharingService.rejectShare(shareId);
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
                data: {
                    full_name: profileData.name,
                    emergency_contact_name: profileData.emergency_contact_name,
                    emergency_contact_phone: profileData.emergency_contact_phone,
                    emergency_contact_email: profileData.emergency_contact_email
                }
            });

            if (authError) throw authError;

            // 2. Atualizar tabela de perfis (Public)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: profileData.name,
                    emergency_contact_name: profileData.emergency_contact_name,
                    emergency_contact_phone: profileData.emergency_contact_phone,
                    emergency_contact_email: profileData.emergency_contact_email
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            showToast('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showToast('Erro ao atualizar perfil', 'error');
        }
    };

    // Acessibilidade
    const updateAccessibility = async (newSettings) => {
        if (!user) return;
        try {
            const updated = { ...accessibility, ...newSettings };
            setAccessibility(updated); // Optimistic

            await supabase
                .from('profiles')
                .update({ accessibility_settings: updated })
                .eq('id', user.id);

            showToast('Configurações salvas.', 'success');
        } catch (error) {
            console.error('Erro ao salvar acessibilidade:', error);
            showToast('Erro ao salvar configurações', 'error');
        }
    };

    // Aplicar Acessibilidade (Side Effects)
    useEffect(() => {
        document.documentElement.style.setProperty('--font-scale', (accessibility.fontSize || 100) / 100);
    }, [accessibility.fontSize]);

    // Síntese de Voz (TTS) com voz feminina suave
    const speak = (text) => {
        if (!('speechSynthesis' in window)) return;

        // Cancelar qualquer fala em andamento para não encavalar
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';

        // Voz feminina suave e tranquila para idosos
        utterance.rate = 0.85; // Mais devagar para maior clareza
        utterance.pitch = 0.9; // Pitch mais suave e feminino
        utterance.volume = 1.0; // Volume pleno

        // Tentar usar voz feminina do sistema
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v =>
            v.lang.includes('pt-BR') && v.name.toLowerCase().includes('female')
        ) || voices.find(v =>
            v.lang.includes('pt-BR') && (v.name.includes('Luciana') || v.name.includes('Google'))
        );

        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }

        window.speechSynthesis.speak(utterance);
    };


    // Estado Derivado para compatibilidade de UI
    const userPatients = patients.filter(p => p.userId === user?.id);
    const accessiblePatients = patients; // Since we fetch all accessible ones
    const userMedications = medications;
    const userPrescriptions = prescriptions;

    const triggerPanicAlert = async (patientId, lat, lng, accuracy = null, address = null, type = 'emergency') => {
        if (!user) return;
        try {
            const newAlert = await SOSService.triggerPanicAlert(patientId, user.id, lat, lng, accuracy, address, type);
            showToast(type === 'emergency' ? 'SOS Enviado!' : 'Pedido de ajuda enviado!', 'success');
            return newAlert;
        } catch (error) {
            console.error('Erro ao disparar alerta:', error);
            showToast('Erro ao disparar alerta.', 'error');
        }
    };

    const requestHelp = async (patientId) => {
        if (!user) return;
        return await SOSService.requestHelp(patientId, user.id);
    };

    // --- APPOINTMENTS METHODS ---
    const addAppointment = async (appointmentData) => {
        try {
            const newAppointment = await AppointmentService.add(appointmentData, user.id);
            setAppointments(prev => [newAppointment, ...prev].sort((a, b) =>
                new Date(a.appointmentDate) - new Date(b.appointmentDate)
            ));
            showToast('Consulta agendada com sucesso!', 'success');
            return newAppointment;
        } catch (err) {
            showToast('Erro ao agendar consulta.', 'error');
            throw err;
        }
    };

    const updateAppointment = async (id, updatedData) => {
        try {
            const updated = await AppointmentService.update(id, updatedData);
            setAppointments(prev => prev.map(a => a.id === id ? updated : a).sort((a, b) =>
                new Date(a.appointmentDate) - new Date(b.appointmentDate)
            ));
            showToast('Consulta atualizada!', 'success');
            return updated;
        } catch (err) {
            showToast('Erro ao atualizar consulta.', 'error');
            throw err;
        }
    };

    const deleteAppointment = async (id) => {
        try {
            await AppointmentService.delete(id);
            setAppointments(prev => prev.filter(a => a.id !== id));
            showToast('Consulta removida.', 'success');
        } catch (err) {
            showToast('Erro ao remover consulta.', 'error');
            throw err;
        }
    };

    const updateVacationMode = async (enabled) => {
        if (!user) return;
        try {
            setVacationMode(enabled);
            const { error } = await supabase
                .from('profiles')
                .update({ vacation_mode: enabled })
                .eq('id', user.id);
            if (error) throw error;
            showToast(enabled ? 'Modo Férias ativado! 🏖️' : 'Modo Férias desativado.', 'success');
        } catch (error) {
            console.error('Erro ao atualizar modo férias:', error);
            showToast('Erro ao atualizar modo férias', 'error');
            setVacationMode(!enabled);
        }
    };

    return (
        <AppContext.Provider value={{
            user,
            loadingData,
            patients: accessiblePatients,
            userPatients,
            addPatient, updatePatient, deletePatient,
            sharePatient, unsharePatient,
            pendingShares, acceptShare, rejectShare,
            medications: userMedications, addMedication, updateMedication, deleteMedication, refreshMedications,
            prescriptions: userPrescriptions, addPrescription, updatePrescription, deletePrescription,
            consumptionLog, logConsumption, removeConsumption,
            showToast,
            calculateStockDays,
            updateProfile,

            // Acessibilidade
            accessibility, updateAccessibility,

            // Modo Férias
            vacationMode, updateVacationMode,

            accountShares, shareAccount, unshareAccount,
            healthLogs, addHealthLog, updateHealthLog, deleteHealthLog,
            // Sintomas
            symptomLogs, logSymptom, removeSymptom,
            runCaregiverCheck,
            checkLowStock,
            triggerPanicAlert,
            requestHelp,
            logout: authSignOut,

            // Consultas
            appointments,
            specialties,
            addAppointment,
            updateAppointment,
            deleteAppointment,

            // Preferências do Usuário
            userPreferences,
            updateUserPreferences,
            speak
        }}>
            {children}
            {toast && <Toast message={toast.message} type={toast.type} duration={toast.duration} onClose={() => setToast(null)} />}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
