import { Vehicle, Rental, Customer, Expense, Insurance, Company, Insurer, Settlement, VehicleDocument, InsuranceClaim } from '../types';
import { 
  getProtocolCache, 
  setProtocolCache, 
  clearProtocolCache, 
  isCacheFresh, 
  getCacheInfo,
  type CachedProtocolStatus 
} from '../utils/protocolCache';
import { 
  withRetry, 
  analyzeError, 
  EnhancedError, 
  createNetworkMonitor,
  type RetryOptions 
} from '../utils/errorHandling';
import { 
  debounce, 
  RequestDeduplicator, 
  measurePerformance,
  type DebounceOptions 
} from '../utils/debounce';
import { 
  apiCache, 
  cacheKeys, 
  cacheHelpers,
  type CacheOptions 
} from '../utils/apiCache';
import { 
  withRetry as newWithRetry,
  parseApiError,
  createApiErrorHandler,
  handleApiResponse 
} from '../utils/apiErrorHandler';

const getApiBaseUrl = () => {
  // V produkcii používame Railway URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://blackrent-app-production-4d6f.up.railway.app/api';
  }
  
  // V developmente - dynamické API URL pre sieťový prístup
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Automatická detekcia - použije hostname z prehliadača s portom 3001
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}:3001/api`;
};

export const API_BASE_URL = getApiBaseUrl();



class ApiService {
  // ⚡ Performance optimizations
  private requestDeduplicator = new RequestDeduplicator();
  private errorHandler = createApiErrorHandler(
    (error) => {
      // This will be overridden by components that use the error context
      console.error('API Error (fallback handler):', error);
      return 'api-error-' + Date.now();
    }
  );
  
  // Set error handler from components that have access to error context
  public setErrorHandler(showError: (error: any) => string) {
    this.errorHandler = createApiErrorHandler(showError);
  }
  
  private getAuthToken(): string | null {
    return localStorage.getItem('blackrent_token') || sessionStorage.getItem('blackrent_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    // 🛡️ ENHANCED ERROR HANDLING s retry mechanism
    const operation = async (): Promise<T> => {
      try {
        const response = await fetch(url, config);
        
        // Special handling pre auth errors
        if (response.status === 401 || response.status === 403) {
          console.warn('🚨 Auth error:', response.status, 'Token validation failed');
          console.warn('🔍 Token debug:', {
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
            url: url
          });
          
          // Create error with status for proper retry logic
          const authError = new Error(`Auth failed: ${response.status} - Token validation error`);
          (authError as any).status = response.status;
          throw authError;
        }

        if (!response.ok) {
          const error = new Error(`API chyba: ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }

        const data = await response.json();
        
        // Ak je to API response objekt s success/data, vráť len data
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data.data;
        }
        
        return data;
      } catch (error: any) {
        // Analyze error pre user-friendly messages
        const analysis = analyzeError(error);
        console.warn(`⚠️ API request failed: ${analysis.userMessage}`);
        
        // Create enhanced error
        throw new EnhancedError(error);
      }
    };

    // 🔄 Execute with retry mechanism
    try {
      return await withRetry(operation, {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000,
        // Custom retry condition pre auth errors - tie sa neretryujú
        retryCondition: (error) => {
          if (error.originalError?.status === 401 || error.originalError?.status === 403) {
            console.log('⚠️ Auth error - not retrying');
            return false;
          }
          return error.isRetryable;
        }
      });
    } catch (error: any) {
      // Final error handling - throw enhanced error pre user feedback
      if (error instanceof EnhancedError) {
        console.error('❌ Final API error:', error.userMessage);
        throw error;
      }
      
      // Fallback pre unexpected errors
      throw new EnhancedError(error);
    }
  }

  async login(username: string, password: string): Promise<{ user: any; token: string }> {
    console.log('🔗 API Service - Making login request to:', `${API_BASE_URL}/auth/login`);
    console.log('🔗 API Service - Request body:', { username, password: '***' });
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log('🔗 API Service - Response status:', response.status);
    console.log('🔗 API Service - Response ok:', response.ok);
    console.log('🔗 API Service - Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('🔗 API Service - Login failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Login failed: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('🔗 API Service - Login successful, data:', {
      success: data.success,
      hasUser: !!data.user,
      hasToken: !!data.token,
      userRole: data.user?.role
    });
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('⚠️ Logout error:', error);
    } finally {
      localStorage.removeItem('blackrent_token');
      localStorage.removeItem('blackrent_user');
      localStorage.removeItem('blackrent_remember_me');
      sessionStorage.removeItem('blackrent_token');
      sessionStorage.removeItem('blackrent_user');
    }
  }

  // Vozidlá s cache
  async getVehicles(): Promise<Vehicle[]> {
    const userId = localStorage.getItem('blackrent_user_id');
    const cacheKey = cacheKeys.vehicles(userId || undefined);
    
    return apiCache.getOrFetch(
      cacheKey,
      () => this.request<Vehicle[]>('/vehicles'),
      {
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: ['vehicles'],
        background: true // Enable background refresh
      }
    );
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }

  // ⚡ BULK DATA ENDPOINT - Načíta všetky dáta jedným requestom s AGGRESSIVE CACHING
  async getBulkData(): Promise<{
    vehicles: Vehicle[];
    rentals: Rental[];
    customers: Customer[];
    companies: Company[];
    insurers: Insurer[];
    expenses: Expense[];
    insurances: Insurance[];
    settlements: Settlement[];
    vehicleDocuments: VehicleDocument[];
    insuranceClaims: InsuranceClaim[];
    metadata: {
      loadTimeMs: number;
      userRole: string;
      isFiltered: boolean;
      timestamp: string;
    };
  }> {
    // ⚡ SMART CACHING + REQUEST DEDUPLICATION
    return this.requestDeduplicator.deduplicate(
      'bulk-data',
      async () => {
        return apiCache.getOrFetch(
          cacheKeys.bulkData(),
          async () => {
            console.log('🌐 Loading bulk data from API...');
            const startTime = performance.now();
            
            const response = await this.request<{
              vehicles: Vehicle[];
              rentals: Rental[];
              customers: Customer[];
              companies: Company[];
              insurers: Insurer[];
              expenses: Expense[];
              insurances: Insurance[];
              settlements: Settlement[];
              vehicleDocuments: VehicleDocument[];
              insuranceClaims: InsuranceClaim[];
              metadata: {
                loadTimeMs: number;
                userRole: string;
                isFiltered: boolean;
                timestamp: string;
              };
            }>('/bulk/data');
            
            const loadTime = performance.now() - startTime;
            console.log(`⚡ Bulk data loaded in ${loadTime.toFixed(2)}ms`);
            console.log(`📊 Data: ${response.vehicles?.length || 0} vehicles, ${response.rentals?.length || 0} rentals, ${response.customers?.length || 0} customers`);
            
            return response;
          },
          { 
            ttl: 10 * 60 * 1000, // 10 minutes - aggressive caching
            tags: ['bulk', 'vehicles', 'rentals', 'customers'] 
          }
        );
      }
    );
  }

  // ⚡ BULK PROTOCOL STATUS - Získa protocol status pre všetky rentals naraz s SMART CACHE
  async getBulkProtocolStatus(): Promise<{ 
    rentalId: string; 
    hasHandoverProtocol: boolean; 
    hasReturnProtocol: boolean; 
    handoverProtocolId?: string; 
    returnProtocolId?: string;
    handoverCreatedAt?: Date;
    returnCreatedAt?: Date;
  }[]> {
    
    // ⚡ REQUEST DEDUPLICATION - prevent duplicate requests
    return this.requestDeduplicator.deduplicate(
      'bulk-protocol-status',
      async () => {
        // 📦 1. CACHE FIRST - skús načítať z cache
        const cached = getProtocolCache();
        if (cached && isCacheFresh()) {
          console.log('⚡ Using cached protocol status');
          
          // 🔄 Background refresh - aktualizuj cache na pozadí
          this.refreshProtocolCacheInBackground();
          
          return cached;
        }
        
        // 🌐 2. API CALL - cache chýba alebo expired
        console.log('🌐 Loading protocol status from API...');
        const cacheInfo = getCacheInfo();
        if (cacheInfo.exists) {
          console.log(`📊 Cache info: age=${cacheInfo.age}s, records=${cacheInfo.records}, fresh=${cacheInfo.fresh}`);
        }
        
        return this.loadProtocolStatusFromAPI();
      }
    );
  }

  /**
   * 🌐 Load protocol status from API - extracted for reuse
   */
  private async loadProtocolStatusFromAPI(): Promise<any[]> {
    try {
      const response = await this.request<any>('/protocols/bulk-status');
      
      // 🚀 SMART RESPONSE HANDLING - Backend môže vrátiť Array alebo API wrapper
      let protocolData;
      
      if (Array.isArray(response)) {
        // Backend vracia priamy Array: [...]
        protocolData = response;
      } else if (response && Array.isArray(response.data)) {
        // Backend vracia API wrapper: { success: true, data: [...] }
        protocolData = response.data;
      } else {
        console.error('❌ getBulkProtocolStatus: Nerozpoznaný formát odpovede');
        console.error('Raw response:', response);
        throw new Error('Neplatná odpoveď zo servera');
      }
      
      if (protocolData.length === 0) {
        console.warn('⚠️ getBulkProtocolStatus: Žiadne protocol data nenájdené');
        return [];
      }
      
      // Transformuj dáta s bezpečným pristupom
      const transformedData = protocolData.map((item: any) => ({
        rentalId: item?.rentalId || '',
        hasHandoverProtocol: Boolean(item?.hasHandoverProtocol),
        hasReturnProtocol: Boolean(item?.hasReturnProtocol),
        handoverProtocolId: item?.handoverProtocolId || undefined,
        returnProtocolId: item?.returnProtocolId || undefined,
        handoverCreatedAt: item.handoverCreatedAt ? new Date(item.handoverCreatedAt) : undefined,
        returnCreatedAt: item.returnCreatedAt ? new Date(item.returnCreatedAt) : undefined
      }));
      
      // 💾 3. SAVE TO CACHE
      setProtocolCache(transformedData);
      
      return transformedData;
      
    } catch (error: any) {
      console.error('❌ getBulkProtocolStatus error:', error);
      console.error('❌ Error details:', error.message);
      
      // 🔄 FALLBACK - použiť starý cache ak existuje
      const cached = getProtocolCache();
      if (cached) {
        console.log('🔄 Using stale cache as fallback');
        return cached;
      }
      
      throw error;
    }
  }

  /**
   * 🔄 Background refresh cache - neblokuje UI
   */
  private async refreshProtocolCacheInBackground(): Promise<void> {
    try {
      console.log('🔄 Refreshing protocol cache in background...');
      
      const response = await this.request<any>('/protocols/bulk-status');
      
      let protocolData;
      if (Array.isArray(response)) {
        protocolData = response;
      } else if (response && Array.isArray(response.data)) {
        protocolData = response.data;
      } else {
        throw new Error('Invalid response format');
      }
      
      const transformedData = protocolData.map((item: any) => ({
        rentalId: item?.rentalId || '',
        hasHandoverProtocol: Boolean(item?.hasHandoverProtocol),
        hasReturnProtocol: Boolean(item?.hasReturnProtocol),
        handoverProtocolId: item?.handoverProtocolId || undefined,
        returnProtocolId: item?.returnProtocolId || undefined,
        handoverCreatedAt: item.handoverCreatedAt ? new Date(item.handoverCreatedAt) : undefined,
        returnCreatedAt: item.returnCreatedAt ? new Date(item.returnCreatedAt) : undefined
      }));
      
      setProtocolCache(transformedData);
      console.log('✅ Background cache refresh completed');
      
    } catch (error) {
      console.warn('⚠️ Background cache refresh failed:', error);
    }
  }

  // ⚡ BULK: História vlastníctva všetkých vozidiel naraz s CACHING
  async getBulkVehicleOwnershipHistory(): Promise<{
    vehicleHistories: Array<{
      vehicleId: string;
      vehicle: {
        id: string;
        brand: string;
        model: string;
        licensePlate: string;
        ownerCompanyId?: string;
      };
      history: Array<{
        id: string;
        ownerCompanyId: string;
        ownerCompanyName: string;
        validFrom: string;
        validTo: string | null;
        transferReason: string;
        transferNotes: string | null;
      }>;
    }>;
    totalVehicles: number;
    loadTimeMs: number;
  }> {
    return this.requestDeduplicator.deduplicate(
      'bulk-vehicle-ownership-history',
      async () => {
        return apiCache.getOrFetch(
          cacheKeys.vehicleOwnership(),
          async () => {
            console.log('🌐 Loading vehicle ownership history from API...');
            const response = await this.request<{
              vehicleHistories: any[];
              totalVehicles: number;
              loadTimeMs: number;
            }>('/vehicles/bulk-ownership-history');
            console.log(`📊 Vehicle ownership history: ${response.totalVehicles} vehicles loaded`);
            return response;
          },
          { 
            ttl: 15 * 60 * 1000, // 15 minutes - history changes rarely
            tags: ['vehicles', 'ownership', 'history'] 
          }
        );
      }
    );
  }

  async createVehicle(vehicle: Vehicle): Promise<void> {
    const result = await this.request<void>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
    
    // Invalidate cache
    cacheHelpers.invalidateEntity('vehicle');
    return result;
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    const result = await this.request<void>(`/vehicles/${vehicle.id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
    
    // Invalidate cache
    cacheHelpers.invalidateEntity('vehicle');
    return result;
  }

  async deleteVehicle(id: string): Promise<void> {
    const result = await this.request<void>(`/vehicles/${id}`, { method: 'DELETE' });
    
    // Invalidate cache
    cacheHelpers.invalidateEntity('vehicle');
    return result;
  }



  // CSV Export/Import pre vozidlá
  async exportVehiclesCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/vehicles/export/csv`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async importVehiclesCSV(csvData: string): Promise<any> {
    return this.request<any>('/vehicles/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // CSV Export/Import pre zákazníkov
  async exportCustomersCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/customers/export/csv`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async importCustomersCSV(csvData: string): Promise<any> {
    return this.request<any>('/customers/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // CSV Export/Import pre náklady
  async exportExpensesCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/expenses/export/csv`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async importExpensesCSV(csvData: string): Promise<any> {
    return this.request<any>('/expenses/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // Prenájmy
  async getRentals(): Promise<Rental[]> {
    return this.request<Rental[]>('/rentals');
  }

  async getRental(id: string): Promise<Rental> {
    return this.request<Rental>(`/rentals/${id}`);
  }

  async createRental(rental: Rental): Promise<void> {
    return this.request<void>('/rentals', {
      method: 'POST',
      body: JSON.stringify(rental),
    });
  }

  async updateRental(rental: Rental): Promise<void> {
    return this.request<void>(`/rentals/${rental.id}`, {
      method: 'PUT',
      body: JSON.stringify(rental),
    });
  }

  async deleteRental(id: string): Promise<void> {
    return this.request<void>(`/rentals/${id}`, { method: 'DELETE' });
  }

  // Zákazníci s cache
  async getCustomers(): Promise<Customer[]> {
    const userId = localStorage.getItem('blackrent_user_id');
    const cacheKey = cacheKeys.customers(userId || undefined);
    
    return apiCache.getOrFetch(
      cacheKey,
      () => this.request<Customer[]>('/customers'),
      {
        ttl: 5 * 60 * 1000, // 5 minutes
        tags: ['customers'],
        background: true
      }
    );
  }

  async createCustomer(customer: Customer): Promise<void> {
    const result = await this.request<void>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    
    // Invalidate cache
    cacheHelpers.invalidateEntity('customer');
    return result;
  }

  async updateCustomer(customer: Customer): Promise<void> {
    const result = await this.request<void>(`/customers/${customer.id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
    
    // Invalidate cache
    cacheHelpers.invalidateEntity('customer');
    return result;
  }

  async deleteCustomer(id: string): Promise<void> {
    const result = await this.request<void>(`/customers/${id}`, { method: 'DELETE' });
    
    // Invalidate cache
    cacheHelpers.invalidateEntity('customer');
    return result;
  }

  // Náklady
  async getExpenses(): Promise<Expense[]> {
    return this.request<Expense[]>('/expenses');
  }

  async createExpense(expense: Expense): Promise<void> {
    return this.request<void>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(expense: Expense): Promise<void> {
    return this.request<void>(`/expenses/${expense.id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: string): Promise<void> {
    return this.request<void>(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Poistky
  async getInsurances(): Promise<Insurance[]> {
    return this.request<Insurance[]>('/insurances');
  }

  async createInsurance(insurance: Insurance): Promise<void> {
    return this.request<void>('/insurances', {
      method: 'POST',
      body: JSON.stringify(insurance),
    });
  }

  async updateInsurance(insurance: Insurance): Promise<void> {
    return this.request<void>(`/insurances/${insurance.id}`, {
      method: 'PUT',
      body: JSON.stringify(insurance),
    });
  }

  async deleteInsurance(id: string): Promise<void> {
    return this.request<void>(`/insurances/${id}`, {
      method: 'DELETE',
    });
  }

  // Vehicle Documents
  async getVehicleDocuments(vehicleId?: string): Promise<VehicleDocument[]> {
    const url = vehicleId ? `/vehicle-documents?vehicleId=${vehicleId}` : '/vehicle-documents';
    return this.request<VehicleDocument[]>(url);
  }

  async createVehicleDocument(document: VehicleDocument): Promise<void> {
    return this.request<void>('/vehicle-documents', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async updateVehicleDocument(document: VehicleDocument): Promise<void> {
    return this.request<void>(`/vehicle-documents/${document.id}`, {
      method: 'PUT',
      body: JSON.stringify(document),
    });
  }

  async deleteVehicleDocument(id: string): Promise<void> {
    return this.request<void>(`/vehicle-documents/${id}`, { method: 'DELETE' });
  }

  // Insurance Claims
  async getInsuranceClaims(vehicleId?: string): Promise<InsuranceClaim[]> {
    const url = vehicleId ? `/insurance-claims?vehicleId=${vehicleId}` : '/insurance-claims';
    return this.request<InsuranceClaim[]>(url);
  }

  async createInsuranceClaim(claim: InsuranceClaim): Promise<void> {
    return this.request<void>('/insurance-claims', {
      method: 'POST',
      body: JSON.stringify(claim),
    });
  }

  async updateInsuranceClaim(claim: InsuranceClaim): Promise<void> {
    return this.request<void>(`/insurance-claims/${claim.id}`, {
      method: 'PUT',
      body: JSON.stringify(claim),
    });
  }

  async deleteInsuranceClaim(id: string): Promise<void> {
    return this.request<void>(`/insurance-claims/${id}`, { method: 'DELETE' });
  }

  // Firmy s cache (dlhší TTL - firmy sa zriedka menia)
  async getCompanies(): Promise<Company[]> {
    const cacheKey = cacheKeys.companies();
    
    return apiCache.getOrFetch(
      cacheKey,
      () => this.request<Company[]>('/companies'),
      {
        ttl: 30 * 60 * 1000, // 30 minutes
        tags: ['companies'],
        background: true
      }
    );
  }

  async createCompany(company: Company): Promise<void> {
    return this.request<void>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
  }

  async deleteCompany(id: string): Promise<void> {
    return this.request<void>(`/companies/${id}`, { method: 'DELETE' });
  }

  // Poisťovne
  async getInsurers(): Promise<Insurer[]> {
    return this.request<Insurer[]>('/insurers');
  }

  async createInsurer(insurer: Insurer): Promise<void> {
    return this.request<void>('/insurers', {
      method: 'POST',
      body: JSON.stringify(insurer),
    });
  }

  async deleteInsurer(id: string): Promise<void> {
    return this.request<void>(`/insurers/${id}`, { method: 'DELETE' });
  }

  // Vyúčtovania
  async getSettlements(): Promise<Settlement[]> {
    return this.request<Settlement[]>('/settlements');
  }

  async getSettlement(id: string): Promise<Settlement> {
    return this.request<Settlement>(`/settlements/${id}`);
  }

  async createSettlement(settlement: Settlement): Promise<void> {
    return this.request<void>('/settlements', {
      method: 'POST',
      body: JSON.stringify(settlement),
    });
  }

  async updateSettlement(id: string, settlement: Partial<Settlement>): Promise<void> {
    return this.request<void>(`/settlements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(settlement),
    });
  }

  async deleteSettlement(id: string): Promise<void> {
    return this.request<void>(`/settlements/${id}`, { method: 'DELETE' });
  }

  // Protokoly
  async getProtocolsByRental(rentalId: string): Promise<{ handoverProtocols: any[]; returnProtocols: any[] }> {
    const url = `${API_BASE_URL}/protocols/rental/${rentalId}`;
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401 || response.status === 403) {
        console.warn('🚨 Auth error:', response.status, 'Token validation failed');
        console.warn('🔍 Token debug:', {
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
          url: url
        });
        
        // TEMPORARY FIX: Don't redirect, just throw error
        // This prevents the auto-logout loop
        console.warn('⚠️ TEMPORARY: Not redirecting to login, just throwing error');
        throw new Error(`Auth failed: ${response.status} - Token validation error`);
      }

      if (!response.ok) {
        throw new Error(`API chyba: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 Raw API response for protocols:', data);
      
      // Backend vracia priamo dáta, nie ApiResponse formát
      return data as { handoverProtocols: any[]; returnProtocols: any[] };
    } catch (error) {
      console.error('❌ API chyba pri načítaní protokolov:', error);
      throw error;
    }
  }

  async createHandoverProtocol(protocolData: any): Promise<any> {
    console.log('🔄 API createHandoverProtocol - input:', JSON.stringify(protocolData, null, 2));
    
    // Ensure all required fields are present
    const completeProtocolData = {
      rentalId: protocolData.rentalId,
      location: protocolData.location || '',
      vehicleCondition: protocolData.vehicleCondition || {
        odometer: 0,
        fuelLevel: 100,
        fuelType: 'Benzín',
        exteriorCondition: 'Dobrý',
        interiorCondition: 'Dobrý',
        notes: ''
      },
      vehicleImages: protocolData.vehicleImages || [],
      vehicleVideos: protocolData.vehicleVideos || [],
      documentImages: protocolData.documentImages || [],
      damageImages: protocolData.damageImages || [],
      damages: protocolData.damages || [],
      signatures: protocolData.signatures || [],
      rentalData: protocolData.rentalData || {},
      notes: protocolData.notes || '',
      createdBy: protocolData.createdBy || '',
      status: 'completed',
      completedAt: new Date(),
      pdfUrl: protocolData.pdfUrl, // ✅ Pridané: PDF URL z R2
      emailSent: protocolData.emailSent || false, // ✅ Pridané: email status
    };
    
    console.log('🔄 API createHandoverProtocol - complete data:', JSON.stringify(completeProtocolData, null, 2));
    
    try {
      const result = await this.request<any>('/protocols/handover', {
        method: 'POST',
        body: JSON.stringify(completeProtocolData),
      });
      
      // 🗑️ CACHE INVALIDATION - protokol sa zmenil
      clearProtocolCache();
      console.log('🔄 Protocol cache invalidated after handover protocol creation');
      
      return result;
    } catch (error) {
      console.error('❌ Failed to create handover protocol:', error);
      throw error;
    }
  }

  async createReturnProtocol(protocolData: any): Promise<any> {
    console.log('🔄 API createReturnProtocol - input:', JSON.stringify(protocolData, null, 2));
    
    // Ensure all required fields are present
    const completeProtocolData = {
      ...protocolData,
      pdfUrl: protocolData.pdfUrl, // ✅ Pridané: PDF URL z R2
      emailSent: protocolData.emailSent || false, // ✅ Pridané: email status
    };
    
    console.log('🔄 API createReturnProtocol - complete data:', JSON.stringify(completeProtocolData, null, 2));
    
    try {
      const result = await this.request<any>('/protocols/return', {
        method: 'POST',
        body: JSON.stringify(completeProtocolData),
      });
      
      // 🗑️ CACHE INVALIDATION - protokol sa zmenil
      clearProtocolCache();
      console.log('🔄 Protocol cache invalidated after return protocol creation');
      
      return result;
    } catch (error) {
      console.error('❌ Failed to create return protocol:', error);
      throw error;
    }
  }

  async deleteProtocol(protocolId: string, type: 'handover' | 'return'): Promise<void> {
    console.log(`🗑️ API deleteProtocol - deleting ${type} protocol:`, protocolId);
    
    try {
      const result = await this.request<void>(`/protocols/${type}/${protocolId}`, {
        method: 'DELETE',
      });
      
      // 🗑️ CACHE INVALIDATION - protokol sa zmazal
      clearProtocolCache();
      console.log('🔄 Protocol cache invalidated after protocol deletion');
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to delete ${type} protocol:`, error);
      throw error;
    }
  }

  // Signature template management
  async updateSignatureTemplate(signatureTemplate: string): Promise<any> {
    console.log('🖊️ API updateSignatureTemplate - saving signature template');
    
    const response = await this.request<any>('/auth/signature-template', {
      method: 'PUT',
      body: JSON.stringify({ signatureTemplate }),
    });
    
    console.log('🖊️ API updateSignatureTemplate - response:', response);
    return response;
  }

  // User profile management
  async updateUserProfile(firstName: string, lastName: string): Promise<any> {
    console.log('👤 API updateUserProfile - updating user profile');
    
    const response = await this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName }),
    });
    
    console.log('👤 API updateUserProfile - response:', response);
    return response;
  }

  // 👥 USER MANAGEMENT API METHODS
  async getUsers(): Promise<any[]> {
    console.log('👥 API getUsers - fetching all users');
    
    const response = await this.request<any>('/auth/users');
    console.log('👥 API getUsers - response:', response);
    console.log('👥 API getUsers - response type:', typeof response);
    console.log('👥 API getUsers - is array:', Array.isArray(response));
    
    // request() už parsuje data a vracia priamo users array
    return Array.isArray(response) ? response : [];
  }

  async createUser(userData: any): Promise<any> {
    console.log('👤 API createUser - creating user:', userData);
    
    const response = await this.request<any>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    console.log('👤 API createUser - response:', response);
    console.log('👤 API createUser - response type:', typeof response);
    
    // request() už parsuje data a vracia priamo user objekt
    return response;
  }

  async updateUser(userId: string, userData: any): Promise<any> {
    console.log('👤 API updateUser - updating user:', userId, userData);
    
    const response = await this.request<any>(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    
    console.log('👤 API updateUser - response:', response);
    console.log('👤 API updateUser - response type:', typeof response);
    
    // request() už parsuje data a vracia priamo user objekt
    return response;
  }

  async deleteUser(userId: string): Promise<void> {
    console.log('👤 API deleteUser - deleting user:', userId);
    
    await this.request<void>(`/auth/users/${userId}`, {
      method: 'DELETE',
    });
    
    console.log('👤 API deleteUser - user deleted successfully');
  }

  // 🔐 PERMISSIONS API METHODS
  async getUserCompanyAccess(userId: string): Promise<any[]> {
    console.log('🔐 API getUserCompanyAccess - fetching user company access:', userId);
    
    const response = await this.request<any>(`/permissions/user/${userId}/access`);
    console.log('🔐 API getUserCompanyAccess - response:', response);
    
    return Array.isArray(response) ? response : [];
  }

  async setUserPermission(userId: string, companyId: string, permissions: any): Promise<any> {
    console.log('🔐 API setUserPermission - setting permissions:', { userId, companyId, permissions });
    
    const response = await this.request<any>(`/permissions/user/${userId}/company/${companyId}`, {
      method: 'POST',
      body: JSON.stringify({ permissions }),
    });
    
    console.log('🔐 API setUserPermission - response:', response);
    return response;
  }

  async removeUserPermission(userId: string, companyId: string): Promise<void> {
    console.log('🔐 API removeUserPermission - removing permissions:', { userId, companyId });
    
    await this.request<void>(`/permissions/user/${userId}/company/${companyId}`, {
      method: 'DELETE',
    });
    
    console.log('🔐 API removeUserPermission - permissions removed successfully');
  }

  async setUserPermissionsBulk(assignments: Array<{ userId: string; companyId: string; permissions: any }>): Promise<any> {
    console.log('🔐 API setUserPermissionsBulk - bulk setting permissions:', assignments);
    
    const response = await this.request<any>('/permissions/bulk', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
    
    console.log('🔐 API setUserPermissionsBulk - response:', response);
    return response;
  }

  // Získanie majiteľa vozidla k dátumu
  async getVehicleOwnerAtDate(vehicleId: string, date: Date): Promise<{
    vehicleId: string;
    date: string;
    owner: {
      ownerCompanyId: string | null;
      ownerCompanyName: string;
    };
  }> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return this.request<{
      vehicleId: string;
      date: string;
      owner: {
        ownerCompanyId: string | null;
        ownerCompanyName: string;
      };
    }>(`/vehicles/${vehicleId}/owner-at-date?date=${dateStr}`);
  }

  // 📧 Email Webhook APIs
  private convertSnakeToCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertSnakeToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        converted[camelKey] = this.convertSnakeToCamelCase(value);
      }
      return converted;
    }
    return obj;
  }

  async getPendingAutomaticRentals(): Promise<Rental[]> {
    // this.request už extrahuje 'data' z {success, data} response
    const responseData = await this.request<any[]>('/email-webhook/pending');
    
    // Konvertuj snake_case na camelCase
    const convertedData = this.convertSnakeToCamelCase(responseData);
    
    return convertedData || [];
  }

  async approveAutomaticRental(rentalId: string): Promise<void> {
    await this.request<{
      success: boolean;
      data: { status: string };
    }>(`/email-webhook/approve/${rentalId}`, {
      method: 'POST',
    });
  }

  async rejectAutomaticRental(rentalId: string, reason: string): Promise<void> {
    await this.request<{
      success: boolean;
      data: { status: string };
    }>(`/email-webhook/reject/${rentalId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updatePendingRental(rentalId: string, updates: Partial<Rental>): Promise<void> {
    await this.request<{
      success: boolean;
      data: any;
    }>(`/email-webhook/rentals/${rentalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getWebhookStats(): Promise<{
    stats: any[];
    log: any[];
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        stats: any[];
        log: any[];
      };
    }>('/email-webhook/stats');
    return response.data;
  }

  // IMAP Email Monitoring methods
  async getImapStatus(): Promise<any> {
    const response = await this.request<any>('/email-imap/status', { method: 'GET' });
    return response;
  }

  async testImapConnection(): Promise<any> {
    console.log('🧪 API: IMAP test pripojenia...');
    
    const response = await this.request<any>('/email-imap/test', { method: 'GET' });
    
    console.log('📊 API: Raw IMAP response:', response);
    console.log('🔍 API: Extracted data:', response);
    
    return response;
  }

  async startImapMonitoring(): Promise<void> {
    await this.request<any>('/email-imap/start', { method: 'POST' });
  }

  async stopImapMonitoring(): Promise<void> {
    await this.request<any>('/email-imap/stop', { method: 'POST' });
  }

  async checkImapNow(): Promise<void> {
    await this.request<any>('/email-imap/check-now', { method: 'POST' });
  }

  // ==================== AUDIT LOGS API ====================

  async getAuditLogs(params: string): Promise<{ logs: any[]; total: number }> {
    return await this.request<{ logs: any[]; total: number }>(`/audit/logs?${params}`, { method: 'GET' });
  }

  async getAuditStats(days: number): Promise<any> {
    return await this.request<any>(`/audit/stats?days=${days}`, { method: 'GET' });
  }

  async getAuditActions(): Promise<string[]> {
    return await this.request<string[]>('/audit/actions', { method: 'GET' });
  }

  async cleanupAuditLogs(olderThanDays: number): Promise<{ deletedCount: number }> {
    return await this.request<{ deletedCount: number }>('/audit/logs/cleanup', { 
      method: 'POST',
      body: JSON.stringify({ olderThanDays })
    });
  }
}

export const apiService = new ApiService();
