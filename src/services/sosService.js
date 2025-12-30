import { supabase } from '../lib/supabase';

export const SOSService = {
    triggerPanicAlert: async (patientId, userId, lat, lng, accuracy = null, address = null, type = 'emergency') => {
        const { data: newAlert, error: insertError } = await supabase
            .from('sos_alerts')
            .insert([{
                patient_id: patientId,
                triggered_by: userId,
                location_lat: lat,
                location_lng: lng,
                accuracy: accuracy,
                status: 'active',
                alert_type: type,
                address: address
            }])
            .select()
            .single();

        if (insertError) throw insertError;
        return newAlert;
    },

    requestHelp: async (patientId, userId) => {
        if (!navigator.geolocation) {
            return await SOSService.triggerPanicAlert(patientId, userId, null, null, null, null, 'help_request');
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const res = await SOSService.triggerPanicAlert(
                        patientId,
                        userId,
                        pos.coords.latitude,
                        pos.coords.longitude,
                        pos.coords.accuracy,
                        null,
                        'help_request'
                    );
                    resolve(res);
                },
                async () => {
                    const res = await SOSService.triggerPanicAlert(patientId, userId, null, null, null, null, 'help_request');
                    resolve(res);
                }
            );
        });
    },

    acknowledgeAlert: async (alertId, userId) => {
        const { data, error } = await supabase
            .from('sos_alerts')
            .update({
                acknowledged_by: userId,
                status: 'acknowledged'
            })
            .eq('id', alertId)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error('Não foi possível atualizar o alerta. Verifique se ele ainda existe ou se você tem permissão.');
        }

        return data[0];
    }
};
