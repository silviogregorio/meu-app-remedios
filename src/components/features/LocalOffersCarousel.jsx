
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OfferService } from '../../services/offerService';
import { Tag, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

import { getWeightedOffers } from '../../utils/adRotation';

const LocalOffersCarousel = ({ userIbge }) => {
    const { user } = useApp();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOffers = async () => {
            if (!userIbge) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const fetchedOffers = await OfferService.fetchByLocation(userIbge);
                const uniqueSelected = getWeightedOffers(fetchedOffers, 10);
                setOffers(uniqueSelected);

                // Track views for all displayed offers
                uniqueSelected.forEach(offer => {
                    OfferService.trackView(offer.id);
                });

            } catch (err) {
                console.error("Failed to load offers", err);
            } finally {
                setLoading(false);
            }
        };

        loadOffers();
    }, [userIbge]);

    const getWhatsAppUrl = (phone, offer) => {
        if (!phone) return '';
        const clean = phone.replace(/\D/g, '');
        const finalPhone = clean.startsWith('55') ? clean : `55${clean}`;
        const userName = user?.user_metadata?.full_name || 'Visitante';

        const title = offer?.title || 'Oferta';
        const price = offer?.price;
        const original = offer?.original_price;

        let message = `Olá! Sou *${userName}*.\n\nVi a oferta: *${title}* no App SiG Remédios.\n\n`;

        if (original && price && original > price) {
            message += `Preço Normal: ${formatCurrency(original)}\n`;
        }

        if (price) {
            message += `Preço Promocional: ${formatCurrency(price)}\n\n`;
        }

        message += `A promoção ainda é válida? Obrigado.`;

        return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    };

    const handleOfferClick = (offer) => {
        OfferService.trackClick(offer.id);

        let targetUrl = offer.whatsapp_link;

        // If it's a direct URL, use it
        if (targetUrl && targetUrl.startsWith('http')) {
            window.open(targetUrl, '_blank');
            return;
        }

        // Otherwise construct it
        const phone = targetUrl || offer.sponsor?.whatsapp || offer.sponsor?.phone;
        if (phone) {
            const url = getWhatsAppUrl(phone, offer);
            window.open(url, '_blank');
        }
    };

    if (loading || offers.length === 0) return null;

    const uniqueSponsors = [...new Set(offers.map(o => o.sponsor?.name).filter(Boolean))].join(', ');

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-3 px-1">
                <Tag className="text-pink-500" size={20} />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                    Ofertas Especiais
                </h2>
            </div>
            {uniqueSponsors && (
                <p className="px-1 mb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {uniqueSponsors}
                </p>
            )}

            <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x scrollbar-hide">
                {offers.map(offer => (
                    <div
                        key={offer.id}
                        className="flex-none w-64 bg-white dark:bg-slate-800 rounded-l-xl rounded-tr-3xl rounded-br-3xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden snap-start flex flex-col relative"
                    >
                        {/* Side Actions (Vertical - Full Height) */}
                        <div className="absolute right-0 top-0 h-full w-8 bg-slate-50 border-l border-slate-100 flex flex-col items-center justify-center gap-4 py-3 z-10">
                            {offer.sponsor?.whatsapp && (
                                <a
                                    href={getWhatsAppUrl(offer.sponsor.whatsapp, offer)}
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

                            {offer.sponsor?.website_url && (
                                <a
                                    href={offer.sponsor.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-slate-800 hover:text-blue-600 transition-colors whitespace-nowrap mt-2"
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                                >
                                    Visite nosso Site
                                </a>
                            )}
                        </div>
                        {/* Image Header */}
                        <div className="h-24 bg-white dark:bg-slate-700 relative flex items-center justify-center p-2 mr-8 border-b border-slate-50">
                            {offer.image_url ? (
                                <img src={offer.image_url} alt={offer.title} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <Tag size={40} />
                                </div>
                            )}

                            {/* Discount Badge */}
                            {offer.original_price && offer.original_price > offer.price && (
                                <div className="absolute top-2 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-l-full shadow-md z-10">
                                    {Math.round(((offer.original_price - offer.price) / offer.original_price) * 100)}% OFF
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-3 pt-3 flex-1 flex flex-col mr-8">
                            <h3 className="font-bold text-slate-800 dark:text-gray-100 line-clamp-1" title={offer.title}>
                                {offer.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
                                {offer.description}
                            </p>

                            <div className="mt-auto mb-3">
                                {offer.original_price && (
                                    <span className="text-xs text-slate-400 line-through mr-2">
                                        {formatCurrency(offer.original_price)}
                                    </span>
                                )}
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(offer.price)}
                                </span>
                            </div>

                            <button
                                onClick={() => handleOfferClick(offer)}
                                className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
                            >
                                <ExternalLink size={16} />
                                Eu Quero
                            </button>


                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocalOffersCarousel;
