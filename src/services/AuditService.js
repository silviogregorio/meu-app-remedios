import { supabase } from '../lib/supabase';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes debounce per resource/action
const lastLogTime = {}; // In-memory cache for debounce: key = `${ownerId}-${action}-${resource}`

export const AuditService = {
    /**
     * Log an access event
     * @param {string} ownerId - ID of the user whose data is being accessed
     * @param {string} accessedBy - ID of the user performing the action
     * @param {string} action - 'VIEW', 'EDIT', 'DELETE', etc.
     * @param {string} resource - 'DIARY', 'MEDICATIONS', 'PROFILE', etc.
     * @param {string} details - Optional details
     */
    logAccess: async (ownerId, accessedBy, action, resource, details = '') => {
        // 1. Don't log if owner is accessing their own data
        if (ownerId === accessedBy) return;

        // 2. Debounce Check
        const key = `${ownerId}-${action}-${resource}`;
        const now = Date.now();
        if (lastLogTime[key] && (now - lastLogTime[key] < COOLDOWN_MS)) {
            // console.log('Audit Log throttled for:', key);
            return;
        }

        try {
            const { error } = await supabase.from('access_logs').insert([{
                owner_id: ownerId,
                accessed_by: accessedBy,
                action,
                resource,
                details
            }]);

            if (error) {
                console.error('Failed to log access:', error);
            } else {
                lastLogTime[key] = now; // Update timestamp
            }
        } catch (err) {
            console.error('Audit Service Error:', err);
        }
    },

    /**
     * Get logs for the owner (to see who accessed their data)
     */
    getLogs: async (ownerId) => {
        const { data, error } = await supabase
            .from('access_logs')
            .select(`
                *,
                actor:profiles!accessed_by (full_name, email)
            `)
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data;
    }
};
