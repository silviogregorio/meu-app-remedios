
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfferService } from './offerService';

// Define mocks using vi.hoisted to survive hoisting
const mocks = vi.hoisted(() => {
    // Create a chain object
    const chain = {};

    // Create spies that return the chain
    const select = vi.fn(() => chain);
    const eq = vi.fn(() => chain);
    const or = vi.fn(() => chain);
    const order = vi.fn(() => chain);

    // 'from' returns the chain
    const from = vi.fn(() => chain);

    // Populate chain with spies
    Object.assign(chain, {
        select, eq, or, order,
        then: (onFulfilled) => Promise.resolve({ data: [], error: null }).then(onFulfilled)
    });

    return {
        select, eq, or, order, from, chain
    };
});

// Mock the module
vi.mock('../lib/supabase', () => {
    return {
        supabase: {
            from: mocks.from.mockReturnValue(mocks.chain)
        }
    };
});

describe('OfferService Security & Logic', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset call counts but keep implementation (returning chain)
    });

    describe('fetchByLocation (Public View)', () => {
        it('should filter by active status', async () => {
            console.log('Test: Calling fetchActiveWeightedOffers');
            try {
                await OfferService.fetchByLocation('12345');
            } catch (error) {
                console.error('Test Error:', error);
            }
            console.log('Test: Call complete');

            expect(mocks.eq).toHaveBeenCalledWith('active', true);
        });

        it('should enforce date constraints (starts_at, expires_at)', async () => {
            await OfferService.fetchByLocation('12345');
            // Check start and end date constraints
            expect(mocks.or).toHaveBeenCalledWith(expect.stringContaining('starts_at.lte.now()'));
            expect(mocks.or).toHaveBeenCalledWith(expect.stringContaining('expires_at.gt.now()'));
        });

        it('should filter by user location (ibge_code)', async () => {
            await OfferService.fetchByLocation('12345');
            expect(mocks.eq).toHaveBeenCalledWith('sponsor.ibge_code', '12345');
        });
    });
});
