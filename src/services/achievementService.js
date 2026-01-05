import { supabase } from '../lib/supabase';
import { startOfDay, subDays, format, isSameDay, parseISO } from 'date-fns';

export const AchievementService = {

    /**
     * Main entry point to check for achievements based on recent actions.
     * @param {string} userId
     * @param {object} context - { type: 'medication' | 'health' | 'login', data: any }
     */
    checkAchievements: async (userId, context) => {
        const newUnlocks = [];

        try {
            // 1. Fetch user's current achievements to avoid re-checking unlocked ones
            const { data: userAchievements } = await supabase
                .from('user_achievements')
                .select('achievement_code')
                .eq('user_id', userId);

            const unlockedCodes = new Set(userAchievements?.map(ua => ua.achievement_code) || []);

            // 2. Helper to unlock
            const tryUnlock = async (code, checkFn) => {
                if (!unlockedCodes.has(code)) {
                    console.log(`Checking achievement: ${code}`);
                    const isEligible = await checkFn();
                    if (isEligible) {
                        await AchievementService.unlock(userId, code);
                        newUnlocks.push(code);
                    }
                }
            };

            // 3. Check Specific Badges based on Context

            // --- GENERAL / FIRST STEPS ---
            await tryUnlock('first_step', async () => true); // If we are here, users did something. Simplified logic.

            // --- MEDICATION RELATED ---
            if (context.type === 'medication') {
                const { log, prescription } = context.data;

                // "Madrugador": Before 8 AM
                await tryUnlock('early_bird', async () => {
                    if (!log?.taken_at) return false;
                    const takenTime = new Date(log.taken_at);
                    return takenTime.getHours() < 8;
                });

                // "Semana Perfeita": 100% adherence last 7 days
                await tryUnlock('perfect_week', async () => {
                    return await AchievementService.checkAdherenceStreak(userId, 7, 100);
                });
            }

            // --- HEALTH LOG RELATED ---
            if (context.type === 'health') {
                // "Vigilante": 7 days streak of health logs
                await tryUnlock('vigilante', async () => {
                    return await AchievementService.checkLogStreak(userId, 7);
                });
            }

            return newUnlocks;

        } catch (error) {
            console.error('Error checking achievements:', error);
            return [];
        }
    },

    /**
     * Records an achievement as unlocked.
     */
    unlock: async (userId, code) => {
        try {
            const { error } = await supabase
                .from('user_achievements')
                .insert([{ user_id: userId, achievement_code: code }]);

            if (error && error.code !== '23505') { // Ignore unique violation
                throw error;
            }
            return true;
        } catch (e) {
            console.error(`Failed to unlock achievement ${code}:`, e);
            return false;
        }
    },

    /**
     * Checks if user has consecutive days with at least one record in a table.
     */
    checkLogStreak: async (userId, days) => {
        const today = new Date();
        // We need to check if there is a log for each of the last N days
        // Efficient way: limit query to last N+2 days, distinct dates, check count

        const startDate = subDays(today, days);

        // Check health logs
        const { data: logs } = await supabase
            .from('health_logs')
            .select('measured_at')
            .eq('user_id', userId)
            .gte('measured_at', startDate.toISOString())
            .order('measured_at', { ascending: false });

        if (!logs || logs.length === 0) return false;

        const uniqueDays = new Set(logs.map(l => format(new Date(l.measured_at), 'yyyy-MM-dd')));

        // Simple check: does user have N unique days in the last N+1 days window?
        // This is approximate but performant.
        return uniqueDays.size >= days;
    },

    /**
     * Checks for perfect adherence over N days.
     * Logic: (Taken Doses / Scheduled Doses) == 1 for the period.
     */
    checkAdherenceStreak: async (userId, days, targetPercentage = 100) => {
        // This is complex because we need "Scheduled" vs "Taken".
        // "consumption_log" stores history. We can assume if status='taken' it is good.
        // However, knowing how many they *missed* is hard without checking all prescriptions.
        // Simplified Logic for MVP:
        // Check if user has taken meds every day for 7 days AND has no "missed" status logs (if we tracked them).
        // As we don't track "missed" rows explicitly in this app (we just show them as empty),
        // we will check if they have Activity for 7 days consecutive.
        // Ideally, for "Perfect Week", we'd be stricter, but let's start with "Consistency".

        const startDate = subDays(new Date(), days).toISOString();

        const { data: logs } = await supabase
            .from('consumption_log')
            .select('date, status')
            .eq('taken_by', userId) // or based on user context
            .eq('status', 'taken')
            .gte('date', startDate);

        if (!logs || logs.length === 0) return false;

        const uniqueDays = new Set(logs.map(l => l.date)); // date is YYYY-MM-DD string in DB usually
        return uniqueDays.size >= days;
    },

    /**
     * Get all achievements for a user (locked and unlocked)
     */
    getAchievements: async (userId) => {
        // Get all definitions
        const { data: allBadges, error: badgesError } = await supabase
            .from('achievements')
            .select('*')
            .order('points', { ascending: true });

        if (badgesError) throw badgesError;

        // Get user progress
        const { data: userBadges, error: userError } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId);

        if (userError) throw userError;

        const unlockedMap = new Map();
        userBadges.forEach(ub => unlockedMap.set(ub.achievement_code, ub));

        return allBadges.map(badge => ({
            ...badge,
            isUnlocked: unlockedMap.has(badge.code),
            unlockedAt: unlockedMap.get(badge.code)?.unlocked_at,
            metadata: unlockedMap.get(badge.code)?.metadata
        }));
    }
};
