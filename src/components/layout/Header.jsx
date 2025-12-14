import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, LogOut, User as UserIcon, Heart, Search } from 'lucide-react'; // Added Search
import { useApp } from '../../context/AppContext';
import NotificationsModal from '../ui/NotificationsModal';
import SOSCard from '../features/SOSCard';
import MedicationSearchModal from '../features/MedicationSearchModal'; // Added Import

import { useTheme } from '../../context/ThemeContext';

const Header = ({ onMenuClick, isPinned }) => {
    const { user, pendingShares, logout } = useApp();
    const { theme, setTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSOS, setShowSOS] = useState(false);
    const [showSearch, setShowSearch] = useState(false); // Added State
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'U';
    };

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 h-[64px] bg-white dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-800 z-30 px-4 flex items-center justify-between shadow-sm transition-all duration-300 ${isPinned ? 'md:left-64' : ''
                }`}
        >
            <div className="flex items-center gap-3">
                <button
                    id="header-menu-toggle"
                    onClick={onMenuClick}
                    className={`p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors ${isPinned ? 'md:hidden' : ''
                        }`}
                >
                    <Menu size={24} />
                </button>
                <div className={`flex items-center gap-2 ${isPinned ? 'md:hidden' : ''}`}>
                    <img src="/assets/logo.png" alt="SiG Remédios" className="w-8 h-8 object-contain animate-heartbeat" />
                    <h1 className="text-xl font-bold text-[#10b981]">SiG Remédios</h1>
                </div>
            </div>

            {user && (
                <div className="flex items-center gap-4">

                    {/* Search Button (Mobile/Desktop) */}
                    <button
                        id="tour-search-btn"
                        onClick={() => setShowSearch(true)}
                        className="flex items-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title="Buscar Medicamento"
                    >
                        <Search size={22} />
                        <span className="hidden md:inline text-sm font-medium">Buscar</span>
                    </button>

                    {/* SOS Button */}
                    <button
                        id="tour-sos-btn"
                        onClick={() => setShowSOS(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-105 flex items-center gap-2 animate-pulse-slow"
                    >
                        <Heart size={18} fill="currentColor" />
                        <span className="hidden sm:inline">SOS</span>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        title={theme === 'dark' ? 'Mudar para Claro' : 'Mudar para Escuro'}
                    >
                        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                    </button>

                    <button
                        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        onClick={() => setShowNotifications(true)}
                        title="Notificações"
                    >
                        <Bell size={24} />
                        {pendingShares.length > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {pendingShares.length}
                            </span>
                        )}
                    </button>

                    {/* User Menu Dropdown */}
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1.5 rounded-xl transition-colors"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            <span className="text-sm font-medium text-[#64748b] hidden sm:block">
                                Olá, {user.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}
                            </span>
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="User"
                                    className="w-8 h-8 rounded-full border border-[#e2e8f0]"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                    {getInitials(user.user_metadata?.full_name)}
                                </div>
                            )}
                        </button>

                        {isUserMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setIsUserMenuOpen(false)}
                                ></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 py-1 z-40 animate-fade-in-down">
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setIsUserMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                    >
                                        <UserIcon size={16} />
                                        Editar Perfil
                                    </button>
                                    <div className="h-px bg-gray-100 dark:bg-slate-800 my-1"></div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                    >
                                        <LogOut size={16} />
                                        Sair
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <NotificationsModal
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
            />

            {showSOS && <SOSCard onClose={() => setShowSOS(false)} />}

            <MedicationSearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
            />
        </header>
    );
};

export default Header;
