-- Deletar patrocinador de teste e suas ofertas
DELETE FROM ad_offers WHERE sponsor_id IN (SELECT id FROM sponsors WHERE name LIKE 'sigsistemas%');
DELETE FROM sponsors WHERE name LIKE 'sigsistemas%';
