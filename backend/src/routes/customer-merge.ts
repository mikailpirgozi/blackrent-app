import express from 'express';
import { postgresDatabase } from '../models/postgres-database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// 🔍 GET /api/customer-merge/duplicates - Nájdi duplicitných zákazníkov
router.get('/duplicates', authenticateToken, async (req, res) => {
  try {
    logger.info('🔍 Finding duplicate customers...');
    
    const duplicates = await postgresDatabase.findDuplicateCustomers();
    
    // Pridaj štatistiky pre každého zákazníka
    const duplicatesWithStats = await Promise.all(
      duplicates.map(async (duplicate) => {
        const customer1Stats = await postgresDatabase.getCustomerStats(duplicate.group[0].id);
        const customer2Stats = await postgresDatabase.getCustomerStats(duplicate.group[1].id);
        
        return {
          ...duplicate,
          group: [
            { ...duplicate.group[0], stats: customer1Stats },
            { ...duplicate.group[1], stats: customer2Stats }
          ]
        };
      })
    );
    
    logger.info(`✅ Found ${duplicatesWithStats.length} potential duplicate groups`);
    res.json({
      success: true,
      data: duplicatesWithStats
    });
  } catch (error) {
    logger.error(`❌ Error finding duplicates: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Chyba pri hľadaní duplicitných zákazníkov'
    });
  }
});

// 🔄 POST /api/customer-merge/merge - Zjednoť zákazníkov
router.post('/merge', authenticateToken, async (req, res) => {
  try {
    const { targetCustomerId, sourceCustomerId, mergedData } = req.body;
    
    // Validácia vstupných údajov
    if (!targetCustomerId || !sourceCustomerId || !mergedData) {
      return res.status(400).json({
        success: false,
        error: 'Chýbajú povinné údaje pre merge'
      });
    }
    
    if (targetCustomerId === sourceCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'Nemožno zjednotiť zákazníka so sebou samým'
      });
    }
    
    if (!mergedData.name || !mergedData.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Meno zákazníka je povinné'
      });
    }
    
    logger.info(`🔄 Merging customer ${sourceCustomerId} into ${targetCustomerId}`);
    
    // Získaj štatistiky pred merge
    const sourceStats = await postgresDatabase.getCustomerStats(sourceCustomerId);
    const targetStats = await postgresDatabase.getCustomerStats(targetCustomerId);
    
    // Vykonaj merge
    await postgresDatabase.mergeCustomers(targetCustomerId, sourceCustomerId, {
      name: mergedData.name.trim(),
      email: mergedData.email?.trim() || '',
      phone: mergedData.phone?.trim() || ''
    });
    
    // Získaj finálne štatistiky
    const finalStats = await postgresDatabase.getCustomerStats(targetCustomerId);
    
    logger.info(`✅ Customer merge completed: ${sourceStats.rentalCount + targetStats.rentalCount} rentals merged`);
    
    res.json({
      success: true,
      data: {
        mergedCustomerId: targetCustomerId,
        mergedRentals: sourceStats.rentalCount + targetStats.rentalCount,
        finalStats
      }
    });
  } catch (error) {
    logger.error(`❌ Error merging customers: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Chyba pri zjednocovaní zákazníkov'
    });
  }
});

// 📊 GET /api/customer-merge/stats/:customerId - Získaj štatistiky zákazníka
router.get('/stats/:customerId', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const stats = await postgresDatabase.getCustomerStats(customerId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`❌ Error getting customer stats: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Chyba pri získavaní štatistík zákazníka'
    });
  }
});

export default router;
