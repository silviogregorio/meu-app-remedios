import { getISODate } from './dateFormatter';

export const generateICS = (scheduleItems) => {
    // Basic VCALENDAR header
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SiG Remedios//Calendar Export//PT-BR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];

    // Get current time formatted for stamp
    const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

    scheduleItems.forEach(item => {
        // Skip taken items if desirable? No, export everything.

        // Format start time
        // item.date is YYYY-MM-DD
        // item.time is HH:MM
        const [year, month, day] = item.date.split('-'); // Assuming item has date property attached in loop, or we construct it.
        // Actually Home.jsx 'todaysSchedule' only has time for TODAY.
        // We need a loop to generate for multiple days if we want a real export.

        // HOWEVER, for simplicity let's stick to the passed items first.
        // If the item doesn't have a full date, we construct it.

        let startDateTime;
        if (item.fullDateTime) {
            startDateTime = new Date(item.fullDateTime).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
        } else {
            // Fallback if we only have time and it's for today
            const d = new Date();
            const [h, m] = item.time.split(':');
            d.setHours(h, m, 0);
            startDateTime = d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
        }

        const endDateTime = new Date(
            new Date(
                startDateTime.slice(0, 4) + '-' +
                startDateTime.slice(4, 6) + '-' +
                startDateTime.slice(6, 11) + ':' +
                startDateTime.slice(11, 13) + ':' +
                startDateTime.slice(13, 15) + 'Z'
            ).getTime() + 15 * 60000 // 15 minutes duration
        ).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${item.id}-${now}@sigremedios.app`);
        icsContent.push(`DTSTAMP:${now}`);
        icsContent.push(`DTSTART:${startDateTime}`);
        icsContent.push(`DTEND:${endDateTime}`);
        icsContent.push(`SUMMARY:Tomar ${item.medicationName} (${item.dosage})`);
        icsContent.push(`DESCRIPTION:Paciente: ${item.patientName}\\nDose: ${item.doseAmount}x`);
        icsContent.push('STATUS:CONFIRMED');
        icsContent.push('BEGIN:VALARM');
        icsContent.push('TRIGGER:-PT5M');
        icsContent.push('ACTION:DISPLAY');
        icsContent.push('DESCRIPTION:Hora do Remédio');
        icsContent.push('END:VALARM');
        icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    // Create blob and download
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `remedios_agenda_${now.slice(0, 8)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper to generate future items for export
export const generateFutureSchedule = (prescriptions, medications, patients, days = 7) => {
    const schedule = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = getISODate(currentDate);

        // Normalize for comparison
        currentDate.setHours(0, 0, 0, 0);

        prescriptions.forEach(presc => {
            const start = new Date(presc.startDate);
            const end = new Date(presc.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (currentDate >= start && currentDate <= end) {
                if (presc.times && Array.isArray(presc.times)) {
                    const med = medications.find(m => m.id === presc.medicationId);
                    const patient = patients.find(p => p.id === presc.patientId);

                    presc.times.forEach(time => {
                        schedule.push({
                            id: `${presc.id}-${dateStr}-${time}`,
                            date: dateStr,
                            time: time,
                            fullDateTime: `${dateStr}T${time}:00`,
                            medicationName: med?.name || 'Desconhecido',
                            dosage: med?.dosage || '',
                            patientName: patient?.name || 'Paciente',
                            doseAmount: presc.doseAmount || '1'
                        });
                    });
                }
            }
        });
    }
    return schedule;
};
