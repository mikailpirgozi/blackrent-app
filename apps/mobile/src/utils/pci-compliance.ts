/**
 * 💳 PCI DSS Compliance Manager
 * Payment Card Industry Data Security Standard compliance
 */

import React from 'react';
import { logger } from './logger';
import { securityManager } from './security-manager';

interface PCIConfig {
  enableCardDataProtection: boolean;
  enableTransactionLogging: boolean;
  enableFraudDetection: boolean;
  maxTransactionAmount: number;
  dailyTransactionLimit: number;
  suspiciousActivityThreshold: number;
  cardDataRetentionPeriod: number; // days
}

interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: 'card' | 'bank_transfer' | 'digital_wallet';
  cardLast4?: string;
  cardBrand?: string;
  merchantId: string;
  riskScore: number;
  fraudFlags: string[];
  ipAddress?: string;
  deviceFingerprint?: string;
}

interface FraudAlert {
  id: string;
  transactionId: string;
  userId: string;
  alertType: 'velocity' | 'amount' | 'location' | 'device' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  description: string;
  resolved: boolean;
  falsePositive?: boolean;
}

interface CardDataEvent {
  id: string;
  eventType: 'access' | 'transmission' | 'storage' | 'deletion';
  timestamp: number;
  userId?: string;
  dataType: 'pan' | 'cvv' | 'expiry' | 'cardholder_name';
  encrypted: boolean;
  purpose: string;
  authorized: boolean;
}

class PCIComplianceManager {
  private config: PCIConfig;
  private transactions: Map<string, PaymentTransaction> = new Map();
  private fraudAlerts: Map<string, FraudAlert> = new Map();
  private cardDataEvents: CardDataEvent[] = [];
  private userTransactionHistory: Map<string, PaymentTransaction[]> = new Map();

  constructor(config: Partial<PCIConfig> = {}) {
    this.config = {
      enableCardDataProtection: true,
      enableTransactionLogging: true,
      enableFraudDetection: true,
      maxTransactionAmount: 10000, // €10,000
      dailyTransactionLimit: 50000, // €50,000
      suspiciousActivityThreshold: 5, // 5 failed attempts
      cardDataRetentionPeriod: 90, // 90 days
      ...config,
    };
  }

  /**
   * Initialize PCI compliance system
   */
  async initialize(): Promise<void> {
    logger.info('💳 Initializing PCI DSS Compliance Manager...');

    try {
      // Load existing data
      await this.loadStoredData();
      
      // Start monitoring
      this.startComplianceMonitoring();
      
      // Schedule cleanup
      this.scheduleDataCleanup();

      logger.info('✅ PCI DSS Compliance Manager initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize PCI DSS Compliance Manager', error);
      throw error;
    }
  }

  /**
   * Validate payment card data before processing
   */
  validateCardData(cardData: {
    number: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
    holderName: string;
  }): {
    isValid: boolean;
    errors: string[];
    riskScore: number;
  } {
    const errors: string[] = [];
    let riskScore = 0;

    // Log card data access
    this.logCardDataEvent('access', 'pan', true, 'validation');

    // Validate card number (Luhn algorithm)
    if (!this.validateCardNumber(cardData.number)) {
      errors.push('Invalid card number');
      riskScore += 50;
    }

    // Validate CVV
    if (!this.validateCVV(cardData.cvv, cardData.number)) {
      errors.push('Invalid CVV');
      riskScore += 30;
    }

    // Validate expiry date
    if (!this.validateExpiryDate(cardData.expiryMonth, cardData.expiryYear)) {
      errors.push('Invalid or expired card');
      riskScore += 40;
    }

    // Validate cardholder name
    if (!this.validateCardholderName(cardData.holderName)) {
      errors.push('Invalid cardholder name');
      riskScore += 20;
    }

    // Check against known fraud patterns
    const fraudRisk = this.checkFraudPatterns(cardData.number);
    riskScore += fraudRisk;

    return {
      isValid: errors.length === 0,
      errors,
      riskScore: Math.min(riskScore, 100),
    };
  }

