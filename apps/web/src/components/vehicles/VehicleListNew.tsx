import { Trash2 as DeleteIcon, AlertCircle as ErrorIcon } from 'lucide-react';
import { UnifiedButton as Button } from '@/components/ui/UnifiedButton';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedTypography } from '@/components/ui/UnifiedTypography';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BankAccountManager } from '@/components/bank-accounts/BankAccountManager';

import { useCompanies } from '@/lib/react-query/hooks/useCompanies';
import {
  useInvestors,
  useAllShares,
  useCreateInvestor,
  useCreateShare,
} from '@/lib/react-query/hooks/useInvestors';
import {
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
  type VehicleFilters,
} from '@/lib/react-query/hooks/useVehicles';
import type { Vehicle, VehicleCategory, VehicleStatus } from '../../types';
import VehicleFiltersComponent from './components/VehicleFilters';

// 📝 INTERFACES: Proper TypeScript types
// interface OwnershipHistoryItem {
//   id: string;
//   vehicleId: string;
//   previousOwnerId?: string;
//   newOwnerId: string;
//   transferDate: string;
//   transferReason?: string;
//   notes?: string;
// } // Unused - ownership history disabled

interface InvestorData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

// interface ShareData {
//   companyId: string;
//   ownershipPercentage: number;
//   investmentAmount: number;
//   isPrimaryContact: boolean;
// } // Unused interface
import { getApiBaseUrl } from '../../utils/apiUrl';
import { EnhancedLoading } from '../common/EnhancedLoading';

import InvestorCard from './components/InvestorCard';
import OwnerCard from './components/OwnerCard';
import VehicleActions from './components/VehicleActions';
import QuickFilters from './components/QuickFilters';
import VehicleDialogs from './components/VehicleDialogs';
import VehicleImportExport from './components/VehicleImportExport';
import VehicleKmHistory from './components/VehicleKmHistory';
import VehicleTable from './components/VehicleTable';
import { logger } from '@/utils/smartLogger';

