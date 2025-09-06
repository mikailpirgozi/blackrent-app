import type {
  Company,
  Customer,
  Expense,
  ExpenseCategory,
  Insurance,
  InsuranceClaim,
  Insurer,
  RecurringExpense,
  Rental,
  Settlement,
  Vehicle,
  VehicleDocument,
} from '../types';
import { createApiErrorHandler } from '../utils/apiErrorHandler';
import { getApiBaseUrl } from '../utils/apiUrl';
import { RequestDeduplicator } from '../utils/debounce';
import { EnhancedError, analyzeError, withRetry } from '../utils/errorHandling';
import {
  getCacheInfo,
  getProtocolCache,
  isCacheFresh,
  setProtocolCache,
  type CachedProtocolStatus,
} from '../utils/protocolCache';
// 🔄 PHASE 3: Migrating to unified cache system
import { compatibilityCache } from '../utils/unifiedCacheSystem';

// 🔄 COMPATIBILITY: Alias pre postupnú migráciu
const apiCache = compatibilityCache;
const cacheKeys = {
  vehicles: (userId?: string) =>
    compatibilityCache.generateKey('vehicles', { userId }),
  customers: (userId?: string) =>
    compatibilityCache.generateKey('customers', { userId }),
  companies: () => compatibilityCache.generateKey('companies'),
  bulkData: () => compatibilityCache.generateKey('bulkData'),
  vehicleOwnership: () => compatibilityCache.generateKey('vehicleOwnership'),
};
const cacheHelpers = {
  invalidateEntity: compatibilityCache.invalidateEntity,
};

// Export for compatibility
export const getApiBaseUrlDynamic = getApiBaseUrl;
// Dynamické získanie API URL namiesto statickej konštanty
export const getAPI_BASE_URL = () => getApiBaseUrl();

class ApiService {
  // ⚡ Performance optimizations
  private requestDeduplicator = new RequestDeduplicator();
  private errorHandler = createApiErrorHandler(error => {
    // This will be overridden by components that use the error context
    console.error('API Error (fallback handler):', error);
    return 'api-error-' + Date.now();
  });

  // Set error handler from components that have access to error context
  public setErrorHandler(showError: (error: unknown) => string) {
    this.errorHandler = createApiErrorHandler(showError);
  }

