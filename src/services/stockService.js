import { supabase } from '../lib/supabase';

/**
 * Stock Management Service
 * Handles stock calculations, predictions, and refill operations
 */
export const StockService = {
    /**
     * Calculate days until medication runs out based on prescription usage
     * @param {Object} medication - Medication object with quantity
     * @param {Array} prescriptions - Active prescriptions using this medication
     * @returns {number|null} - Days until depletion, or null if cannot calculate
     */
    getDaysUntilDepletion: (medication, prescriptions) => {
        if (!medication || medication.quantity <= 0) return 0;

        // Find all active prescriptions for this medication
        const activePrescriptions = prescriptions.filter(p =>
            p.medicationId === medication.id &&
            (p.continuousUse || !p.endDate || new Date(p.endDate) >= new Date())
        );

        if (activePrescriptions.length === 0) return null; // Not in use

        // Calculate daily consumption
        let dailyConsumption = 0;
        activePrescriptions.forEach(p => {
            const doseAmount = parseFloat(p.doseAmount) || 1;
            const timesPerDay = Array.isArray(p.times) ? p.times.length : 1;

            // Adjust for frequency
            let frequencyMultiplier = 1;
            if (p.frequency === 'daily') frequencyMultiplier = 1;
            else if (p.frequency === 'weekly') frequencyMultiplier = 1 / 7;
            else if (p.frequency === 'monthly') frequencyMultiplier = 1 / 30;
            else if (p.frequency === 'every_other_day') frequencyMultiplier = 0.5;

            dailyConsumption += doseAmount * timesPerDay * frequencyMultiplier;
        });

        if (dailyConsumption <= 0) return null;

        const daysRemaining = Math.floor(medication.quantity / dailyConsumption);
        return daysRemaining;
    },

    /**
     * Get stock severity level based on days remaining
     * @param {number} daysRemaining 
     * @returns {'critical' | 'warning' | 'ok' | 'unused'}
     */
    getStockLevel: (daysRemaining) => {
        if (daysRemaining === null) return 'unused';
        if (daysRemaining <= 3) return 'critical';
        if (daysRemaining <= 7) return 'warning';
        return 'ok';
    },

    /**
     * Get stock history for a medication
     * @param {string} medicationId 
     * @param {number} days - Number of days to look back
     * @returns {Promise<Array>}
     */
    getStockHistory: async (medicationId, days = 30) => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('stock_history')
            .select(`
                *,
                patients:patient_id (name),
                profiles:user_id (full_name)
            `)
            .eq('medication_id', medicationId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Add a refill (restock) to medication
     * @param {string} medicationId 
     * @param {number} quantity - Amount to add
     * @param {string} userId 
     * @param {number} currentBalance 
     * @param {string} notes 
     * @returns {Promise<Object>}
     */
    addRefill: async (medicationId, quantity, userId, currentBalance, notes = '') => {
        const newBalance = currentBalance + quantity;

        // 1. Update medication quantity
        const { error: updateError } = await supabase
            .from('medications')
            .update({ quantity: newBalance })
            .eq('id', medicationId);

        if (updateError) throw updateError;

        // 2. Log to stock history
        const { data, error: historyError } = await supabase
            .from('stock_history')
            .insert([{
                user_id: userId,
                medication_id: medicationId,
                quantity_change: quantity,
                previous_balance: currentBalance,
                new_balance: newBalance,
                reason: 'refill',
                notes: notes || 'Reposição de estoque'
            }])
            .select()
            .single();

        if (historyError) throw historyError;

        return { newBalance, historyEntry: data };
    },

    /**
     * Get all medications with low stock for a user
     * @param {Array} medications 
     * @param {Array} prescriptions 
     * @param {number} thresholdDays - Days threshold for low stock warning
     * @returns {Array}
     */
    getLowStockMedications: (medications, prescriptions, thresholdDays = 7) => {
        return medications
            .map(med => {
                const daysRemaining = StockService.getDaysUntilDepletion(med, prescriptions);
                return {
                    ...med,
                    daysRemaining,
                    level: StockService.getStockLevel(daysRemaining)
                };
            })
            .filter(med => med.level === 'critical' || med.level === 'warning')
            .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
    },

    /**
     * Prepare data for stock chart
     * @param {Array} history - Stock history entries
     * @returns {Array} - Chart-ready data points
     */
    prepareChartData: (history) => {
        if (!history || history.length === 0) return [];

        // Group by date and get end-of-day balance
        const dailyData = {};
        history.forEach(entry => {
            const date = new Date(entry.created_at).toISOString().split('T')[0];
            dailyData[date] = entry.new_balance;
        });

        return Object.entries(dailyData).map(([date, balance]) => ({
            date,
            balance: parseFloat(balance) || 0
        }));
    },

    /**
     * Translate reason to Portuguese
     * @param {string} reason 
     * @returns {string}
     */
    translateReason: (reason) => {
        const translations = {
            'refill': 'Reposição',
            'consumption': 'Consumo',
            'adjustment': 'Ajuste',
            'initial': 'Cadastro inicial',
            'expired': 'Vencido',
            'lost': 'Perda',
            'other': 'Outro'
        };
        return translations[reason] || reason;
    }
};