  /**
   * Process payment transaction with PCI compliance
   */
  async processTransaction(
    userId: string,
    amount: number,
    currency: string,
    paymentMethod: 'card' | 'bank_transfer' | 'digital_wallet',
    cardData?: {
      last4: string;
      brand: string;
      token: string; // Tokenized card data
    },
    metadata?: {
      ipAddress?: string;
      deviceFingerprint?: string;
      merchantId?: string;
    }
  ): Promise<{
    transactionId: string;
    status: 'approved' | 'declined' | 'requires_review';
    riskScore: number;
    fraudAlerts: string[];
  }> {
    const transactionId = this.generateTransactionId();
    
    // Calculate risk score
    const riskScore = await this.calculateTransactionRisk(userId, amount, metadata);
    
    // Check transaction limits
    const limitsCheck = await this.checkTransactionLimits(userId, amount);
    
    // Detect fraud patterns
    const fraudAlerts = await this.detectFraudPatterns(userId, amount, metadata);
    
    // Determine transaction status
    let status: 'approved' | 'declined' | 'requires_review' = 'approved';
    
    if (!limitsCheck.allowed) {
      status = 'declined';
      fraudAlerts.push(`Transaction limit exceeded: ${limitsCheck.reason}`);
    } else if (riskScore > 80) {
      status = 'declined';
      fraudAlerts.push('High risk transaction blocked');
    } else if (riskScore > 60 || fraudAlerts.length > 0) {
      status = 'requires_review';
    }

    // Create transaction record
    const transaction: PaymentTransaction = {
      id: transactionId,
      userId,
      amount,
      currency,
      timestamp: Date.now(),
      status: status === 'approved' ? 'pending' : 'failed',
      paymentMethod,
      cardLast4: cardData?.last4,
      cardBrand: cardData?.brand,
      merchantId: metadata?.merchantId || 'blackrent',
      riskScore,
      fraudFlags: fraudAlerts,
      ipAddress: metadata?.ipAddress,
      deviceFingerprint: metadata?.deviceFingerprint,
    };

    // Store transaction
    this.transactions.set(transactionId, transaction);
    
    // Update user transaction history
    const userHistory = this.userTransactionHistory.get(userId) || [];
    userHistory.push(transaction);
    this.userTransactionHistory.set(userId, userHistory);

    // Create fraud alerts if necessary
    if (fraudAlerts.length > 0) {
      await this.createFraudAlert(transactionId, userId, fraudAlerts, riskScore);
    }

    // Log transaction
    if (this.config.enableTransactionLogging) {
      logger.info(`Transaction processed: ${transactionId} - ${status} (risk: ${riskScore})`);
    }

    // Persist data
    await this.persistTransactionData();

    return {
      transactionId,
      status,
      riskScore,
      fraudAlerts,
    };
  }

  /**
   * Tokenize sensitive card data
   */
  async tokenizeCardData(cardNumber: string): Promise<string> {
    // Log card data access
    this.logCardDataEvent('access', 'pan', true, 'tokenization');
    
    try {
      // In production, use a proper tokenization service
      // This is a simplified implementation
      const token = await securityManager.encryptData(cardNumber);
      
      // Log successful tokenization
      this.logCardDataEvent('storage', 'pan', true, 'tokenization_success');
      
      return `tok_${token.substring(0, 16)}`;
    } catch (error) {
      logger.error('Card tokenization failed', error);
      throw new Error('Tokenization failed');
    }
  }

  /**
   * Detokenize card data (only for authorized purposes)
   */
  async detokenizeCardData(token: string, purpose: string): Promise<string> {
    // Log card data access
    this.logCardDataEvent('access', 'pan', true, purpose);
    
    try {
      // Verify authorization for detokenization
      if (!this.isAuthorizedForDetokenization(purpose)) {
        throw new Error('Unauthorized detokenization attempt');
      }

      // In production, use proper detokenization service
      const encryptedData = token.replace('tok_', '');
      const _cardNumber = await securityManager.decryptData(encryptedData);
      
      return cardNumber;
    } catch (error) {
      logger.error('Card detokenization failed', error);
      throw new Error('Detokenization failed');
    }
  }

