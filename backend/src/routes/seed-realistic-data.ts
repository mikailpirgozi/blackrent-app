/**
 * SEED REALISTIC DATA ENDPOINT
 * Generates comprehensive test data for realistic testing
 * 
 * Usage:
 *   GET /api/seed/realistic-data
 * 
 * Generates:
 *   - 50 vehicles (different brands, models, years)
 *   - 100 customers (realistic names, emails, phones)
 *   - 200 rentals (various statuses, dates, prices)
 *   - 50 expenses (different categories)
 *   - 20 insurances (different types, companies)
 *   - 10 leasings (different payment types)
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router: Router = Router();

// Helper function to generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random price
function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Vehicle data
const vehicleBrands = [
  { brand: 'BMW', models: ['X1', 'X3', 'X5', '3 Series', '5 Series', '7 Series'] },
  { brand: 'Mercedes', models: ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'S-Class'] },
  { brand: 'Audi', models: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'] },
  { brand: 'Volkswagen', models: ['Golf', 'Passat', 'Tiguan', 'Touran', 'Polo'] },
  { brand: 'Škoda', models: ['Octavia', 'Superb', 'Karoq', 'Kodiaq', 'Fabia'] },
  { brand: 'Toyota', models: ['Corolla', 'Yaris', 'RAV4', 'Camry', 'Auris'] },
  { brand: 'Ford', models: ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'Mustang'] },
  { brand: 'Renault', models: ['Clio', 'Megane', 'Captur', 'Kadjar', 'Scenic'] }
];

const companies = ['ABC Rent', 'Premium Cars', 'City Rent', 'Euro Rent', 'Fast Cars'];

// Customer data
const firstNames = [
  'Ján', 'Peter', 'Marek', 'Lukáš', 'Martin', 'Tomáš', 'Michal', 'Matej', 'Jakub', 'Filip',
  'Mária', 'Eva', 'Anna', 'Zuzana', 'Katarína', 'Lucia', 'Martina', 'Jana', 'Petra', 'Lenka'
];

const lastNames = [
  'Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horáková', 'Němec',
  'Horváth', 'Varga', 'Tóth', 'Kiss', 'Molnár', 'Kovács', 'Szabó', 'Nagy', 'Baláž', 'Farkaš'
];

// Expense categories
const expenseCategories = [
  'fuel', 'maintenance', 'insurance', 'cleaning', 'parking', 'toll', 'damage', 'other'
];

// Insurance types
const insuranceTypes = ['collision', 'liability', 'comprehensive'];
const insurers = ['Allianz', 'Generali', 'ČSOB Poisťovňa', 'Kooperativa', 'Union'];

/**
 * POST /api/seed/realistic-data
 * Generates realistic test data
 * 
 * Query params:
 *   - vehicles: number of vehicles (default: 50)
 *   - customers: number of customers (default: 100)
 *   - rentals: number of rentals (default: 200)
 */
