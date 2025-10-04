import type {
  ApiResponse,
  AuthResponse,
  Company,
  Customer,
  Expense,
  ExpenseCategory,
  HandoverProtocol,
  Insurance,
  InsuranceClaim,
  Insurer,
  RecurringExpense,
  Rental,
  ReturnProtocol,
  Settlement,
  User,
  Vehicle,
  VehicleDocument,
} from '../types';
import type { Leasing } from '../types/leasing-types';
import { logger } from '@/utils/smartLogger';
import { getApiBaseUrl } from '@/utils/apiUrl'; // ✅ Unified API URL logic

// ✅ Use centralized API URL logic
export const API_BASE_URL = getApiBaseUrl();
export const getAPI_BASE_URL = getApiBaseUrl;

class ApiService {
  private getAuthToken(): string | null {
    // Skús najskôr localStorage, potom sessionStorage
    let token = localStorage.getItem('blackrent_token');
    if (!token) {
      token = sessionStorage.getItem('blackrent_token');
    }
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        // ✅ CRITICAL FIX: Disable ALL caching mechanisms
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        // ✅ CRITICAL FIX: Disable ETag caching
        'If-None-Match': '', // Force fresh response, ignore ETag
        'If-Modified-Since': '', // Force fresh response, ignore Last-Modified
        ...options.headers,
      },
      cache: 'no-store', // ✅ Fetch API cache option
      ...options,
    };

    // 🔍 DEBUG: Log každý API request (len vehicle-documents)
    if (endpoint.includes('vehicle-documents')) {
      logger.debug(
        'API REQUEST',
        {
          method: options.method || 'GET',
          endpoint,
          url,
          timestamp: new Date().toISOString(),
        },
        'api'
      );
    }

    try {
      const response = await fetch(url, config);

      // Ak je odpoveď 401 (Unauthorized) alebo 403 (Forbidden), presmeruj na prihlásenie
      if (response.status === 401 || response.status === 403) {
        logger.warn('Auth error - clearing storage and redirecting', {
          status: response.status,
        });
        localStorage.removeItem('blackrent_token');
        localStorage.removeItem('blackrent_user');
        localStorage.removeItem('blackrent_remember_me');
        sessionStorage.removeItem('blackrent_token');
        sessionStorage.removeItem('blackrent_user');

        // Presmeruj len ak nie sme už na login stránke
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('Neplatný token - presmerovanie na prihlásenie');
      }

      // Check if response has content before parsing JSON
      const responseText = await response.text();

      if (!responseText.trim()) {
        logger.warn('Empty response from API', { endpoint });
        throw new Error('Prázdna odpoveď zo servera');
      }

      let data: ApiResponse<T>;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('JSON parsing error', {
          endpoint,
          responseText: responseText.substring(0, 200),
          error: parseError,
        });
        throw new Error('Neplatná odpoveď zo servera');
      }

      // Debug log pre protokoly (len v development)
      if (endpoint.includes('/protocols/') && import.meta.env.DEV) {
        logger.debug(
          'API Response for protocol',
          {
            endpoint,
            fullData: data,
            extractedData: data.data,
            status: response.status,
          },
          'api'
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Pre protokoly, backend môže vracať priamo objekt bez wrapper
      // Backend vracia objekt s protocol, email a pdfProxyUrl
      if (endpoint.includes('/protocols/') && response.status === 201) {
        type ProtocolApiResponse = {
          success?: boolean;
          protocol?: unknown;
          email?: unknown;
          pdfProxyUrl?: string;
          id?: string;
        };

        const protocolData = data as ApiResponse<T> & ProtocolApiResponse;

        // Backend vracia štruktúru: { success, protocol: { pdfProxyUrl }, email }
        if (protocolData.success && protocolData.protocol) {
          const protocol = protocolData.protocol as { pdfProxyUrl?: string };
          logger.debug('🔍 Protocol created with full response:', {
            hasProtocol: !!protocolData.protocol,
            hasEmail: !!protocolData.email,
            hasPdfUrl: !!protocol.pdfProxyUrl,
          });
          // Vrátime celý response objekt, nie len protocol
          return data as T;
        }
        // Fallback pre prípad prázdneho objektu
        if (!data.data && Object.keys(data).length === 0) {
          logger.debug(
            '🔍 Protocol created successfully but backend returned empty response'
          );
          return { success: true } as T;
        }
        // Ak má data.id, je to priamo protokol objekt (starý formát)
        if (!data.data && protocolData.id) {
          logger.debug(
            '🔍 Protocol response without data wrapper, returning directly'
          );
          return data as T;
        }
      }

      return data.data as T;
    } catch (error) {
      console.error('API chyba:', error);
      throw error;
    }
  }

  // Auth metódy
  async login(
    username: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data: AuthResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Chyba pri prihlásení');
    }

    // Vráť len token a používateľa bez ukladania - o storage sa postará AuthContext
    if (data.success && data.token && data.user) {
      return { user: data.user, token: data.token };
    }

    throw new Error('Neplatná odpoveď zo servera');
  }

  async logout(): Promise<void> {
    const token = this.getAuthToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }

    // Vymaž token z oboch storage typov
    localStorage.removeItem('blackrent_token');
    localStorage.removeItem('blackrent_user');
    localStorage.removeItem('blackrent_remember_me');
    sessionStorage.removeItem('blackrent_token');
    sessionStorage.removeItem('blackrent_user');
  }

  // Generická GET metóda
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  // Generická POST metóda
  async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  // Generická PUT metóda
  async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  // Generická DELETE metóda
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Vozidlá
  async getVehicles(options?: {
    includeRemoved?: boolean;
    includePrivate?: boolean;
  }): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (options?.includeRemoved) params.append('includeRemoved', 'true');
    if (options?.includePrivate) params.append('includePrivate', 'true');

    const url = params.toString()
      ? `/vehicles?${params.toString()}`
      : '/vehicles';
    return this.request<Vehicle[]>(url);
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }

  async checkDuplicateVehicle(
    licensePlate: string
  ): Promise<{ exists: boolean; vehicle?: Vehicle }> {
    return this.request<{ exists: boolean; vehicle?: Vehicle }>(
      `/vehicles/check-duplicate/${encodeURIComponent(licensePlate)}`
    );
  }

  async createVehicle(vehicle: Vehicle): Promise<void> {
    return this.request<void>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicle),
    });
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    return this.request<void>(`/vehicles/${vehicle.id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicle),
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    return this.request<void>(`/vehicles/${id}`, {
      method: 'DELETE',
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
    return this.request<void>(`/rentals/${id}`, {
      method: 'DELETE',
    });
  }

  // Zákazníci
  async getCustomers(): Promise<Customer[]> {
    return this.request<Customer[]>('/customers');
  }

  async createCustomer(customer: Customer): Promise<void> {
    return this.request<void>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(customer: Customer): Promise<void> {
    return this.request<void>(`/customers/${customer.id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
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
    return this.request<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  async exportExpensesCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/expenses/export/csv`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`CSV export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async batchImportExpenses(expenses: Partial<Expense>[]): Promise<{
    created: number;
    updated: number;
    errorsCount: number;
    successRate: string;
    processed: number;
    total: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        processed: number;
        total: number;
        created: number;
        updated: number;
        errorsCount: number;
        successRate: string;
      };
    }>('/expenses/batch-import', {
      method: 'POST',
      body: JSON.stringify({ expenses }),
    });

    if (!response.success) {
      throw new Error('Batch import failed');
    }

    return response.data;
  }

  // Expense Categories
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    return this.request<ExpenseCategory[]>('/expense-categories');
  }

  async createExpenseCategory(
    category: Partial<ExpenseCategory>
  ): Promise<ExpenseCategory> {
    return this.request<ExpenseCategory>('/expense-categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateExpenseCategory(
    category: ExpenseCategory
  ): Promise<ExpenseCategory> {
    return this.request<ExpenseCategory>(`/expense-categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteExpenseCategory(id: string): Promise<void> {
    return this.request<void>(`/expense-categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Recurring Expenses
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return this.request<RecurringExpense[]>('/recurring-expenses');
  }

  async createRecurringExpense(
    expense: Partial<RecurringExpense>
  ): Promise<RecurringExpense> {
    return this.request<RecurringExpense>('/recurring-expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateRecurringExpense(
    expense: RecurringExpense
  ): Promise<RecurringExpense> {
    return this.request<RecurringExpense>(`/recurring-expenses/${expense.id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    return this.request<void>(`/recurring-expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Poistky
  async getInsurances(): Promise<Insurance[]> {
    return this.request<Insurance[]>('/insurances');
  }

  async getInsurancesPaginated(params: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    company?: string;
    status?: string;
    vehicleId?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    insurances: Insurance[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      insurances: Insurance[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
      };
    }>(`/insurances/paginated?${queryParams.toString()}`);
  }

  async createInsurance(insurance: Insurance): Promise<void> {
    return this.request<void>('/insurances', {
      method: 'POST',
      body: JSON.stringify(insurance),
    });
  }

  async updateInsurance(id: string, insurance: Insurance): Promise<Insurance> {
    return this.request<Insurance>(`/insurances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(insurance),
    });
  }

  async deleteInsurance(id: string): Promise<void> {
    return this.request<void>(`/insurances/${id}`, {
      method: 'DELETE',
    });
  }

  // Insurance Claims
  async getInsuranceClaims(vehicleId?: string): Promise<InsuranceClaim[]> {
    const endpoint = vehicleId
      ? `/insurance-claims?vehicleId=${vehicleId}`
      : '/insurance-claims';
    return this.request<InsuranceClaim[]>(endpoint);
  }

  async createInsuranceClaim(
    claim: Partial<InsuranceClaim>
  ): Promise<InsuranceClaim> {
    return this.request<InsuranceClaim>('/insurance-claims', {
      method: 'POST',
      body: JSON.stringify(claim),
    });
  }

  async updateInsuranceClaim(claim: InsuranceClaim): Promise<InsuranceClaim> {
    return this.request<InsuranceClaim>(`/insurance-claims/${claim.id}`, {
      method: 'PUT',
      body: JSON.stringify(claim),
    });
  }

  async deleteInsuranceClaim(id: string): Promise<void> {
    return this.request<void>(`/insurance-claims/${id}`, {
      method: 'DELETE',
    });
  }

  // Firmy
  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/companies');
  }

  async createCompany(company: Company): Promise<void> {
    return this.request<void>('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
  }

  async deleteCompany(id: string): Promise<void> {
    return this.request<void>(`/companies/${id}`, {
      method: 'DELETE',
    });
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
    return this.request<void>(`/insurers/${id}`, {
      method: 'DELETE',
    });
  }

  // Settlements API
  async getSettlements(): Promise<Settlement[]> {
    return this.request<Settlement[]>('/settlements');
  }

  async getSettlement(id: string): Promise<Settlement> {
    return this.request<Settlement>(`/settlements/${id}`);
  }

  async createSettlement(settlement: Settlement): Promise<Settlement> {
    // Backend očakáva len company a period, nie celý Settlement objekt
    const requestData = {
      company: settlement.company,
      period: settlement.period,
    };

    return this.request<Settlement>('/settlements', {
      method: 'POST',
      body: JSON.stringify(requestData),
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
    return this.request<void>(`/settlements/${id}`, {
      method: 'DELETE',
    });
  }

  // Protokoly
  async getProtocolsByRental(rentalId: string): Promise<{
    handoverProtocols: HandoverProtocol[];
    returnProtocols: ReturnProtocol[];
  }> {
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
        console.warn(
          '🚨 Auth error:',
          response.status,
          'Clearing storage and redirecting to login'
        );
        localStorage.removeItem('blackrent_token');
        localStorage.removeItem('blackrent_user');
        localStorage.removeItem('blackrent_remember_me');
        sessionStorage.removeItem('blackrent_token');
        sessionStorage.removeItem('blackrent_user');
        window.location.href = '/login';
        throw new Error('Neplatný token - presmerovanie na prihlásenie');
      }

      if (!response.ok) {
        throw new Error(`API chyba: ${response.status}`);
      }

      const data = await response.json();
      logger.debug('🔍 Raw API response for protocols:', data);

      // Backend vracia priamo dáta, nie ApiResponse formát
      return data as {
        handoverProtocols: HandoverProtocol[];
        returnProtocols: ReturnProtocol[];
      };
    } catch (error) {
      console.error('❌ API chyba pri načítaní protokolov:', error);
      throw error;
    }
  }

  async createHandoverProtocol(
    protocolData: Partial<HandoverProtocol>
  ): Promise<HandoverProtocol> {
    logger.debug(
      '🔄 API createHandoverProtocol - input:',
      JSON.stringify(protocolData, null, 2)
    );

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

    logger.debug(
      '🔄 API createHandoverProtocol - complete data:',
      JSON.stringify(completeProtocolData, null, 2)
    );

    return this.request<HandoverProtocol>('/protocols/handover', {
      method: 'POST',
      body: JSON.stringify(completeProtocolData),
    });
  }

  async createReturnProtocol(
    protocolData: Partial<ReturnProtocol>
  ): Promise<ReturnProtocol> {
    logger.debug(
      '🔄 API createReturnProtocol - input:',
      JSON.stringify(protocolData, null, 2)
    );

    // Ensure all required fields are present
    const completeProtocolData = {
      ...protocolData,
      pdfUrl: protocolData.pdfUrl, // ✅ Pridané: PDF URL z R2
      emailSent: protocolData.emailSent || false, // ✅ Pridané: email status
    };

    logger.debug(
      '🔄 API createReturnProtocol - complete data:',
      JSON.stringify(completeProtocolData, null, 2)
    );

    return this.request<ReturnProtocol>('/protocols/return', {
      method: 'POST',
      body: JSON.stringify(completeProtocolData),
    });
  }

  // Bulk Data API - chýbajúca metóda
  async getBulkData(): Promise<{
    vehicles: Vehicle[];
    customers: Customer[];
    rentals: Rental[];
    companies: Company[];
    expenses: Expense[];
    expenseCategories: ExpenseCategory[];
    recurringExpenses: RecurringExpense[];
    insurances: Insurance[];
    insuranceClaims: InsuranceClaim[];
    insurers: Insurer[];
    settlements: Settlement[];
  }> {
    return this.request<{
      vehicles: Vehicle[];
      customers: Customer[];
      rentals: Rental[];
      companies: Company[];
      expenses: Expense[];
      expenseCategories: ExpenseCategory[];
      recurringExpenses: RecurringExpense[];
      insurances: Insurance[];
      insuranceClaims: InsuranceClaim[];
      insurers: Insurer[];
      settlements: Settlement[];
    }>('/bulk/data');
  }

  // Vehicle Documents API
  async getVehicleDocuments(vehicleId?: string): Promise<VehicleDocument[]> {
    // ✅ Add cache-busting query param to force fresh data
    const timestamp = Date.now();
    const endpoint = vehicleId
      ? `/vehicle-documents?vehicleId=${vehicleId}&_t=${timestamp}`
      : `/vehicle-documents?_t=${timestamp}`;
    const result = await this.request<VehicleDocument[]>(endpoint);

    // 🔍 DEBUG: Log API response
    const sample = result.find(
      d => d.id === 'ce0d2d86-2f70-419d-a459-b81a71805d21'
    );
    logger.debug('📡 API RESPONSE /vehicle-documents:', {
      count: result.length,
      timestamp: new Date().toISOString(),
      sampleDoc: sample
        ? {
            id: sample.id,
            validFrom: sample.validFrom,
            validTo: sample.validTo,
            documentType: sample.documentType,
          }
        : 'not found',
    });

    return result;
  }

  async createVehicleDocument(document: VehicleDocument): Promise<void> {
    return this.request<void>('/vehicle-documents', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async updateVehicleDocument(document: VehicleDocument): Promise<void> {
    logger.debug(
      '📤 API: Sending UPDATE request for vehicle document:',
      document.id
    );
    const result = await this.request<void>(
      `/vehicle-documents/${document.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(document),
      }
    );
    logger.debug('✅ API: UPDATE request completed');
    return result;
  }

  async deleteVehicleDocument(id: string): Promise<void> {
    return this.request<void>(`/vehicle-documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Rentals Paginated API - chýbajúca metóda
  async getRentalsPaginated(params: {
    page: number;
    limit: number;
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
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    rentals: Rental[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      rentals: Rental[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
      };
    }>(`/rentals/paginated?${queryParams.toString()}`);
  }

  // Leasings Paginated API
  async getLeasingsPaginated(params: {
    page: number;
    limit: number;
    searchQuery?: string;
    vehicleId?: string;
    leasingCompany?: string;
    loanCategory?: string;
    status?: string;
  }): Promise<{
    leasings: Leasing[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasMore: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<{
      leasings: Leasing[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasMore: boolean;
      };
    }>(`/leasings/paginated?${queryParams.toString()}`);
  }

  // Get Single Leasing Detail
  async getLeasing(id: string): Promise<{ leasing: Leasing }> {
    return this.request<{ leasing: Leasing }>(`/leasings/${id}`);
  }

  // Bulk Protocol Status API - chýbajúca metóda
  async getBulkProtocolStatus(): Promise<{
    [rentalId: string]: {
      hasHandoverProtocol: boolean;
      hasReturnProtocol: boolean;
      handoverProtocolId?: string;
      returnProtocolId?: string;
    };
  }> {
    return this.request<{
      [rentalId: string]: {
        hasHandoverProtocol: boolean;
        hasReturnProtocol: boolean;
        handoverProtocolId?: string;
        returnProtocolId?: string;
      };
    }>('/protocols/bulk-status');
  }

  // All Protocols for Statistics API - chýbajúca metóda
  async getAllProtocolsForStats(): Promise<{
    handoverProtocols: HandoverProtocol[];
    returnProtocols: ReturnProtocol[];
  }> {
    return this.request<{
      handoverProtocols: HandoverProtocol[];
      returnProtocols: ReturnProtocol[];
    }>('/protocols/all-for-stats');
  }

  // Email Webhook API - Pending Rentals
  async getPendingAutomaticRentals(): Promise<Rental[]> {
    return this.request<Rental[]>('/email-webhook/pending');
  }

  async approveAutomaticRental(rentalId: string): Promise<void> {
    return this.request<void>(`/email-webhook/approve/${rentalId}`, {
      method: 'POST',
    });
  }

  async rejectAutomaticRental(rentalId: string, reason: string): Promise<void> {
    return this.request<void>(`/email-webhook/reject/${rentalId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Vehicle Unavailability methods
  async createVehicleUnavailability(unavailability: {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    type:
      | 'maintenance'
      | 'service'
      | 'repair'
      | 'blocked'
      | 'cleaning'
      | 'inspection'
      | 'private_rental';
    notes?: string;
    priority: 1 | 2 | 3;
    recurring?: boolean;
    recurringConfig?: {
      interval: 'days' | 'weeks' | 'months' | 'years';
      value: number;
    };
  }): Promise<void> {
    return this.request<void>('/vehicle-unavailability', {
      method: 'POST',
      body: JSON.stringify(unavailability),
    });
  }

  // IMAP Email methods
  async getImapStatus(): Promise<{
    running: boolean;
    enabled: boolean;
    timestamp: string;
    config: {
      host: string;
      user: string;
      enabled: boolean;
    };
  }> {
    return this.request<{
      running: boolean;
      enabled: boolean;
      timestamp: string;
      config: {
        host: string;
        user: string;
        enabled: boolean;
      };
    }>('/email-imap/status');
  }

  async testImapConnection(): Promise<{
    connected: boolean;
    timestamp: string;
    config: {
      host: string;
      port: string;
      user: string;
    };
  }> {
    return this.request<{
      connected: boolean;
      timestamp: string;
      config: {
        host: string;
        port: string;
        user: string;
      };
    }>('/email-imap/test');
  }

  async startImapMonitoring(): Promise<void> {
    return this.request<void>('/email-imap/start', {
      method: 'POST',
    });
  }

  async stopImapMonitoring(): Promise<void> {
    return this.request<void>('/email-imap/stop', {
      method: 'POST',
    });
  }

  async checkImapNow(): Promise<void> {
    return this.request<void>('/email-imap/check-now', {
      method: 'POST',
    });
  }

  // User Company Access method
  async getUserCompanyAccess(
    userId: string
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(
      `/users/${userId}/company-access`
    );
  }

  // Export methods
  async exportVehiclesCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/vehicles/export/csv`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  async exportCustomersCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/customers/export/csv`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // Import methods
  async batchImportVehicles(
    vehicles: Vehicle[]
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/vehicles/batch-import', {
      method: 'POST',
      body: JSON.stringify({ vehicles }),
    });
  }

  async importCustomersCSV(
    csvString: string
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/customers/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csvData: csvString }),
    });
  }

  // Paginated methods
  async getCompaniesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: Company[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    return this.request<{
      data: Company[];
      total: number;
      page: number;
      limit: number;
    }>(`/companies/paginated?${queryParams.toString()}`);
  }

  async getCustomersPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    return this.request<{
      data: Customer[];
      total: number;
      page: number;
      limit: number;
    }>(`/customers/paginated?${queryParams.toString()}`);
  }

  async getVehiclesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    data: Vehicle[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    return this.request<{
      data: Vehicle[];
      total: number;
      page: number;
      limit: number;
    }>(`/vehicles/paginated?${queryParams.toString()}`);
  }

  // Bulk Vehicle Ownership History method
  async getBulkVehicleOwnershipHistory(): Promise<{
    totalVehicles: number;
    loadTimeMs: number;
    vehicleHistories: Record<string, unknown>[];
  }> {
    return this.request<{
      totalVehicles: number;
      loadTimeMs: number;
      vehicleHistories: Record<string, unknown>[];
    }>('/vehicles/bulk-ownership-history');
  }

  // User Profile method
  async updateUserProfile(
    firstName: string,
    lastName: string
  ): Promise<{
    success: boolean;
    user: Record<string, unknown>;
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      user: Record<string, unknown>;
      message?: string;
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ firstName, lastName }),
    });
  }

  // Signature Template method
  async updateSignatureTemplate(dataUrl: string): Promise<{
    success: boolean;
    user: Record<string, unknown>;
    message?: string;
  }> {
    return this.request<{
      success: boolean;
      user: Record<string, unknown>;
      message?: string;
    }>('/auth/signature-template', {
      method: 'PUT',
      body: JSON.stringify({ signatureTemplate: dataUrl }),
    });
  }

  // Error Handler method
  setErrorHandler(_handler: (_error: Error) => void): void {
    // Store error handler for future use
    // This is a placeholder implementation
    logger.debug('Error handler set');
  }

  // ===== EMAIL MANAGEMENT API METHODS =====

  async getEmailManagement(filters?: {
    status?: string;
    sender?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<Record<string, unknown>[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.sender) queryParams.append('sender', filters.sender);
    if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset)
      queryParams.append('offset', filters.offset.toString());

    return this.request<Record<string, unknown>[]>(
      `/email-management?${queryParams.toString()}`
    );
  }

  async getEmailStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/email-management/stats');
  }

  async getEmail(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/email-management/${id}`);
  }

  async archiveEmail(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/email-management/${id}/archive`,
      {
        method: 'POST',
      }
    );
  }

  async rejectEmail(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/email-management/${id}/reject`,
      {
        method: 'POST',
      }
    );
  }

  async processEmail(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/email-management/${id}/process`,
      {
        method: 'POST',
      }
    );
  }

  async bulkArchiveEmails(ids: string[]): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      '/email-management/bulk-archive',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }
    );
  }

  async bulkRejectEmails(ids: string[]): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      '/email-management/bulk-reject',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }
    );
  }

  async bulkProcessEmails(ids: string[]): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      '/email-management/bulk-process',
      {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }
    );
  }

  async getArchivedEmails(filters?: {
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Record<string, unknown>> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    return this.request<Record<string, unknown>>(
      `/email-management/archived?${params.toString()}`
    );
  }

  // ===== USERS API METHODS =====

  async getUsers(filters?: {
    role?: string;
    companyId?: string;
    status?: string;
    search?: string;
  }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (filters?.role) queryParams.append('role', filters.role);
    if (filters?.companyId) queryParams.append('companyId', filters.companyId);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search);

    return this.request<User[]>(`/auth/users?${queryParams.toString()}`);
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/auth/users/${id}`);
  }

  async getUserStats(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/auth/users/stats');
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId?: string;
    permissions?: string[];
  }): Promise<User> {
    return this.request<User>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userData: {
    id: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    companyId?: string;
    permissions?: string[];
    isActive?: boolean;
  }): Promise<User> {
    return this.request<User>(`/auth/users/${userData.id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  }

  async changeUserPassword(passwordData: {
    id: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/auth/users/${passwordData.id}/change-password`,
      {
        method: 'POST',
        body: JSON.stringify(passwordData),
      }
    );
  }

  async deactivateUser(id: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/auth/users/${id}/deactivate`,
      {
        method: 'POST',
      }
    );
  }

  // ===== FILE UPLOAD API METHODS =====

  async uploadFile(uploadData: {
    file: File;
    protocolId?: string;
    protocolType?: string; // ✅ PRIDANÉ: Backend vyžaduje protocolType
    category?: string;
    mediaType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', uploadData.file);
    if (uploadData.protocolId)
      formData.append('protocolId', uploadData.protocolId);
    if (uploadData.protocolType)
      // ✅ PRIDANÉ: Backend vyžaduje protocolType
      formData.append('protocolType', uploadData.protocolType);
    if (uploadData.category) formData.append('category', uploadData.category);
    if (uploadData.mediaType)
      formData.append('mediaType', uploadData.mediaType);
    if (uploadData.metadata)
      formData.append('metadata', JSON.stringify(uploadData.metadata));

    const response = await fetch(`${API_BASE_URL}/files/protocol-photo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  async presignedUpload(uploadData: {
    file: File;
    protocolId: string;
    category: string;
    mediaType: string;
    metadata?: Record<string, unknown>;
  }): Promise<Record<string, unknown>> {
    const requestBody = {
      protocolId: uploadData.protocolId,
      category: uploadData.category,
      mediaType: uploadData.mediaType,
      filename: uploadData.file.name,
      contentType: uploadData.file.type,
      protocolType: (uploadData.metadata?.protocolType as string) || 'handover',
      metadata: uploadData.metadata,
    };

    const response = await fetch(`${API_BASE_URL}/files/presigned-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Presigned upload failed: ${response.status}`);
    }

    return response.json();
  }

  async getUploadProgress(uploadId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/files/upload-progress/${uploadId}`
    );
  }

  async deleteFile(fileId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async getFilesByProtocol(
    protocolId: string
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(
      `/files/protocol/${protocolId}`
    );
  }

  async getFilesByCategory(
    category: string
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(
      `/files/category/${category}`
    );
  }

  async bulkUploadFiles(
    files: Array<{
      file: File;
      protocolId?: string;
      category?: string;
      mediaType?: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<Record<string, unknown>[]> {
    const formData = new FormData();
    files.forEach((fileData, index) => {
      formData.append(`files[${index}]`, fileData.file);
      if (fileData.protocolId)
        formData.append(`protocolIds[${index}]`, fileData.protocolId);
      if (fileData.category)
        formData.append(`categories[${index}]`, fileData.category);
      if (fileData.mediaType)
        formData.append(`mediaTypes[${index}]`, fileData.mediaType);
      if (fileData.metadata)
        formData.append(
          `metadata[${index}]`,
          JSON.stringify(fileData.metadata)
        );
    });

    const response = await fetch(`${API_BASE_URL}/files/bulk-upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Bulk upload failed: ${response.status}`);
    }

    return response.json();
  }

  async bulkDeleteFiles(fileIds: string[]): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/files/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ fileIds }),
    });
  }

  async getFileMetadata(fileId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/files/${fileId}/metadata`);
  }

  async validateFile(file: File): Promise<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/files/validate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`File validation failed: ${response.status}`);
    }

    return response.json();
  }

  // ===== PROTOCOL PDF API METHODS =====

  async getProtocolPdf(
    protocolId: string,
    type: 'handover' | 'return'
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/protocols/${type}/${protocolId}`
    );
  }

  async getProtocolPdfUrl(
    protocolId: string,
    type: 'handover' | 'return'
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/protocols/${type}/${protocolId}/url`
    );
  }

  async generateProtocolPdf(data: {
    protocolId: string;
    type: 'handover' | 'return';
    options?: {
      includePhotos?: boolean;
      includeSignatures?: boolean;
      watermark?: string;
      language?: string;
    };
  }): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/protocols/${data.type}/${data.protocolId}/generate-pdf`,
      {
        method: 'POST',
        body: JSON.stringify(data.options || {}),
      }
    );
  }

  async getPdfGenerationStatus(
    protocolId: string,
    type: 'handover' | 'return'
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/protocols/${type}/${protocolId}/pdf/status`
    );
  }

  async downloadProtocolPdf(
    protocolId: string,
    type: 'handover' | 'return'
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/protocols/${type}/${protocolId}/download`
    );
  }

  async bulkGeneratePdfs(
    data: Array<{
      protocolId: string;
      type: 'handover' | 'return';
      options?: {
        includePhotos?: boolean;
        includeSignatures?: boolean;
        watermark?: string;
        language?: string;
      };
    }>
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(
      '/protocols/bulk-generate-pdf',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteProtocolPdf(
    protocolId: string,
    type: 'handover' | 'return'
  ): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/protocols/${type}/${protocolId}/pdf`,
      {
        method: 'DELETE',
      }
    );
  }

  async getProtocolPdfs(
    protocolId: string
  ): Promise<Record<string, unknown>[]> {
    return this.request<Record<string, unknown>[]>(
      `/protocols/${protocolId}/pdfs`
    );
  }
}

export const apiService = new ApiService();
