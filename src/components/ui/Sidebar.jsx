import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Pill, FileText, User, X, LogOut, ClipboardList, Share2, Briefcase, Pin, PinOff, Heart } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';

const Sidebar = ({ isOpen, onClose, isPinned, onTogglePin }) => {
    const { logout, user } = useApp();

    const navItems = [
        { path: '/app', icon: Home, label: 'Início' },
        { path: '/patients', icon: Users, label: 'Pacientes' },
        { path: '/medications', icon: Pill, label: 'Medicamentos' },
        { path: '/prescriptions', icon: ClipboardList, label: 'Prescrições' },
        { path: '/diary', icon: Heart, label: 'Diário de Saúde' },
        { path: '/reports', icon: FileText, label: 'Relatórios' },
        { path: '/share', icon: Share2, label: 'Compartilhar' },
        { path: '/profile', icon: User, label: 'Perfil' },
    ];

    if (user?.email === 'sigsis@gmail.com') {
        navItems.push({ path: '/admin/sponsors', icon: Briefcase, label: 'Parceiros (Admin)' });
    }

    return (
        <>
            {/* Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
                    isPinned && "md:hidden" // Hide overlay on desktop if pinned
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-transparent dark:border-slate-800",
                    isOpen ? "translate-x-0" : (isPinned ? "md:translate-x-0 -translate-x-full" : "-translate-x-full")
                )}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-[#10b981]">SiG Remédios</h2>
                    <div className="flex items-center gap-1">
                        {/* Pin Button (Desktop Only) */}
                        <button
                            onClick={onTogglePin}
                            className={clsx(
                                "hidden md:flex p-2 rounded-full transition-colors",
                                isPinned
                                    ? "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400"
                                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                            )}
                            title={isPinned ? "Desafixar Menu" : "Fixar Menu"}
                        >
                            {isPinned ? <PinOff size={18} /> : <Pin size={18} />}
                        </button>

                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden">
                            <X size={20} className="text-gray-500 dark:text-slate-400" />
                        </button>
                    </div>
                </div>

                <nav className="flex flex-col p-4 gap-2">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            onClick={onClose}
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-[#10b981]/10 text-[#10b981] font-medium"
                                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200"
                            )}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-slate-800">
                    <button
                        onClick={async () => {
                            await logout();
                            onClose();
                            window.location.href = '/'; // Forçando refresh e navegação limpa para a Landing
                        }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
