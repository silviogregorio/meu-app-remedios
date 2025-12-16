import { supabase } from '../lib/supabase';

/**
 * Fetch active offers for the given ibgeCode (city) and order by sponsor weight.
 * Returns offers with sponsor data embedded.
 */
// Re-export for compatibility if used elsewhere (though consumers seem to use OfferService.method)
export const fetchActiveWeightedOffers = async (ibgeCode) => {
    return OfferService.fetchByLocation(ibgeCode);
};

export const OfferService = {
    /**
     * Fetch active offers for the given ibgeCode (city) and order by sponsor weight.
     * Returns offers with sponsor data embedded.
     */
    async fetchByLocation(ibgeCode) {
        let query = supabase
            .from('ad_offers')
            .select('*, sponsor: sponsors!inner(*)') // !inner allows filtering on the joined table
            .eq('active', true)
            .eq('sponsor.active', true) // Safety check: sponsor must be active globally
            // Filter future offers: starts_at must be NULL or in the past
            .or('starts_at.is.null,starts_at.lte.now()')
            // Filter expired offers: expires_at must be NULL or in the future
            .or('expires_at.is.null,expires_at.gt.now()')
            .order('weight', { ascending: false }) // higher weight first
            .order('created_at', { ascending: false });

        // Filter by city if ibgeCode provided (sponsor has ibge_code column)
        if (ibgeCode) {
            query = query.eq('sponsor.ibge_code', ibgeCode);
        }

        const { data, error } = await query;
        if (error) throw error;
        // Exclude expired offers
        const now = new Date();
        const filtered = data.filter((offer) => {
            if (!offer.expires_at) return true;
            return new Date(offer.expires_at) > now;
        });
        return filtered;
    },

    async update(id, updates) {
        const { data, error } = await supabase
            .from('ad_offers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async create(offerData) {
        const { data, error } = await supabase
            .from('ad_offers')
            .insert([offerData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('ad_offers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async trackClick(id) {
        // RPC call to increment click counter safely
        const { error } = await supabase.rpc('increment_offer_clicks', { offer_id: id });
        if (error) console.error('Error tracking click:', error);
    },

    async trackView(id) {
        // RPC call to increment view counter safely
        const { error } = await supabase.rpc('increment_offer_views', { offer_id: id });
        if (error) console.error('Error tracking view:', error);
    }
};
