import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../hooks/useNotifications';
import { format } from 'date-fns';
import { getISODate } from '../utils/dateFormatter';

const NotificationManager = () => {
    const { prescriptions, medications, consumptionLog, patients, accessibility, speak } = useApp();
    const { sendNotification, permission } = useNotifications();
    const notifiedDosesRef = useRef(new Set());

    useEffect(() => {
        if (permission !== 'granted') return;

        const checkDoses = () => {
            const now = new Date();
            const todayStr = getISODate();

            // Calculate schedule for today (simplified version of Home.jsx logic)
            const schedule = [];
            prescriptions.forEach(presc => {
                // Check if prescription is active
                if (presc.endDate && new Date(presc.endDate) < new Date(todayStr)) return;
                if (new Date(presc.startDate) > new Date(todayStr)) return;

                const med = medications.find(m => m.id === presc.medicationId);
                const patient = patients.find(p => p.id === presc.patientId);

                presc.times.forEach(time => {
                    // Check if already taken
                    const isTaken = consumptionLog.some(log =>
                        log.prescriptionId === presc.id &&
                        log.scheduledTime?.substring(0, 5) === time &&
                        log.date === todayStr
                    );

                    if (!isTaken) {
                        schedule.push({
                            id: `${presc.id}-${time}`,
                            medicationName: med?.name,
                            patientName: patient?.name,
                            time: time
                        });
                    }
                });
            });

            // Check for upcoming doses (e.g., in the next 15 minutes)
            schedule.forEach(item => {
                const [hours, minutes] = item.time.split(':').map(Number);
                const doseDate = new Date();
                doseDate.setHours(hours, minutes, 0, 0);

                const diffMinutes = (doseDate - now) / 60000;

                // Notify if dose is within 15 minutes and hasn't been notified yet
                // Also notify if it's "now" (diffMinutes between -1 and 1)
                if (diffMinutes <= 15 && diffMinutes > -5) {
                    const notificationId = `${item.id}-${todayStr}`;

                    if (!notifiedDosesRef.current.has(notificationId)) {
                        sendNotification(`Hora do Remédio: ${item.medicationName}`, {
                            body: `${item.patientName} precisa tomar ${item.medicationName} às ${item.time}.`,
                            tag: notificationId // Prevent duplicate notifications on some platforms
                        });

                        // TTS Voice Alert
                        if (accessibility?.voiceEnabled) {
                            speak(`Olá! Hora do remédio para ${item.patientName === 'Você' ? 'você' : item.patientName}. É hora de tomar ${item.medicationName}.`);
                        }

                        notifiedDosesRef.current.add(notificationId);
                    }
                }
            });
        };

        // Check immediately and then every minute
        checkDoses();
        const intervalId = setInterval(checkDoses, 60000);

        return () => clearInterval(intervalId);
    }, [prescriptions, medications, consumptionLog, patients, permission, sendNotification]);

    return null; // This component doesn't render anything
};

export default NotificationManager;
