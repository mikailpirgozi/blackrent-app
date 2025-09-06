import type { Vehicle, VehicleCategory } from './index';
// import { VehicleStatus } from './index'; // Unused import

// 🆕 OWNER CARD COMPONENT - Rozbaliteľná karta majiteľa s vozidlami
export interface OwnerCardProps {
  company: Record<string, unknown>; // Company type
  vehicles: Vehicle[];
  onVehicleUpdate: (vehicleId: string, companyId: string) => Promise<void>;
  onVehicleEdit: (vehicle: Vehicle) => void;
}

// 🤝 INVESTOR CARD COMPONENT - Rozbaliteľná karta spoluinvestora s podielmi
export interface InvestorCardProps {
  investor: Record<string, unknown>; // CompanyInvestor type
  shares: Record<string, unknown>[]; // CompanyInvestorShare[]
  companies: Record<string, unknown>[]; // Company[]
  onShareUpdate: () => void;
  onAssignShare: (investor: Record<string, unknown>) => void;
}

// 📊 VEHICLE FILTERS STATE
export interface VehicleFiltersState {
  searchQuery: string;
  filterBrand: string;
  filterModel: string;
  filterCompany: string;
  filterStatus: string;
  filterCategory: VehicleCategory | 'all';
  showAvailable: boolean;
  showRented: boolean;
  showMaintenance: boolean;
  showOther: boolean;
  showPrivate: boolean;
  showRemoved: boolean;
  showTempRemoved: boolean;
}

// 🎯 VEHICLE ACTIONS STATE
export interface VehicleActionsState {
  selectedVehicles: Set<string>;
  isSelectAllChecked: boolean;
  showBulkActions: boolean;
  editingVehicle: Vehicle | null;
  openDialog: boolean;
  loading: boolean;
}

// 🚀 INFINITE SCROLL STATE
export interface InfiniteScrollState {
  displayedVehicles: number;
  isLoadingMore: boolean;
}

// 🏢 COMPANY CREATION STATE
export interface CompanyCreationState {
  createCompanyDialogOpen: boolean;
  newCompanyData: {
    name: string;
    ownerName: string;
    personalIban: string;
    businessIban: string;
    contactEmail: string;
    contactPhone: string;
    defaultCommissionRate: number;
    isActive: boolean;
  };
}

// 🤝 INVESTOR MANAGEMENT STATE
export interface InvestorManagementState {
  createInvestorDialogOpen: boolean;
  investors: Record<string, unknown>[];
  investorShares: Record<string, unknown>[];
  loadingInvestors: boolean;
  assignShareDialogOpen: boolean;
  selectedInvestorForShare: Record<string, unknown> | null;
  newShareData: {
    companyId: string;
    ownershipPercentage: number;
    investmentAmount: number;
    isPrimaryContact: boolean;
  };
  newInvestorData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
  };
}

// 📋 OWNERSHIP HISTORY STATE
export interface OwnershipHistoryState {
  ownershipHistoryDialog: boolean;
  selectedVehicleHistory: Vehicle | null;
  ownershipHistory: Record<string, unknown>[];
}

// 🎯 TAB STATE
export interface TabState {
  currentTab: number;
}

// 🔍 SCROLL PRESERVATION STATE
export interface ScrollPreservationState {
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  savedScrollPosition: React.MutableRefObject<number>;
  infiniteScrollPosition: React.MutableRefObject<number>;
  isLoadingMoreRef: React.MutableRefObject<boolean>;
}

// 📊 COMBINED VEHICLE LIST STATE
export interface VehicleListState
  extends VehicleFiltersState,
    VehicleActionsState,
    InfiniteScrollState,
    CompanyCreationState,
    InvestorManagementState,
    OwnershipHistoryState,
    TabState,
    ScrollPreservationState {}
