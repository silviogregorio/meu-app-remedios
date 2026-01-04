import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Profile from '../Profile';
import { supabase } from '../../lib/supabase';
import { MemoryRouter } from 'react-router-dom';

// Mocks
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { full_name: 'Silvio Teste', is_self: true }, error: null }),
            update: vi.fn().mockReturnThis(),
        })),
        auth: {
            updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }
    }
}));

vi.mock('../../utils/firebase', () => ({
    requestForToken: vi.fn(() => Promise.resolve('mock-token')),
    onMessageListener: vi.fn(),
    setupOnMessageListener: vi.fn(() => () => { }),
    default: {
        messaging: vi.fn()
    }
}));

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn()
}));

vi.mock('firebase/messaging', () => ({
    getMessaging: vi.fn(),
    getToken: vi.fn(),
    onMessage: vi.fn()
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: 'user-123',
            email: 'silvio@teste.com',
            user_metadata: { full_name: 'Silvio Teste' }
        }
    })
}));

vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        patients: [],
        medications: [],
        prescriptions: [],
        consumptionLog: [],
        healthLogs: [],
        showToast: vi.fn(),
        runCaregiverCheck: vi.fn(),
        logout: vi.fn(),
        accountShares: [],
        shareAccount: vi.fn(),
        unshareAccount: vi.fn(),
        accessibility: { fontSize: 100 },
        updateAccessibility: vi.fn(),
        vacationMode: false,
        updateVacationMode: vi.fn(),
        userPreferences: { summary_day: 'off' },
        updateUserPreferences: vi.fn(),
    })
}));

describe('Profile Page - is_self Sync', () => {
    it('renders profile data correctly', async () => {
        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/silvio@teste.com/i)).toBeInTheDocument();
        });
    });

    it('syncs profile update to self-patient entry', async () => {
        const updateSpy = vi.spyOn(supabase, 'from');

        render(
            <MemoryRouter>
                <Profile />
            </MemoryRouter>
        );

        // Abrir edição
        const editBtn = await screen.findByText(/Dados Pessoais/i);
        fireEvent.click(editBtn);

        // Salvar alterações
        const saveBtn = await screen.findByText(/Salvar Alterações/i);
        fireEvent.click(saveBtn);

        await waitFor(() => {
            // Verifica se tentou atualizar a tabela 'patients' onde is_self = true
            expect(updateSpy).toHaveBeenCalledWith('patients');
        });
    });
});
