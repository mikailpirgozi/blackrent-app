import { Rental, Vehicle, Customer, PaymentMethod } from './index';

// ═══════════════════════════════════════════════════════════════════
// 🎯 FILTER TYPES
// ═══════════════════════════════════════════════════════════════════

export interface FilterState {
  // Základné filtre - arrays pre multi-select
  status: string[];
  paymentMethod: string[];
  company: string[];
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  protocolStatus: string[];

  // Rozšírené filtre
  customerName: string;
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  insuranceCompany: string;
  insuranceType: string;

  // Časové filtre
  timeFilter: string; // 'all', 'today', 'week', 'month', 'quarter', 'year', 'custom'

  // Cenové filtre
  priceRange: string; // 'all', 'low', 'medium', 'high', 'custom'

  // Stav platby
  paymentStatus: string; // 'all', 'paid', 'unpaid', 'partial'

  // Zobrazenie
  showOnlyActive: boolean;
  showOnlyOverdue: boolean;
  showOnlyCompleted: boolean;
}

export interface QuickFilterType {
  type:
    | 'overdue'
    | 'todayActivity'
    | 'tomorrowReturns'
    | 'weekActivity'
    | 'newToday'
    | 'active'
    | 'unpaid'
    | 'pending';
  label: string;
  count: number;
  color: 'error' | 'warning' | 'info' | 'success';
  urgent: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 COMPONENT PROPS TYPES
// ═══════════════════════════════════════════════════════════════════

export interface RentalFormProps {
  rental?: Rental | null;
  open: boolean;
  onClose: () => void;
  onSave?: (rental: Rental) => void;
  isLoading?: boolean;
}

export interface RentalFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  advancedFilters: FilterState;
  setAdvancedFilters: (filters: FilterState) => void;
  uniqueStatuses: string[];
  uniqueCompanies: string[];
  uniquePaymentMethods: string[];
  uniqueVehicleBrands: string[];
  uniqueInsuranceCompanies: string[];
  uniqueInsuranceTypes: string[];
  filteredRentalsCount: number;
  totalRentalsCount: number;
  onQuickFilter?: (filterType: string) => void;
  resetFilters: () => void;
  isMobile?: boolean;
  showFiltersMobile?: boolean;
  setShowFiltersMobile?: (value: boolean) => void;
}

export interface RentalTableProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  protocols: Record<string, { handover?: any; return?: any }>;
  protocolStatusMap: Record<
    string,
    {
      hasHandoverProtocol: boolean;
      hasReturnProtocol: boolean;
      handoverProtocolId?: string;
      returnProtocolId?: string;
    }
  >;
  isLoadingProtocolStatus: boolean;
  isMobile: boolean;
  getStatusIndicator: (rental: Rental) => {
    color: string;
    label: string;
    priority: number;
  };
  getVehicleByRental: (rental: Rental) => Vehicle | null;
  mobileCardRenderer: (rental: Rental, index: number) => React.ReactNode;
  handleEdit: (rental: Rental) => void;
  handleDelete: (id: string) => void;
  handleCreateHandover: (rental: Rental) => void;
  handleCreateReturn: (rental: Rental) => void;
  loadProtocolsForRental: (rentalId: string) => void;
  // Scroll refs
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  scrollHandlerRef: React.MutableRefObject<((event: any) => void) | null>;
  // Pagination
  hasMore: boolean;
  paginatedLoading: boolean;
  handleLoadMore: () => void;
}

export interface RentalActionsProps {
  isMobile: boolean;
  handleAdd: () => void;
}

export interface RentalExportProps {
  filteredRentals: Rental[];
  state: {
    customers: Customer[];
    companies: any[];
    vehicles: Vehicle[];
    rentals: Rental[];
  };
  isMobile: boolean;
  setImportError: (error: string) => void;
}

export interface RentalStatsProps {
  rentals: Rental[];
  protocols?: Record<string, { handover?: any; return?: any }>;
  isLoading?: boolean;
  onQuickFilter?: (filterType: string, value?: any) => void;
}

export interface RentalProtocolsProps {
  // Dialog states
  openDialog: boolean;
  openHandoverDialog: boolean;
  openReturnDialog: boolean;
  openProtocolMenu: boolean;
  openPDFViewer: boolean;
  openProtocolGallery: boolean;

