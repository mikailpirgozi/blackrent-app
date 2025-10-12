import express from 'express';
import { postgresDatabase } from '../models/database.js';
import { generateHandoverPDF, generateReturnPDF } from '../utils/pdf-generator.js';
import { r2Storage } from '../utils/r2-storage.js';

const router = express.Router();

// Get company info (debug endpoint)
router.get('/companies/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const result = await postgresDatabase.pool.query(
      'SELECT id, name, protocol_display_name, owner_name FROM companies WHERE LOWER(name) LIKE LOWER($1)',
      [`%${name}%`]
    );
    
    res.json({ companies: result.rows });
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
    
    await postgresDatabase.pool.query(
      'UPDATE companies SET protocol_display_name = $1 WHERE id = $2',
      [protocolDisplayName, id]
    );
    
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
    const pdfBuffer = type === 'handover' 
      ? await generateHandoverPDF(protocol)
      : await generateReturnPDF(protocol);
    
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
      handover: handoverProtocols.map(p => ({
        id: p.id,
        createdAt: p.createdAt,
        pdfUrl: p.pdfUrl,
        vehicleCompany: p.rentalData?.vehicle?.company,
        ownerCompanyId: p.rentalData?.vehicle?.ownerCompanyId
      })),
      return: returnProtocols.map(p => ({
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

