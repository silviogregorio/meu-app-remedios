/**
 * Utility functions for Google Calendar integration
 */

/**
 * Generates a Google Calendar URL for adding a medication reminder
 * @param {Object} prescription - Prescription object
 * @param {Object} medication - Medication object
 * @param {Object} patient - Patient object
 * @param {string} specificTime - Specific time for this event (HH:mm format)
 * @returns {string} Google Calendar URL
 */
export const generateGoogleCalendarUrl = (prescription, medication, patient, specificTime) => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

    // Event title
    const title = `💊 ${medication?.name || 'Medicamento'} - ${patient?.name || 'Paciente'}`;

    // Event description
    const dosage = prescription.doseAmount || '1';
    const unit = prescription.doseUnit || 'unidade';
    const instructions = prescription.instructions || '';

    const description = `
Medicamento: ${medication?.name}
Paciente: ${patient?.name}
Dose: ${dosage} ${unit}
${instructions ? `Instruções: ${instructions}` : ''}

Registrado via SiG Remédios
  `.trim();

    // Calculate start and end time
    const today = new Date();
    const [hours, minutes] = specificTime.split(':');

    // Start date (today at specified time)
    const startDate = new Date(today);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // End date (15 minutes after start)
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 15);

    // Format dates for Google Calendar (yyyyMMddTHHmmss)
    const formatDateForGoogle = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const sec = '00';
        return `${year}${month}${day}T${hour}${min}${sec}`;
    };

    const dates = `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`;

    // Recurrence rule (daily until end date, or indefinitely if no end date)
    let recurrence = 'RRULE:FREQ=DAILY';
    if (prescription.endDate) {
        const endDateObj = new Date(prescription.endDate);
        const untilDate = endDateObj.toISOString().split('T')[0].replace(/-/g, '');
        recurrence += `;UNTIL=${untilDate}`;
    }

    // Build URL
    const params = new URLSearchParams({
        text: title,
        details: description,
        dates: dates,
        recur: recurrence,
        ctz: 'America/Sao_Paulo',
        // Add reminder (15 minutes before)
        remind: '15'
    });

    return `${baseUrl}&${params.toString()}`;
};

/**
 * Generates multiple Google Calendar URLs for a prescription with multiple times
 * @param {Object} prescription - Prescription object
 * @param {Object} medication - Medication object  
 * @param {Object} patient - Patient object
 * @returns {Array} Array of {time, url} objects
 */
export const generateCalendarUrlsForPrescription = (prescription, medication, patient) => {
    if (!prescription.times || !Array.isArray(prescription.times)) {
        return [];
    }

    return prescription.times.map(time => ({
        time,
        url: generateGoogleCalendarUrl(prescription, medication, patient, time)
    }));
};

/**
 * Downloads an .ics file for importing into any calendar app
 * @param {Object} prescription - Prescription object
 * @param {Object} medication - Medication object
 * @param {Object} patient - Patient object
 * @param {string} specificTime - Specific time for this event
 */
export const downloadICalFile = (prescription, medication, patient, specificTime) => {
    const [hours, minutes] = specificTime.split(':');
    const startDate = new Date();
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 15);

    const formatDateForICal = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = `💊 ${medication?.name || 'Medicamento'} - ${patient?.name || 'Paciente'}`;
    const dosage = prescription.doseAmount || '1';
    const unit = prescription.doseUnit || 'unidade';
    const instructions = prescription.instructions || '';

    const description = `Medicamento: ${medication?.name}\\nPaciente: ${patient?.name}\\nDose: ${dosage} ${unit}${instructions ? `\\nInstruções: ${instructions}` : ''}`;

    let rrule = 'FREQ=DAILY';
    if (prescription.endDate) {
        const endDateObj = new Date(prescription.endDate);
        rrule += `;UNTIL=${formatDateForICal(endDateObj)}`;
    }

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SiG Remédios//Medication Reminder//EN',
        'BEGIN:VEVENT',
        `UID:${prescription.id}-${specificTime}@sigremedios.app`,
        `DTSTAMP:${formatDateForICal(new Date())}`,
        `DTSTART:${formatDateForICal(startDate)}`,
        `DTEND:${formatDateForICal(endDate)}`,
        `RRULE:${rrule}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${title}`,
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    // Create and download file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `medicamento-${medication?.name}-${specificTime}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