  private getAuthToken(): string | null {
    return (
      localStorage.getItem('blackrent_token') ||
      sessionStorage.getItem('blackrent_token')
    );
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${getAPI_BASE_URL()}${endpoint}`;
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
          console.warn(
            '🚨 Auth error:',
            response.status,
            'Token validation failed'
          );
          console.warn('🔍 Token debug:', {
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
            url: url,
          });

          // Create error with status for proper retry logic
          const authError = new Error(
            `Auth failed: ${response.status} - Token validation error`
          );
          (authError as Error & { status: number }).status = response.status;
          throw authError;
        }

        if (!response.ok) {
          const error = new Error(`API chyba: ${response.status}`);
          (error as Error & { status: number }).status = response.status;
          throw error;
        }

        const data = await response.json();

        // Ak je to API response objekt s success/data, vráť len data
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return data.data;
        }

        return data;
      } catch (error: unknown) {
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
        retryCondition: error => {
          if (
            error.originalError?.status === 401 ||
            error.originalError?.status === 403
          ) {
            // console.log('⚠️ Auth error - not retrying');
            return false;
          }
          return error.isRetryable;
        },
      });
    } catch (error: unknown) {
      // Final error handling - throw enhanced error pre user feedback
      if (error instanceof EnhancedError) {
        console.error('❌ Final API error:', error.userMessage);
        throw error;
      }

      // Fallback pre unexpected errors
      throw new EnhancedError(error);
    }
  }

  async login(
    username: string,
    password: string
  ): Promise<{ user: Record<string, unknown>; token: string }> {
    // console.log('🔗 API Service - Making login request to:', `${getAPI_BASE_URL()}/auth/login`);
    // console.log('🔗 API Service - Request body:', { username, password: '***' });

    const response = await fetch(`${getAPI_BASE_URL()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    // console.log('🔗 API Service - Response status:', response.status);
    // console.log('🔗 API Service - Response ok:', response.ok);
    // console.log('🔗 API Service - Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Unknown error' }));
      console.error('🔗 API Service - Login failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new Error(
        `Login failed: ${response.status} - ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();
    // console.log('🔗 API Service - Login successful, data:', { success: data.success, hasUser: !!data.user, hasToken: !!data.token, userRole: data.user?.role });
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

  // Generická GET metóda
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Generická POST metóda
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generická PUT metóda
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generická DELETE metóda
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Vozidlá s cache
  async getVehicles(
    includeRemoved: boolean = false,
    includePrivate: boolean = false
  ): Promise<Vehicle[]> {
    const userId = localStorage.getItem('blackrent_user_id');

    // Vytvor endpoint s parametrami
    const params = new URLSearchParams();
    if (includeRemoved) params.append('includeRemoved', 'true');
    if (includePrivate) params.append('includePrivate', 'true');
    const endpoint = `/vehicles${params.toString() ? '?' + params.toString() : ''}`;

    // Cache key závisí od parametrov
    const cacheKey =
      includeRemoved || includePrivate
        ? `vehicles-${includeRemoved ? 'removed' : ''}${includePrivate ? 'private' : ''}`
        : cacheKeys.vehicles(userId || undefined);

    // Pre zahrnutie vyradených alebo súkromných vozidiel nepoužívame cache
    if (includeRemoved || includePrivate) {
      return this.request<Vehicle[]>(endpoint);
    }

    return apiCache.getOrFetch(
      cacheKey,
      () => this.request<Vehicle[]>(endpoint),
      {
        ttl: 10 * 60 * 1000, // 10 minutes
        tags: ['vehicles'],
        background: true, // Enable background refresh
      }
    );
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }

  // 🚀 GMAIL APPROACH: Paginated vehicles s filtrami
  async getVehiclesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    company?: string;
    brand?: string;
    category?: string;
    status?: string;
    yearMin?: string;
    yearMax?: string;
    priceMin?: string;
    priceMax?: string;
  }): Promise<{
    vehicles: Vehicle[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
      itemsPerPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    // Add all parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/vehicles/paginated${queryString ? `?${queryString}` : ''}`;

    return this.request<{
      vehicles: Vehicle[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
        itemsPerPage: number;
      };
    }>(endpoint);
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
    return this.requestDeduplicator.deduplicate('bulk-data', async () => {
      return apiCache.getOrFetch(
        cacheKeys.bulkData(),
        async () => {
          // Optimalized: Consolidated bulk data loading log
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

          performance.now() - startTime;
          // Optimalized: Single consolidated bulk data log
          // console.log(`⚡ Bulk data loaded: ${response.rentals?.length || 0} rentals, ${response.vehicles?.length || 0} vehicles (${loadTime.toFixed(0)}ms)`);

          return response;
        },
        {
          ttl: 10 * 60 * 1000, // 10 minutes - aggressive caching
          tags: ['bulk', 'vehicles', 'rentals', 'customers'],
        }
      );
    });
  }

  // ⚡ BULK PROTOCOL STATUS - Získa protocol status pre všetky rentals naraz s SMART CACHE
  async getBulkProtocolStatus(): Promise<CachedProtocolStatus[]> {
    // ⚡ REQUEST DEDUPLICATION - prevent duplicate requests
    return this.requestDeduplicator.deduplicate(
      'bulk-protocol-status',
      async () => {
        // 📦 1. CACHE FIRST - skús načítať z cache
        const cached = getProtocolCache();
        if (cached && isCacheFresh()) {
          // Optimalized: Removed redundant log (already logged in protocolCache.ts)

          // 🔄 Background refresh - aktualizuj cache na pozadí
          this.refreshProtocolCacheInBackground();

          return cached;
        }

        // 🌐 2. API CALL - cache chýba alebo expired
        // console.log('🌐 Loading protocol status from API...');
        const cacheInfo = getCacheInfo();
        if (cacheInfo.exists) {
          // console.log(`📊 Cache info: age=${cacheInfo.age}s, records=${cacheInfo.records}, fresh=${cacheInfo.fresh}`);
        }

        return this.loadProtocolStatusFromAPI();
      }
    );
  }

  /**
   * 🌐 Load protocol status from API - extracted for reuse
   */
  private async loadProtocolStatusFromAPI(): Promise<CachedProtocolStatus[]> {
    try {
      const response = await this.request<
        Record<string, unknown>[] | { data: Record<string, unknown>[] }
      >('/protocols/bulk-status');

      // 🚀 SMART RESPONSE HANDLING - Backend môže vrátiť Array alebo API wrapper
      let protocolData: Record<string, unknown>[];

      if (Array.isArray(response)) {
        // Backend vracia priamy Array: [...]
        protocolData = response;
      } else if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        Array.isArray(response.data)
      ) {
        // Backend vracia API wrapper: { success: true, data: [...] }
        protocolData = response.data;
      } else {
        console.error('❌ getBulkProtocolStatus: Nerozpoznaný formát odpovede');
        console.error('Raw response:', response);
        throw new Error('Neplatná odpoveď zo servera');
      }

      if (protocolData.length === 0) {
        console.warn(
          '⚠️ getBulkProtocolStatus: Žiadne protocol data nenájdené'
        );
        return [];
      }

      // Transformuj dáta s bezpečným pristupom
      const transformedData: CachedProtocolStatus[] = protocolData.map(
        (item: Record<string, unknown>): CachedProtocolStatus => ({
          rentalId: String(item?.rentalId || ''),
          hasHandoverProtocol: Boolean(item?.hasHandoverProtocol),
          hasReturnProtocol: Boolean(item?.hasReturnProtocol),
          handoverProtocolId: item?.handoverProtocolId
            ? String(item.handoverProtocolId)
            : undefined,
          returnProtocolId: item?.returnProtocolId
            ? String(item.returnProtocolId)
            : undefined,
          handoverCreatedAt: item.handoverCreatedAt
            ? new Date(String(item.handoverCreatedAt))
            : undefined,
          returnCreatedAt: item.returnCreatedAt
            ? new Date(String(item.returnCreatedAt))
            : undefined,
        })
      );

      // 💾 3. SAVE TO CACHE
      setProtocolCache(transformedData);

      return transformedData;
    } catch (error: unknown) {
      console.error('❌ getBulkProtocolStatus error:', error);
      console.error(
        '❌ Error details:',
        error instanceof Error ? error.message : String(error)
      );

      // 🔄 FALLBACK - použiť starý cache ak existuje
      const cached = getProtocolCache();
      if (cached) {
        // console.log('🔄 Using stale cache as fallback');
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
      // Optimalized: Reduced background refresh logging
      if (process.env.NODE_ENV === 'development') {
        // console.log('🔄 Refreshing protocol cache in background...');
      }

      const response = await this.request<
        { data?: Record<string, unknown>[] } | Record<string, unknown>[]
      >('/protocols/bulk-status');

      let protocolData: Record<string, unknown>[];
      if (Array.isArray(response)) {
        protocolData = response;
      } else if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        Array.isArray(response.data)
      ) {
        protocolData = response.data;
      } else {
        throw new Error('Invalid response format');
      }

      const transformedData: CachedProtocolStatus[] = protocolData.map(
        (item: Record<string, unknown>): CachedProtocolStatus => ({
          rentalId: String(item?.rentalId || ''),
          hasHandoverProtocol: Boolean(item?.hasHandoverProtocol),
          hasReturnProtocol: Boolean(item?.hasReturnProtocol),
          handoverProtocolId: item?.handoverProtocolId
            ? String(item.handoverProtocolId)
            : undefined,
          returnProtocolId: item?.returnProtocolId
            ? String(item.returnProtocolId)
            : undefined,
          handoverCreatedAt: item.handoverCreatedAt
            ? new Date(String(item.handoverCreatedAt))
            : undefined,
          returnCreatedAt: item.returnCreatedAt
            ? new Date(String(item.returnCreatedAt))
            : undefined,
        })
      );

      setProtocolCache(transformedData);
      if (process.env.NODE_ENV === 'development') {
        // console.log('✅ Background cache refresh completed');
      }
    } catch (error) {
      console.warn(
        '⚠️ Background cache refresh failed:',
        error instanceof Error ? error.message : String(error)
      );
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
            // console.log('🌐 Loading vehicle ownership history from API...');
            const response = await this.request<{
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
            }>('/vehicles/bulk-ownership-history');
            // console.log(`📊 Vehicle ownership history: ${response.totalVehicles} vehicles loaded`);
            return response;
          },
          {
            ttl: 15 * 60 * 1000, // 15 minutes - history changes rarely
            tags: ['vehicles', 'ownership', 'history'],
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
    const result = await this.request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
    });

    // Invalidate cache
    cacheHelpers.invalidateEntity('vehicle');
    return result;
  }

