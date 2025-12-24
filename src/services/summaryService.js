/**
 * Service to calculate weekly health statistics for the summary feature.
 */

/**
 * Calculates statistics for the last 7 days.
 * 
 * @param {Array} patients List of patients
 * @param {Array} prescriptions List of prescriptions
 * @param {Array} consumptionLog List of medication consumption logs
 * @param {Array} healthLogs List of health logs (vitals)
 * @returns {Object} Calculated stats per patient
 */
export const calculateWeeklyStats = (patients, prescriptions, consumptionLog, healthLogs) => {
    const stats = {};
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Create a map for quick lookup: prescriptionId -> patientId
    const prescriptionToPatientMap = {};
    prescriptions.forEach(p => {
        prescriptionToPatientMap[p.id] = p.patientId;
    });

    patients.forEach(patient => {
        // Filter consumption logs for this patient in the last 7 days
        // We look up the patientId via the prescriptionId
        const patientConsumption = consumptionLog.filter(log => {
            const logPatientId = prescriptionToPatientMap[log.prescriptionId];
            return logPatientId === patient.id && new Date(log.date) >= sevenDaysAgo;
        });

        // Filter health logs for this patient in the last 7 days
        // Health logs typically have patient_id directly
        const patientHealth = healthLogs.filter(log =>
            (log.patient_id === patient.id || log.patientId === patient.id) &&
            new Date(log.measured_at || log.measuredAt) >= sevenDaysAgo
        );

        // 1. Medication Adherence
        const takenDoses = patientConsumption.filter(log => log.status === 'taken').length;
        const forgottenDoses = patientConsumption.filter(log => log.status === 'forgotten' || log.status === 'missed').length;
        const totalDosesRecorded = takenDoses + forgottenDoses;

        const adherenceRate = totalDosesRecorded > 0
            ? Math.round((takenDoses / totalDosesRecorded) * 100)
            : null;

        // 2. Average Blood Pressure
        const pressureLogs = patientHealth.filter(log => log.category === 'pressure');
        let avgSystolic = 0;
        let avgDiastolic = 0;

        if (pressureLogs.length > 0) {
            const sumSystolic = pressureLogs.reduce((acc, log) => acc + (parseFloat(log.value) || 0), 0);
            const sumDiastolic = pressureLogs.reduce((acc, log) => acc + (parseFloat(log.value_secondary || log.valueSecondary) || 0), 0);
            avgSystolic = Math.round(sumSystolic / pressureLogs.length);
            avgDiastolic = Math.round(sumDiastolic / pressureLogs.length);
        }

        // 3. Average Glucose
        const glucoseLogs = patientHealth.filter(log => log.category === 'glucose');
        let avgGlucose = 0;
        if (glucoseLogs.length > 0) {
            const sumGlucose = glucoseLogs.reduce((acc, log) => acc + (parseFloat(log.value) || 0), 0);
            avgGlucose = Math.round(sumGlucose / glucoseLogs.length);
        }

        stats[patient.id] = {
            patientName: patient.name,
            adherenceRate,
            takenDoses,
            forgottenDoses,
            avgPressure: pressureLogs.length > 0 ? `${avgSystolic}/${avgDiastolic}` : null,
            avgGlucose: glucoseLogs.length > 0 ? avgGlucose : null,
            totalLogs: patientConsumption.length + patientHealth.length
        };
    });

    return stats;
};
