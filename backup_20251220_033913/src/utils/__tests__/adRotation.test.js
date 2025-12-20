import { describe, it, expect } from 'vitest';
import { getWeightedOffers } from '../adRotation';

describe('getWeightedOffers', () => {

    it('returns empty array for empty input', () => {
        expect(getWeightedOffers([], 10)).toEqual([]);
    });

    it('returns unique items only', () => {
        const offers = [
            { id: 1, sponsor: { weight: 10 } },
            { id: 2, sponsor: { weight: 1 } },
            { id: 3, sponsor: { weight: 1 } }
        ];
        // Request count larger than available items
        const selected = getWeightedOffers(offers, 10);

        // Should return at most 3 items
        expect(selected.length).toBe(3);

        // Verify uniqueness
        const ids = selected.map(o => o.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('respects the limit', () => {
        const offers = Array.from({ length: 20 }, (_, i) => ({ id: i, sponsor: { weight: 1 } }));
        const selected = getWeightedOffers(offers, 5);
        expect(selected.length).toBe(5);
    });

    it('prioritizes higher weights statistically (Monte Carlo)', () => {
        const offerHigh = { id: 'HIGH', sponsor: { weight: 10 } };
        const offerLow = { id: 'LOW', sponsor: { weight: 1 } };
        // Add some noise items to dilute the pool a bit so selection isn't guaranteed
        const offers = [
            offerHigh,
            offerLow,
            { id: 'N1', sponsor: { weight: 1 } },
            { id: 'N2', sponsor: { weight: 1 } },
            { id: 'N3', sponsor: { weight: 1 } },
            { id: 'N4', sponsor: { weight: 1 } },
        ]; // Total items: 6. 
        // Total weight in pool: 10 + 1 + 1 + 1 + 1 + 1 = 15.
        // If we select 1 item:
        // P(High) = 10/15 = 66%
        // P(Low) = 1/15 = 6.6%

        let highCount = 0;
        let lowCount = 0;
        const trials = 2000;

        for (let i = 0; i < trials; i++) {
            // Select ONLY 1 item to test raw probability
            const selected = getWeightedOffers(offers, 1);
            if (selected[0].id === 'HIGH') highCount++;
            if (selected[0].id === 'LOW') lowCount++;
        }

        const highRate = highCount / trials;
        const lowRate = lowCount / trials;

        console.log(`High Rate: ${highRate}, Low Rate: ${lowRate}`);

        // Expect High to be roughly 10x Low
        // Allow some variance, but High should be significantly > Low
        expect(highRate).toBeGreaterThan(lowRate * 5);
        expect(highRate).toBeGreaterThan(0.5); // Should be around 0.66
        expect(lowRate).toBeLessThan(0.15); // Should be around 0.066
    });

});
