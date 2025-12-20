import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Analyzes user activity for security threats
 * @param {string} userId - User ID
 * @param {string} action - Action being performed
 * @param {string} ipAddress - Client IP address
 * @param {Object} metadata - Additional context
 * @returns {Promise<Array>} Array of detected threats
 */
export const analyzeSecurityThreats = async (userId, action, ipAddress, metadata = {}) => {
    const threats = [];
    const now = new Date();

    try {
        // Fetch recent logs for this user (last 24 hours)
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const { data: recentLogs, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', yesterday.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching audit logs:', error);
            return threats;
        }

        // THREAT 1: Multiple IPs in 24 hours (3+ different IPs)
        const uniqueIPs = new Set(recentLogs.map(log => log.ip_address).filter(Boolean));
        if (ipAddress) uniqueIPs.add(ipAddress);

        if (uniqueIPs.size >= 3) {
            threats.push({
                type: 'multiple_ips',
                severity: 'high',
                description: `${uniqueIPs.size} IPs diferentes detectados em 24h`,
                details: { ips: Array.from(uniqueIPs) }
            });
        }

        // THREAT 2: Bulk actions (more than 20 actions in 5 minutes)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const recentActions = recentLogs.filter(log =>
            new Date(log.created_at) >= fiveMinutesAgo
        );

        if (recentActions.length >= 20) {
            threats.push({
                type: 'bulk_actions',
                severity: 'critical',
                description: `${recentActions.length} ações em 5 minutos`,
                details: { count: recentActions.length }
            });
        }

        // THREAT 3: Impossible speed / Location change
        // Check if there's a country change in metadata within short time
        if (metadata.country && recentLogs.length > 0) {
            const recentCountries = recentLogs
                .filter(log => log.metadata?.country)
                .map(log => log.metadata.country);

            if (recentCountries.length > 0) {
                const lastCountry = recentCountries[0];
                if (lastCountry !== metadata.country) {
                    const timeDiff = now - new Date(recentLogs[0].created_at);
                    const hoursDiff = timeDiff / (1000 * 60 * 60);

                    // If country changed in less than 2 hours, flag as impossible
                    if (hoursDiff < 2) {
                        threats.push({
                            type: 'impossible_location',
                            severity: 'critical',
                            description: `Mudança de país: ${lastCountry} → ${metadata.country} em ${Math.round(hoursDiff * 60)} minutos`,
                            details: { from: lastCountry, to: metadata.country, minutes: Math.round(hoursDiff * 60) }
                        });
                    }
                }
            }
        }

        // THREAT 4: High-risk actions
        const highRiskActions = ['delete_prescription', 'delete_patient', 'unshare_patient', 'export_data'];
        if (highRiskActions.includes(action)) {
            threats.push({
                type: 'high_risk_action',
                severity: 'medium',
                description: `Ação de alto risco: ${action}`,
                details: { action }
            });
        }

        // THREAT 5: Multiple failed attempts (if action is failed_login)
        if (action === 'failed_login') {
            const failedLogins = recentLogs.filter(log => log.action === 'failed_login');
            if (failedLogins.length >= 3) {
                threats.push({
                    type: 'multiple_failed_logins',
                    severity: 'critical',
                    description: `${failedLogins.length + 1} tentativas de login falhadas`,
                    details: { count: failedLogins.length + 1 }
                });
            }
        }

    } catch (err) {
        console.error('Error analyzing security threats:', err);
    }

    return threats;
};

/**
 * Get real-time IP address of client
 * @returns {Promise<string>} IP address
 */
export const getClientIP = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP:', error);
        return null;
    }
};

/**
 * Get country from IP using ipapi.co (free tier: 1000 requests/day)
 * @param {string} ip - IP address
 * @returns {Promise<string>} Country code
 */
export const getCountryFromIP = async (ip) => {
    if (!ip) return null;

    try {
        const response = await fetch(`https://ipapi.co/${ip}/country/`);
        const country = await response.text();
        return country || null;
    } catch (error) {
        console.error('Error fetching country:', error);
        return null;
    }
};

/**
 * Calculate risk level based on threats
 * @param {Array} threats - Array of threats
 * @returns {string} Risk level: low, medium, high, critical
 */
export const calculateRiskLevel = (threats) => {
    if (threats.length === 0) return 'low';

    const hasCritical = threats.some(t => t.severity === 'critical');
    const hasHigh = threats.some(t => t.severity === 'high');

    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    return 'medium';
};
