import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home';
import Login from '../Login';

// Mock dependencies to isolate the page tests
vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        user: { id: '123', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
        prescriptions: [],
        medications: [],
        patients: [],
        consumptionLog: [],
        pendingShares: [],
        calculateStockDays: () => 10,
        loading: false,
        logConsumption: vi.fn(),
        removeConsumption: vi.fn(),
    })
}));

// Mock Notifications hook
vi.mock('../../hooks/useNotifications', () => ({
    useNotifications: () => ({
        permission: 'default',
        requestPermission: vi.fn()
    })
}));

// Mock simple UI components
vi.mock('../../components/features/VoiceCommand', () => ({
    default: () => <div data-testid="voice-command">Voice Command</div>
}));

// Mock AuthContext for Login.jsx
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        signIn: vi.fn(() => Promise.resolve({ error: null })),
        signOut: vi.fn(),
    })
}));

vi.mock('../../components/features/MotivationCard', () => ({
    default: () => <div>Motivation Card</div>
}));

vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

vi.mock('../../components/features/SponsorDisplay', () => ({
    default: () => <div>Sponsor Display</div>
}));

vi.mock('../../components/OnboardingTour', () => ({
    default: () => <div>Onboarding Tour</div>
}));

vi.mock('../../utils/dateFormatter', () => ({
    formatDate: () => '01/01/2023',
    formatTime: () => '12:00',
    formatDateFull: () => 'Sexta, 01 de Janeiro'
}));

vi.mock('../../utils/icsGenerator', () => ({
    generateICS: vi.fn(),
    generateFutureSchedule: () => []
}));

vi.mock('../../utils/gamification', () => ({
    calculateStreak: () => ({ current: 0, best: 0 })
}));

describe('Smoke Tests - Main Pages', () => {
    it.skip('renders Home page without crashing', () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        // Check for key elements that indicate success
        expect(screen.getByText(/Olá, Test/i)).toBeInTheDocument();
        // expect(screen.getByText(/Visão Geral/i)).toBeInTheDocument(); 
    });

    it('renders Login page without crashing', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
        // Check for login specific text
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });
});
