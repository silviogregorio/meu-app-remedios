import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Pill, FileText, User, X, LogOut, ClipboardList, Share2, Briefcase, Pin, PinOff, Heart, BookOpen, LifeBuoy, MessageSquare, Settings, Calendar, Shield, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const Sidebar = ({ isOpen, onClose, isPinned, onTogglePin }) => {
    const { logout, user } = useApp();
    const sidebarRef = useRef(null);
    const closeButtonRef = useRef(null);

    // Focus trap when sidebar is open on mobile
    useEffect(() => {
        if (isOpen && closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle Escape key to close sidebar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    // Grouped Navigation
    const navGroups = [
        {
            title: 'Dia a Dia',
            items: [
                { path: '/app', icon: Home, label: 'Início' },
                { path: '/diary', icon: Heart, label: 'Diário da Saúde' },
                { path: '/appointments', icon: Calendar, label: 'Consultas Médicas' },
                { path: '/reports', icon: FileText, label: 'Relatórios' },
                { path: '/trophies', icon: Trophy, label: 'Galeria de Troféus' },
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
                { path: '/security-audit', icon: Shield, label: 'Segurança' },
            ]
        }
    ];

    const adminEmails = ['sigremedios@gmail.com', 'sigsis@gmail.com', 'silviogregorio@gmail.com'];
    if (adminEmails.includes(user?.email)) {
        navGroups[2].items.push(
            { path: '/admin/settings', icon: Settings, label: 'Configurações' },
            { path: '/admin/sponsors', icon: Briefcase, label: 'Parceiros' },
            { path: '/admin/security', icon: Shield, label: 'Segurança (Admin)' },
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
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={clsx(
                    "fixed top-0 left-0 h-full w-64 bg-slate-50 dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-transparent dark:border-slate-800 flex flex-col",
                    isOpen ? "translate-x-0" : (isPinned ? "md:translate-x-0 -translate-x-full" : "-translate-x-full")
                )}
                role="navigation"
                aria-label="Menu principal"
                aria-hidden={!isOpen && !isPinned}
                inert={(!isOpen && !isPinned) ? true : undefined}
            >
                {/* Header - Static */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shrink-0">
                    <h2 className="text-xl font-bold text-[#10b981]">SiG Remédios</h2>
                    <div className="flex items-center gap-1">
                        {/* Pin Button (Desktop Only) */}
                        <button
                            onClick={onTogglePin}
                            className={clsx(
                                "hidden md:flex p-2 rounded-full transition-colors min-h-[44px] min-w-[44px] items-center justify-center",
                                isPinned
                                    ? "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400"
                                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                            )}
                            title={isPinned ? "Desafixar Menu" : "Fixar Menu"}
                            aria-label={isPinned ? "Desafixar Menu" : "Fixar Menu"}
                            aria-pressed={isPinned}
                        >
                            {isPinned ? <PinOff size={18} aria-hidden="true" /> : <Pin size={18} aria-hidden="true" />}
                        </button>

                        <button
                            ref={closeButtonRef}
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
                            aria-label="Fechar menu"
                        >
                            <X size={20} className="text-gray-500 dark:text-slate-400" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Nav - Scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <nav className="flex flex-col p-4" aria-label="Navegação principal">
                        {navGroups.map((group, groupIndex) => (
                            <div key={group.title} className="mb-6" role="group" aria-labelledby={`nav-group-${groupIndex}`}>
                                <h3 id={`nav-group-${groupIndex}`} className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    {group.title}
                                </h3>
                                <ul className="space-y-1" role="list">
                                    {group.items.map(({ path, icon: Icon, label }) => (
                                        <li key={path}>
                                            <NavLink
                                                to={path}
                                                onClick={onClose}
                                                id={`tour-nav-${path.replace('/', '').replace(/\//g, '-')}`}
                                                className={({ isActive }) => clsx(
                                                    "flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 min-h-[52px] text-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                                                    isActive
                                                        ? "bg-white dark:bg-slate-800 text-[#10b981] font-black shadow-md"
                                                        : "text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                                                )}
                                                aria-current={({ isActive }) => isActive ? 'page' : undefined}
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        <Icon size={22} className={clsx(isActive ? "text-[#10b981]" : "text-slate-500 dark:text-slate-400")} aria-hidden="true" />
                                                        <span>{label}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Footer - Static */}
                <div className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="p-4">
                        <button
                            onClick={async () => {
                                console.log('🚪 Sidebar: Iniciando logout...');
                                try {
                                    await Promise.race([
                                        logout(),
                                        new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 2000))
                                    ]);
                                    console.log('🚪 Sidebar: Logout concluído.');
                                } catch (err) {
                                    console.warn('🚪 Sidebar: Erro ou timeout no logout, forçando redirecionamento:', err);
                                } finally {
                                    onClose();
                                    window.location.href = '/';
                                }
                            }}
                            className="flex items-center justify-between px-4 py-3 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors min-h-[48px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/50"
                            aria-label="Sair da conta"
                        >
                            <div className="flex items-center gap-3">
                                <LogOut size={20} aria-hidden="true" />
                                <span>Sair</span>
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-slate-600">
                                v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'}
                            </span>
                        </button>
                    </div>

                </div>

            </aside>
        </>
    );
};

export default Sidebar;
