import type { Router } from 'express';
import express from 'express';
import { postgresDatabase } from '../models/postgres-database.js';
import { generateHandoverPDF, generateReturnPDF } from '../utils/pdf-generator.js';
import { r2Storage } from '../utils/r2-storage.js';

const router: Router = express.Router();

// 🔍 DEBUG: Platform isolation diagnostics
router.get('/platform-isolation', async (req, res) => {
  try {
    const client = await (postgresDatabase as any).pool.connect();
    
    try {
      // 1. Check users with platform_id
      const users = await client.query(`
        SELECT id, username, role, platform_id, company_id 
        FROM users 
        WHERE username ILIKE '%impresario%'
      `);
      
      // 2. Check platforms
      const platforms = await client.query(`SELECT id, name FROM platforms ORDER BY name`);
      
      // 3. Check companies with platform_id
      const companies = await client.query(`
        SELECT id, name, platform_id 
        FROM companies 
        ORDER BY name
        LIMIT 20
      `);
      
      // 4. Check vehicles with platform_id via JOIN
      const vehicles = await client.query(`
        SELECT v.id, v.brand, v.model, v.license_plate, 
               v.company_id as vehicle_company_id,
               c.name as company_name, 
               c.platform_id as company_platform_id
        FROM vehicles v
        LEFT JOIN companies c ON v.company_id = c.id
        ORDER BY v.brand, v.model
        LIMIT 20
      `);
      
      res.json({
        success: true,
        data: {
          users: users.rows,
          platforms: platforms.rows,
          companies: companies.rows,
          vehicles: vehicles.rows
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Platform isolation debug error:', error);
    res.status(500).json({
      success: false,
      error: String(error)
    });
  }
});

// Get company info (debug endpoint)
router.get('/companies/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const companies = await postgresDatabase.getCompanies();
    const filtered = companies.filter((c) => 
      c.name.toLowerCase().includes(name.toLowerCase())
    );
    
    res.json({ companies: filtered });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update protocol_display_name for a company
router.post('/companies/:id/set-protocol-name', async (req, res) => {
  try {
    const { id } = req.params;
    const { protocolDisplayName } = req.body;
    
    await postgresDatabase.updateCompany(id, { protocolDisplayName });
    
    res.json({ success: true, message: `Updated protocol_display_name to "${protocolDisplayName}"` });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Regenerate protocol PDF by ID
router.post('/protocols/:type/:id/regenerate', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (type !== 'handover' && type !== 'return') {
      return res.status(400).json({ error: 'Invalid protocol type. Must be "handover" or "return"' });
    }
    
    // Fetch protocol from database
    let protocol;
    if (type === 'handover') {
      protocol = await postgresDatabase.getHandoverProtocolById(id);
    } else {
      protocol = await postgresDatabase.getReturnProtocolById(id);
    }
    
    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }
    
    console.log('🔄 Regenerating protocol:', { type, id });
    console.log('📋 Current rental data:', JSON.stringify(protocol.rentalData, null, 2));
    
    // Generate new PDF
    let pdfBuffer: Buffer;
    if (type === 'handover') {
      const handoverProtocol = protocol as Awaited<ReturnType<typeof postgresDatabase.getHandoverProtocolById>>;
      if (!handoverProtocol) {
        return res.status(404).json({ error: 'Handover protocol not found' });
      }
      pdfBuffer = await generateHandoverPDF(handoverProtocol);
    } else {
      const returnProtocol = protocol as Awaited<ReturnType<typeof postgresDatabase.getReturnProtocolById>>;
      if (!returnProtocol) {
        return res.status(404).json({ error: 'Return protocol not found' });
      }
      pdfBuffer = await generateReturnPDF(returnProtocol);
    }
    
    // Upload to R2
    const filename = `protocols/${type}/${id}-${Date.now()}.pdf`;
    const pdfUrl = await r2Storage.uploadFile(filename, pdfBuffer, 'application/pdf');
    
    // Update protocol with new PDF URL
    if (type === 'handover') {
      await postgresDatabase.updateHandoverProtocol(id, { pdfUrl });
    } else {
      await postgresDatabase.updateReturnProtocol(id, { pdfUrl });
    }
    
    console.log('✅ Protocol regenerated:', { type, id, pdfUrl });
    
    res.json({ 
      success: true, 
      message: `Protocol ${type}/${id} regenerated successfully`,
      pdfUrl,
      protocol: {
        id: protocol.id,
        rentalId: protocol.rentalId,
        vehicleCompany: protocol.rentalData?.vehicle?.company,
        ownerCompanyId: protocol.rentalData?.vehicle?.ownerCompanyId
      }
    });
  } catch (error) {
    console.error('Error regenerating protocol:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate protocol', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all protocols for a rental
router.get('/rentals/:rentalId/protocols', async (req, res) => {
  try {
    const { rentalId } = req.params;
    
    const handoverProtocols = await postgresDatabase.getHandoverProtocolsByRental(rentalId);
    const returnProtocols = await postgresDatabase.getReturnProtocolsByRental(rentalId);
    
    res.json({
      rentalId,
      handover: handoverProtocols.map((p: any) => ({
        id: p.id,
        createdAt: p.createdAt,
        pdfUrl: p.pdfUrl,
        vehicleCompany: p.rentalData?.vehicle?.company,
        ownerCompanyId: p.rentalData?.vehicle?.ownerCompanyId
      })),
      return: returnProtocols.map((p: any) => ({
        id: p.id,
        createdAt: p.createdAt,
        pdfUrl: p.pdfUrl,
        vehicleCompany: p.rentalData?.vehicle?.company,
        ownerCompanyId: p.rentalData?.vehicle?.ownerCompanyId
      }))
    });
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ error: 'Failed to fetch protocols', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

