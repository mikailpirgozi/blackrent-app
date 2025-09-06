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

// Railway backend URL
const RAILWAY_API_URL =
  'https://blackrent-app-production-4d6f.up.railway.app/api';

const getApiBaseUrl = () => {
  // Ak je nastavená custom API URL v environment
  if (import.meta.env.VITE_API_URL) {
    console.log('🌐 Používam API URL z .env:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  // Pre Railway deployment (celá aplikácia na Railway)
  if (window.location.hostname.includes('railway.app')) {
    const apiUrl = `${window.location.origin}/api`;
    console.log('🌐 Railway detekované, používam relatívnu API URL:', apiUrl);
    return apiUrl;
  }

  // Pre GitHub Pages používaj Railway API
  if (window.location.hostname === 'mikailpirgozi.github.io') {
    console.log(
      '🌐 GitHub Pages detekované, používam Railway API:',
      RAILWAY_API_URL
    );
    return RAILWAY_API_URL;
  }

  // Pre lokálny development - používaj Vite proxy
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    console.log('🌐 Localhost detekované, používam Vite proxy');
    return '/api';
  }

  // Fallback na Railway API
  console.log('🌐 Používam Railway API ako fallback:', RAILWAY_API_URL);
  return RAILWAY_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
export const getAPI_BASE_URL = getApiBaseUrl;
console.log('🔗 API_BASE_URL nastavené na:', API_BASE_URL);

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
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Ak je odpoveď 401 (Unauthorized) alebo 403 (Forbidden), presmeruj na prihlásenie
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

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API chyba');
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

  // Vozidlá
  async getVehicles(): Promise<Vehicle[]> {
    return this.request<Vehicle[]>('/vehicles');
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`);
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
      console.log('🔍 Raw API response for protocols:', data);

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
    console.log(
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

    console.log(
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
    console.log(
      '🔄 API createReturnProtocol - input:',
      JSON.stringify(protocolData, null, 2)
    );

    // Ensure all required fields are present
    const completeProtocolData = {
      ...protocolData,
      pdfUrl: protocolData.pdfUrl, // ✅ Pridané: PDF URL z R2
      emailSent: protocolData.emailSent || false, // ✅ Pridané: email status
    };

    console.log(
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
    }>('/bulk-data');
  }

  // Vehicle Documents API - chýbajúca metóda
  async getVehicleDocuments(vehicleId?: string): Promise<VehicleDocument[]> {
    const endpoint = vehicleId
      ? `/vehicles/${vehicleId}/documents`
      : '/vehicle-documents';
    return this.request<VehicleDocument[]>(endpoint);
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

  // Bulk Protocol Status API - chýbajúca metóda
  async getBulkProtocolStatus(rentalIds: string[]): Promise<{
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
    }>('/protocols/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ rentalIds }),
    });
  }
}

export const apiService = new ApiService();
