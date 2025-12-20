/**
 * Expands and shuffles offers based on sponsor weight.
 * @param {Array} offers - List of offers with sponsor data (must include sponsor.weight)
 * @param {number} limit - Max number of items to return
 * @returns {Array} - The selected offers
 */
export const getWeightedOffers = (offers, limit = 10) => {
    if (!offers || offers.length === 0) return [];

    const weightedPool = [];

    // 1. Expand list based on weight
    offers.forEach(offer => {
        const weight = offer.sponsor?.weight || 1;
        // Cap weight at 20 to prevent performance issues
        const safeWeight = Math.min(Math.max(1, weight), 20);

        for (let i = 0; i < safeWeight; i++) {
            weightedPool.push(offer);
        }
    });

    // 2. Shuffle the pool (Fisher-Yates Shuffle)
    for (let i = weightedPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [weightedPool[i], weightedPool[j]] = [weightedPool[j], weightedPool[i]];
    }

    // 3. Selection Strategy:
    // If we just pick top N, high weight items appear more often in the selection set.
    // We want to avoid consecutive duplicates if possible, or just duplicates in general?
    // "Appears 10 times more" usually means probability of being seen.
    // If we filter uniques, a weight 10 item is just "more likely to be in the final 10".

    // For a Carousel, users probably prefer unique items.
    // Let's filter intended unique items, prioritizing earlier indices (which are randomized).

    const uniqueSelected = [];
    const seenIds = new Set();

    for (const offer of weightedPool) {
        if (!seenIds.has(offer.id)) {
            uniqueSelected.push(offer);
            seenIds.add(offer.id);
        }
        if (uniqueSelected.length >= limit) break;
    }

    return uniqueSelected;
};
