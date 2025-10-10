// Query Keys štruktúra pre BlackRent aplikáciu
export const queryKeys = {
  // Vehicles
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.vehicles.lists(), filters] as const,
    details: () => [...queryKeys.vehicles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vehicles.details(), id] as const,
    availability: (id: string, dateRange?: Record<string, unknown>) =>
      ['vehicles', 'availability', id, dateRange] as const,
  },

  // Rentals
  rentals: {
    all: ['rentals'] as const,
    lists: () => [...queryKeys.rentals.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.rentals.lists(), filters] as const,
    details: () => [...queryKeys.rentals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.rentals.details(), id] as const,
    byVehicle: (vehicleId: string) =>
      ['rentals', 'byVehicle', vehicleId] as const,
    byCustomer: (customerId: string) =>
      ['rentals', 'byCustomer', customerId] as const,
  },

  // Protocols
  protocols: {
    all: ['protocols'] as const,
    lists: () => [...queryKeys.protocols.all, 'list'] as const,
    list: () => [...queryKeys.protocols.lists()] as const,
    details: () => [...queryKeys.protocols.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.protocols.details(), id] as const,
    handover: (rentalId: string) =>
      ['protocols', 'handover', rentalId] as const,
    return: (rentalId: string) => ['protocols', 'return', rentalId] as const,
    byRental: (rentalId: string) =>
      ['protocols', 'byRental', rentalId] as const,
    bulkStatus: () => ['protocols', 'bulk-status'] as const,
    allForStats: ['protocols', 'all-for-stats'] as const,
  },

  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.customers.lists(), filters] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },

  // Expenses
  expenses: {
    all: ['expenses'] as const,
    byVehicle: (vehicleId: string) =>
      ['expenses', 'byVehicle', vehicleId] as const,
    byCategory: (category: string) =>
      ['expenses', 'byCategory', category] as const,
    recurring: () => ['expenses', 'recurring'] as const,
  },

  // Statistics
  statistics: {
    all: ['statistics'] as const,
    dashboard: () => ['statistics', 'dashboard'] as const,
    revenue: (period: string) => ['statistics', 'revenue', period] as const,
    expenses: (period: string) => ['statistics', 'expenses', period] as const,
  },

  // Availability
  availability: {
    all: ['availability'] as const,
    calendar: (startDate: string, endDate: string) =>
      ['availability', 'calendar', startDate, endDate] as const,
  },

  // Companies & Settings
  companies: {
    all: ['companies'] as const,
    list: () => [...queryKeys.companies.all, 'list'] as const,
  },

  insurers: {
    all: ['insurers'] as const,
    lists: () => [...queryKeys.insurers.all, 'list'] as const,
    list: () => [...queryKeys.insurers.lists()] as const,
  },

  settlements: {
    all: ['settlements'] as const,
    list: () => [...queryKeys.settlements.all, 'list'] as const,
    detail: (id: string) => ['settlements', 'detail', id] as const,
  },

  // Insurances
  insurances: {
    all: ['insurances'] as const,
    lists: () => [...queryKeys.insurances.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.insurances.lists(), filters] as const,
    details: () => [...queryKeys.insurances.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.insurances.details(), id] as const,
    byVehicle: (vehicleId: string) =>
      ['insurances', 'byVehicle', vehicleId] as const,
    paginated: (params?: Record<string, unknown>) =>
      ['insurances', 'paginated', params] as const,
  },

  // Insurance Claims
  insuranceClaims: {
    all: ['insuranceClaims'] as const,
    lists: () => [...queryKeys.insuranceClaims.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.insuranceClaims.lists(), filters] as const,
    details: () => [...queryKeys.insuranceClaims.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.insuranceClaims.details(), id] as const,
    byVehicle: (vehicleId: string) =>
      ['insuranceClaims', 'byVehicle', vehicleId] as const,
  },

  // BULK API - AppContext cache
  bulk: {
    all: ['bulk'] as const,
    data: () => [...queryKeys.bulk.all, 'data'] as const,
  },

  // Email Management
  emailManagement: {
    all: ['emailManagement'] as const,
    lists: () => [...queryKeys.emailManagement.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.emailManagement.lists(), filters] as const,
    details: () => [...queryKeys.emailManagement.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.emailManagement.details(), id] as const,
    stats: () => ['emailManagement', 'stats'] as const,
    archived: (filters?: Record<string, unknown>) =>
      ['emailManagement', 'archived', filters] as const,
    imapStatus: () => ['emailManagement', 'imapStatus'] as const,
    pendingRentals: () => ['emailManagement', 'pendingRentals'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    byCompany: (companyId: string) =>
      ['users', 'byCompany', companyId] as const,
    stats: () => ['users', 'stats'] as const,
  },

  // File Upload
  fileUpload: {
    all: ['fileUpload'] as const,
    lists: () => [...queryKeys.fileUpload.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.fileUpload.lists(), filters] as const,
    details: () => [...queryKeys.fileUpload.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.fileUpload.details(), id] as const,
    byProtocol: (protocolId: string) =>
      ['fileUpload', 'byProtocol', protocolId] as const,
    byCategory: (category: string) =>
      ['fileUpload', 'byCategory', category] as const,
    progress: (uploadId: string) =>
      ['fileUpload', 'progress', uploadId] as const,
  },

  // Protocol PDF
  protocolPdf: {
    all: ['protocolPdf'] as const,
    details: () => [...queryKeys.protocolPdf.all, 'detail'] as const,
    detail: (protocolId: string, type: string) =>
      [...queryKeys.protocolPdf.details(), protocolId, type] as const,
    urls: () => [...queryKeys.protocolPdf.all, 'url'] as const,
    url: (protocolId: string, type: string) =>
      [...queryKeys.protocolPdf.urls(), protocolId, type] as const,
    statuses: () => [...queryKeys.protocolPdf.all, 'status'] as const,
    status: (protocolId: string, type: string) =>
      [...queryKeys.protocolPdf.statuses(), protocolId, type] as const,
    byProtocol: (protocolId: string) =>
      ['protocolPdf', 'byProtocol', protocolId] as const,
  },
} as const;
