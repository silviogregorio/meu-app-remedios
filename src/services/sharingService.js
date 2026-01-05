/**
 * SharingService - Funções de Compartilhamento de Pacientes e Contas
 * Extraído de AppContext.jsx para melhor manutenibilidade
 * 
 * Este serviço contém as funções de compartilhamento que podem ser
 * importadas diretamente pelo AppContext ou outros componentes.
 */
import { supabase } from '../lib/supabase';

/**
 * Buscar Compartilhamentos Pendentes (Convites recebidos)
 */
export const fetchPendingShares = async (userEmail) => {
    if (!userEmail) return [];
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
            .ilike('shared_with_email', userEmail)
            .is('accepted_at', null);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar compartilhamentos pendentes:', error);
        return [];
    }
};

/**
 * Buscar Compartilhamentos de Conta (Quem eu compartilhei minha conta)
 */
export const fetchAccountShares = async (userId) => {
    if (!userId) return [];
    try {
        const { data, error } = await supabase
            .from('account_shares')
            .select(`
                *,
                shared_user:profiles!shared_with_id (full_name, email)
            `)
            .eq('owner_id', userId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar compartilhamentos de conta:', error);
        return [];
    }
};

/**
 * Buscar Convites de Conta Pendentes (Convites que EU recebi)
 */
export const fetchPendingAccountShares = async (userEmail) => {
    if (!userEmail) return [];
    try {
        const { data, error } = await supabase
            .from('account_shares')
            .select(`
                id,
                created_at,
                owner_id
            `)
            .ilike('shared_with_email', userEmail)
            .is('accepted_at', null);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Erro ao buscar convites de conta pendentes:', error);
        return [];
    }
};

/**
 * Compartilhar um paciente específico com outro usuário
 */
export const sharePatient = async (patientId, email, permission, user, patients) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.from('patient_shares').insert([{
        patient_id: patientId,
        owner_id: user.id,
        shared_with_email: email,
        permission: permission
    }]).select();

    if (error) {
        if (error.code === '23505') {
            return { success: false, alreadyShared: true };
        }
        throw error;
    }

    // Enviar Email de convite
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const endpoint = apiUrl ? `${apiUrl}/api/send-email` : '/api/send-email';
    const patientName = patients?.find(p => p.id === patientId)?.name || 'um paciente';

    const { data: { session } } = await supabase.auth.getSession();
    const emailResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
            to: email,
            subject: `Convite de Acesso - Paciente ${patientName}`,
            text: `${user.user_metadata?.full_name || 'Alguém'} compartilhou o acesso ao paciente "${patientName}" com você no SiG Remédios.\n\nAcesse o app com este email para visualizar os dados.`,
            observations: `Permissão concedida: ${permission === 'edit' ? 'Editar' : 'Visualizar'}`,
            type: 'invite'
        })
    });

    return {
        success: true,
        data: data[0],
        emailSent: emailResponse.ok
    };
};

/**
 * Remover compartilhamento de paciente
 */
export const unsharePatient = async (patientId, sharedWithEmail) => {
    const { error, count } = await supabase
        .from('patient_shares')
        .delete({ count: 'exact' })
        .eq('patient_id', patientId)
        .ilike('shared_with_email', sharedWithEmail);

    if (error) throw error;

    return { success: true, count };
};

/**
 * Compartilhar conta inteira com outro usuário
 */
export const shareAccount = async (email, user) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.from('account_shares').insert([{
        owner_id: user.id,
        shared_with_email: email
    }]).select();

    if (error) {
        if (error.code === '23505') {
            return { success: false, alreadyShared: true };
        }
        throw error;
    }

    // Enviar email de convite
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const endpoint = apiUrl ? `${apiUrl}/api/send-email` : '/api/send-email';

    const { data: { session } } = await supabase.auth.getSession();

    // Email para convidado
    await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
            to: email,
            subject: 'Convite de Acesso - SiG Remédios',
            text: `${user.user_metadata?.full_name || 'Alguém'} compartilhou o acesso à conta do SiG Remédios com você.\n\nAgora você pode visualizar e gerenciar os pacientes, medicamentos e receitas desta conta.\n\nAcesse o app com este email para ver os dados compartilhados.`,
            observations: 'Acesso concedido via Compartilhamento de Conta.'
        })
    });

    // Email de segurança para o dono
    if (user.email) {
        await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
                to: user.email,
                subject: 'Alerta de Segurança - Compartilhamento de Conta',
                text: `Olá, ${user.user_metadata?.full_name || 'Usuário'}.\n\nSua conta do SiG Remédios acabou de ser compartilhada com: ${email}.\n\nSe você NÃO reconhece esta ação, acesse sua conta imediatamente, remova o compartilhamento e troque sua senha.\n\nData: ${new Date().toLocaleString('pt-BR')}`,
                observations: 'Esta é uma mensagem automática de segurança.',
                type: 'contact'
            })
        });
    }

    return { success: true, data: data[0] };
};

/**
 * Remover compartilhamento de conta
 */
export const unshareAccount = async (id) => {
    const { error } = await supabase
        .from('account_shares')
        .delete()
        .eq('id', id);

    if (error) throw error;

    return { success: true };
};

/**
 * Aceitar convite de compartilhamento
 */
export const acceptShare = async (shareId, userId) => {
    const { error } = await supabase
        .from('patient_shares')
        .update({
            accepted_at: new Date().toISOString(),
            shared_with_id: userId
        })
        .eq('id', shareId);

    if (error) throw error;

    return { success: true };
};

/**
 * Rejeitar convite de compartilhamento de paciente
 */
export const rejectShare = async (shareId) => {
    const { error } = await supabase
        .from('patient_shares')
        .delete()
        .eq('id', shareId);

    if (error) throw error;

    return { success: true };
};

/**
 * Aceitar convite de compartilhamento de conta
 */
export const acceptAccountShare = async (shareId, userId) => {
    const { error } = await supabase
        .from('account_shares')
        .update({
            accepted_at: new Date().toISOString(),
            shared_with_id: userId,
            status: 'accepted'
        })
        .eq('id', shareId);

    if (error) throw error;

    return { success: true };
};

/**
 * Rejeitar convite de compartilhamento de conta
 */
export const rejectAccountShare = async (shareId) => {
    const { error } = await supabase
        .from('account_shares')
        .delete()
        .eq('id', shareId);

    if (error) throw error;

    return { success: true };
};
