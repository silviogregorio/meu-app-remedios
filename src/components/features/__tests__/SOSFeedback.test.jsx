import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SOSPatientFeedback from '../SOSPatientFeedback';
import { supabase } from '../../../lib/supabase';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
    supabase: {
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
    }
}));

// Mock Contexts
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'patient-123' }
    })
}));

vi.mock('../../../context/AppContext', () => ({
    useApp: () => ({
        speak: vi.fn()
    })
}));

describe('SOSPatientFeedback Component', () => {
    let mockOn;
    let mockPayload;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOn = vi.fn().mockImplementation((event, filter, callback) => {
            mockPayload = callback;
            return { on: mockOn, subscribe: vi.fn() };
        });
        supabase.channel.mockReturnValue({ on: mockOn, subscribe: vi.fn() });
    });

    it('should not show anything initially', () => {
        render(<SOSPatientFeedback />);
        expect(screen.queryByText(/AJUDA A CAMINHO/i)).not.toBeInTheDocument();
    });

    it('should show feedback when SOS is acknowledged', async () => {
        render(<SOSPatientFeedback />);

        // Simular o evento de Realtime (UPDATE no alerta para 'acknowledged')
        await act(async () => {
            mockPayload({
                new: { id: 'sos-1', status: 'acknowledged' },
                old: { id: 'sos-1', status: 'active' }
            });
        });

        expect(screen.getByText(/AJUDA A CAMINHO/i)).toBeInTheDocument();
        expect(screen.getByText(/Seu cuidador recebeu o alerta/i)).toBeInTheDocument();
    });
});
