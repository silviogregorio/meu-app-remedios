
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OfferService } from './offerService';

// Define mocks using vi.hoisted to survive hoisting
const mocks = vi.hoisted(() => {
    const select = vi.fn();
    const eq = vi.fn();
    const or = vi.fn();
    const order = vi.fn();
    const from = vi.fn();

    // Create a chain object that returns itself for all methods
    const chain = {
        select: (...args) => { console.log('Mock: select', args); return chain; },
        eq: (...args) => { console.log('Mock: eq', args); return chain; },
        or: (...args) => { console.log('Mock: or', args); return chain; },
        order: (...args) => { console.log('Mock: order', args); return chain; },
        then: (onFulfilled) => {
            console.log('Mock: then called');
            return Promise.resolve({ data: [], error: null }).then(onFulfilled);
        }
    };

    // Configure mocks (spies) to match for expectations, but implementation is fixed above
    select.mockImplementation((...args) => chain.select(...args));
    eq.mockImplementation((...args) => chain.eq(...args));
    or.mockImplementation((...args) => chain.or(...args));
    order.mockImplementation((...args) => chain.order(...args));

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
                await OfferService.fetchActiveWeightedOffers('12345');
            } catch (error) {
                console.error('Test Error:', error);
            }
            console.log('Test: Call complete');

            expect(mocks.eq).toHaveBeenCalledWith('active', true);
        });

        it('should enforce date constraints (starts_at, expires_at)', async () => {
            await OfferService.fetchActiveWeightedOffers('12345');
            // Check start and end date constraints
            expect(mocks.or).toHaveBeenCalledWith(expect.stringContaining('starts_at.lte.now()'));
            expect(mocks.or).toHaveBeenCalledWith(expect.stringContaining('expires_at.gt.now()'));
        });

        it('should filter by user location (ibge_code)', async () => {
            await OfferService.fetchActiveWeightedOffers('12345');
            expect(mocks.eq).toHaveBeenCalledWith('sponsor.ibge_code', '12345');
        });
    });
});
