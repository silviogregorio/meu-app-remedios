import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Pill, FileText, User, X, LogOut, ClipboardList, Share2, Briefcase, Pin, PinOff, Heart, BookOpen, LifeBuoy, MessageSquare, Settings, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const Sidebar = ({ isOpen, onClose, isPinned, onTogglePin }) => {
    const { logout, user } = useApp();

    // Grouped Navigation
    const navGroups = [
        {
            title: 'Dia a Dia',
            items: [
                { path: '/app', icon: Home, label: 'Início' },
                { path: '/diary', icon: Heart, label: 'Sinais Vitais Diários' },
                { path: '/appointments', icon: Calendar, label: 'Consultas Médicas' },
                { path: '/reports', icon: FileText, label: 'Relatórios' },
            ]
        },
        {
            title: 'Cadastros',
            items: [
                { path: '/patients', icon: Users, label: 'Pacientes' },
                { path: '/medications', icon: Pill, label: 'Medicamentos' },
                { path: '/prescriptions', icon: ClipboardList, label: 'Prescrições' },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { path: '/share', icon: Share2, label: 'Acesso Geral' },
                { path: '/manual', icon: BookOpen, label: 'Manual' },
                { path: '/contact', icon: LifeBuoy, label: 'Ajuda' },
                { path: '/profile', icon: User, label: 'Perfil' },
            ]
        }
    ];

    const adminEmails = ['sigremedios@gmail.com', 'sigsis@gmail.com', 'silviogregorio@gmail.com'];
    if (adminEmails.includes(user?.email)) {
        navGroups[2].items.push(
            { path: '/admin/settings', icon: Settings, label: 'Configurações' },
            { path: '/admin/sponsors', icon: Briefcase, label: 'Parceiros' },
            { path: '/admin/support', icon: MessageSquare, label: 'Suporte' }
        );
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
                    "fixed top-0 left-0 h-full w-64 bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-transparent dark:border-slate-800 flex flex-col",
                    isOpen ? "translate-x-0" : (isPinned ? "md:translate-x-0 -translate-x-full" : "-translate-x-full")
                )}
            >
                {/* Header - Static */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shrink-0">
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

                {/* Nav - Scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <nav className="flex flex-col p-4">
                        {navGroups.map((group, groupIndex) => (
                            <div key={group.title} className="mb-6">
                                <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {group.title}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map(({ path, icon: Icon, label }) => (
                                        <NavLink
                                            key={path}
                                            to={path}
                                            onClick={onClose}
                                            id={`tour-nav-${path.replace('/', '').replace(/\//g, '-')}`}
                                            className={({ isActive }) => clsx(
                                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200",
                                                isActive
                                                    ? "bg-white dark:bg-slate-800 text-[#10b981] font-bold shadow-sm"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                                            )}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <Icon size={20} className={clsx(isActive ? "text-[#10b981]" : "text-slate-400")} />
                                                    <span>{label}</span>
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Footer - Static */}
                <div className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="p-4">
                        <button
                            onClick={async () => {
                                await logout();
                                onClose();
                                window.location.href = '/';
                            }}
                            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