  // CSV Export/Import pre vozidlá
  async exportVehiclesCSV(): Promise<Blob> {
    const response = await fetch(`${getAPI_BASE_URL()}/vehicles/export/csv`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async importVehiclesCSV(csvData: string): Promise<unknown> {
    return this.request<unknown>('/vehicles/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // CSV Export/Import pre zákazníkov
  async exportCustomersCSV(): Promise<Blob> {
    const response = await fetch(`${getAPI_BASE_URL()}/customers/export/csv`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async importCustomersCSV(csvData: string): Promise<unknown> {
    return this.request<unknown>('/customers/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // CSV Export/Import pre náklady
  async exportExpensesCSV(): Promise<Blob> {
    const response = await fetch(`${getAPI_BASE_URL()}/expenses/export/csv`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  async importExpensesCSV(csvData: string): Promise<unknown> {
    return this.request<unknown>('/expenses/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csvData }),
    });
  }

  // Prenájmy
  async getRentals(): Promise<Rental[]> {
    return this.request<Rental[]>('/rentals');
  }

  // 🚀 NOVÝ: Paginated rentals s filtrami
  async getRentalsPaginated(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      dateFilter?: string;
      dateFrom?: string;
      dateTo?: string;
      company?: string;
      status?: string;
      protocolStatus?: string;
      paymentMethod?: string;
      paymentStatus?: string;
      vehicleBrand?: string;
      priceMin?: string;
      priceMax?: string;
      sortBy?: 'created_at' | 'start_date' | 'end_date' | 'smart_priority';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    rentals: Rental[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
      itemsPerPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    // Pridaj všetky parametre do query stringu
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/rentals/paginated${queryString ? `?${queryString}` : ''}`;

    // 🔧 OPRAVA: request() už automaticky extrahuje data z {success, data} response
    return this.request<{
      rentals: Rental[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
        itemsPerPage: number;
      };
    }>(endpoint);
  }

  async getRental(id: string): Promise<Rental> {
    return this.request<Rental>(`/rentals/${id}`);
  }

  async createRental(rental: Rental): Promise<Rental> {
    return this.request<Rental>('/rentals', {
      method: 'POST',
      body: JSON.stringify(rental),
    });
  }

  // 📥 BATCH IMPORT - Rýchly import viacerých prenájmov naraz
  async batchImportRentals(rentals: Rental[]): Promise<{
    processed: number;
    total: number;
    results: Record<string, unknown>[];
    errors: Record<string, unknown>[];
    successRate: number;
  }> {
    return this.request<{
      processed: number;
      total: number;
      results: Record<string, unknown>[];
      errors: Record<string, unknown>[];
      successRate: number;
    }>('/rentals/batch-import', {
      method: 'POST',
      body: JSON.stringify({ rentals }),
    });
  }

  // 📥 BATCH IMPORT VEHICLES - Rýchly import viacerých vozidiel naraz
  async batchImportVehicles(vehicles: Vehicle[]): Promise<{
    processed: number;
    total: number;
    created: number;
    updated: number;
    errorsCount: number;
    successRate: string;
    results: Record<string, unknown>[];
    errors: Record<string, unknown>[];
  }> {
    return this.request<{
      processed: number;
      total: number;
      created: number;
      updated: number;
      errorsCount: number;
      successRate: string;
      results: Record<string, unknown>[];
      errors: Record<string, unknown>[];
    }>('/vehicles/batch-import', {
      method: 'POST',
      body: JSON.stringify({ vehicles }),
    });
  }

  // 📥 BATCH IMPORT EXPENSES - Rýchly import viacerých nákladov naraz
  async batchImportExpenses(expenses: Expense[]): Promise<{
    processed: number;
    total: number;
    created: number;
    updated: number;
    errorsCount: number;
    successRate: string;
    results: Record<string, unknown>[];
    errors: Record<string, unknown>[];
  }> {
    return this.request<{
      processed: number;
      total: number;
      created: number;
      updated: number;
      errorsCount: number;
      successRate: string;
      results: Record<string, unknown>[];
      errors: Record<string, unknown>[];
    }>('/expenses/batch-import', {
      method: 'POST',
      body: JSON.stringify({ expenses }),
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
        background: true,
      }
    );
  }

  // 🚀 GMAIL APPROACH: Paginated customers s filtrami
  async getCustomersPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    country?: string;
    hasRentals?: string;
  }): Promise<{
    customers: Customer[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
      itemsPerPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    // Add all parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/customers/paginated${queryString ? `?${queryString}` : ''}`;

    return this.request<{
      customers: Customer[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
        itemsPerPage: number;
      };
    }>(endpoint);
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
    const result = await this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });

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

  // Kategórie nákladov
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return this.request<ExpenseCategory[]>('/expense-categories');
  }

  async createExpenseCategory(
    category: Omit<
      ExpenseCategory,
      'id' | 'createdAt' | 'updatedAt' | 'isDefault' | 'isActive'
    >
  ): Promise<ExpenseCategory> {
    return this.request<ExpenseCategory>('/expense-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateExpenseCategory(category: ExpenseCategory): Promise<void> {
    return this.request<void>(`/expense-categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    return this.request<void>(`/expense-categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Pravidelné náklady
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return this.request<RecurringExpense[]>('/recurring-expenses');
  }

  async createRecurringExpense(
    recurring: Omit<
      RecurringExpense,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'isActive'
      | 'totalGenerated'
      | 'lastGeneratedDate'
      | 'nextGenerationDate'
    >
  ): Promise<RecurringExpense> {
    return this.request<RecurringExpense>('/recurring-expenses', {
      method: 'POST',
      body: JSON.stringify(recurring),
    });
  }

  async updateRecurringExpense(recurring: RecurringExpense): Promise<void> {
    return this.request<void>(`/recurring-expenses/${recurring.id}`, {
      method: 'PUT',
      body: JSON.stringify(recurring),
    });
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    return this.request<void>(`/recurring-expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async generateRecurringExpenses(
    targetDate?: Date
  ): Promise<{ generated: number; skipped: number; errors: string[] }> {
    return this.request<{
      generated: number;
      skipped: number;
      errors: string[];
    }>('/recurring-expenses/generate', {
      method: 'POST',
      body: JSON.stringify({ targetDate: targetDate?.toISOString() }),
    });
  }

  async generateSingleRecurringExpense(
    id: string,
    targetDate?: Date
  ): Promise<{ generatedExpenseId: string }> {
    return this.request<{ generatedExpenseId: string }>(
      `/recurring-expenses/${id}/generate`,
      {
        method: 'POST',
        body: JSON.stringify({ targetDate: targetDate?.toISOString() }),
      }
    );
  }

  // 📊 PROTOCOLS FOR STATISTICS
  async getAllProtocolsForStats(): Promise<
    Array<{
      id: string;
      type: 'handover' | 'return';
      rentalId: string;
      createdBy: string;
      createdAt: Date;
      rentalData?: Rental;
    }>
  > {
    return this.request<
      Array<{
        id: string;
        type: 'handover' | 'return';
        rentalId: string;
        createdBy: string;
        createdAt: Date;
        rentalData?: Rental;
      }>
    >('/protocols/all-for-stats');
  }

  // Poistky
  async getInsurances(): Promise<Insurance[]> {
    return this.request<Insurance[]>('/insurances');
  }

  async getInsurancesPaginated(params: string): Promise<unknown> {
    return this.request<unknown>(`/insurances/paginated?${params}`);
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
    const url = vehicleId
      ? `/vehicle-documents?vehicleId=${vehicleId}`
      : '/vehicle-documents';
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
    const url = vehicleId
      ? `/insurance-claims?vehicleId=${vehicleId}`
      : '/insurance-claims';
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
        background: true,
      }
    );
  }

  // 🚀 GMAIL APPROACH: Paginated companies s filtrami
  async getCompaniesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    country?: string;
    status?: string;
  }): Promise<{
    companies: Company[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
      itemsPerPage: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    // Add all parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/companies/paginated${queryString ? `?${queryString}` : ''}`;

    return this.request<{
      companies: Company[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
        itemsPerPage: number;
      };
    }>(endpoint);
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

  async updateSettlement(
    id: string,
    settlement: Partial<Settlement>
  ): Promise<void> {
    return this.request<void>(`/settlements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(settlement),
    });
  }

  async deleteSettlement(id: string): Promise<void> {
    return this.request<void>(`/settlements/${id}`, { method: 'DELETE' });
  }

  // Protokoly
  async getProtocolsByRental(
    rentalId: string
  ): Promise<{ handoverProtocols: unknown[]; returnProtocols: unknown[] }> {
    const url = `${getAPI_BASE_URL()}/protocols/rental/${rentalId}`;
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
        console.warn(
          '🚨 Auth error:',
          response.status,
          'Token validation failed'
        );
        console.warn('🔍 Token debug:', {
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
          url: url,
        });

        // TEMPORARY FIX: Don't redirect, just throw error
        // This prevents the auto-logout loop
        console.warn(
          '⚠️ TEMPORARY: Not redirecting to login, just throwing error'
        );
        throw new Error(
          `Auth failed: ${response.status} - Token validation error`
        );
      }

      if (!response.ok) {
        throw new Error(`API chyba: ${response.status}`);
      }

      const data = await response.json();
      // console.log('🔍 Raw API response for protocols:', data);

      // Backend vracia priamo dáta, nie ApiResponse formát
      return data as {
        handoverProtocols: unknown[];
        returnProtocols: unknown[];
      };
    } catch (error) {
      console.error('❌ API chyba pri načítaní protokolov:', error);
      throw error;
    }
  }

  async createHandoverProtocol(
    protocolData: Record<string, unknown>
  ): Promise<unknown> {
    // console.log('🔄 API createHandoverProtocol - input:', JSON.stringify(protocolData, null, 2));

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
        notes: '',
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

    // console.log('🔄 API createHandoverProtocol - complete data:', JSON.stringify(completeProtocolData, null, 2));

    try {
      const result = await this.request<unknown>('/protocols/handover', {
        method: 'POST',
        body: JSON.stringify(completeProtocolData),
      });

      // 🔴 REMOVED: Redundant cache invalidation - WebSocket updates handle this

      return result;
    } catch (error) {
      console.error('❌ Failed to create handover protocol:', error);
      throw error;
    }
  }

  async createReturnProtocol(
    protocolData: Record<string, unknown>
  ): Promise<unknown> {
    // console.log('🔄 API createReturnProtocol - input:', JSON.stringify(protocolData, null, 2));

    // Ensure all required fields are present
    const completeProtocolData = {
      ...protocolData,
      pdfUrl: protocolData.pdfUrl, // ✅ Pridané: PDF URL z R2
      emailSent: protocolData.emailSent || false, // ✅ Pridané: email status
    };

    // console.log('🔄 API createReturnProtocol - complete data:', JSON.stringify(completeProtocolData, null, 2));

    try {
      const result = await this.request<unknown>('/protocols/return', {
        method: 'POST',
        body: JSON.stringify(completeProtocolData),
      });

      // 🔴 REMOVED: Redundant cache invalidation - WebSocket updates handle this

      return result;
    } catch (error) {
      console.error('❌ Failed to create return protocol:', error);
      throw error;
    }
  }

  async deleteProtocol(
    protocolId: string,
    type: 'handover' | 'return'
  ): Promise<void> {
    // console.log(`🗑️ API deleteProtocol - deleting ${type} protocol:`, protocolId);

    try {
      const result = await this.request<void>(
        `/protocols/${type}/${protocolId}`,
        {
          method: 'DELETE',
        }
      );

      // 🔴 REMOVED: Redundant cache invalidation - WebSocket updates handle this

      return result;
    } catch (error) {
      console.error(`❌ Failed to delete ${type} protocol:`, error);
      throw error;
    }
  }

  // Signature template management
  async updateSignatureTemplate(signatureTemplate: string): Promise<unknown> {
    // console.log('🖊️ API updateSignatureTemplate - saving signature template');

    const response = await this.request<unknown>('/auth/signature-template', {
      method: 'PUT',
      body: JSON.stringify({ signatureTemplate }),
    });

    // console.log('🖊️ API updateSignatureTemplate - response:', response);
    return response;
  }

  // User profile management
  async updateUserProfile(
    firstName: string,
    lastName: string
  ): Promise<unknown> {
    // console.log('👤 API updateUserProfile - updating user profile');

    const response = await this.request<unknown>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName }),
    });

    // console.log('👤 API updateUserProfile - response:', response);
    return response;
  }

  // 👥 USER MANAGEMENT API METHODS
  async getUsers(): Promise<unknown[]> {
    // console.log('👥 API getUsers - fetching all users');

    const response = await this.request<unknown>('/auth/users');
    // console.log('👥 API getUsers - response:', response);
    // console.log('👥 API getUsers - response type:', typeof response);
    // console.log('👥 API getUsers - is array:', Array.isArray(response));

    // request() už parsuje data a vracia priamo users array
    return Array.isArray(response) ? response : [];
  }

  async createUser(userData: Record<string, unknown>): Promise<unknown> {
    // console.log('👤 API createUser - creating user:', userData);

    const response = await this.request<unknown>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // console.log('👤 API createUser - response:', response);
    // console.log('👤 API createUser - response type:', typeof response);

    // request() už parsuje data a vracia priamo user objekt
    return response;
  }

  async updateUser(
    userId: string,
    userData: Record<string, unknown>
  ): Promise<unknown> {
    // console.log('👤 API updateUser - updating user:', userId, userData);

    const response = await this.request<unknown>(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    // console.log('👤 API updateUser - response:', response);
    // console.log('👤 API updateUser - response type:', typeof response);

    // request() už parsuje data a vracia priamo user objekt
    return response;
  }

  async deleteUser(userId: string): Promise<void> {
    // console.log('👤 API deleteUser - deleting user:', userId);

    await this.request<void>(`/auth/users/${userId}`, {
      method: 'DELETE',
    });

    // console.log('👤 API deleteUser - user deleted successfully');
  }

  // 🔐 PERMISSIONS API METHODS
  async getUserCompanyAccess(userId: string): Promise<unknown[]> {
    // console.log('🔐 API getUserCompanyAccess - fetching user company access:', userId);

    const response = await this.request<unknown>(
      `/permissions/user/${userId}/access`
    );
    // console.log('🔐 API getUserCompanyAccess - response:', response);

    return Array.isArray(response) ? response : [];
  }

  async setUserPermission(
    userId: string,
    companyId: string,
    permissions: Record<string, unknown>
  ): Promise<unknown> {
    // console.log('🔐 API setUserPermission - setting permissions:', { userId, companyId, permissions });

    const response = await this.request<unknown>(
      `/permissions/user/${userId}/company/${companyId}`,
      {
        method: 'POST',
        body: JSON.stringify({ permissions }),
      }
    );

    // console.log('🔐 API setUserPermission - response:', response);
    return response;
  }

  async removeUserPermission(userId: string, companyId: string): Promise<void> {
    // console.log('🔐 API removeUserPermission - removing permissions:', { userId, companyId });

    await this.request<void>(
      `/permissions/user/${userId}/company/${companyId}`,
      {
        method: 'DELETE',
      }
    );

    // console.log('🔐 API removeUserPermission - permissions removed successfully');
  }

  async setUserPermissionsBulk(
    assignments: Array<{
      userId: string;
      companyId: string;
      permissions: Record<string, unknown>;
    }>
  ): Promise<unknown> {
    // console.log('🔐 API setUserPermissionsBulk - bulk setting permissions:', assignments);

    const response = await this.request<unknown>('/permissions/bulk', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });

    // console.log('🔐 API setUserPermissionsBulk - response:', response);
    return response;
  }

  // Získanie majiteľa vozidla k dátumu
  async getVehicleOwnerAtDate(
    vehicleId: string,
    date: Date
  ): Promise<{
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
  private convertSnakeToCamelCase(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertSnakeToCamelCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      const converted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
          letter.toUpperCase()
        );
        converted[camelKey] = this.convertSnakeToCamelCase(value);
      }
      return converted;
    }
    return obj;
  }

  async getPendingAutomaticRentals(): Promise<Rental[]> {
    // this.request už extrahuje 'data' z {success, data} response
    const responseData = await this.request<unknown[]>(
      '/email-webhook/pending'
    );

    // Konvertuj snake_case na camelCase
    const convertedData = this.convertSnakeToCamelCase(responseData);

    return (Array.isArray(convertedData) ? convertedData : []) as Rental[];
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

  async updatePendingRental(
    rentalId: string,
    updates: Partial<Rental>
  ): Promise<void> {
    await this.request<{
      success: boolean;
      data: unknown;
    }>(`/email-webhook/rentals/${rentalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getWebhookStats(): Promise<{
    stats: unknown[];
    log: unknown[];
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        stats: unknown[];
        log: unknown[];
      };
    }>('/email-webhook/stats');
    return response.data;
  }

  // IMAP Email Monitoring methods
  async getImapStatus(): Promise<unknown> {
    const response = await this.request<unknown>('/email-imap/status', {
      method: 'GET',
    });
    return response;
  }

  async testImapConnection(): Promise<unknown> {
    // console.log('🧪 API: IMAP test pripojenia...');

    const response = await this.request<unknown>('/email-imap/test', {
      method: 'GET',
    });

    // console.log('📊 API: Raw IMAP response:', response);
    // console.log('🔍 API: Extracted data:', response);

    return response;
  }

  async startImapMonitoring(): Promise<void> {
    await this.request<unknown>('/email-imap/start', { method: 'POST' });
  }

  async stopImapMonitoring(): Promise<void> {
    await this.request<unknown>('/email-imap/stop', { method: 'POST' });
  }

  async checkImapNow(): Promise<void> {
    await this.request<unknown>('/email-imap/check-now', { method: 'POST' });
  }

  // ==================== AUDIT LOGS API ====================

  async getAuditLogs(
    params: string
  ): Promise<{ logs: unknown[]; total: number }> {
    return await this.request<{ logs: unknown[]; total: number }>(
      `/audit/logs?${params}`,
      { method: 'GET' }
    );
  }

  async getAuditStats(days: number): Promise<unknown> {
    return await this.request<unknown>(`/audit/stats?days=${days}`, {
      method: 'GET',
    });
  }

  async getAuditActions(): Promise<string[]> {
    return await this.request<string[]>('/audit/actions', { method: 'GET' });
  }

  async cleanupAuditLogs(
    olderThanDays: number
  ): Promise<{ deletedCount: number }> {
    return await this.request<{ deletedCount: number }>('/audit/logs/cleanup', {
      method: 'POST',
      body: JSON.stringify({ olderThanDays }),
    });
  }

  // ==================== VEHICLE UNAVAILABILITY API ====================

  async createVehicleUnavailability(unavailabilityData: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    type: string;
    notes?: string;
    priority?: number;
  }): Promise<void> {
    return await this.request<void>('/vehicle-unavailability', {
      method: 'POST',
      body: JSON.stringify(unavailabilityData),
    });
  }
}

export const apiService = new ApiService();