  /**
   * Calculate transaction risk score
   */
  private async calculateTransactionRisk(
    userId: string,
    amount: number,
    metadata?: any
  ): Promise<number> {
    let riskScore = 0;

    // Amount-based risk
    if (amount > this.config.maxTransactionAmount * 0.8) {
      riskScore += 30;
    } else if (amount > this.config.maxTransactionAmount * 0.5) {
      riskScore += 15;
    }

    // User history risk
    const userHistory = this.userTransactionHistory.get(userId) || [];
    const recentTransactions = userHistory.filter(
      t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000
    );

    // Velocity risk
    if (recentTransactions.length > 10) {
      riskScore += 25;
    } else if (recentTransactions.length > 5) {
      riskScore += 10;
    }

    // Failed transaction risk
    const failedTransactions = recentTransactions.filter(t => t.status === 'failed');
    if (failedTransactions.length >= this.config.suspiciousActivityThreshold) {
      riskScore += 40;
    }

    // Device/IP risk (simplified)
    if (metadata?.ipAddress && this.isHighRiskIP(metadata.ipAddress)) {
      riskScore += 20;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Check transaction limits
   */
  private async checkTransactionLimits(
    userId: string,
    amount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Single transaction limit
    if (amount > this.config.maxTransactionAmount) {
      return {
        allowed: false,
        reason: `Amount exceeds maximum limit of €${this.config.maxTransactionAmount}`,
      };
    }

    // Daily limit check
    const userHistory = this.userTransactionHistory.get(userId) || [];
    const todayTransactions = userHistory.filter(
      t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000 &&
           t.status === 'completed'
    );

    const dailyTotal = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    if (dailyTotal + amount > this.config.dailyTransactionLimit) {
      return {
        allowed: false,
        reason: `Daily limit of €${this.config.dailyTransactionLimit} would be exceeded`,
      };
    }

    return { allowed: true };
  }

  /**
   * Detect fraud patterns
   */
  private async detectFraudPatterns(
    userId: string,
    amount: number,
    metadata?: any
  ): Promise<string[]> {
    const alerts: string[] = [];

    if (!this.config.enableFraudDetection) {
      return alerts;
    }

    const userHistory = this.userTransactionHistory.get(userId) || [];
    const recentTransactions = userHistory.filter(
      t => Date.now() - t.timestamp < 60 * 60 * 1000 // Last hour
    );

    // Rapid-fire transactions
    if (recentTransactions.length > 5) {
      alerts.push('Rapid transaction velocity detected');
    }

    // Round number pattern
    if (amount % 100 === 0 && amount >= 1000) {
      alerts.push('Suspicious round amount pattern');
    }

    // Time-based patterns
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      alerts.push('Unusual transaction time');
    }

    return alerts;
  }

  /**
   * Create fraud alert
   */
  private async createFraudAlert(
    transactionId: string,
    userId: string,
    alerts: string[],
    riskScore: number
  ): Promise<void> {
    const alertId = this.generateId();
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore > 80) severity = 'critical';
    else if (riskScore > 60) severity = 'high';
    else if (riskScore > 40) severity = 'medium';

    const fraudAlert: FraudAlert = {
      id: alertId,
      transactionId,
      userId,
      alertType: 'pattern', // Simplified
      severity,
      timestamp: Date.now(),
      description: alerts.join('; '),
      resolved: false,
    };

    this.fraudAlerts.set(alertId, fraudAlert);
    
    logger.warn(`Fraud alert created: ${alertId} - ${fraudAlert.description}`);
  }

  /**
   * Log card data events for compliance
   */
  private logCardDataEvent(
    eventType: 'access' | 'transmission' | 'storage' | 'deletion',
    dataType: 'pan' | 'cvv' | 'expiry' | 'cardholder_name',
    encrypted: boolean,
    purpose: string,
    userId?: string
  ): void {
    const event: CardDataEvent = {
      id: this.generateId(),
      eventType,
      timestamp: Date.now(),
      userId,
      dataType,
      encrypted,
      purpose,
      authorized: true, // Simplified - in production, check authorization
    };

    this.cardDataEvents.push(event);
    
    // Keep only recent events (for performance)
    if (this.cardDataEvents.length > 10000) {
      this.cardDataEvents = this.cardDataEvents.slice(-5000);
    }
  }