router.post('/realistic-data',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      // Only super_admin and admin can seed data
      if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý. Len admin môže vytvárať seed dáta.'
        });
      }

      logger.info('🌱 SEED: Starting realistic data generation...');

      const vehicleCount = parseInt(req.query.vehicles as string) || 50;
      const customerCount = parseInt(req.query.customers as string) || 100;
      const rentalCount = parseInt(req.query.rentals as string) || 200;

      const client = await postgresDatabase.dbPool.connect();
      
      try {
        await client.query('BEGIN');

        const stats = {
          companies: 0,
          insurers: 0,
          vehicles: 0,
          customers: 0,
          rentals: 0,
          expenses: 0,
          insurances: 0
        };

        // 1. CREATE COMPANIES
        logger.info('🏢 SEED: Creating companies...');
        const companyResults = await Promise.all(
          companies.map(name =>
            client.query(
              'INSERT INTO companies (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name',
              [name]
            )
          )
        );
        const companyIds = companyResults.map(r => r.rows[0]);
        stats.companies = companyIds.length;
        logger.info(`✅ SEED: Created ${stats.companies} companies`);

        // 2. CREATE INSURERS
        logger.info('🛡️ SEED: Creating insurers...');
        const insurerResults = await Promise.all(
          insurers.map(name =>
            client.query(
              'INSERT INTO insurers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
              [name]
            )
          )
        );
        const insurerIds = insurerResults
          .filter(r => r.rows.length > 0)
          .map(r => r.rows[0]);
        stats.insurers = insurerIds.length;
        logger.info(`✅ SEED: Created ${stats.insurers} insurers`);

        // 3. CREATE VEHICLES
        logger.info('🚗 SEED: Creating vehicles...');
        const vehicleIds: Array<{ id: string; brand: string; model: string }> = [];
        
        for (let i = 0; i < vehicleCount; i++) {
          const brandData = vehicleBrands[Math.floor(Math.random() * vehicleBrands.length)];
          const model = brandData.models[Math.floor(Math.random() * brandData.models.length)];
          const year = 2018 + Math.floor(Math.random() * 7); // 2018-2024
          const company = companies[Math.floor(Math.random() * companies.length)];
          const licensePlate = `BA${String(i + 100).padStart(3, '0')}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
          
          // Realistic pricing tiers
          const basePrice = randomPrice(40, 120);
          const pricing = [
            { id: '1', minDays: 0, maxDays: 1, pricePerDay: basePrice },
            { id: '2', minDays: 2, maxDays: 3, pricePerDay: basePrice * 0.9 },
            { id: '3', minDays: 4, maxDays: 7, pricePerDay: basePrice * 0.8 },
            { id: '4', minDays: 8, maxDays: 30, pricePerDay: basePrice * 0.7 }
          ];

          const commission = {
            type: 'percentage',
            value: Math.floor(Math.random() * 10) + 10 // 10-20%
          };

          const status = Math.random() > 0.8 ? 'maintenance' : 'available';

          try {
            const result = await client.query(
              `INSERT INTO vehicles (brand, model, year, license_plate, company, pricing, commission, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (license_plate) DO NOTHING
               RETURNING id, brand, model`,
              [brandData.brand, model, year, licensePlate, company, JSON.stringify(pricing), JSON.stringify(commission), status]
            );

            if (result.rows.length > 0) {
              vehicleIds.push(result.rows[0]);
              stats.vehicles++;
            }
          } catch (error) {
            logger.warn(`⚠️ SEED: Failed to create vehicle ${licensePlate}:`, error);
          }
        }
        logger.info(`✅ SEED: Created ${stats.vehicles} vehicles`);

        // 4. CREATE CUSTOMERS
        logger.info('👥 SEED: Creating customers...');
        const customerIds: Array<{ id: string; name: string }> = [];

        for (let i = 0; i < customerCount; i++) {
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          const name = `${firstName} ${lastName}`;
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
          const phone = `+42190${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`;

          try {
            const result = await client.query(
              `INSERT INTO customers (name, email, phone)
               VALUES ($1, $2, $3)
               ON CONFLICT (email) DO NOTHING
               RETURNING id, name`,
              [name, email, phone]
            );

            if (result.rows.length > 0) {
              customerIds.push(result.rows[0]);
              stats.customers++;
            }
          } catch (error) {
            logger.warn(`⚠️ SEED: Failed to create customer ${email}:`, error);
          }
        }
        logger.info(`✅ SEED: Created ${stats.customers} customers`);

        // 5. CREATE RENTALS
        logger.info('📄 SEED: Creating rentals...');
        
        if (vehicleIds.length > 0 && customerIds.length > 0) {
          const now = new Date();
          const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          const oneMonthFuture = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          for (let i = 0; i < rentalCount; i++) {
            const vehicle = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
            const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
            
            const startDate = randomDate(sixMonthsAgo, oneMonthFuture);
            const duration = Math.floor(Math.random() * 14) + 1; // 1-14 days
            const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

            const pricePerDay = randomPrice(50, 150);
            const totalPrice = pricePerDay * duration;
            const commission = totalPrice * 0.15;

            // Realistic status distribution
            let status: string;
            let paid: boolean;
            let confirmed: boolean;

            if (endDate < now) {
              // Past rental
              status = Math.random() > 0.1 ? 'completed' : 'cancelled';
              paid = Math.random() > 0.2;
              confirmed = true;
            } else if (startDate > now) {
              // Future rental
              status = 'confirmed';
              paid = Math.random() > 0.5;
              confirmed = true;
            } else {
              // Active rental
              status = 'active';
              paid = Math.random() > 0.3;
              confirmed = true;
            }

            const paymentMethods = ['cash', 'bank_transfer', 'card'];
            const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

            const handoverPlaces = [
              'Bratislava - Letisko',
              'Bratislava - Hlavná stanica',
              'Bratislava - Centrum',
              'Košice - Letisko',
              'Košice - Centrum',
              'Žilina - Centrum',
              'Prešov - Centrum'
            ];
            const handoverPlace = handoverPlaces[Math.floor(Math.random() * handoverPlaces.length)];

            try {
              await client.query(
                `INSERT INTO rentals (
                  vehicle_id, customer_id, customer_name,
                  start_date, end_date, total_price, commission,
                  payment_method, paid, confirmed, status, handover_place
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                  vehicle.id, customer.id, customer.name,
                  startDate, endDate, totalPrice, commission,
                  paymentMethod, paid, confirmed, status, handoverPlace
                ]
              );
              stats.rentals++;
            } catch (error) {
              logger.warn(`⚠️ SEED: Failed to create rental:`, error);
            }
          }
        }
        logger.info(`✅ SEED: Created ${stats.rentals} rentals`);

        // 6. CREATE EXPENSES (for random vehicles)
        logger.info('💰 SEED: Creating expenses...');
        const expenseCount = Math.min(50, vehicleIds.length * 2);

        for (let i = 0; i < expenseCount; i++) {
          const vehicle = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
          const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
          const amount = randomPrice(20, 500);
          const date = randomDate(
            new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            new Date()
          );

          try {
            await client.query(
              `INSERT INTO expenses (vehicle_id, amount, category, date, description)
               VALUES ($1, $2, $3, $4, $5)`,
              [vehicle.id, amount, category, date, `${category} - ${vehicle.brand} ${vehicle.model}`]
            );
            stats.expenses++;
          } catch (error) {
            logger.warn(`⚠️ SEED: Failed to create expense:`, error);
          }
        }
        logger.info(`✅ SEED: Created ${stats.expenses} expenses`);

        // 7. CREATE INSURANCES (for random vehicles)
        logger.info('🛡️ SEED: Creating insurances...');
        const insuranceCount = Math.min(20, vehicleIds.length);

        for (let i = 0; i < insuranceCount; i++) {
          const vehicle = vehicleIds[Math.floor(Math.random() * vehicleIds.length)];
          const insurer = insurers[Math.floor(Math.random() * insurers.length)];
          const type = insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)];
          const premium = randomPrice(500, 2000);
          
          const startDate = randomDate(
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            new Date()
          );
          const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

          try {
            await client.query(
              `INSERT INTO insurances (vehicle_id, insurer, type, policy_number, premium, start_date, end_date)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [vehicle.id, insurer, type, `POL-${Date.now()}-${i}`, premium, startDate, endDate]
            );
            stats.insurances++;
          } catch (error) {
            logger.warn(`⚠️ SEED: Failed to create insurance:`, error);
          }
        }
        logger.info(`✅ SEED: Created ${stats.insurances} insurances`);

        await client.query('COMMIT');

        logger.info('🎉 SEED: Realistic data generation complete!', stats);

        res.json({
          success: true,
          message: 'Realistické dáta úspešne vytvorené',
          data: stats
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('❌ SEED: Realistic data generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vytváraní realistických dát: ' + (error instanceof Error ? error.message : String(error))
      });
    }
  }
);

/**
 * DELETE /api/seed/clear-all-data
 * Clears all test data (DANGEROUS!)
 * Only for development/testing
 */
router.delete('/clear-all-data',
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      // Only super_admin can clear data
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Prístup zamietnutý. Len super_admin môže vymazať všetky dáta.'
        });
      }

      // Safety check: require confirmation parameter
      if (req.query.confirm !== 'yes-delete-everything') {
        return res.status(400).json({
          success: false,
          error: 'Musíš potvrdiť vymazanie pridaním ?confirm=yes-delete-everything'
        });
      }

      logger.warn('🗑️ SEED: CLEARING ALL DATA...');

      const client = await postgresDatabase.dbPool.connect();
      
      try {
        await client.query('BEGIN');

        // Delete in correct order (respect foreign keys)
        await client.query('DELETE FROM expenses');
        await client.query('DELETE FROM insurances');
        await client.query('DELETE FROM leasings');
        await client.query('DELETE FROM handover_protocols');
        await client.query('DELETE FROM return_protocols');
        await client.query('DELETE FROM rentals');
        await client.query('DELETE FROM vehicles');
        await client.query('DELETE FROM customers');
        await client.query('DELETE FROM companies WHERE name != \'Default Company\'');
        await client.query('DELETE FROM insurers');

        await client.query('COMMIT');

        logger.warn('✅ SEED: All data cleared!');

        res.json({
          success: true,
          message: 'Všetky dáta boli vymazané'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('❌ SEED: Data clearing failed:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri vymazávaní dát: ' + (error instanceof Error ? error.message : String(error))
      });
    }
  }
);

export default router;

