-- =====================================================
-- MIGRÁCIA: Pridanie polí pre spoluúčasť v poistkách
-- =====================================================
-- Autor: BlackRent Development Team
-- Dátum: 2025-10-04
-- Popis: Pridanie stĺpcov pre výšku spoluúčasti (EUR) a percentuálnu spoluúčasť (%)
--        do tabuľky insurances pre Kasko a PZP+Kasko poistky
-- =====================================================

-- Pridanie stĺpca pre spoluúčasť v EUR
ALTER TABLE insurances 
ADD COLUMN IF NOT EXISTS deductible_amount DECIMAL(10, 2) DEFAULT NULL;

-- Pridanie stĺpca pre spoluúčasť v %
ALTER TABLE insurances 
ADD COLUMN IF NOT EXISTS deductible_percentage DECIMAL(5, 2) DEFAULT NULL;

-- Pridanie komentárov pre lepšiu dokumentáciu
COMMENT ON COLUMN insurances.deductible_amount IS 'Výška spoluúčasti v EUR (voliteľné)';
COMMENT ON COLUMN insurances.deductible_percentage IS 'Percentuálna spoluúčasť (voliteľné)';

-- =====================================================
-- ROLLBACK (v prípade potreby)
-- =====================================================
-- ALTER TABLE insurances DROP COLUMN IF EXISTS deductible_amount;
-- ALTER TABLE insurances DROP COLUMN IF EXISTS deductible_percentage;

-- =====================================================
-- POZNÁMKY
-- =====================================================
-- 1. Obe polia sú voliteľné (nullable)
-- 2. Existujúce záznamy budú mať NULL hodnoty
-- 3. Decimal(10,2) pre sumu umožňuje hodnoty do 99,999,999.99 EUR
-- 4. Decimal(5,2) pre % umožňuje hodnoty 0.00 - 999.99%

