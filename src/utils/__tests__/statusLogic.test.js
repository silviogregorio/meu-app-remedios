import { describe, it, expect } from 'vitest';

// Simulating the function logic used in HealthDiary to determine status
const calculateStatus = (takenCount, expectedCount, viewDate) => {
    const today = new Date().setHours(0, 0, 0, 0);
    // Fix: explicitly handle YYYY-MM-DD to avoid Zulu time which might fall back to previous day
    const [y, m, d] = viewDate.split('-').map(Number);
    const view = new Date(y, m - 1, d).setHours(0, 0, 0, 0);

    if (takenCount >= expectedCount && expectedCount > 0) {
        return 'Tomado';
    } else if (takenCount > 0) {
        return 'Parcial';
    } else if (view < today) {
        return 'Não Tomado';
    }
    return 'Pendente';
};

describe('Health Diary Status Logic', () => {
    it('returns "Tomado" when taken count meets expected count', () => {
        expect(calculateStatus(2, 2, '2023-01-01')).toBe('Tomado');
    });

    it('returns "Parcial" when taken count is greater than 0 but less than expected', () => {
        expect(calculateStatus(1, 2, '2023-01-01')).toBe('Parcial');
    });

    it('returns "Não Tomado" for past dates with 0 taken', () => {
        // Create a past date
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const dateStr = pastDate.toISOString().split('T')[0];

        expect(calculateStatus(0, 2, dateStr)).toBe('Não Tomado');
    });

    it('returns "Pendente" for today/future with 0 taken', () => {
        // Today
        const today = new Date().toISOString().split('T')[0];
        expect(calculateStatus(0, 2, today)).toBe('Pendente');
    });
});
