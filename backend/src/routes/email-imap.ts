import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { checkPermission } from '../middleware/permissions';
import ImapEmailService from '../services/imap-email-service';

const router = Router();

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Import global IMAP service from main server
let imapService: ImapEmailService | null = null;

// Get global IMAP service status (from main server auto-start)
function getGlobalImapStatus(): boolean {
  // Check if there's a global IMAP running by environment
  return process.env.IMAP_AUTO_STARTED === 'true';
}

// GET /api/email-imap/test - Test IMAP pripojenia
router.get('/test',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
      
      if (!isEnabled) {
        return res.json({
          success: true,
          data: {
            connected: false,
            enabled: false,
            message: 'IMAP služba je vypnutá',
            timestamp: new Date().toISOString(),
            config: {
              host: process.env.IMAP_HOST || 'imap.m1.websupport.sk',
              port: process.env.IMAP_PORT || '993',
              user: process.env.IMAP_USER || 'info@blackrent.sk'
            }
          }
        });
      }
      
      console.log('🧪 IMAP: Testujem pripojenie...');
      
      const testService = new ImapEmailService();
      const isConnected = await testService.testConnection();
      
      res.json({
        success: true,
        data: {
          connected: isConnected,
          enabled: true,
          timestamp: new Date().toISOString(),
          config: {
            host: process.env.IMAP_HOST || 'imap.m1.websupport.sk',
            port: process.env.IMAP_PORT || '993',
            user: process.env.IMAP_USER || 'info@blackrent.sk'
          }
        }
      });
    } catch (error) {
      console.error('❌ IMAP Test error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri testovaní IMAP pripojenia'
      });
    }
  }
);

// POST /api/email-imap/start - Spustiť IMAP monitoring
router.post('/start',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      if (imapService) {
        return res.status(400).json({
          success: false,
          error: 'IMAP monitoring už beží'
        });
      }

      console.log('🚀 IMAP: Spúšťam monitoring...');
      
      imapService = new ImapEmailService();
      
      // Spustiť monitoring v background (každých 30 sekúnd)
      imapService.startMonitoring(0.5).catch(error => {
        console.error('❌ IMAP Monitoring error:', error);
      });
      
      res.json({
        success: true,
        data: {
          status: 'started',
          interval: '30 seconds',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ IMAP Start error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri spustení IMAP monitoringu'
      });
    }
  }
);

// POST /api/email-imap/stop - Zastaviť IMAP monitoring
router.post('/stop',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      if (!imapService) {
        return res.status(400).json({
          success: false,
          error: 'IMAP monitoring nebeží'
        });
      }

      console.log('🛑 IMAP: Zastavujem monitoring...');
      
      await imapService.disconnect();
      imapService = null;
      
      res.json({
        success: true,
        data: {
          status: 'stopped',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ IMAP Stop error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri zastavení IMAP monitoringu'
      });
    }
  }
);

// POST /api/email-imap/check-now - Manuálna kontrola emailov
router.post('/check-now',
  authenticateToken,
  checkPermission('rentals', 'update'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      console.log('🔍 IMAP: Manuálna kontrola emailov...');
      
      const checkService = new ImapEmailService();
      await checkService.checkForNewEmails();
      
      res.json({
        success: true,
        data: {
          status: 'checked',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ IMAP Check error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri kontrole emailov'
      });
    }
  }
);

// GET /api/email-imap/status - Status IMAP monitoringu
router.get('/status',
  authenticateToken,
  checkPermission('rentals', 'read'),
  async (req: Request, res: Response<ApiResponse>) => {
    try {
      const isEnabled = process.env.IMAP_ENABLED !== 'false' && !!process.env.IMAP_PASSWORD;
      
      const globalRunning = getGlobalImapStatus();
      const manualRunning = !!imapService;
      const anyRunning = globalRunning || manualRunning;
      
      res.json({
        success: true,
        data: {
          running: anyRunning,
          enabled: isEnabled,
          autoStarted: globalRunning,
          manuallyStarted: manualRunning,
          timestamp: new Date().toISOString(),
          config: {
            host: process.env.IMAP_HOST || 'imap.m1.websupport.sk',
            user: process.env.IMAP_USER || 'info@blackrent.sk',
            enabled: isEnabled,
            autoStart: process.env.IMAP_AUTO_START !== 'false'
          }
        }
      });
    } catch (error) {
      console.error('❌ IMAP Status error:', error);
      res.status(500).json({
        success: false,
        error: 'Chyba pri získavaní statusu'
      });
    }
  }
);

export default router;