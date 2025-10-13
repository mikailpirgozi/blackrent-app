import type { Request, Response } from 'express';
import { Router } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import type { Customer, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import { cacheResponse, invalidateCache, userSpecificCache } from '../middleware/cache-middleware';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

// GET /api/customers - Získanie všetkých zákazníkov s cache
router.get('/', 
  authenticateToken,
  cacheResponse('customers', {
    cacheKey: userSpecificCache,
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ['customers']
  }),
  async (req: Request, res: Response<ApiResponse<Customer[]>>) => {
  try {
    let customers = await postgresDatabase.getCustomers();
    
    console.log('👥 Customers GET - user:', { 
      role: req.user?.role, 
      userId: req.user?.id,
      username: req.user?.username,
      platformId: req.user?.platformId,
      totalCustomers: customers.length 
    });
    
    // 🔍 DEBUG: Log first 3 customers
    console.log('🔍 CUSTOMERS SAMPLE (first 3):', customers.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      email: c.email
    })));
    
    // 🔐 PLATFORM FILTERING - Apply to ALL users with platformId (including admin role)
    if (req.user && req.user.platformId && req.user.role !== 'super_admin') {
      const user = req.user;
      const originalCount = customers.length;
      
      console.log('🌐 CUSTOMERS: Platform filtering - user:', { username: user.username, role: user.role, platformId: user.platformId });
      
      // Get all companies for this platform
      const companies = await postgresDatabase.getCompanies();
      const platformCompanies = companies.filter(c => c.platformId === user.platformId);
      const allowedCompanyIds = platformCompanies.map(c => c.id);
      
      console.log('🔍 CUSTOMERS: Platform companies:', { platformId: user.platformId, companyCount: platformCompanies.length, companyNames: platformCompanies.map(c => c.name) });
      
      // Získaj všetky rentals a vehicles pre mapping
      const rentals = await postgresDatabase.getRentals();
      const vehicles = await postgresDatabase.getVehicles();
      
      // Filter zákazníkov len tých, ktorí mali prenajaté vozidlá z platform companies
      const allowedCustomerIds = new Set<string>();
      
      rentals.forEach(rental => {
        if (!rental.customerId || !rental.vehicleId) return;
        
        const vehicle = vehicles.find(v => v.id === rental.vehicleId);
        if (!vehicle || !vehicle.ownerCompanyId) return;
        
        // Check if vehicle belongs to platform company
        if (allowedCompanyIds.includes(vehicle.ownerCompanyId)) {
          allowedCustomerIds.add(rental.customerId);
        }
      });
      
      customers = customers.filter(c => allowedCustomerIds.has(c.id));
      
      console.log('🌐 CUSTOMERS: Platform filter applied:', { originalCount, filteredCount: customers.length });
    } else if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin' && req.user) {
      // Regular users WITHOUT platformId: filter podľa company permissions
      const user = req.user;
      const originalCount = customers.length;
      
      // Získaj company access pre používateľa
      const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(user.id);
      const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
      
      // Získaj všetky rentals a vehicles pre mapping
      const rentals = await postgresDatabase.getRentals();
      const vehicles = await postgresDatabase.getVehicles();
      
      // Filter zákazníkov len tých, ktorí mali prenajaté vozidlá z povolených firiem
      const allowedCustomerIds = new Set<string>();
      
      rentals.forEach(rental => {
        if (!rental.customerId || !rental.vehicleId) return;
        
        const vehicle = vehicles.find(v => v.id === rental.vehicleId);
        if (!vehicle || !vehicle.ownerCompanyId) return;
        
        if (allowedCompanyIds.includes(vehicle.ownerCompanyId)) {
          allowedCustomerIds.add(rental.customerId);
        }
      });
      
      customers = customers.filter(c => allowedCustomerIds.has(c.id));
      
      console.log('🔐 Customers Company Permission Filter:', {
        userId: user.id,
        allowedCompanyIds,
        originalCount,
        filteredCount: customers.length,
        allowedCustomerIds: Array.from(allowedCustomerIds)
      });
    }
    
    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní zákazníkov'
    });
  }
});

