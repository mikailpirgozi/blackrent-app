import { Vehicle, Rental, Customer, Expense, Insurance, Company, Insurer, ApiResponse } from '../types';

// Automaticky detektuj správnu IP adresu
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    console.log('🌐 Používam API URL z .env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Ak je aplikácia spustená cez IP adresu, použij tú istú IP pre API
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const protocol = window.location.protocol; // http: alebo https:
    const apiUrl = `${protocol}//${hostname}/api`;
    console.log('🌐 Detekovaná IP adresa, používam API URL:', apiUrl);
    return apiUrl;
  }
  
  // Fallback na localhost
  console.log('🌐 Používam localhost API URL');
  return 'http://localhost:5001/api';
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
      
      // Ak je odpoveď 401 (Unauthorized), presmeruj na prihlásenie
      if (response.status === 401) {
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
}

export const apiService = new ApiService();