  /**
   * Card validation methods
   */
  private validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Check if all digits
    if (!/^\d+$/.test(cleanNumber)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  private validateCVV(cvv: string, cardNumber: string): boolean {
    // Remove spaces
    const cleanCVV = cvv.replace(/\s/g, '');
    
    // Check if all digits
    if (!/^\d+$/.test(cleanCVV)) {
      return false;
    }

    // American Express has 4-digit CVV, others have 3
    const isAmex = cardNumber.startsWith('34') || cardNumber.startsWith('37');
    const expectedLength = isAmex ? 4 : 3;
    
    return cleanCVV.length === expectedLength;
  }

  private validateExpiryDate(month: string, year: string): boolean {
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) {
      return false;
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Handle 2-digit years
    const fullYear = expYear < 100 ? 2000 + expYear : expYear;
    
    if (fullYear < currentYear) {
      return false;
    }
    
    if (fullYear === currentYear && expMonth < currentMonth) {
      return false;
    }
    
    return true;
  }

  private validateCardholderName(name: string): boolean {
    // Basic validation - at least 2 characters, only letters and spaces
    return /^[a-zA-Z\s]{2,}$/.test(name.trim());
  }

  private checkFraudPatterns(cardNumber: string): number {
    // Simplified fraud pattern checking
    // In production, check against known fraud databases
    return 0;
  }

  private isHighRiskIP(ipAddress: string): boolean {
    // Simplified IP risk checking
    // In production, check against threat intelligence feeds
    return false;
  }

  private isAuthorizedForDetokenization(purpose: string): boolean {
    const authorizedPurposes = [
      'payment_processing',
      'refund_processing',
      'chargeback_handling',
      'compliance_audit',
    ];
    
    return authorizedPurposes.includes(purpose);
  }

  /**
   * Start compliance monitoring
   */
  private startComplianceMonitoring(): void {
    // Monitor for suspicious patterns every 5 minutes
    setInterval(() => {
      this.monitorSuspiciousActivity();
    }, 5 * 60 * 1000);

    // Generate compliance reports daily
    setInterval(() => {
      this.generateComplianceReport();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Schedule data cleanup for PCI compliance
   */
  private scheduleDataCleanup(): void {
    // Clean old card data events daily
    setInterval(() => {
      this.cleanupCardDataEvents();
    }, 24 * 60 * 60 * 1000);

    // Clean old transaction data based on retention policy
    setInterval(() => {
      this.cleanupOldTransactions();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  /**
   * Monitor for suspicious activity
   */
  private monitorSuspiciousActivity(): void {
    // Check for patterns across all users
    const recentTransactions = Array.from(this.transactions.values())
      .filter(t => Date.now() - t.timestamp < 60 * 60 * 1000); // Last hour

    // High-risk transactions
    const highRiskTransactions = recentTransactions.filter(t => t.riskScore > 70);
    
    if (highRiskTransactions.length > 10) {
      logger.warn(`High number of risky transactions detected: ${highRiskTransactions.length}`);
    }
  }

  /**
   * Generate compliance report
   */
  private generateComplianceReport(): void {
    const report = {
      timestamp: Date.now(),
      totalTransactions: this.transactions.size,
      fraudAlerts: this.fraudAlerts.size,
      cardDataEvents: this.cardDataEvents.length,
      complianceStatus: 'compliant', // Simplified
    };

    logger.info('PCI DSS Compliance Report Generated', report);
  }

  /**
   * Cleanup methods
   */
  private cleanupCardDataEvents(): void {
    const cutoffDate = Date.now() - (this.config.cardDataRetentionPeriod * 24 * 60 * 60 * 1000);
    const initialCount = this.cardDataEvents.length;
    
    this.cardDataEvents = this.cardDataEvents.filter(event => event.timestamp > cutoffDate);
    
    const removedCount = initialCount - this.cardDataEvents.length;
    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} old card data events`);
    }
  }

  private cleanupOldTransactions(): void {
    // Keep transactions for compliance but remove sensitive data after retention period
    const cutoffDate = Date.now() - (this.config.cardDataRetentionPeriod * 24 * 60 * 60 * 1000);
    
    for (const [id, transaction] of this.transactions) {
      if (transaction.timestamp < cutoffDate) {
        // Remove sensitive data but keep transaction record
        transaction.cardLast4 = undefined;
        transaction.ipAddress = undefined;
        transaction.deviceFingerprint = undefined;
      }
    }
  }

  /**
   * Storage methods
   */
  private async loadStoredData(): Promise<void> {
    // In production, load from secure encrypted storage
    // This is a simplified implementation
  }

  private async persistTransactionData(): Promise<void> {
    // In production, persist to secure encrypted storage
    // This is a simplified implementation
  }

  /**
   * Utility methods
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(): {
    isCompliant: boolean;
    activeAlerts: number;
    riskLevel: 'low' | 'medium' | 'high';
    lastAudit: number;
  } {
    const activeAlerts = Array.from(this.fraudAlerts.values())
      .filter(alert => !alert.resolved).length;

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (activeAlerts > 10) riskLevel = 'high';
    else if (activeAlerts > 3) riskLevel = 'medium';

    return {
      isCompliant: true, // Simplified
      activeAlerts,
      riskLevel,
      lastAudit: Date.now(),
    };
  }
}

export const _pciManager = new PCIComplianceManager();
export const pciManager = _pciManager;

/**
 * Hook for PCI compliance in React components
 */
export function usePCICompliance() {
  const [complianceStatus, setComplianceStatus] = React.useState(pciManager.getComplianceStatus());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setComplianceStatus(pciManager.getComplianceStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    complianceStatus,
    validateCardData: pciManager.validateCardData.bind(pciManager),
    tokenizeCardData: pciManager.tokenizeCardData.bind(pciManager),
    processTransaction: pciManager.processTransaction.bind(pciManager),
  };
}
