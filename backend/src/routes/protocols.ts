import express from 'express';
import multer from 'multer';
import { HandoverProtocol, ReturnProtocol } from '../types';
import { postgresDatabase } from '../models/postgres-database';

const router = express.Router();

// Multer config for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all protocols for a rental
router.get('/rental/:rentalId', async (req, res) => {
  try {
    const { rentalId } = req.params;
    console.log('📋 Fetching protocols for rental:', rentalId);
    
    const [rentalHandoverProtocols, rentalReturnProtocols] = await Promise.all([
      postgresDatabase.getHandoverProtocolsByRental(rentalId),
      postgresDatabase.getReturnProtocolsByRental(rentalId)
    ]);
    
    res.json({ 
      handoverProtocols: rentalHandoverProtocols, 
      returnProtocols: rentalReturnProtocols 
    });
  } catch (error) {
    console.error('❌ Error fetching protocols:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create handover protocol
router.post('/handover', async (req, res) => {
  try {
    const protocolData: HandoverProtocol = req.body;
    console.log('📝 Creating handover protocol:', protocolData.id);
    
    const protocol = await postgresDatabase.createHandoverProtocol(protocolData);
    
    res.status(201).json({ 
      message: 'Handover protocol created successfully', 
      protocol 
    });
  } catch (error) {
    console.error('❌ Error creating handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create return protocol
router.post('/return', async (req, res) => {
  try {
    const protocolData: ReturnProtocol = req.body;
    console.log('📝 Creating return protocol:', protocolData.id);
    
    const protocol = await postgresDatabase.createReturnProtocol(protocolData);
    
    res.status(201).json({ 
      message: 'Return protocol created successfully', 
      protocol 
    });
  } catch (error) {
    console.error('❌ Error creating return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get handover protocol by ID
router.get('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching handover protocol:', id);
    
    const protocol = await postgresDatabase.getHandoverProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    res.json(protocol);
  } catch (error) {
    console.error('❌ Error fetching handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get return protocol by ID
router.get('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching return protocol:', id);
    
    const protocol = await postgresDatabase.getReturnProtocolById(id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    res.json(protocol);
  } catch (error) {
    console.error('❌ Error fetching return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update handover protocol
router.put('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('✏️ Updating handover protocol:', id);
    
    // For now, we don't have a specific update method for handover protocols
    // This could be implemented if needed
    res.status(501).json({ error: 'Update handover protocol not implemented yet' });
    
  } catch (error) {
    console.error('❌ Error updating handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update return protocol
router.put('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log('✏️ Updating return protocol:', id);
    
    const protocol = await postgresDatabase.updateReturnProtocol(id, updates);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    res.json({ 
      message: 'Return protocol updated successfully',
      protocol 
    });
  } catch (error) {
    console.error('❌ Error updating return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete handover protocol
router.delete('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting handover protocol:', id);
    
    // For now, deletion is not implemented for safety
    // Could be implemented with proper authorization checks
    res.status(501).json({ error: 'Delete handover protocol not implemented for safety' });
    
  } catch (error) {
    console.error('❌ Error deleting handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete return protocol
router.delete('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting return protocol:', id);
    
    // For now, deletion is not implemented for safety
    // Could be implemented with proper authorization checks
    res.status(501).json({ error: 'Delete return protocol not implemented for safety' });
    
  } catch (error) {
    console.error('❌ Error deleting return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 