// POST /api/customers - Vytvorenie nového zákazníka
router.post('/', 
  authenticateToken, 
  checkPermission('customers', 'create'),
  invalidateCache('customer'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    console.log('🎯 Customer creation started with data:', req.body);
    const { name, email, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.log('❌ Customer validation failed - missing or invalid name:', name);
      return res.status(400).json({
        success: false,
        error: 'Meno zákazníka je povinné a musí byť vyplnené'
      });
    }

    console.log('✅ Customer validation passed, creating customer...');
    console.log('📝 Customer data:', {
      name: name.trim(),
      email: email || null,
      phone: phone || null
    });

    const createdCustomer = await postgresDatabase.createCustomer({
      name: name.trim(),
      email: email || null,
      phone: phone || null
    });

    console.log('🎉 Customer created successfully:', createdCustomer.id);

    res.status(201).json({
      success: true,
      message: 'Zákazník úspešne vytvorený',
      data: createdCustomer
    });

  } catch (error: unknown) {
    const dbError = error as { name?: string; code?: string; detail?: string; stack?: string };
    console.error('❌ DETAILED Create customer error:');
    console.error('   Error name:', dbError.name);
    console.error('   Error message:', error instanceof Error ? error.message : String(error));
    console.error('   Error code:', dbError.code);
    console.error('   Error detail:', dbError.detail);
    console.error('   Error stack:', dbError.stack);
    console.error('   Full error object:', error);
    
    res.status(500).json({
      success: false,
      error: `Chyba pri vytváraní zákazníka: ${error instanceof Error ? error.message : String(error) || 'Neznáma chyba'}`
    });
  }
});

// PUT /api/customers/:id - Aktualizácia zákazníka
router.put('/:id', 
  authenticateToken, 
  checkPermission('customers', 'update'),
  invalidateCache('customer'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Meno zákazníka je povinné'
      });
    }

    const updatedCustomer: Customer = {
      id,
      name,
      email: email || '',
      phone: phone || '',
      createdAt: new Date()
    };

    await postgresDatabase.updateCustomer(updatedCustomer);

    res.json({
      success: true,
      message: 'Zákazník úspešne aktualizovaný',
      data: updatedCustomer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri aktualizácii zákazníka'
    });
  }
});

// DELETE /api/customers/:id - Vymazanie zákazníka
router.delete('/:id', 
  authenticateToken, 
  checkPermission('customers', 'delete'),
  invalidateCache('customer'),
  async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    await postgresDatabase.deleteCustomer(id);

    res.json({
      success: true,
      message: 'Zákazník úspešne vymazaný'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vymazávaní zákazníka'
    });
  }
});

// 📊 CSV EXPORT - Export zákazníkov do CSV
router.get('/export/csv', 
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      let customers = await postgresDatabase.getCustomers();
      
      // 🔐 NON-ADMIN USERS - filter podľa company permissions
      if (req.user?.role !== 'admin' && req.user) {
        const userCompanyAccess = await postgresDatabase.getUserCompanyAccess(req.user.id);
        const allowedCompanyIds = userCompanyAccess.map(access => access.companyId);
        
        const rentals = await postgresDatabase.getRentals();
        const vehicles = await postgresDatabase.getVehicles();
        
        const allowedCustomerIds = new Set<string>();
        rentals.forEach(rental => {
          if (!rental.customerId || !rental.vehicleId) return;
          const vehicle = vehicles.find(v => v.id === rental.vehicleId);
          if (!vehicle || !vehicle.ownerCompanyId) return;
          if (allowedCompanyIds.includes(vehicle.ownerCompanyId)) {
            allowedCustomerIds.add(rental.customerId);
          }
        });
        
        customers = customers.filter(c => allowedCustomerIds.has(c.id));
      }

      // Vytvor CSV hlavičky
      const csvHeaders = [
        'ID',
        'Meno',
        'Email',
        'Telefón',
        'Vytvorené'
      ];

      // Konvertuj zákazníkov na CSV riadky
      const csvRows = customers.map(customer => [
        customer.id,
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.createdAt ? customer.createdAt.toISOString().split('T')[0] : ''
      ]);

      // Vytvor CSV obsah
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Nastav response headers pre CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="zakaznici-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Pridaj BOM pre správne zobrazenie diakritiky v Exceli
      res.send('\ufeff' + csvContent);

      console.log(`📊 CSV Export: ${customers.length} zákazníkov exportovaných pre používateľa ${req.user?.username}`);

    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri exporte CSV'
      });
    }
  }
);

