import { supabase } from '../lib/supabase';

export const AppointmentService = {
    transform: (a) => ({
        ...a,
        userId: a.user_id,
        patientId: a.patient_id,
        doctorName: a.doctor_name,
        specialtyId: a.specialty_id,
        specialtyText: a.specialty_text,
        appointmentDate: a.appointment_date,
        locationName: a.location_name,
        address: a.address,
        contactPhone: a.contact_phone,
        whatsappPhone: a.whatsapp_phone,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        // Optional: Include expanded specialty if joined, otherwise fallback to specialtyText
        specialty: a.medical_specialties ? a.medical_specialties.name : a.specialty_text
    }),

    fetchAll: async () => {
        const { data, error } = await supabase
            .from('medical_appointments')
            .select(`
                *,
                patients (
                    name
                ),
                medical_specialties (
                    name
                )
            `)
            .order('appointment_date', { ascending: true });

        if (error) throw error;
        return data.map(AppointmentService.transform);
    },

    fetchByPatient: async (patientId) => {
        const { data, error } = await supabase
            .from('medical_appointments')
            .select(`
                *,
                medical_specialties (
                    name
                )
            `)
            .eq('patient_id', patientId)
            .order('appointment_date', { ascending: true });

        if (error) throw error;
        return data.map(AppointmentService.transform);
    },

    add: async (appointmentData, userId) => {
        const { data, error } = await supabase
            .from('medical_appointments')
            .insert([{
                user_id: userId,
                patient_id: appointmentData.patientId || null,
                doctor_name: appointmentData.doctorName,
                specialty_id: appointmentData.specialtyId || null,
                specialty_text: appointmentData.specialtyText,
                appointment_date: appointmentData.appointmentDate,
                location_name: appointmentData.locationName,
                address: appointmentData.address,
                contact_phone: appointmentData.contactPhone,
                whatsapp_phone: appointmentData.whatsappPhone,
                notes: appointmentData.notes,
                status: appointmentData.status || 'scheduled'
            }])
            .select('*, patients(name), medical_specialties(name)')
            .single();

        if (error) throw error;
        return AppointmentService.transform(data);
    },

    update: async (id, updatedData) => {
        const dbData = {};
        if (updatedData.patientId) dbData.patient_id = updatedData.patientId || null;
        if (updatedData.doctorName) dbData.doctor_name = updatedData.doctorName;
        if (updatedData.specialtyId !== undefined) dbData.specialty_id = updatedData.specialtyId || null;
        if (updatedData.specialtyText !== undefined) dbData.specialty_text = updatedData.specialtyText;
        if (updatedData.appointmentDate) dbData.appointment_date = updatedData.appointmentDate;
        if (updatedData.locationName !== undefined) dbData.location_name = updatedData.locationName;
        if (updatedData.address !== undefined) dbData.address = updatedData.address;
        if (updatedData.contactPhone !== undefined) dbData.contact_phone = updatedData.contactPhone;
        if (updatedData.whatsappPhone !== undefined) dbData.whatsapp_phone = updatedData.whatsappPhone;
        if (updatedData.notes !== undefined) dbData.notes = updatedData.notes;
        if (updatedData.status) dbData.status = updatedData.status;

        const { data, error } = await supabase
            .from('medical_appointments')
            .update(dbData)
            .eq('id', id)
            .select('*, patients(name), medical_specialties(name)')
            .single();

        if (error) throw error;
        return AppointmentService.transform(data);
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('medical_appointments')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
