import { Vehicle, Rental, Customer, Expense, Insurance, Company, Insurer, Settlement, VehicleDocument, InsuranceClaim } from '../types';

const getApiBaseUrl = () => {
  // V produkcii používame Railway URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://blackrent-app-production-4d6f.up.railway.app/api';
  }
  
  // V developmente používame localhost port 5001
  return process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
};

export const API_BASE_URL = getApiBaseUrl();



class ApiService {
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

    // Retry logic for temporary backend issues
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (response.status === 401 || response.status === 403) {
          console.warn('🚨 Auth error:', response.status, 'Token validation failed');
          console.warn('🔍 Token debug:', {
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
            url: url,
            attempt: attempt
          });
          
          // TEMPORARY FIX: Don't redirect, just throw error
          // This prevents the auto-logout loop
          console.warn('⚠️ TEMPORARY: Not redirecting to login, just throwing error');
          
          if (attempt === maxRetries) {
            throw new Error(`Auth failed: ${response.status} - Token validation error`);
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        if (!response.ok) {
          throw new Error(`API chyba: ${response.status}`);
        }

        const data = await response.json();
        
        // Ak je to API response objekt s success/data, vráť len data
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data.data;
        }
        
        return data;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ API attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('❌ API chyba:', error);
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw lastError;
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

  // Vozidlá
  async getVehicles(): Promise<Vehicle[]> {
    return this.request<Vehicle[]>('/vehicles');
  }

  async getVehicle(id: string): Promise<Vehicle> {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }

  // ⚡ BULK DATA ENDPOINT - Načíta všetky dáta jedným requestom
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
    return response;
  }

  // ⚡ BULK PROTOCOL STATUS - Získa protocol status pre všetky rentals naraz
  async getBulkProtocolStatus(): Promise<{
    rentalId: string;
    hasHandoverProtocol: boolean;
    hasReturnProtocol: boolean;
    handoverProtocolId?: string;
    returnProtocolId?: string;
    handoverCreatedAt?: Date;
    returnCreatedAt?: Date;
  }[]> {
    const response = await this.request<{
      success: boolean;
      data: {
        rentalId: string;
        hasHandoverProtocol: boolean;
        hasReturnProtocol: boolean;
        handoverProtocolId?: string;
        returnProtocolId?: string;
        handoverCreatedAt?: string;
        returnCreatedAt?: string;
      }[];
      metadata: {
        loadTimeMs: number;
        totalRentals: number;
        timestamp: string;
      };
    }>('/protocols/bulk-status');
    
    // Convert date strings back to Date objects
    return response.data.map(item => ({
      ...item,
      handoverCreatedAt: item.handoverCreatedAt ? new Date(item.handoverCreatedAt) : undefined,
      returnCreatedAt: item.returnCreatedAt ? new Date(item.returnCreatedAt) : undefined
    }));
  }

  // ⚡ BULK: História vlastníctva všetkých vozidiel naraz
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
    const response = await this.request<{
      vehicleHistories: any[];
      totalVehicles: number;
      loadTimeMs: number;
    }>('/vehicles/bulk-ownership-history');
    return response;
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
    return this.request<void>(`/vehicles/${id}`, { method: 'DELETE' });
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
    return this.request<void>(`/customers/${id}`, { method: 'DELETE' });
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
    
    return this.request<any>('/protocols/handover', {
      method: 'POST',
      body: JSON.stringify(completeProtocolData),
    });
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
    
    return this.request<any>('/protocols/return', {
      method: 'POST',
      body: JSON.stringify(completeProtocolData),
    });
  }

  async deleteProtocol(protocolId: string, type: 'handover' | 'return'): Promise<void> {
    console.log(`🗑️ API deleteProtocol - deleting ${type} protocol:`, protocolId);
    
    return this.request<void>(`/protocols/${type}/${protocolId}`, {
      method: 'DELETE',
    });
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
}

export const apiService = new ApiService();
