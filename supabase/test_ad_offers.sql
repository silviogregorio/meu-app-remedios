
-- Test script for ad_offers with sponsor creation
DO $$
DECLARE
    sponsor_id uuid;
    offer_id uuid;
BEGIN
    -- Insert a test sponsor
    INSERT INTO public.sponsors (name, logo_url, active)
    VALUES ('Sponsor Teste', 'https://example.com/logo.png', true)
    RETURNING id INTO sponsor_id;

    RAISE NOTICE 'Sponsor criado com id %', sponsor_id;

    -- Insert a test offer linked to sponsor
    INSERT INTO public.ad_offers (
        sponsor_id, title, description, price, original_price,
        image_url, whatsapp_link, active, expires_at
    ) VALUES (
        sponsor_id,
        'Oferta Teste',
        'Descrição da oferta de teste',
        9.99,
        19.99,
        NULL,
        NULL,
        true,
        NULL
    ) RETURNING id INTO offer_id;

    RAISE NOTICE 'Oferta criada com id %', offer_id;

    -- Test RPC functions
    PERFORM increment_offer_clicks(offer_id);
    PERFORM increment_offer_views(offer_id);

    RAISE NOTICE 'Clicks: %', (SELECT clicks_count FROM public.ad_offers WHERE id = offer_id);
    RAISE NOTICE 'Views: %', (SELECT views_count FROM public.ad_offers WHERE id = offer_id);
END $$;

-- Verify public read policy
SELECT * FROM public.ad_offers
WHERE active = true AND (expires_at IS NULL OR expires_at > now());

