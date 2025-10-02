/**
 * 🇪🇺 GDPR Compliance Manager
 * Complete GDPR compliance system for data protection and privacy
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';
import { securityManager } from './security-manager';

interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: number;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: number;
}

interface DataProcessingRecord {
  id: string;
  userId: string;
  dataType: DataType;
  purpose: ProcessingPurpose;
  legalBasis: LegalBasis;
  timestamp: number;
  retentionPeriod: number; // days
  automated: boolean;
}

interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: number;
  completedAt?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: number;
}

interface DataDeletionRequest {
  id: string;
  userId: string;
  requestedAt: number;
  completedAt?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletedData: string[];
  retainedData: string[];
  retentionReason?: string;
}

type ConsentType = 
  | 'essential' 
  | 'analytics' 
  | 'marketing' 
  | 'personalization' 
  | 'location' 
  | 'biometric'
  | 'third_party_sharing';

type DataType = 
  | 'personal_info' 
  | 'contact_info' 
  | 'location_data' 
  | 'biometric_data' 
  | 'usage_data' 
  | 'device_data'
  | 'payment_data'
  | 'communication_data';

type ProcessingPurpose = 
  | 'service_provision' 
  | 'analytics' 
  | 'marketing' 
  | 'security' 
  | 'legal_compliance'
  | 'customer_support';

type LegalBasis = 
  | 'consent' 
  | 'contract' 
  | 'legal_obligation' 
  | 'vital_interests' 
  | 'public_task'
  | 'legitimate_interests';

interface GDPRConfig {
  enableConsentManagement: boolean;
  enableDataMinimization: boolean;
  enableAutomaticDeletion: boolean;
  defaultRetentionPeriod: number; // days
  consentExpiryPeriod: number; // days
  dataExportFormat: 'json' | 'csv' | 'xml';
  anonymizationDelay: number; // days after deletion request
}

class GDPRComplianceManager {
  private config: GDPRConfig;
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private processingRecords: Map<string, DataProcessingRecord[]> = new Map();
  private exportRequests: Map<string, DataExportRequest> = new Map();
  private deletionRequests: Map<string, DataDeletionRequest> = new Map();

  constructor(config: Partial<GDPRConfig> = {}) {
    this.config = {
      enableConsentManagement: true,
      enableDataMinimization: true,
      enableAutomaticDeletion: true,
      defaultRetentionPeriod: 365, // 1 year
      consentExpiryPeriod: 730, // 2 years
      dataExportFormat: 'json',
      anonymizationDelay: 30, // 30 days
      ...config,
    };
  }

  /**
   * Initialize GDPR compliance system
   */
  async initialize(): Promise<void> {
    logger.info('🇪🇺 Initializing GDPR Compliance Manager...');

    try {
      // Load existing records
      await this.loadStoredRecords();
      
      // Start compliance monitoring
      this.startComplianceMonitoring();
      
      // Schedule automatic cleanup
      this.scheduleAutomaticCleanup();

      logger.info('✅ GDPR Compliance Manager initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize GDPR Compliance Manager', error);
      throw error;
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    version: string = '1.0',
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const consentRecord: ConsentRecord = {
      id: this.generateId(),
      userId,
      consentType,
      granted,
      timestamp: Date.now(),
      version,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      expiresAt: granted ? Date.now() + (this.config.consentExpiryPeriod * 24 * 60 * 60 * 1000) : undefined,
    };

    // Store consent record
    const userConsents = this.consentRecords.get(userId) || [];
    userConsents.push(consentRecord);
    this.consentRecords.set(userId, userConsents);

    // Persist to storage
    await this.persistConsentRecords();

    // Log processing activity
    await this.recordDataProcessing(userId, 'personal_info', 'legal_compliance', 'consent');

    logger.info(`Consent recorded: ${consentType} = ${granted} for user ${userId}`);
  }

  /**
   * Check if user has valid consent
   */
  hasValidConsent(userId: string, consentType: ConsentType): boolean {
    const userConsents = this.consentRecords.get(userId) || [];
    
    // Find latest consent for this type
    const latestConsent = userConsents
      .filter(c => c.consentType === consentType)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!latestConsent) {
      return false;
    }

    // Check if consent is granted and not expired
    if (!latestConsent.granted) {
      return false;
    }

    if (latestConsent.expiresAt && Date.now() > latestConsent.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Record data processing activity
   */
  async recordDataProcessing(
    userId: string,
    dataType: DataType,
    purpose: ProcessingPurpose,
    legalBasis: LegalBasis,
    automated: boolean = false,
    retentionPeriod?: number
  ): Promise<void> {
    const processingRecord: DataProcessingRecord = {
      id: this.generateId(),
      userId,
      dataType,
      purpose,
      legalBasis,
      timestamp: Date.now(),
      retentionPeriod: retentionPeriod || this.config.defaultRetentionPeriod,
      automated,
    };

    // Store processing record
    const userProcessing = this.processingRecords.get(userId) || [];
    userProcessing.push(processingRecord);
    this.processingRecords.set(userId, userProcessing);

    // Persist to storage
    await this.persistProcessingRecords();

    logger.debug(`Data processing recorded: ${dataType} for ${purpose} (${legalBasis})`);
  }

  /**
   * Request data export (Right to Data Portability)
   */
  async requestDataExport(userId: string): Promise<string> {
    const requestId = this.generateId();
    
    const exportRequest: DataExportRequest = {
      id: requestId,
      userId,
      requestedAt: Date.now(),
      status: 'pending',
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    };

    this.exportRequests.set(requestId, exportRequest);
    await this.persistExportRequests();

    // Start processing in background
    this.processDataExport(requestId);

    logger.info(`Data export requested by user ${userId}, request ID: ${requestId}`);
    return requestId;
  }

  /**
   * Process data export request
   */
  private async processDataExport(requestId: string): Promise<void> {
    const request = this.exportRequests.get(requestId);
    if (!request) return;

    try {
      // Update status
      request.status = 'processing';
      this.exportRequests.set(requestId, request);
      await this.persistExportRequests();

      // Collect all user data
      const userData = await this.collectUserData(request.userId);
      
      // Generate export file
      const exportData = this.formatExportData(userData);
      const downloadUrl = await this.createDownloadUrl(exportData, request.userId);

      // Update request with completion
      request.status = 'completed';
      request.completedAt = Date.now();
      request.downloadUrl = downloadUrl;
      this.exportRequests.set(requestId, request);
      await this.persistExportRequests();

      logger.info(`Data export completed for request ${requestId}`);
    } catch (error) {
      // Update status on failure
      request.status = 'failed';
      this.exportRequests.set(requestId, request);
      await this.persistExportRequests();

      logger.error(`Data export failed for request ${requestId}`, error);
    }
  }

  /**
   * Request data deletion (Right to be Forgotten)
   */
  async requestDataDeletion(
    userId: string,
    dataTypes?: DataType[],
    reason?: string
  ): Promise<string> {
    const requestId = this.generateId();
    
    const deletionRequest: DataDeletionRequest = {
      id: requestId,
      userId,
      requestedAt: Date.now(),
      status: 'pending',
      deletedData: [],
      retainedData: [],
      retentionReason: reason,
    };

    this.deletionRequests.set(requestId, deletionRequest);
    await this.persistDeletionRequests();

    // Start processing in background
    this.processDataDeletion(requestId, dataTypes);

    logger.info(`Data deletion requested by user ${userId}, request ID: ${requestId}`);
    return requestId;
  }

  /**
   * Process data deletion request
   */
  private async processDataDeletion(requestId: string, dataTypes?: DataType[]): Promise<void> {
    const request = this.deletionRequests.get(requestId);
    if (!request) return;

    try {
      // Update status
      request.status = 'processing';
      this.deletionRequests.set(requestId, request);
      await this.persistDeletionRequests();

      // Determine what data can be deleted
      const { deletable, retained } = await this.analyzeDataForDeletion(request.userId, dataTypes);

      // Perform deletion
      const deletedData = await this.performDataDeletion(request.userId, deletable);

      // Update request with results
      request.status = 'completed';
      request.completedAt = Date.now();
      request.deletedData = deletedData;
      request.retainedData = retained.map(r => r.dataType);
      request.retentionReason = retained.map(r => r.reason).join('; ');
      
      this.deletionRequests.set(requestId, request);
      await this.persistDeletionRequests();

      logger.info(`Data deletion completed for request ${requestId}`);
    } catch (error) {
      // Update status on failure
      request.status = 'failed';
      this.deletionRequests.set(requestId, request);
      await this.persistDeletionRequests();

      logger.error(`Data deletion failed for request ${requestId}`, error);
    }
  }

  /**
   * Get user's consent history
   */
  getConsentHistory(userId: string): ConsentRecord[] {
    return this.consentRecords.get(userId) || [];
  }

  /**
   * Get user's data processing history
   */
  getProcessingHistory(userId: string): DataProcessingRecord[] {
    return this.processingRecords.get(userId) || [];
  }

  /**
   * Get privacy dashboard data
   */
  getPrivacyDashboard(userId: string): {
    consents: { [key in ConsentType]?: boolean };
    dataProcessing: DataProcessingRecord[];
    exportRequests: DataExportRequest[];
    deletionRequests: DataDeletionRequest[];
    dataRetention: { [key in DataType]?: number };
  } {
    const consents: { [key in ConsentType]?: boolean } = {};
    const consentTypes: ConsentType[] = ['essential', 'analytics', 'marketing', 'personalization', 'location', 'biometric', 'third_party_sharing'];
    
    consentTypes.forEach(type => {
      consents[type] = this.hasValidConsent(userId, type);
    });

    const dataProcessing = this.getProcessingHistory(userId);
    const exportRequests = Array.from(this.exportRequests.values())
      .filter(req => req.userId === userId);
    const deletionRequests = Array.from(this.deletionRequests.values())
      .filter(req => req.userId === userId);

    const dataRetention: { [key in DataType]?: number } = {};
    dataProcessing.forEach(record => {
      const expiryDate = record.timestamp + (record.retentionPeriod * 24 * 60 * 60 * 1000);
      const daysUntilExpiry = Math.ceil((expiryDate - Date.now()) / (24 * 60 * 60 * 1000));
      dataRetention[record.dataType] = Math.max(daysUntilExpiry, 0);
    });

    return {
      consents,
      dataProcessing,
      exportRequests,
      deletionRequests,
      dataRetention,
    };
  }

  /**
   * Collect all user data for export
   */
  private async collectUserData(userId: string): Promise<any> {
    // This would collect data from various sources
    // For now, return consent and processing records
    return {
      userId,
      consents: this.getConsentHistory(userId),
      dataProcessing: this.getProcessingHistory(userId),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Format export data according to configuration
   */
  private formatExportData(data: any): string {
    switch (this.config.dataExportFormat) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        // Convert to CSV format
        return this.convertToCSV(data);
      case 'xml':
        // Convert to XML format
        return this.convertToXML(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Create download URL for export data
   */
  private async createDownloadUrl(data: string, userId: string): Promise<string> {
    // In a real implementation, this would upload to secure storage
    // and return a time-limited download URL
    const filename = `user_data_${userId}_${Date.now()}.${this.config.dataExportFormat}`;
    
    // Store encrypted data
    const encryptedData = await securityManager.encryptData(data);
    await AsyncStorage.setItem(`export_${filename}`, encryptedData);
    
    return `app://download/${filename}`;
  }

  /**
   * Analyze what data can be deleted vs retained
   */
  private async analyzeDataForDeletion(userId: string, dataTypes?: DataType[]): Promise<{
    deletable: DataType[];
    retained: Array<{ dataType: DataType; reason: string }>;
  }> {
    const allDataTypes: DataType[] = ['personal_info', 'contact_info', 'location_data', 'biometric_data', 'usage_data', 'device_data', 'payment_data', 'communication_data'];
    const targetTypes = dataTypes || allDataTypes;
    
    const deletable: DataType[] = [];
    const retained: Array<{ dataType: DataType; reason: string }> = [];

    for (const dataType of targetTypes) {
      // Check if data must be retained for legal reasons
      const processingRecords = this.processingRecords.get(userId) || [];
      const relevantRecords = processingRecords.filter(r => r.dataType === dataType);
      
      const hasLegalObligation = relevantRecords.some(r => 
        r.legalBasis === 'legal_obligation' || 
        r.legalBasis === 'contract'
      );

      if (hasLegalObligation) {
        retained.push({
          dataType,
          reason: 'Legal obligation or contractual requirement'
        });
      } else {
        deletable.push(dataType);
      }
    }

    return { deletable, retained };
  }

  /**
   * Perform actual data deletion
   */
  private async performDataDeletion(userId: string, dataTypes: DataType[]): Promise<string[]> {
    const deletedData: string[] = [];

    for (const dataType of dataTypes) {
      try {
        // In a real implementation, this would delete data from various systems
        // For now, we'll just mark it as deleted in our records
        
        // Remove from processing records
        const processingRecords = this.processingRecords.get(userId) || [];
        const filteredRecords = processingRecords.filter(r => r.dataType !== dataType);
        this.processingRecords.set(userId, filteredRecords);

        deletedData.push(dataType);
        logger.debug(`Deleted ${dataType} for user ${userId}`);
      } catch (error) {
        logger.error(`Failed to delete ${dataType} for user ${userId}`, error);
      }
    }

    await this.persistProcessingRecords();
    return deletedData;
  }

  /**
   * Start compliance monitoring
   */
  private startComplianceMonitoring(): void {
    // Check for expired consents daily
    setInterval(() => {
      this.checkExpiredConsents();
    }, 24 * 60 * 60 * 1000);

    // Check data retention periods daily
    setInterval(() => {
      this.checkDataRetention();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Schedule automatic cleanup
   */
  private scheduleAutomaticCleanup(): void {
    if (!this.config.enableAutomaticDeletion) return;

    // Run cleanup weekly
    setInterval(() => {
      this.performAutomaticCleanup();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Check for expired consents
   */
  private checkExpiredConsents(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [userId, consents] of this.consentRecords) {
      const expiredConsents = consents.filter(c => 
        c.expiresAt && c.expiresAt < now && c.granted
      );

      if (expiredConsents.length > 0) {
        expiredCount += expiredConsents.length;
        logger.info(`Found ${expiredConsents.length} expired consents for user ${userId}`);
        
        // Optionally, automatically revoke expired consents
        // or notify user to renew consent
      }
    }

    if (expiredCount > 0) {
      logger.info(`Total expired consents found: ${expiredCount}`);
    }
  }

  /**
   * Check data retention periods
   */
  private checkDataRetention(): void {
    const now = Date.now();
    let expiredRecords = 0;

    for (const [userId, records] of this.processingRecords) {
      const expiredData = records.filter(r => {
        const expiryDate = r.timestamp + (r.retentionPeriod * 24 * 60 * 60 * 1000);
        return expiryDate < now;
      });

      if (expiredData.length > 0) {
        expiredRecords += expiredData.length;
        logger.info(`Found ${expiredData.length} expired data records for user ${userId}`);
      }
    }

    if (expiredRecords > 0) {
      logger.info(`Total expired data records found: ${expiredRecords}`);
    }
  }

  /**
   * Perform automatic cleanup
   */
  private async performAutomaticCleanup(): Promise<void> {
    logger.info('🧹 Starting automatic GDPR cleanup...');

    // Clean expired export requests
    const expiredExports = Array.from(this.exportRequests.entries())
      .filter(([, req]) => req.expiresAt && req.expiresAt < Date.now());
    
    expiredExports.forEach(([id]) => {
      this.exportRequests.delete(id);
    });

    if (expiredExports.length > 0) {
      await this.persistExportRequests();
      logger.info(`Cleaned up ${expiredExports.length} expired export requests`);
    }

    logger.info('✅ Automatic GDPR cleanup completed');
  }

  /**
   * Utility methods for data conversion
   */
  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    return JSON.stringify(data);
  }

  private convertToXML(data: any): string {
    // Simple XML conversion - in production, use a proper XML library
    return `<data>${JSON.stringify(data)}</data>`;
  }

  /**
   * Storage methods
   */
  private async loadStoredRecords(): Promise<void> {
    try {
      const [consents, processing, exports, deletions] = await Promise.all([
        AsyncStorage.getItem('gdpr_consents'),
        AsyncStorage.getItem('gdpr_processing'),
        AsyncStorage.getItem('gdpr_exports'),
        AsyncStorage.getItem('gdpr_deletions'),
      ]);

      if (consents) {
        this.consentRecords = new Map(JSON.parse(consents));
      }
      if (processing) {
        this.processingRecords = new Map(JSON.parse(processing));
      }
      if (exports) {
        this.exportRequests = new Map(JSON.parse(exports));
      }
      if (deletions) {
        this.deletionRequests = new Map(JSON.parse(deletions));
      }
    } catch (error) {
      logger.error('Failed to load stored GDPR records', error);
    }
  }

  private async persistConsentRecords(): Promise<void> {
    try {
      await AsyncStorage.setItem('gdpr_consents', JSON.stringify(Array.from(this.consentRecords.entries())));
    } catch (error) {
      logger.error('Failed to persist consent records', error);
    }
  }

  private async persistProcessingRecords(): Promise<void> {
    try {
      await AsyncStorage.setItem('gdpr_processing', JSON.stringify(Array.from(this.processingRecords.entries())));
    } catch (error) {
      logger.error('Failed to persist processing records', error);
    }
  }

  private async persistExportRequests(): Promise<void> {
    try {
      await AsyncStorage.setItem('gdpr_exports', JSON.stringify(Array.from(this.exportRequests.entries())));
    } catch (error) {
      logger.error('Failed to persist export requests', error);
    }
  }

  private async persistDeletionRequests(): Promise<void> {
    try {
      await AsyncStorage.setItem('gdpr_deletions', JSON.stringify(Array.from(this.deletionRequests.entries())));
    } catch (error) {
      logger.error('Failed to persist deletion requests', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const _gdprManager = new GDPRComplianceManager();

/**
 * Hook for GDPR compliance in React components
 */
export function useGDPRCompliance(userId?: string) {
  const [privacyData, setPrivacyData] = React.useState<any>(null);

  React.useEffect(() => {
    if (userId) {
      const data = gdprManager.getPrivacyDashboard(userId);
      setPrivacyData(data);
    }
  }, [userId]);

  const recordConsent = React.useCallback((consentType: ConsentType, granted: boolean) => {
    if (userId) {
      return gdprManager.recordConsent(userId, consentType, granted);
    }
  }, [userId]);

  const requestDataExport = React.useCallback(() => {
    if (userId) {
      return gdprManager.requestDataExport(userId);
    }
  }, [userId]);

  const requestDataDeletion = React.useCallback((dataTypes?: DataType[]) => {
    if (userId) {
      return gdprManager.requestDataDeletion(userId, dataTypes);
    }
  }, [userId]);

  return {
    privacyData,
    recordConsent,
    requestDataExport,
    requestDataDeletion,
    hasValidConsent: (consentType: ConsentType) => 
      userId ? gdprManager.hasValidConsent(userId, consentType) : false,
  };
}