  // Data
  editingRental: Rental | null;
  selectedRentalForProtocol: Rental | null;
  selectedProtocolType: 'handover' | 'return' | null;
  selectedPdf: {
    url: string;
    type: 'handover' | 'return';
    title: string;
  } | null;
  galleryImages: any[]; // Should be ProtocolImage[]
  galleryVideos: any[]; // Should be ProtocolVideo[]
  galleryTitle: string;

  // Handlers
  handleCloseDialog: () => void;
  handleCloseHandoverDialog: () => void;
  handleCloseReturnDialog: () => void;
  handleClosePDF: () => void;
  handleCloseGallery: () => void;
  handleCloseProtocolMenu: () => void;
  handleDownloadPDF: () => void;
  handleViewGallery: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 HOOK TYPES
// ═══════════════════════════════════════════════════════════════════

export interface UseRentalFiltersProps {
  rentals: Rental[];
  vehicles?: Vehicle[];
  protocols?: Record<string, { handover?: any; return?: any }>;
}

export interface UseRentalFiltersReturn {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedSearchQuery: string;

  // Filter state
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  advancedFilters: FilterState;
  setAdvancedFilters: (filters: FilterState) => void;

  // Filtered data
  filteredRentals: Rental[];

  // Filter options
  uniqueStatuses: string[];
  uniqueCompanies: string[];
  uniquePaymentMethods: string[];
  uniqueVehicleBrands: string[];
  uniqueInsuranceCompanies: string[];
  uniqueInsuranceTypes: string[];

  // Quick filter handlers
  handleQuickFilter: (filterType: string) => void;
  resetFilters: () => void;
}

export interface UseRentalActionsProps {
  onEdit?: (rental: Rental) => void;
  onDelete?: (id: string) => void;
  onScrollRestore?: () => void;
}

export interface UseRentalActionsReturn {
  // Dialog state
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  editingRental: Rental | null;
  setEditingRental: (rental: Rental | null) => void;

  // Import state
  importError: string;
  setImportError: (error: string) => void;

  // Action handlers
  handleAdd: () => void;
  handleEdit: (rental: Rental) => void;
  handleDelete: (id: string) => Promise<void>;
  handleCancel: () => void;
  handleViewRental: (rental: Rental) => void;

  // Scroll preservation
  savedScrollPosition: React.MutableRefObject<number>;
  restoreScrollPosition: () => void;
}

export interface UseRentalProtocolsProps {
  onProtocolUpdate?: (
    rentalId: string,
    protocolType: 'handover' | 'return',
    data: any
  ) => void;
}

export interface UseRentalProtocolsReturn {
  // Protocol state
  protocols: Record<string, { handover?: any; return?: any }>;
  setProtocols: (
    protocols: Record<string, { handover?: any; return?: any }>
  ) => void;
  loadingProtocols: string[];
  setLoadingProtocols: (loading: string[]) => void;

  // Protocol status state
  protocolStatusMap: Record<
    string,
    {
      hasHandoverProtocol: boolean;
      hasReturnProtocol: boolean;
      handoverProtocolId?: string;
      returnProtocolId?: string;
    }
  >;
  setProtocolStatusMap: (
    statusMap: Record<
      string,
      {
        hasHandoverProtocol: boolean;
        hasReturnProtocol: boolean;
        handoverProtocolId?: string;
        returnProtocolId?: string;
      }
    >
  ) => void;
  isLoadingProtocolStatus: boolean;
  setIsLoadingProtocolStatus: (loading: boolean) => void;
  protocolStatusLoaded: boolean;
  setProtocolStatusLoaded: (loaded: boolean) => void;

  // Dialog states
  openHandoverDialog: boolean;
  setOpenHandoverDialog: (open: boolean) => void;
  openReturnDialog: boolean;
  setOpenReturnDialog: (open: boolean) => void;
  selectedRentalForProtocol: Rental | null;
  setSelectedRentalForProtocol: (rental: Rental | null) => void;
  openProtocolMenu: boolean;
  setOpenProtocolMenu: (open: boolean) => void;
  selectedProtocolType: 'handover' | 'return' | null;
  setSelectedProtocolType: (type: 'handover' | 'return' | null) => void;

