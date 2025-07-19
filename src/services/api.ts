import { Vehicle, Rental, Customer, Expense, Insurance, Company, Insurer, ApiResponse, Settlement } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Railway backend URL
const RAILWAY_API_URL = 'https://blackrent-app-production-4d6f.up.railway.app/api';

const getApiBaseUrl = () => {
  // Ak je nastavená custom API URL v environment
  if (process.env.REACT_APP_API_URL) {
    console.log('🌐 Používam API URL z .env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Pre Railway deployment (celá aplikácia na Railway)
  if (window.location.hostname.includes('railway.app')) {
    const apiUrl = `${window.location.origin}/api`;
    console.log('🌐 Railway detekované, používam relatívnu API URL:', apiUrl);
    return apiUrl;
  }
  
  // Pre GitHub Pages používaj Railway API
  if (window.location.hostname === 'mikailpirgozi.github.io') {
    console.log('🌐 GitHub Pages detekované, používam Railway API:', RAILWAY_API_URL);
    return RAILWAY_API_URL;
  }
  
  // Pre lokálny development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🌐 Localhost detekované, používam lokálny backend');
    return 'http://localhost:5001/api';
  }
  
  // Fallback na Railway API
  console.log('🌐 Používam Railway API ako fallback:', RAILWAY_API_URL);
  return RAILWAY_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        console.warn('🚨 Auth error:', response.status, 'Clearing storage and redirecting to login');
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
  async login(username: string, password: string): Promise<{ user: any; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data: ApiResponse<any> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Chyba pri prihlásení');
    }

    // Vráť len token a používateľa bez ukladania - o storage sa postará AuthContext
    if (data.success && (data as any).token) {
      return { user: (data as any).user, token: (data as any).token };
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
            'Authorization': `Bearer ${token}`,
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

  async updateSettlement(id: string, settlement: Partial<Settlement>): Promise<void> {
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
        console.warn('🚨 Auth error:', response.status, 'Clearing storage and redirecting to login');
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
    };
    
    console.log('🔄 API createHandoverProtocol - complete data:', JSON.stringify(completeProtocolData, null, 2));
    
    return this.request<any>('/protocols/handover', {
      method: 'POST',
      body: JSON.stringify(completeProtocolData),
    });
  }

  async createReturnProtocol(protocolData: any): Promise<any> {
    return this.request<any>('/protocols/return', {
      method: 'POST',
      body: JSON.stringify(protocolData),
    });
  }
}

export const apiService = new ApiService();