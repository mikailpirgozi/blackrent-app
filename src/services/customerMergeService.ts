import { apiService } from './api';

export interface CustomerStats {
  rentalCount: number;
  firstRental: Date | null;
  lastRental: Date | null;
  totalRevenue: number;
}

export interface CustomerWithStats {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  stats: CustomerStats;
}

export interface DuplicateGroup {
  group: CustomerWithStats[];
  similarity: 'name' | 'email' | 'phone';
  score: number;
}

export interface MergeResult {
  mergedCustomerId: string;
  mergedRentals: number;
  finalStats: CustomerStats;
}

export interface MergeRequest {
  targetCustomerId: string;
  sourceCustomerId: string;
  mergedData: {
    name: string;
    email: string;
    phone: string;
  };
}

class CustomerMergeService {
  /**
   * Získa zoznam duplicitných zákazníkov
   */
  async findDuplicateCustomers(): Promise<DuplicateGroup[]> {
    const response = await apiService.get<{ success: boolean; data: DuplicateGroup[] }>('/customer-merge/duplicates');
    return response.data;
  }

  /**
   * Zjednotí dvoch zákazníkov
   */
  async mergeCustomers(mergeRequest: MergeRequest): Promise<MergeResult> {
    const response = await apiService.post<{ success: boolean; data: MergeResult }>('/customer-merge/merge', mergeRequest);
    return response.data;
  }

  /**
   * Získa štatistiky zákazníka
   */
  async getCustomerStats(customerId: string): Promise<CustomerStats> {
    const response = await apiService.get<{ success: boolean; data: CustomerStats }>(`/customer-merge/stats/${customerId}`);
    return response.data;
  }

  /**
   * Navrhne najlepšie údaje pre merge (kombinuje najkompletnejšie informácie)
   */
  suggestMergedData(customer1: CustomerWithStats, customer2: CustomerWithStats): {
    name: string;
    email: string;
    phone: string;
    primaryCustomer: CustomerWithStats;
    secondaryCustomer: CustomerWithStats;
  } {
    // Určí primárneho zákazníka (s viac prenájmami alebo novší)
    const primaryCustomer = customer1.stats.rentalCount >= customer2.stats.rentalCount ? customer1 : customer2;
    const secondaryCustomer = primaryCustomer === customer1 ? customer2 : customer1;

    // Vyberie najlepšie údaje
    const name = this.chooseBestValue(customer1.name, customer2.name, (a, b) => a.length > b.length);
    const email = this.chooseBestValue(customer1.email, customer2.email, (a, b) => a.includes('@'));
    const phone = this.chooseBestValue(customer1.phone, customer2.phone, (a, b) => a.length > b.length);

    return {
      name,
      email,
      phone,
      primaryCustomer,
      secondaryCustomer
    };
  }

  /**
   * Pomocná metóda na výber najlepšej hodnoty
   */
  private chooseBestValue(value1: string, value2: string, preferValue1: (a: string, b: string) => boolean): string {
    if (!value1 && !value2) return '';
    if (!value1) return value2;
    if (!value2) return value1;
    
    return preferValue1(value1, value2) ? value1 : value2;
  }

  /**
   * Získa popis podobnosti pre UI
   */
  getSimilarityDescription(similarity: 'name' | 'email' | 'phone', score: number): string {
    switch (similarity) {
      case 'name':
        if (score >= 0.9) return 'Veľmi podobné mená';
        if (score >= 0.7) return 'Podobné mená';
        return 'Čiastočne podobné mená';
      case 'email':
        return 'Rovnaký email';
      case 'phone':
        return 'Rovnaký telefón';
      default:
        return 'Neznáma podobnosť';
    }
  }

  /**
   * Získa farbu pre UI na základe skóre podobnosti
   */
  getSimilarityColor(similarity: 'name' | 'email' | 'phone', score: number): 'success' | 'warning' | 'error' {
    if (similarity === 'email' || similarity === 'phone') return 'error'; // Presná zhoda
    if (score >= 0.8) return 'error'; // Vysoká podobnosť
    if (score >= 0.6) return 'warning'; // Stredná podobnosť
    return 'success'; // Nízka podobnosť
  }
}

export const customerMergeService = new CustomerMergeService();