export default function VehicleListNew() {
  // React Query hooks
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();

  // ⚡ OPTIMIZED: Use React Query for investors (cached, parallel)
  const { data: investors = [], isLoading: loadingInvestors } = useInvestors();
  const companyIds = useMemo(
    () => companies.map(c => String(c.id)),
    [companies]
  );
  const { data: investorShares = [] } = useAllShares(companyIds);

  const createInvestorMutation = useCreateInvestor();
  const createShareMutation = useCreateShare();

  // 🎯 SCROLL PRESERVATION: Refs pre scroll kontajnery
  const mobileScrollRef = React.useRef<HTMLDivElement>(null);
  const desktopScrollRef = React.useRef<HTMLDivElement>(null);
  const savedScrollPosition = React.useRef<number>(0);

  // 🎯 INFINITE SCROLL PRESERVATION: Pre načítanie ďalších vozidiel
  const infiniteScrollPosition = React.useRef<number>(0);
  const isLoadingMoreRef = React.useRef<boolean>(false);

  const [isMobile, setIsMobile] = useState(false);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🔍 DEBUG: Základné informácie o komponente (len raz)
  React.useEffect(() => {
    logger.debug('🚀 VehicleListNew MOUNTED:', {
      isMobile,
      screenWidth:
        typeof window !== 'undefined' ? window.innerWidth : 'unknown',
    });
  }, [isMobile]); // Spustí sa len raz pri mount

  // States
  const [currentTab, setCurrentTab] = useState(0); // 🆕 Tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🚀 INFINITE SCROLL STATES
  const [displayedVehicles, setDisplayedVehicles] = useState(20); // Start with 20 items
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ✅ NOVÉ: State pre hromadné mazanie
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(
    new Set()
  );
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filters
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState<VehicleCategory | 'all'>(
    'all'
  ); // 🚗 Category filter
  const [showAvailable, setShowAvailable] = useState(true);
  const [showRented, setShowRented] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showStolen, setShowStolen] = useState(false); // 🚨 Ukradnuté vozidlá defaultne skryté
  const [showPrivate, setShowPrivate] = useState(false); // 🏠 Súkromné vozidlá defaultne skryté
  const [showRemoved, setShowRemoved] = useState(false); // 🗑️ Vyradené vozidlá defaultne skryté
  const [showTempRemoved, setShowTempRemoved] = useState(false); // ⏸️ Dočasne vyradené vozidlá defaultne skryté

  // React Query hooks pre vehicles
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();

  // Pripravíme filters pre React Query
  const vehicleFilters: VehicleFilters = useMemo(() => {
    const filters: VehicleFilters = {};

    if (filterStatus !== 'all') {
      filters.status = filterStatus;
    }

    if (filterCompany !== 'all') {
      filters.company = filterCompany;
    }

    if (filterCategory !== 'all') {
      filters.category = filterCategory;
    }

    if (filterBrand !== 'all' || filterModel !== 'all') {
      const brandPart = filterBrand !== 'all' ? filterBrand : '';
      const modelPart = filterModel !== 'all' ? filterModel : '';
      filters.search = `${brandPart} ${modelPart}`.trim();
    }

    // ✅ CRITICAL FIX: Include removed/private vehicles based on checkboxes
    filters.includeRemoved = showRemoved || showTempRemoved;
    filters.includePrivate = showPrivate;

    return filters;
  }, [
    filterStatus,
    filterCompany,
    filterCategory,
    filterBrand,
    filterModel,
    showRemoved,
    showTempRemoved,
    showPrivate,
  ]);

  // Používame React Query pre načítanie vozidiel
  const {
    data: vehicles = [],
    isLoading: vehiclesLoading,
    dataUpdatedAt,
  } = useVehicles(vehicleFilters);

  // 🔍 DEBUG: Log when vehicles change
  useEffect(() => {
    logger.debug('🔄 Vehicles updated:', {
      count: vehicles?.length,
      dataUpdatedAt: new Date(dataUpdatedAt),
      timestamp: Date.now(),
      data: vehicles,
    });
  }, [vehicles, dataUpdatedAt]);

  // Kombinovaný loading state
  const isLoading = vehiclesLoading || companiesLoading || loading;
  // const [ownershipHistoryDialog, setOwnershipHistoryDialog] = useState(false); // Unused - ownership history disabled
  // const [selectedVehicleHistory, setSelectedVehicleHistory] =
  //   useState<Vehicle | null>(null); // Unused - ownership history disabled
  // const [ownershipHistory, setOwnershipHistory] = useState<
  //   OwnershipHistoryItem[]
  // >([]);  // Unused - ownership history disabled

  // 🚗 História kilometrov
  const [kmHistoryDialog, setKmHistoryDialog] = useState(false);
  const [selectedVehicleKmHistory, setSelectedVehicleKmHistory] =
    useState<Vehicle | null>(null);

  // ❌ Error dialog pre duplicitné vozidlá
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('');

  // 🆕 State pre vytvorenie novej firmy
  const [createCompanyDialogOpen, setCreateCompanyDialogOpen] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    ownerName: '',
    personalIban: '',
    businessIban: '',
    contactEmail: '',
    contactPhone: '',
    defaultCommissionRate: 20,
    isActive: true,
  });

  // 🤝 State pre spoluinvestorov (UI state only - data comes from React Query)
  const [createInvestorDialogOpen, setCreateInvestorDialogOpen] =
    useState(false);
  // ❌ REMOVED: const [investors, setInvestors] - now from useInvestors()
  // ❌ REMOVED: const [investorShares, setInvestorShares] - now from useAllShares()
  // ❌ REMOVED: const [loadingInvestors, setLoadingInvestors] - now from useInvestors().isLoading
  const [assignShareDialogOpen, setAssignShareDialogOpen] = useState(false);
  const [selectedInvestorForShare, setSelectedInvestorForShare] =
    useState<InvestorData | null>(null);
  const [newShareData, setNewShareData] = useState({
    companyId: '',
    ownershipPercentage: 0,
    investmentAmount: 0,
    isPrimaryContact: false,
  });
  const [newInvestorData, setNewInvestorData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    isActive: true,
  });

  // Handlers
  // 🎯 SCROLL PRESERVATION: Funkcia na obnovenie scroll pozície
  const restoreScrollPosition = React.useCallback(() => {
    window.setTimeout(() => {
      const scrollContainer = isMobile
        ? mobileScrollRef.current
        : desktopScrollRef.current;
      if (scrollContainer && savedScrollPosition.current > 0) {
        scrollContainer.scrollTop = savedScrollPosition.current;
        logger.debug(
          `🔄 Restored scroll position (${isMobile ? 'mobile' : 'desktop'}):`,
          savedScrollPosition.current
        );
        savedScrollPosition.current = 0; // Reset
      }
    }, 100);
  }, [isMobile]);

  // 🎯 INFINITE SCROLL PRESERVATION: Obnoviť pozíciu po načítaní nových vozidiel
  const restoreInfiniteScrollPosition = React.useCallback(() => {
    if (!isLoadingMoreRef.current || infiniteScrollPosition.current === 0) {
      return;
    }

    const targetPosition = infiniteScrollPosition.current;
    let restored = false;

    // 🚀 OPTIMIZED: Single smart restore attempt
    const attemptRestore = () => {
      const scrollContainer = isMobile
        ? mobileScrollRef.current
        : desktopScrollRef.current;

      if (scrollContainer && !restored) {
        // Force scroll position
        scrollContainer.scrollTop = targetPosition;

        // Verify restoration worked
        window.setTimeout(() => {
          const actualPosition = scrollContainer.scrollTop;
          const success = Math.abs(actualPosition - targetPosition) < 50;

          if (success) {
            restored = true;
            logger.debug(`✅ Scroll preserved at position ${targetPosition}`);
          }
        }, 50);
      }
    };

    // Single attempt with optimal timing
    window.requestAnimationFrame(() => {
      window.setTimeout(attemptRestore, 200); // Wait for DOM to settle
    });

    // Cleanup
    window.setTimeout(() => {
      isLoadingMoreRef.current = false;
      infiniteScrollPosition.current = 0;
    }, 500);
  }, [isMobile]);

  const handleEdit = (vehicle: Vehicle) => {
    logger.debug('🔥 VEHICLE EDIT CLICKED:', vehicle.id);

    // 🎯 SCROLL PRESERVATION: Uložiť aktuálnu pozíciu pred otvorením dialógu
    const scrollContainer = isMobile
      ? mobileScrollRef.current
      : desktopScrollRef.current;
    if (scrollContainer) {
      savedScrollPosition.current = scrollContainer.scrollTop;
      logger.debug(
        `💾 Saved scroll position (${isMobile ? 'mobile' : 'desktop'}):`,
        savedScrollPosition.current
      );
    }

    setEditingVehicle(vehicle);
    setOpenDialog(true);
  };

  // 🏢 Handler pre vytvorenie novej firmy
  const handleCreateCompany = async () => {
    try {
      logger.debug('🏢 Creating new company:', newCompanyData);

      const response = await fetch(`${getApiBaseUrl()}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
        },
        body: JSON.stringify(newCompanyData),
      });

      const result = await response.json();

      if (result.success) {
        logger.debug('✅ Company created successfully');
        setCreateCompanyDialogOpen(false);
        setNewCompanyData({
          name: '',
          ownerName: '',
          personalIban: '',
          businessIban: '',
          contactEmail: '',
          contactPhone: '',
          defaultCommissionRate: 20,
          isActive: true,
        });
        // Refresh companies data
        window.location.reload();
      } else {
        console.error('❌ Failed to create company:', result.error);
        window.alert(`Chyba pri vytváraní firmy: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating company:', error);
      window.alert('Chyba pri vytváraní firmy');
    }
  };

  // 🤝 Handler pre vytvorenie spoluinvestora - ⚡ OPTIMIZED with React Query
  const handleCreateInvestor = async () => {
    try {
      // ✅ VALIDÁCIA POVINNÝCH POLÍ
      if (!newInvestorData.firstName?.trim()) {
        window.alert('❌ Meno je povinné pole');
        return;
      }

      if (!newInvestorData.lastName?.trim()) {
        window.alert('❌ Priezvisko je povinné pole');
        return;
      }

      // ✅ VALIDÁCIA EMAILU (ak je zadaný)
      if (
        newInvestorData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newInvestorData.email)
      ) {
        window.alert('❌ Neplatný formát emailu');
        return;
      }

      logger.debug('🤝 Creating new investor:', newInvestorData);

      // ⚡ Use React Query mutation (auto-invalidates cache, no manual refetch!)
      await createInvestorMutation.mutateAsync(newInvestorData);

      logger.debug('✅ Investor created successfully via React Query');
      setCreateInvestorDialogOpen(false);
      setNewInvestorData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notes: '',
        isActive: true,
      });
      window.alert('✅ Spoluinvestor bol úspešne vytvorený');
    } catch (error) {
      console.error('❌ Error creating investor:', error);
      window.alert(
        `❌ Chyba pri vytváraní spoluinvestora:\n${error instanceof Error ? error.message : 'Neznáma chyba'}`
      );
    }
  };

  // ❌ REMOVED: loadInvestors function - now handled by React Query hooks
  // Data automatically loads when needed via useInvestors() and useAllShares()
  // No manual fetch, no loading state, no useEffect needed!

  // 🤝 Handler pre priradenie podielu - ⚡ OPTIMIZED with React Query
  const handleAssignShare = async () => {
    try {
      if (!selectedInvestorForShare?.id) {
        window.alert('❌ Nie je vybraný investor');
        return;
      }

      logger.debug('🤝 Assigning share:', newShareData);

      // ⚡ Use React Query mutation (auto-invalidates cache, no manual refetch!)
      await createShareMutation.mutateAsync({
        ...newShareData,
        investorId: selectedInvestorForShare.id,
      });

      logger.debug('✅ Share assigned successfully via React Query');
      setAssignShareDialogOpen(false);
      setSelectedInvestorForShare(null);
      setNewShareData({
        companyId: '',
        ownershipPercentage: 0,
        investmentAmount: 0,
        isPrimaryContact: false,
      });
      window.alert('✅ Podiel úspešne priradený');
    } catch (error) {
      console.error('❌ Error assigning share:', error);
      window.alert(
        `❌ Chyba pri priradzovaní podielu:\n${error instanceof Error ? error.message : 'Neznáma chyba'}`
      );
    }
  };

  // const handleShowOwnershipHistory = async (vehicle: Vehicle) => {
  //   try {
  //     setSelectedVehicleHistory(vehicle);
  //     // Použijem fetch API namiesto private request metódy
  //     const token = localStorage.getItem('token');
  //     const apiBaseUrl = getApiBaseUrl();
  //     const response = await fetch(
  //       `${apiBaseUrl}/vehicles/${vehicle.id}/ownership-history`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );
  //     const data = await response.json();
  //     setOwnershipHistory(data.data.ownershipHistory || []);
  //     setOwnershipHistoryDialog(true);
  //   } catch (error) {
  //     console.error('Error fetching ownership history:', error);
  //     alert('Chyba pri načítaní histórie transferov');
  //   }
  // }; // Unused function

  const handleDelete = async (vehicleId: string) => {
    if (window.confirm('Naozaj chcete vymazať toto vozidlo?')) {
      try {
        setLoading(true);
        await deleteVehicleMutation.mutateAsync(vehicleId);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 🚗 Handler pre históriu kilometrov
  const handleKmHistory = (vehicle: Vehicle) => {
    setSelectedVehicleKmHistory(vehicle);
    setKmHistoryDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingVehicle(null);

    // 🎯 SCROLL PRESERVATION: Obnoviť pozíciu po zatvorení dialógu
    restoreScrollPosition();
  };

  const handleSubmit = async (vehicleData: Vehicle) => {
    try {
      setLoading(true);
      if (editingVehicle) {
        await updateVehicleMutation.mutateAsync(vehicleData);
      } else {
        await createVehicleMutation.mutateAsync(vehicleData);
      }
      handleCloseDialog();
    } catch (error: unknown) {
      console.error('Error saving vehicle:', error);

      // 🔍 Rozpoznanie typu chyby - podporuj rôzne formáty error objektov
      const err = error as {
        message?: string;
        response?: {
          data?: {
            error?: string;
            code?: string;
          };
          status?: number;
        };
      };

      const errorMsg =
        err?.response?.data?.error || err?.message || 'Neznáma chyba';
      const errorCode = err?.response?.data?.code;
      const statusCode = err?.response?.status;

      // ❌ Kontrola duplicitného vozidla
      if (
        errorCode === 'DUPLICATE_LICENSE_PLATE' ||
        statusCode === 409 ||
        errorMsg.toLowerCase().includes('duplicate') ||
        errorMsg.toLowerCase().includes('already exists') ||
        errorMsg.toLowerCase().includes('už existuje') ||
        errorMsg.includes('23505') // PostgreSQL unique constraint error code
      ) {
        setErrorTitle('Vozidlo už existuje');
        setErrorMessage(
          `Vozidlo s ŠPZ "${vehicleData.licensePlate}" sa už v databáze nachádza. ` +
            'Prosím skontrolujte existujúce vozidlá alebo použite inú ŠPZ.'
        );
        setErrorDialogOpen(true);
      } else {
        // Iné chyby
        setErrorTitle('Chyba pri ukladaní vozidla');
        setErrorMessage(errorMsg);
        setErrorDialogOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Tab handlers
  // Tab change handled by onValueChange in Tabs component

  // 👤 Save owner name - REMOVED (ownerName field no longer exists)

  // 🏢 Save company
  const handleSaveCompany = async (vehicleId: string, companyId: string) => {
    try {
      const vehicle = filteredVehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const updatedVehicle = { ...vehicle, ownerCompanyId: companyId };
      await updateVehicleMutation.mutateAsync(updatedVehicle);
      logger.debug('✅ Company saved:', { companyId, vehicleId });
    } catch (error) {
      console.error('❌ Error saving company:', error);
    }
  };

  // 🚀 ENHANCED: Filtered vehicles - teraz používame React Query data
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        v =>
          v.brand?.toLowerCase().includes(query) ||
          v.model?.toLowerCase().includes(query) ||
          v.licensePlate?.toLowerCase().includes(query) ||
          v.company?.toLowerCase().includes(query)
      );
    }

    // Status filters
    const statusFilters: VehicleStatus[] = [];
    if (showAvailable) statusFilters.push('available');
    if (showRented) statusFilters.push('rented');
    if (showMaintenance) statusFilters.push('maintenance');
    if (showStolen) statusFilters.push('stolen');
    if (showPrivate) statusFilters.push('private');
    if (showRemoved) statusFilters.push('removed');
    if (showTempRemoved) statusFilters.push('temporarily_removed');

    if (statusFilters.length > 0) {
      filtered = filtered.filter(v => statusFilters.includes(v.status));
    }

    return filtered;
  }, [
    vehicles,
    searchQuery,
    showAvailable,
    showRented,
    showMaintenance,
    showStolen,
    showPrivate,
    showRemoved,
    showTempRemoved,
  ]);

  // 🎯 INFINITE SCROLL PRESERVATION: Wrapper pre loadMore s uložením pozície
  const handleLoadMoreVehicles = useCallback(() => {
    if (isLoadingMore || displayedVehicles >= filteredVehicles.length) return;

    // Uložiť aktuálnu scroll pozíciu pred načítaním
    const scrollContainer = isMobile
      ? mobileScrollRef.current
      : desktopScrollRef.current;
    if (scrollContainer) {
      infiniteScrollPosition.current = scrollContainer.scrollTop;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    // Simulate loading delay for better UX
    window.setTimeout(() => {
      setDisplayedVehicles(prev =>
        Math.min(prev + 20, filteredVehicles.length)
      );
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, displayedVehicles, filteredVehicles.length, isMobile]);

  // 🚀 INFINITE SCROLL LOGIC (backward compatibility)
  const loadMoreVehicles = handleLoadMoreVehicles;

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedVehicles(20);
  }, [
    searchQuery,
    filterBrand,
    filterModel,
    filterCompany,
    filterStatus,
    filterCategory,
    showAvailable,
    showRented,
    showMaintenance,
    showStolen,
    showPrivate,
    showRemoved,
    showTempRemoved,
  ]);

  // 🎯 INFINITE SCROLL PRESERVATION: Obnoviť pozíciu po načítaní nových vozidiel
  useEffect(() => {
    if (isLoadingMoreRef.current && !isLoadingMore) {
      // Dáta sa načítali, obnoviť scroll pozíciu
      restoreInfiniteScrollPosition();
    }
  }, [displayedVehicles, isLoadingMore, restoreInfiniteScrollPosition]);

  // Infinite scroll event handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // Load more when user scrolls to 80% of the content
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMoreVehicles();
      }
    },
    [loadMoreVehicles]
  );

  // Get vehicles to display (limited by infinite scroll)
  const vehiclesToDisplay = useMemo(() => {
    return filteredVehicles.slice(0, displayedVehicles);
  }, [filteredVehicles, displayedVehicles]);

  const hasMore = displayedVehicles < filteredVehicles.length;

  // Get unique values for filters
  const uniqueBrands = [
    ...new Set(vehicles.map(v => v.brand).filter(Boolean)),
  ].sort() as string[];
  const uniqueModels = [
    ...new Set(vehicles.map(v => v.model).filter(Boolean)),
  ].sort() as string[];
  const uniqueCompanies = [
    ...new Set(vehicles.map(v => v.company).filter(Boolean)),
  ].sort() as string[];
  // const uniqueCategories = [
  //   ...new Set(state.vehicles.map(v => v.category).filter(Boolean)),
  // ].sort() as VehicleCategory[]; // 🚗 Unique categories - unused

  // TabPanel component replaced with TabsContent

  // ✅ NOVÉ: Funkcie pre hromadné mazanie
  const handleVehicleSelect = (vehicleId: string, checked: boolean) => {
    const newSelected = new Set(selectedVehicles);
    if (checked) {
      newSelected.add(vehicleId);
    } else {
      newSelected.delete(vehicleId);
    }
    setSelectedVehicles(newSelected);
    setShowBulkActions(newSelected.size > 0);

    // Update select all checkbox
    setIsSelectAllChecked(
      newSelected.size === filteredVehicles.length &&
        filteredVehicles.length > 0
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredVehicles.map(v => v.id));
      setSelectedVehicles(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
    }
    setIsSelectAllChecked(checked);
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.size === 0) return;

    const confirmed = window.confirm(
      `Naozaj chcete zmazať ${selectedVehicles.size} vozidiel?\n\nTáto akcia sa nedá vrátiť späť.`
    );

    if (!confirmed) return;

    setLoading(true);
    let deletedCount = 0;
    let errorCount = 0;

    try {
      // Mazanie po jednom - pre lepšiu kontrolu
      for (const vehicleId of selectedVehicles) {
        try {
          await deleteVehicleMutation.mutateAsync(vehicleId);
          deletedCount++;
          logger.debug(`✅ Deleted vehicle: ${vehicleId}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to delete vehicle: ${vehicleId}`, error);
        }
      }

      // Reset výber
      setSelectedVehicles(new Set());
      setShowBulkActions(false);
      setIsSelectAllChecked(false);

      // Zobraz výsledok
      if (errorCount === 0) {
        window.alert(`✅ Úspešne zmazaných ${deletedCount} vozidiel.`);
      } else {
        window.alert(
          `⚠️ Zmazaných ${deletedCount} vozidiel.\nChyby: ${errorCount} vozidiel sa nepodarilo zmazať.`
        );
      }
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      window.alert('❌ Chyba pri hromadnom mazaní vozidiel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-1 sm:p-2 md:p-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-2 sm:gap-0">
        <UnifiedTypography
          variant="h4"
          className="font-bold text-blue-600 text-2xl sm:text-3xl"
        >
          🚗 Databáza vozidiel
        </UnifiedTypography>

        {/* ✅ NOVÉ: Bulk Actions */}
        {showBulkActions && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
            <UnifiedTypography variant="body2" className="text-yellow-800">
              Vybraných: {selectedVehicles.size}
            </UnifiedTypography>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="min-w-[120px] gap-2"
            >
              <DeleteIcon className="h-4 w-4" />
              {loading ? 'Mažem...' : 'Zmazať vybrané'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedVehicles(new Set());
                setShowBulkActions(false);
                setIsSelectAllChecked(false);
              }}
            >
              Zrušiť výber
            </Button>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {/* ✅ NOVÉ: Select All Checkbox */}
          {filteredVehicles.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100 mr-1">
              <Checkbox
                checked={isSelectAllChecked}
                onCheckedChange={handleSelectAll}
                className="h-5 w-5"
              />
              <UnifiedTypography variant="body2" className="text-sm">
                Vybrať všetky ({filteredVehicles.length})
              </UnifiedTypography>
            </div>
          )}

          <VehicleActions
            loading={isLoading}
            isMobile={isMobile}
            onAddVehicle={() => setOpenDialog(true)}
            onCreateCompany={() => setCreateCompanyDialogOpen(true)}
            onCreateInvestor={() => setCreateInvestorDialogOpen(true)}
          />

          {/* CSV Export/Import komponenty */}
          <VehicleImportExport
            loading={isLoading}
            setLoading={setLoading}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Search and Filters */}
      <VehicleFiltersComponent
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        filterBrand={filterBrand}
        setFilterBrand={setFilterBrand}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        filterCompany={filterCompany}
        setFilterCompany={setFilterCompany}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        showAvailable={showAvailable}
        setShowAvailable={setShowAvailable}
        showRented={showRented}
        setShowRented={setShowRented}
        showMaintenance={showMaintenance}
        setShowMaintenance={setShowMaintenance}
        showStolen={showStolen}
        setShowStolen={setShowStolen}
        showPrivate={showPrivate}
        setShowPrivate={setShowPrivate}
        showRemoved={showRemoved}
        setShowRemoved={setShowRemoved}
        showTempRemoved={showTempRemoved}
        setShowTempRemoved={setShowTempRemoved}
        uniqueBrands={uniqueBrands}
        uniqueModels={uniqueModels}
        uniqueCompanies={uniqueCompanies}
      />

      {/* 🎯 TABS NAVIGATION */}
      <div className="border-b border-border mb-6">
        <Tabs
          value={currentTab.toString()}
          onValueChange={value => setCurrentTab(parseInt(value))}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="0">Vozidlá</TabsTrigger>
            <TabsTrigger value="1">👤 Majitelia</TabsTrigger>
            <TabsTrigger value="2">🤝 Používatelia</TabsTrigger>
            <TabsTrigger value="3">💳 Bankové účty</TabsTrigger>
          </TabsList>

          {/* TAB 0 - VOZIDLÁ */}
          <TabsContent value="0" className="pt-6">
            {/* Quick Status Filters */}
            <QuickFilters
              showAvailable={showAvailable}
              setShowAvailable={setShowAvailable}
              showRented={showRented}
              setShowRented={setShowRented}
              showMaintenance={showMaintenance}
              setShowMaintenance={setShowMaintenance}
              showStolen={showStolen}
              setShowStolen={setShowStolen}
              showPrivate={showPrivate}
              setShowPrivate={setShowPrivate}
              showRemoved={showRemoved}
              setShowRemoved={setShowRemoved}
              showTempRemoved={showTempRemoved}
              setShowTempRemoved={setShowTempRemoved}
            />

            {/* Results Count */}
            <div className="mb-4 flex items-center gap-2">
              <UnifiedTypography
                variant="body2"
                className="text-muted-foreground"
              >
                Zobrazených {vehiclesToDisplay.length} z{' '}
                {filteredVehicles.length} vozidiel
                {filteredVehicles.length !== vehicles.length &&
                  ` (filtrovaných z ${vehicles.length})`}
              </UnifiedTypography>
              {isLoading && (
                <EnhancedLoading
                  variant="inline"
                  message="Aktualizujem zoznam..."
                  showMessage={false}
                />
              )}
              {isLoadingMore && (
                <EnhancedLoading
                  variant="inline"
                  message="Načítavam ďalšie..."
                  showMessage={true}
                />
              )}
            </div>

            {/* Vehicle List */}
            <VehicleTable
              vehiclesToDisplay={vehiclesToDisplay}
              filteredVehicles={filteredVehicles}
              displayedVehicles={displayedVehicles}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              selectedVehicles={selectedVehicles}
              mobileScrollRef={mobileScrollRef}
              desktopScrollRef={desktopScrollRef}
              onScroll={handleScroll}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onVehicleSelect={handleVehicleSelect}
              onLoadMore={loadMoreVehicles}
              onKmHistory={handleKmHistory}
            />
          </TabsContent>

          {/* TAB 1 - MAJITELIA */}
          <TabsContent value="1" className="pt-6">
            <div className="mb-6">
              <UnifiedTypography variant="h6">
                👤 Správa majiteľov vozidiel
              </UnifiedTypography>
            </div>

            {/* Owners List - Nový dizajn */}
            <Card>
              <CardContent>
                <div className="mb-4">
                  <UnifiedTypography
                    variant="body2"
                    className="text-muted-foreground mb-4"
                  >
                    Zoznam majiteľov vozidiel. Kliknite na majiteľa pre
                    zobrazenie/skrytie jeho vozidiel.
                  </UnifiedTypography>
                </div>

                {/* Zoznam majiteľov zoskupených podľa firmy */}
                {companies
                  ?.filter(company => company.isActive !== false) // Filtrovanie aktívnych firiem
                  ?.map(company => {
                    // Nájdi vozidlá pre túto firmu
                    const companyVehicles = filteredVehicles.filter(
                      v => v.ownerCompanyId === company.id
                    );

                    if (companyVehicles.length === 0) return null;

                    return (
                      <OwnerCard
                        key={company.id}
                        company={company as unknown as Record<string, unknown>}
                        vehicles={companyVehicles}
                        onVehicleUpdate={handleSaveCompany}
                        onVehicleEdit={handleEdit}
                      />
                    );
                  })
                  ?.filter(Boolean)}

                {companies?.filter(c => c.isActive !== false).length === 0 && (
                  <UnifiedTypography
                    variant="body2"
                    className="text-center py-8 text-muted-foreground"
                  >
                    Žiadni aktívni majitelia vozidiel
                  </UnifiedTypography>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2 - POUŽÍVATELIA (SPOLUINVESTORI) */}
          <TabsContent value="2" className="pt-6">
            <div className="mb-6">
              <UnifiedTypography variant="h6">
                🤝 Správa spoluinvestorov
              </UnifiedTypography>
            </div>

            <UnifiedTypography
              variant="body2"
              className="text-muted-foreground mb-6"
            >
              Spoluinvestori s % podielmi vo firmách. Môžu byť priradení k
              viacerým firmám.
            </UnifiedTypography>

            {/* Investors List */}
            <Card>
              <CardContent>
                <UnifiedTypography
                  variant="body2"
                  className="text-muted-foreground mb-4"
                >
                  Zoznam všetkých spoluinvestorov a ich podiely vo firmách.
                </UnifiedTypography>

                {loadingInvestors ? (
                  <div className="flex justify-center py-8">
                    <EnhancedLoading
                      variant="page"
                      showMessage={true}
                      message="Načítavam spoluinvestorov..."
                    />
                  </div>
                ) : investors.length > 0 ? (
                  investors.map((investor: InvestorData) => {
                    // Nájdi podiely tohto investora
                    const investorShares_filtered = investorShares.filter(
                      share => share.investorId === investor.id
                    );

                    return (
                      <InvestorCard
                        key={investor.id}
                        investor={
                          investor as unknown as Record<string, unknown>
                        }
                        shares={
                          investorShares_filtered as unknown as Record<
                            string,
                            unknown
                          >[]
                        }
                        companies={
                          companies as unknown as Record<string, unknown>[]
                        }
                        onAssignShare={(investor: Record<string, unknown>) => {
                          setSelectedInvestorForShare(
                            investor as unknown as InvestorData
                          );
                          setAssignShareDialogOpen(true);
                        }}
                        onShareUpdate={async () => {
                          // Re-fetch shares after update
                          // Handled by React Query invalidation
                        }}
                      />
                    );
                  })
                ) : (
                  <UnifiedTypography
                    variant="body2"
                    className="text-center py-8 text-muted-foreground"
                  >
                    Žiadni spoluinvestori. Kliknite na "Pridať spoluinvestora"
                    pre vytvorenie nového.
                  </UnifiedTypography>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3 - BANKOVÉ ÚČTY */}
          <TabsContent value="3" className="pt-6">
            <div className="mb-6">
              <UnifiedTypography variant="h6">
                💳 Správa bankových účtov
              </UnifiedTypography>
            </div>

            <UnifiedTypography
              variant="body2"
              className="text-muted-foreground mb-6"
            >
              Bankové účty pre generovanie platobných príkazov s QR kódmi
            </UnifiedTypography>

            <BankAccountManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* All Dialogs */}
      <VehicleDialogs
        // Vehicle Form Dialog
        openDialog={openDialog}
        editingVehicle={editingVehicle}
        onCloseDialog={handleCloseDialog}
        onSubmit={handleSubmit}
        // Ownership History Dialog - DISABLED
        ownershipHistoryDialog={false}
        selectedVehicleHistory={null}
        ownershipHistory={[]}
        onCloseOwnershipHistory={() => {}}
        // Create Company Dialog
        createCompanyDialogOpen={createCompanyDialogOpen}
        newCompanyData={newCompanyData}
        onCloseCreateCompany={() => setCreateCompanyDialogOpen(false)}
        onCreateCompany={handleCreateCompany}
        onCompanyDataChange={(field, value) =>
          setNewCompanyData(prev => ({ ...prev, [field]: value }))
        }
        // Create Investor Dialog
        createInvestorDialogOpen={createInvestorDialogOpen}
        newInvestorData={newInvestorData}
        onCloseCreateInvestor={() => setCreateInvestorDialogOpen(false)}
        onCreateInvestor={handleCreateInvestor}
        onInvestorDataChange={(field, value) =>
          setNewInvestorData(prev => ({ ...prev, [field]: value }))
        }
        // Assign Share Dialog
        assignShareDialogOpen={assignShareDialogOpen}
        selectedInvestorForShare={
          selectedInvestorForShare as unknown as Record<string, unknown>
        }
        newShareData={newShareData}
        companies={companies as unknown as Record<string, unknown>[]}
        onCloseAssignShare={() => setAssignShareDialogOpen(false)}
        onAssignShare={handleAssignShare}
        onShareDataChange={(field, value) =>
          setNewShareData(prev => ({ ...prev, [field]: value }))
        }
      />

      {/* 🚗 História kilometrov */}
      <VehicleKmHistory
        open={kmHistoryDialog}
        onClose={() => {
          setKmHistoryDialog(false);
          setSelectedVehicleKmHistory(null);
        }}
        vehicle={selectedVehicleKmHistory}
      />

      {/* ❌ Error Dialog pre duplicitné vozidlá */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <ErrorIcon className="h-6 w-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl font-semibold">
                {errorTitle}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base pt-2">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setErrorDialogOpen(false)}
              className="bg-primary hover:bg-primary/90"
            >
              OK, rozumiem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
