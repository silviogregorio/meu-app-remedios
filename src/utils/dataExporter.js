import { format } from 'date-fns';

/**
 * Downloads data as a JSON file
 * @param {Object} data - The data object to export (e.g. { patients, medications... })
 * @param {String} filename - The desired filename
 */
export const downloadJSON = (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `backup-sigremedios-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Prepares the full backup object from AppContext data
 * @param {Object} contextData - The data from useApp
 * @param {Object} user - The current user
 * @returns {Object} Structured backup object
 */
export const prepareBackupData = (contextData, user) => {
    return {
        meta: {
            exportedAt: new Date().toISOString(),
            userEmail: user?.email,
            userId: user?.id,
            appVersion: '1.3.38' // Could be dynamic
        },
        data: {
            patients: contextData.patients || [],
            medications: contextData.medications || [],
            prescriptions: contextData.prescriptions || [],
            consumptionUsage: contextData.consumptionLog || [],
            healthDiary: contextData.healthLogs || []
        }
    };
};
