import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OfferService } from '../../services/offerService';
import { Tag } from 'lucide-react';
import { getWeightedOffers } from '../../utils/adRotation';
import { OfferCard } from './OfferCard';

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
                    <div key={offer.id} className="flex-none w-64 snap-start">
                        <OfferCard offer={offer} variant="carousel" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocalOffersCarousel;
