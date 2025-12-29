import { useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCurrency } from '../../utils/formatters';
import { ExternalLink, X, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const OfferCard = ({ offer, variant = 'standard' }) => {
    const { user } = useApp();
    const { title, description, price, original_price, image_url, whatsapp_link, sponsor } = offer;
    const discount = original_price ? ((original_price - price) / original_price) * 100 : null;
    const [showModal, setShowModal] = useState(false);

    const isCarousel = variant === 'carousel';

    const getWhatsAppUrl = (phone) => {
        if (!phone) return '';
        const clean = phone.replace(/\D/g, '');
        const finalPhone = clean.startsWith('55') ? clean : `55${clean}`;
        const userName = user?.user_metadata?.full_name || 'Visitante';

        let message = `Olá! Sou *${userName}*.\n\nVi a oferta: *${title}* no App SiG Remédios.\n\n`;

        if (original_price && price && original_price > price) {
            message += `Preço Normal: ${formatCurrency(original_price)}\n`;
        }
        if (price) {
            message += `Preço Promocional: ${formatCurrency(price)}\n\n`;
        }
        message += `A promoção ainda é válida? Obrigado.`;

        return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    };

    const handleCardClick = () => {
        console.log('OFFER CARD CLICKED!', title);
        setShowModal(true);
    };

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={handleCardClick}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
                className={`offer-card bg-white dark:bg-slate-800 shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow cursor-pointer border border-slate-100 dark:border-slate-700 min-w-[200px] text-left w-full relative z-0
                    ${isCarousel ? 'rounded-l-xl rounded-tr-3xl rounded-br-3xl' : 'rounded-xl'}
                `}
            >
                {/* Carousel Sidebar (Restored) */}
                {isCarousel && (
                    <div className="absolute right-0 top-0 h-full w-8 bg-slate-50 border-l border-slate-100 flex flex-col items-center justify-center gap-4 py-3 z-10 rounded-tr-3xl rounded-br-3xl" onClick={(e) => e.stopPropagation()}>
                        {sponsor?.whatsapp && (
                            <a
                                href={getWhatsAppUrl(sponsor.whatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:scale-110 transition-transform p-1 bg-white rounded-full shadow-sm"
                                title="Falar no WhatsApp"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                            </a>
                        )}
                        {sponsor?.website_url && (
                            <a
                                href={sponsor.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] font-bold text-slate-800 hover:text-blue-600 transition-colors whitespace-nowrap mt-2"
                                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                            >
                                Visite nosso Site
                            </a>
                        )}
                    </div>
                )}

                <div className={`relative w-full ${isCarousel ? 'pr-6' : ''}`}>
                    {image_url ? (
                        <img src={image_url} alt={title} className="w-full h-32 object-contain bg-slate-50 rounded-lg p-2" />
                    ) : (
                        <div className="w-full h-32 flex items-center justify-center bg-slate-50 rounded-lg text-slate-400">
                            <Tag size={32} />
                        </div>
                    )}
                    {discount && (
                        <span className="absolute top-2 right-8 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                            {discount.toFixed(0)}% OFF
                        </span>
                    )}
                </div>

                <div className={`flex flex-col items-center text-center ${isCarousel ? 'pr-6' : ''}`}>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white line-clamp-2 w-full leading-tight min-h-[2.5rem] flex items-center justify-center">{title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 w-full mt-1 mb-2">{description}</p>
                </div>

                <div className={`flex items-baseline justify-center gap-2 mt-auto w-full ${isCarousel ? 'pr-6' : ''}`}>
                    <span className="text-lg font-bold text-[#10b981]">{formatCurrency(price)}</span>
                    {original_price && (
                        <span className="text-xs line-through text-slate-400">{formatCurrency(original_price)}</span>
                    )}
                </div>

                <div className={`w-full mt-1 text-sm font-bold py-1.5 rounded-lg transition-colors text-center flex items-center justify-center gap-2
                    ${isCarousel
                        ? 'bg-pink-500 hover:bg-pink-600 text-white mr-6 w-[calc(100%-1.5rem)] py-2 active:scale-95'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'}
                `}>
                    {isCarousel && <ExternalLink size={16} />}
                    Eu Quero
                </div>
            </div>

            {/* Detail Modal - Using Portal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-900 shrink-0">
                            {image_url ? (
                                <img src={image_url} alt={title} className="w-full h-full object-contain p-2" />
                            ) : (
                                <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain p-4" />
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors z-10"
                            >
                                <X size={20} />
                            </button>
                            {discount && (
                                <span className="absolute bottom-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                    {discount.toFixed(0)}% DE DESCONTO
                                </span>
                            )}
                        </div>

                        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">{title}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Oferecido por <strong className="text-primary">{sponsor.name}</strong>
                                </p>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                                {description}
                            </p>

                            <div className="flex flex-col gap-3 mt-auto pt-4">
                                <div className="flex items-end justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
                                    <span className="text-sm text-slate-500">Valor Promocional</span>
                                    <div className="text-right">
                                        {original_price && (
                                            <div className="text-sm line-through text-slate-400 mb-0.5">
                                                De {formatCurrency(original_price)}
                                            </div>
                                        )}
                                        <div className="text-3xl font-bold text-[#10b981]">{formatCurrency(price)}</div>
                                    </div>
                                </div>

                                {whatsapp_link && (
                                    <a
                                        href={whatsapp_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                        onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                                    >
                                        <ExternalLink size={20} />
                                        Comprar via WhatsApp
                                    </a>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowModal(false); }}
                                    className="w-full py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                                >
                                    Voltar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
