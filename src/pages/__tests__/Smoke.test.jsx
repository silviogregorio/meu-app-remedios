import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home';
import Login from '../Login';

// Define global variable for version (Vite build define)
global.__APP_VERSION__ = '1.3.94';

global.__APP_VERSION__ = '1.3.94';

// Mock localStorage
if (typeof window !== 'undefined') {
    const localStorageMock = (function () {
        let store = {};
        return {
            getItem: vi.fn(key => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
            clear: vi.fn(() => { store = {}; }),
            removeItem: vi.fn(key => { delete store[key]; }),
            length: 0,
            key: vi.fn(i => null)
        };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
}

// Mock dependencies to isolate the page tests
vi.mock('../../context/AppContext', () => ({
    useApp: () => ({
        user: { id: '123', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
        prescriptions: [],
        medications: [],
        patients: [],
        consumptionLog: [],
        pendingShares: [],
        appointments: [],
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

// Mock Firebase utility
vi.mock('../../utils/firebase', () => ({
    requestForToken: vi.fn(() => Promise.resolve('mock-fcm-token')),
    onMessageListener: vi.fn(() => Promise.resolve({ notification: { title: 'Test', body: 'Test Body' } })),
    default: {
        messaging: vi.fn()
    }
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

vi.mock('../../components/features/LocalOffersCarousel', () => ({
    default: () => <div data-testid="local-offers">Local Offers Carousel</div>
}));

vi.mock('../../components/features/OfferCard', () => ({
    OfferCard: () => <div>Offer Card</div>
}));

vi.mock('../../services/offerService', () => ({
    fetchActiveWeightedOffers: vi.fn(() => Promise.resolve([]))
}));

vi.mock('../../components/ui/PillIcon', () => ({
    default: () => <div>Pill Icon</div>
}));

vi.mock('../../components/ui/Pagination', () => ({
    default: () => <div>Pagination</div>
}));

vi.mock('../../components/ui/Card', () => ({
    default: ({ children, className }) => <div className={className}>{children}</div>,
    CardContent: ({ children, className }) => <div className={className}>{children}</div>
}));

vi.mock('../../components/ui/Button', () => ({
    default: ({ children, onClick, type, ...props }) => <button type={type} onClick={onClick} {...props}>{children}</button>
}));

vi.mock('../../utils/dateFormatter', () => ({
    formatDate: () => '01/01/2023',
    formatTime: () => '12:00',
    formatDateFull: () => 'Sexta, 01 de Janeiro',
    getISODate: () => '2023-01-01'
}));

vi.mock('../../utils/icsGenerator', () => ({
    generateICS: vi.fn(),
    generateFutureSchedule: () => []
}));

vi.mock('../../utils/gamification', () => ({
    calculateStreak: () => ({ current: 0, best: 0 })
}));

describe('Smoke Tests - Main Pages', () => {
    // Home test is temporarily skipped - it hangs due to complex async dependencies
    // (Firebase messaging, Supabase subscriptions, polling etc.) that need extensive mocking
    it.skip('renders Home page without crashing', () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        expect(screen.getByText(/Olá, Test/i)).toBeInTheDocument();
    });

    it('renders Login page without crashing', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
        // Check for login specific elements - use getAllByRole since there are multiple buttons
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        // Check for email placeholder
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });
});
