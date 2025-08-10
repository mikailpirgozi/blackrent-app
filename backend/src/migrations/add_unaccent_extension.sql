-- Pridanie unaccent extension pre PostgreSQL
-- Táto extension umožňuje vyhľadávanie bez diakritiky

-- Vytvorenie extension ak neexistuje
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Test funkcie
-- SELECT unaccent('Červený'); -- vráti 'Cerveny'
-- SELECT unaccent('ŠKODA'); -- vráti 'SKODA'
-- SELECT unaccent('Prešov'); -- vráti 'Presov'

-- Vytvorenie custom funkcie pre case-insensitive a diacritic-insensitive porovnanie
CREATE OR REPLACE FUNCTION normalize_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(unaccent(COALESCE(text_input, '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Index pre rýchlejšie vyhľadávanie (voliteľné)
-- CREATE INDEX idx_rentals_customer_name_normalized ON rentals(normalize_text(customer_name));
-- CREATE INDEX idx_vehicles_brand_normalized ON vehicles(normalize_text(brand));
-- CREATE INDEX idx_vehicles_model_normalized ON vehicles(normalize_text(model));
-- CREATE INDEX idx_vehicles_license_plate_normalized ON vehicles(normalize_text(license_plate));