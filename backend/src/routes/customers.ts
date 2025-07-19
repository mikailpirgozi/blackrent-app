import { Router, Request, Response } from 'express';
import { postgresDatabase } from '../models/postgres-database';
import { Customer, ApiResponse } from '../types';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/customers - Získanie všetkých zákazníkov
router.get('/', authenticateToken, async (req: Request, res: Response<ApiResponse<Customer[]>>) => {
  try {
    const customers = await postgresDatabase.getCustomers();
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
router.post('/', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
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

  } catch (error: any) {
    console.error('❌ DETAILED Create customer error:');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error detail:', error.detail);
    console.error('   Error stack:', error.stack);
    console.error('   Full error object:', error);
    
    res.status(500).json({
      success: false,
      error: `Chyba pri vytváraní zákazníka: ${error.message || 'Neznáma chyba'}`
    });
  }
});

// PUT /api/customers/:id - Aktualizácia zákazníka
router.put('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
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
router.delete('/:id', authenticateToken, async (req: Request, res: Response<ApiResponse>) => {
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

export default router; 