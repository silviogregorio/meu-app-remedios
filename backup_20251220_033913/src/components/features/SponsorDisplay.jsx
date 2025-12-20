import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchSponsorForUser } from '../../services/sponsorService';
import { ExternalLink, MapPin, Instagram, Facebook, Youtube, MessageCircle, Video } from 'lucide-react';
import clsx from 'clsx';

const SponsorDisplay = ({ user, variant = 'banner' }) => {
    const [sponsor, setSponsor] = useState(null);

    useEffect(() => {
        const load = async () => {
            if (!user) return;

            // 1. Tenta pegar do Metadados (rápido)
            let ibge = user.user_metadata?.ibge_code;
            let city = user.user_metadata?.city;

            // 2. Se não tiver no metadata busca no Profile force
            if (!ibge) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('ibge_code, city')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    ibge = profile.ibge_code;
                    city = profile.city;
                }
            }

            if (ibge) {
                const data = await fetchSponsorForUser(ibge);
                setSponsor(data);
            }
        };
        load();
    }, [user]);

    if (!sponsor) {
        // Opção: Renderizar um placeholder ou nada
        // Se quisermos debug, podemos manter, mas em produção melhor sumir
        const debugMode = true; // Set to false in PROD
        if (!debugMode) return null;

        return (
            <div className={clsx("p-4 text-center", variant === 'banner' ? "w-full" : "hidden")}>
                <div className="text-[10px] text-slate-300">
                    Sponsor Search: {user?.user_metadata?.ibge_code || 'Pending'}
                </div>
            </div>
        );
    }

    if (variant === 'banner') {
        return (
            <div className="w-full mt-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-indigo-100 dark:border-slate-700 group cursor-pointer hover:shadow-xl transition-all">

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-slate-700 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 group-hover:bg-indigo-100 transition-colors"></div>

                    <div className="relative z-10 p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        {/* Logo Container */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white p-3 shadow-md flex items-center justify-center shrink-0 border border-slate-100">
                            <img
                                src={sponsor.logo_url}
                                alt={sponsor.name}
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                    Patrocinador Oficial
                                </span>
                                {sponsor.city && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <MapPin size={10} />
                                        {sponsor.city}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                                {sponsor.name}
                            </h3>

                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 max-w-lg mx-auto md:mx-0">
                                Apoiando a saúde da nossa comunidade e facilitando o acesso aos seus medicamentos.
                            </p>

                            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mt-4">
                                {sponsor.website_url && (
                                    <a
                                        href={sponsor.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-bold text-sm transition-colors shadow-sm hover:shadow-md active:transform active:scale-95"
                                    >
                                        Visitar Parceiro
                                        <ExternalLink size={16} />
                                    </a>
                                )}

                                {/* Social Media Buttons - Dedicated Row */}
                                <div className="flex items-center justify-center gap-2">
                                    {sponsor.instagram && (
                                        <a href={sponsor.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-xl transition-colors" title="Instagram">
                                            <Instagram size={20} />
                                        </a>
                                    )}
                                    {sponsor.facebook && (
                                        <a href={sponsor.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors" title="Facebook">
                                            <Facebook size={20} />
                                        </a>
                                    )}
                                    {sponsor.whatsapp && (
                                        <a href={sponsor.whatsapp.startsWith('http') ? sponsor.whatsapp : `https://wa.me/55${sponsor.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-colors" title="WhatsApp">
                                            <MessageCircle size={20} />
                                        </a>
                                    )}
                                    {sponsor.youtube && (
                                        <a href={sponsor.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors" title="YouTube">
                                            <Youtube size={20} />
                                        </a>
                                    )}
                                    {sponsor.tiktok && (
                                        <a href={sponsor.tiktok} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl transition-colors" title="TikTok">
                                            <Video size={20} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Sidebar / Fallback Variant
    return (
        <div className="px-6 pt-4 pb-2">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                Oferecimento
            </p>
            <div className="flex items-center gap-3 group cursor-pointer transition-all hover:opacity-80">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center p-1 overflow-hidden">
                    <img
                        src={sponsor.logo_url}
                        alt={sponsor.name}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                        {sponsor.name}
                    </h4>
                    {sponsor.website_url && (
                        <a
                            href={sponsor.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#10b981] truncate hover:underline block"
                        >
                            Visitar site
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SponsorDisplay;
