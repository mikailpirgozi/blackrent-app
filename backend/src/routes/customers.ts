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
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Meno zákazníka je povinné'
      });
    }

    const newCustomer: Customer = {
      id: uuidv4(),
      name,
      email: email || '',
      phone: phone || '',
      createdAt: new Date()
    };

    await postgresDatabase.createCustomer(newCustomer);

    res.status(201).json({
      success: true,
      message: 'Zákazník úspešne vytvorený',
      data: newCustomer
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Chyba pri vytváraní zákazníka'
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