  // PDF viewer state
  pdfViewerOpen: boolean;
  setPdfViewerOpen: (open: boolean) => void;
  selectedPdf: {
    url: string;
    title: string;
    type: 'handover' | 'return';
  } | null;
  setSelectedPdf: (
    pdf: { url: string; title: string; type: 'handover' | 'return' } | null
  ) => void;

  // Gallery state
  galleryOpenRef: React.MutableRefObject<boolean>;
  galleryImages: any[];
  setGalleryImages: (images: any[]) => void;
  galleryVideos: any[];
  setGalleryVideos: (videos: any[]) => void;
  galleryTitle: string;
  setGalleryTitle: (title: string) => void;

  // Image parsing cache
  imageParsingCache: Map<
    string,
    { images: any[]; videos: any[]; timestamp: number }
  >;

  // Protocol handlers
  loadProtocolsForRental: (rentalId: string) => Promise<void>;
  handleCreateHandover: (rental: Rental) => Promise<void>;
  handleCreateReturn: (rental: Rental) => Promise<void>;
  handleCloseHandoverDialog: () => void;
  handleCloseReturnDialog: () => void;
  handleClosePDF: () => void;
  handleCloseGallery: () => void;
  handleCloseProtocolMenu: () => void;
  handleDownloadPDF: () => void;
  handleViewGallery: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════

export interface StatusIndicator {
  color: string;
  label: string;
  priority: number;
}

export interface DashboardStats {
  total: number;
  active: number;
  todayActivity: number;
  tomorrowReturns: number;
  weekActivity: number;
  overdue: number;
  newToday: number;
  unpaid: number;
  pending: number;
  withHandover: number;
  withReturn: number;
  totalRevenue: number;
  avgDailyRevenue: number;
}

export interface ProtocolImage {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  timestamp: Date;
}

export interface ProtocolVideo {
  id: string;
  url: string;
  thumbnail?: string;
  caption?: string;
  duration?: number;
  timestamp: Date;
}

export interface ParsedEmailData {
  orderNumber?: string;
  orderDate?: string;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  pickupPlace?: string;
  returnPlace?: string;
  reservationTime?: string;
  deposit?: number;
  vehicleName?: string;
  vehicleCode?: string;
  vehiclePrice?: number;
  vehicleTotalAmount?: number;
  dailyKilometers?: number;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 VIEW TYPES
// ═══════════════════════════════════════════════════════════════════

export type ViewMode = 'cards' | 'list' | 'table';
export type SortBy =
  | 'priority'
  | 'startDate'
  | 'endDate'
  | 'totalPrice'
  | 'customerName';
export type SortDirection = 'asc' | 'desc';

export interface ViewSettings {
  mode: ViewMode;
  sortBy: SortBy;
  sortDirection: SortDirection;
  itemsPerPage: number;
  showCompactView: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 PAGINATION TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
}

export interface InfiniteScrollState {
  items: Rental[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 FORM TYPES
// ═══════════════════════════════════════════════════════════════════

export interface RentalFormData extends Partial<Rental> {
  vehicleId: string;
  customerId: string;
  customerName: string;
  startDate: Date;
  endDate: Date;
  paymentMethod: PaymentMethod;
  orderNumber?: string;
  isFlexible?: boolean;
  flexibleEndDate?: Date;
  isPrivateRental?: boolean;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 API TYPES
// ═══════════════════════════════════════════════════════════════════

export interface BatchImportResult {
  processed: number;
  total: number;
  successRate: number;
  results: Rental[];
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

export interface ProtocolsResponse {
  handoverProtocols: any[];
  returnProtocols: any[];
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export const ITEMS_PER_PAGE = 50;
export const SCROLL_THRESHOLD = 0.75;
export const DEBOUNCE_DELAY = 150;
export const THROTTLE_DELAY = 100;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Hotovosť',
  bank_transfer: 'Bankový prevod',
  vrp: 'VRP',
  direct_to_owner: 'Priamo majiteľovi',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Čakajúci',
  active: 'Aktívny',
  finished: 'Dokončený',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9800',
  active: '#4caf50',
  finished: '#2196f3',
};
