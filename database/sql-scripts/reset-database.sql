-- Reset celej databázy - zmaže všetky tabuľky a dáta
-- Použiť s opatrnosťou!

-- Vypnúť foreign key constraints
SET session_replication_role = replica;

-- Zmazať všetky tabuľky v správnom poradí (kvôli foreign keys)
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS insurance_claims CASCADE;
DROP TABLE IF EXISTS insurances CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS insurers CASCADE;

-- Zapnúť foreign key constraints
SET session_replication_role = DEFAULT;

-- Vytvoriť čistú schému bude aplikácia pri ďalšom štarte
SELECT 'Database reset completed!' as status; 