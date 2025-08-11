-- Enable unaccent extension for diacritic-insensitive search
-- This allows searching "cerveny" to match "Červený"

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Test the extension
SELECT unaccent('Červený') as test_result; -- Should return 'Cerveny'

-- Create a helper function for normalized search
CREATE OR REPLACE FUNCTION normalize_text(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(unaccent(text_input));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Test the function
SELECT normalize_text('Červený Automobil') as test_result; -- Should return 'cerveny automobil'
