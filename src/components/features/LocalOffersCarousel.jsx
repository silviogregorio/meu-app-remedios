import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OfferService } from '../../services/offerService';
import { Tag } from 'lucide-react';
import { getWeightedOffers } from '../../utils/adRotation';
import { OfferCard } from './OfferCard';
import { OfferCarouselShimmer } from '../ui/Shimmer';

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
            const startTime = Date.now();

            try {
                const fetchedOffers = await OfferService.fetchByLocation(userIbge);
                const uniqueSelected = getWeightedOffers(fetchedOffers, 10);

                // Ensure minimum 1.5s loading time for shimmer visibility
                const elapsed = Date.now() - startTime;
                if (elapsed < 1500) {
                    await new Promise(resolve => setTimeout(resolve, 1500 - elapsed));
                }

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

    if (loading) return <OfferCarouselShimmer />;
    if (offers.length === 0) return null;

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
                {offers.map(offer => (
                    <div key={offer.id} className="w-full">
                        <OfferCard offer={offer} variant="carousel" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LocalOffersCarousel;
