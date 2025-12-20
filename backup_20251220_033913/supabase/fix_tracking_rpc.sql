-- Re-create RPC functions to ensure they exist and work correctly
-- Using SECURITY DEFINER to allow these specific updates even if RLS otherwise restricts updates

CREATE OR REPLACE FUNCTION increment_offer_clicks(offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_offers
  SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE id = offer_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_offer_views(offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ad_offers
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = offer_id;
END;
$$;