// 📥 CSV IMPORT - Import zákazníkov z CSV
router.post('/import/csv',
  authenticateToken,
  checkPermission('customers', 'create'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData || typeof csvData !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'CSV dáta sú povinné'
        });
      }

      // Parsuj CSV
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'CSV musí obsahovať aspoň hlavičku a jeden riadok dát'
        });
      }

      // Preskočíme hlavičku
      const dataLines = lines.slice(1);
      const results = [];
      const errors = [];

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const line = dataLines[i].trim();
          if (!line) continue;

          // Parsuj CSV riadok
          const fields = line.split(',').map(field => field.replace(/^"|"$/g, '').trim());
          
          if (fields.length < 2) {
            errors.push({ row: i + 2, error: 'Nedostatok stĺpcov' });
            continue;
          }

          const [, name, email, phone] = fields;

          if (!name) {
            errors.push({ row: i + 2, error: 'Meno zákazníka je povinné' });
            continue;
          }

          // Vytvor zákazníka
          const customerData = {
            name: name.trim(),
            email: email?.trim() || '',
            phone: phone?.trim() || ''
          };

          const createdCustomer = await postgresDatabase.createCustomer(customerData);
          results.push({ row: i + 2, customer: createdCustomer });

        } catch (error: unknown) {
          errors.push({ 
            row: i + 2, 
            error: error instanceof Error ? error.message : String(error) || 'Chyba pri vytváraní zákazníka' 
          });
        }
      }

      res.json({
        success: true,
        message: `CSV import dokončený: ${results.length} úspešných, ${errors.length} chýb`,
        data: {
          imported: results.length,
          errorsCount: errors.length,
          results,
          errors: errors.slice(0, 10) // Limit na prvých 10 chýb
        }
      });

      console.log(`📥 CSV Import: ${results.length} zákazníkov importovaných, ${errors.length} chýb`);

    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri importe CSV'
      });
    }
  }
);

// 🚀 GMAIL APPROACH: GET /api/customers/paginated - Rýchle vyhľadávanie zákazníkov
router.get('/paginated', 
  authenticateToken,
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const { 
        page = 1, 
        limit = 50,
        search = '',
        city = 'all',
        country = 'all',
        hasRentals = 'all'
      } = req.query;

      console.log('👥 Customers PAGINATED GET - params:', { 
        page, limit, search, city, country, hasRentals,
        role: req.user?.role, 
        userId: req.user?.id
      });

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Získaj paginated customers s filtrami
      const result = await postgresDatabase.getCustomersPaginated({
        limit: limitNum,
        offset,
        search: search as string,
        city: city as string,
        country: country as string,
        hasRentals: hasRentals as string,
        userId: req.user?.id,
        userRole: req.user?.role
      });

      console.log(`📊 Found ${result.customers.length}/${result.total} customers (page ${pageNum})`);

      res.json({
        success: true,
        data: {
          customers: result.customers,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(result.total / limitNum),
            totalItems: result.total,
            hasMore: (pageNum * limitNum) < result.total,
            itemsPerPage: limitNum
          }
        }
      });
    } catch (error) {
      console.error('Get paginated customers error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní zákazníkov'
      });
    }
  }
);

export default router; 