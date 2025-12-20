import { generateDailySchedule } from './scheduleGenerator';

// Helper to check if a specific date was "perfect" (all scheduled meds taken)
const isDayPerfect = (dateStr, prescriptions, consumptionLog) => {
    // 1. Generate schedule for that date
    // We need a generator that works for a specific historic date.
    // Reusing the logic from Home.jsx roughly, but strictly.

    // Abstracting schedule generation
    const schedule = generateDailySchedule(dateStr, prescriptions);

    if (schedule.length === 0) return true; // Empty days count as perfect (Rest days)

    // 2. Check if all items are in consumptionLog
    const allTaken = schedule.every(item => {
        return consumptionLog.some(log =>
            log.prescriptionId === item.prescriptionId &&
            // Compare times (HH:MM)
            log.scheduledTime?.substring(0, 5) === item.time &&
            log.date === dateStr &&
            log.status === 'taken'
        );
    });

    return allTaken;
};

export const calculateStreak = (prescriptions, consumptionLog) => {
    let streak = 0;
    const today = new Date();

    // Check Today first
    // If today is NOT perfect yet, we don't count it for the "finished streak" number displayed,
    // UNLESS we want "Current Streak" (including today if perfect so far? No, usually Start of Day = Streak).
    // Standard: Streak = Consecutive COMPLETED days before today.
    // +1 if Today is completed.

    // Let's count backwards starting from YESTERDAY.
    let d = new Date();
    d.setDate(d.getDate() - 1); // Start Yesterday

    // Safety break
    let maxDays = 365;

    while (maxDays > 0) {
        const dateStr = d.toISOString().split('T')[0];

        // Optimize: If date is before ALL prescriptions start dates, stop.
        // Find earliest start date
        // (Optional optimization, skipping for now as local array is fast)

        if (isDayPerfect(dateStr, prescriptions, consumptionLog)) {
            streak++;
        } else {
            break; // Streak broken
        }

        d.setDate(d.getDate() - 1);
        maxDays--;
    }

    // Now check TODAY. If today is fully complete (and has doses), add 1 to streak.
    // If today is empty (Rest day), it counts as perfect automatically? 
    // Usually Apps display "Streak: X" where X includes today ONLY if today is done.

    const todayStr = new Date().toISOString().split('T')[0];
    if (isDayPerfect(todayStr, prescriptions, consumptionLog)) {
        // Only increment if today is *actually* perfect.
        // But simply "isDayPerfect" returns true for empty days.
        // Yes, if today is rest day, streak continues.
        // If today has doses and they are ALL taken, streak increments.
        // If today has doses and NOT all taken, streak is just the past days.
        streak++;
    }

    return streak;
};
