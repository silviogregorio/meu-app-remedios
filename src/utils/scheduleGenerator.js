export const generateDailySchedule = (dateStr, prescriptions) => {
    const schedule = [];
    const date = new Date(dateStr);

    // Normalize time to 00:00:00 assuming local time handling in Date Strings
    // The inputs 'dateStr' is YYYY-MM-DD.
    // Prescriptions are loaded.

    prescriptions.forEach(presc => {
        // Date Checks
        const start = new Date(presc.startDate);
        const end = new Date(presc.endDate);
        const current = new Date(dateStr);

        // Reset hours for pure date comparison
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        current.setHours(0, 0, 0, 0); // This relies on local time interpreting dateStr correctly

        // Check range
        if (current < start || current > end) return;

        // Add items
        if (presc.times && Array.isArray(presc.times)) {
            presc.times.forEach(time => {
                schedule.push({
                    prescriptionId: presc.id,
                    time: time,
                    // Minimal data needed for verification
                });
            });
        }
    });

    return schedule;
};
