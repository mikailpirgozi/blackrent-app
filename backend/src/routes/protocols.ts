import express from 'express';
import { HandoverProtocol, ReturnProtocol } from '../types';

const router = express.Router();

// In-memory storage for protocols (temporary)
let handoverProtocols: HandoverProtocol[] = [];
let returnProtocols: ReturnProtocol[] = [];

// Get all protocols for a rental
router.get('/rental/:rentalId', async (req, res) => {
  try {
    const { rentalId } = req.params;
    
    const rentalHandoverProtocols = handoverProtocols.filter(p => p.rentalId === rentalId);
    const rentalReturnProtocols = returnProtocols.filter(p => p.rentalId === rentalId);
    
    res.json({ 
      handoverProtocols: rentalHandoverProtocols, 
      returnProtocols: rentalReturnProtocols 
    });
  } catch (error) {
    console.error('Error fetching protocols:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create handover protocol
router.post('/handover', async (req, res) => {
  try {
    const protocol: HandoverProtocol = req.body;
    handoverProtocols.push(protocol);
    
    res.status(201).json({ message: 'Handover protocol created successfully', protocol });
  } catch (error) {
    console.error('Error creating handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create return protocol
router.post('/return', async (req, res) => {
  try {
    const protocol: ReturnProtocol = req.body;
    returnProtocols.push(protocol);
    
    res.status(201).json({ message: 'Return protocol created successfully', protocol });
  } catch (error) {
    console.error('Error creating return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get handover protocol by ID
router.get('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const protocol = handoverProtocols.find(p => p.id === id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    res.json(protocol);
  } catch (error) {
    console.error('Error fetching handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get return protocol by ID
router.get('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const protocol = returnProtocols.find(p => p.id === id);
    
    if (!protocol) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    res.json(protocol);
  } catch (error) {
    console.error('Error fetching return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update handover protocol
router.put('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const index = handoverProtocols.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    handoverProtocols[index] = { ...handoverProtocols[index], ...updates };
    
    res.json({ message: 'Handover protocol updated successfully' });
  } catch (error) {
    console.error('Error updating handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update return protocol
router.put('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const index = returnProtocols.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    returnProtocols[index] = { ...returnProtocols[index], ...updates };
    
    res.json({ message: 'Return protocol updated successfully' });
  } catch (error) {
    console.error('Error updating return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete handover protocol
router.delete('/handover/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const index = handoverProtocols.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Handover protocol not found' });
    }
    
    handoverProtocols.splice(index, 1);
    
    res.json({ message: 'Handover protocol deleted successfully' });
  } catch (error) {
    console.error('Error deleting handover protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete return protocol
router.delete('/return/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const index = returnProtocols.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Return protocol not found' });
    }
    
    returnProtocols.splice(index, 1);
    
    res.json({ message: 'Return protocol deleted successfully' });
  } catch (error) {
    console.error('Error deleting return protocol:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 