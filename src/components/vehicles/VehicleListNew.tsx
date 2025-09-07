import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicles,
  type VehicleFilters,
} from '@/lib/react-query/hooks/useVehicles';
import { useApp } from '../../context/AppContext';
import type { Vehicle, VehicleCategory, VehicleStatus } from '../../types';

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

interface InvestorShare {
  id: string;
  investorId: string;
  companyId: string;
  ownershipPercentage: number;
  investmentAmount: number;
  isPrimaryContact: boolean;
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
import VehicleDialogs from './components/VehicleDialogs';
import VehicleImportExport from './components/VehicleImportExport';
import VehicleKmHistory from './components/VehicleKmHistory';
import VehicleTable from './components/VehicleTable';

export default function VehicleListNew() {
  const { state } = useApp(); // Zatiaľ ponechávame pre companies a iné dáta

  // 🎯 SCROLL PRESERVATION: Refs pre scroll kontajnery
  const mobileScrollRef = React.useRef<HTMLDivElement>(null);
  const desktopScrollRef = React.useRef<HTMLDivElement>(null);
  const savedScrollPosition = React.useRef<number>(0);

  // 🎯 INFINITE SCROLL PRESERVATION: Pre načítanie ďalších vozidiel
  const infiniteScrollPosition = React.useRef<number>(0);
  const isLoadingMoreRef = React.useRef<boolean>(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 🔍 DEBUG: Základné informácie o komponente (len raz)
  React.useEffect(() => {
    console.log('🚀 VehicleListNew MOUNTED:', {
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

  // Kombinovaný loading state
  const isLoading = vehiclesLoading || loading;

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
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState<VehicleCategory | 'all'>(
    'all'
  ); // 🚗 Category filter
  const [showAvailable, setShowAvailable] = useState(true);
  const [showRented, setShowRented] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  const [showOther, setShowOther] = useState(true);
  const [showPrivate, setShowPrivate] = useState(false); // 🏠 Súkromné vozidlá defaultne skryté
  const [showRemoved, setShowRemoved] = useState(false); // 🗑️ Vyradené vozidlá defaultne skryté
  const [showTempRemoved, setShowTempRemoved] = useState(false); // ⏸️ Dočasne vyradené vozidlá defaultne skryté

  // React Query hooks pre vehicles
  const createVehicleMutation = useCreateVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();

  // Pripravíme filters pre React Query
  const vehicleFilters: VehicleFilters = useMemo(
    () => ({
      status: filterStatus || undefined,
      company: filterCompany || undefined,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      search:
        filterBrand || filterModel
          ? `${filterBrand} ${filterModel}`.trim()
          : undefined,
    }),
    [filterStatus, filterCompany, filterCategory, filterBrand, filterModel]
  );

  // Používame React Query pre načítanie vozidiel
  const { data: vehicles = [], isLoading: vehiclesLoading } =
    useVehicles(vehicleFilters);
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

  // 🤝 State pre spoluinvestorov
  const [createInvestorDialogOpen, setCreateInvestorDialogOpen] =
    useState(false);
  const [investors, setInvestors] = useState<InvestorData[]>([]);
  const [investorShares, setInvestorShares] = useState<InvestorShare[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
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
  });

  // Handlers
  // 🎯 SCROLL PRESERVATION: Funkcia na obnovenie scroll pozície
  const restoreScrollPosition = React.useCallback(() => {
    setTimeout(() => {
      const scrollContainer = isMobile
        ? mobileScrollRef.current
        : desktopScrollRef.current;
      if (scrollContainer && savedScrollPosition.current > 0) {
        scrollContainer.scrollTop = savedScrollPosition.current;
        console.log(
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
        setTimeout(() => {
          const actualPosition = scrollContainer.scrollTop;
          const success = Math.abs(actualPosition - targetPosition) < 50;

          if (success) {
            restored = true;
            console.log(`✅ Scroll preserved at position ${targetPosition}`);
          }
        }, 50);
      }
    };

    // Single attempt with optimal timing
    requestAnimationFrame(() => {
      setTimeout(attemptRestore, 200); // Wait for DOM to settle
    });

    // Cleanup
    setTimeout(() => {
      isLoadingMoreRef.current = false;
      infiniteScrollPosition.current = 0;
    }, 500);
  }, [isMobile]);

  const handleEdit = (vehicle: Vehicle) => {
    console.log('🔥 VEHICLE EDIT CLICKED:', vehicle.id);

    // 🎯 SCROLL PRESERVATION: Uložiť aktuálnu pozíciu pred otvorením dialógu
    const scrollContainer = isMobile
      ? mobileScrollRef.current
      : desktopScrollRef.current;
    if (scrollContainer) {
      savedScrollPosition.current = scrollContainer.scrollTop;
      console.log(
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
      console.log('🏢 Creating new company:', newCompanyData);

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
        console.log('✅ Company created successfully');
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
        alert(`Chyba pri vytváraní firmy: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating company:', error);
      alert('Chyba pri vytváraní firmy');
    }
  };

  // 🤝 Handler pre vytvorenie spoluinvestora
  const handleCreateInvestor = async () => {
    try {
      console.log('🤝 Creating new investor:', newInvestorData);

      const response = await fetch(`${getApiBaseUrl()}/company-investors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
        },
        body: JSON.stringify(newInvestorData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Investor created successfully');
        setCreateInvestorDialogOpen(false);
        setNewInvestorData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          notes: '',
        });
        // Refresh data
        window.location.reload();
      } else {
        console.error('❌ Failed to create investor:', result.error);
        alert(`Chyba pri vytváraní spoluinvestora: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error creating investor:', error);
      alert('Chyba pri vytváraní spoluinvestora');
    }
  };

  // 🤝 Načítanie spoluinvestorov
  const loadInvestors = useCallback(async () => {
    try {
      setLoadingInvestors(true);

      const response = await fetch(`${getApiBaseUrl()}/company-investors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setInvestors(result.data);

        // Načítaj shares pre všetkých investorov
        const allShares = [];
        for (const company of state.companies || []) {
          const sharesResponse = await fetch(
            `${getApiBaseUrl()}/company-investors/${company.id}/shares`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
              },
            }
          );
          const sharesResult = await sharesResponse.json();
          if (sharesResult.success) {
            allShares.push(...sharesResult.data);
          }
        }
        setInvestorShares(allShares);
      }
    } catch (error) {
      console.error('❌ Error loading investors:', error);
    } finally {
      setLoadingInvestors(false);
    }
  }, [state.companies]);

  // Načítaj investorov pri zmene tabu
  useEffect(() => {
    if (currentTab === 2) {
      loadInvestors();
    }
  }, [currentTab, loadInvestors]);

  // 🤝 Handler pre priradenie podielu
  const handleAssignShare = async () => {
    try {
      console.log('🤝 Assigning share:', newShareData);

      const response = await fetch(
        `${getApiBaseUrl()}/company-investors/shares`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
          body: JSON.stringify({
            ...newShareData,
            investorId: selectedInvestorForShare?.id,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log('✅ Share assigned successfully');
        setAssignShareDialogOpen(false);
        setSelectedInvestorForShare(null);
        setNewShareData({
          companyId: '',
          ownershipPercentage: 0,
          investmentAmount: 0,
          isPrimaryContact: false,
        });
        loadInvestors(); // Refresh data
      } else {
        console.error('❌ Failed to assign share:', result.error);
        alert(`Chyba pri priradzovaní podielu: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error assigning share:', error);
      alert('Chyba pri priradzovaní podielu');
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
    } catch (error) {
      console.error('Error saving vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Tab handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // 👤 Save owner name - REMOVED (ownerName field no longer exists)

  // 🏢 Save company
  const handleSaveCompany = async (vehicleId: string, companyId: string) => {
    try {
      const vehicle = filteredVehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const updatedVehicle = { ...vehicle, ownerCompanyId: companyId };
      await updateVehicleMutation.mutateAsync(updatedVehicle);
      console.log('✅ Company saved:', companyId, 'for vehicle:', vehicleId);
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
    if (showOther) statusFilters.push('other');
    if (showPrivate) statusFilters.push('private');
    if (showRemoved) statusFilters.push('removed');
    if (showTempRemoved) statusFilters.push('temp_removed');

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
    showOther,
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
    setTimeout(() => {
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
    showOther,
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

  // 🆕 TabPanel component
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`vehicle-tabpanel-${index}`}
        aria-labelledby={`vehicle-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      </div>
    );
  }

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
          console.log(`✅ Deleted vehicle: ${vehicleId}`);
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
        alert(`✅ Úspešne zmazaných ${deletedCount} vozidiel.`);
      } else {
        alert(
          `⚠️ Zmazaných ${deletedCount} vozidiel.\nChyby: ${errorCount} vozidiel sa nepodarilo zmazať.`
        );
      }
    } catch (error) {
      console.error('❌ Bulk delete error:', error);
      alert('❌ Chyba pri hromadnom mazaní vozidiel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1976d2',
            fontSize: { xs: '1.5rem', sm: '2rem' },
          }}
        >
          🚗 Databáza vozidiel
        </Typography>

        {/* ✅ NOVÉ: Bulk Actions */}
        {showBulkActions && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 1,
              px: 2,
              py: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: '#856404' }}>
              Vybraných: {selectedVehicles.size}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              disabled={isLoading}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Mažem...' : 'Zmazať vybrané'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedVehicles(new Set());
                setShowBulkActions(false);
                setIsSelectAllChecked(false);
              }}
            >
              Zrušiť výber
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* ✅ NOVÉ: Select All Checkbox */}
          {filteredVehicles.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSelectAllChecked}
                  indeterminate={
                    selectedVehicles.size > 0 &&
                    selectedVehicles.size < filteredVehicles.length
                  }
                  onChange={e => handleSelectAll(e.target.checked)}
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                  Vybrať všetky ({filteredVehicles.length})
                </Typography>
              }
              sx={{
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                mr: 1,
              }}
            />
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
        </Box>
      </Box>

      {/* Search and Filters */}
      <VehicleFilters
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
        showOther={showOther}
        setShowOther={setShowOther}
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          aria-label="vehicle tabs"
        >
          <Tab
            label="Vozidlá"
            id="vehicle-tab-0"
            aria-controls="vehicle-tabpanel-0"
          />
          <Tab
            label="👤 Majitelia"
            id="vehicle-tab-1"
            aria-controls="vehicle-tabpanel-1"
          />
          <Tab
            label="🤝 Používatelia"
            id="vehicle-tab-2"
            aria-controls="vehicle-tabpanel-2"
          />
        </Tabs>
      </Box>

      {/* TAB 0 - VOZIDLÁ */}
      <TabPanel value={currentTab} index={0}>
        {/* Results Count */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Zobrazených {vehiclesToDisplay.length} z {filteredVehicles.length}{' '}
            vozidiel
            {filteredVehicles.length !== vehicles.length &&
              ` (filtrovaných z ${vehicles.length})`}
          </Typography>
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
        </Box>

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
      </TabPanel>

      {/* TAB 1 - MAJITELIA */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">👤 Správa majiteľov vozidiel</Typography>
        </Box>

        {/* Owners List - Nový dizajn */}
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Zoznam majiteľov vozidiel. Kliknite na majiteľa pre
                zobrazenie/skrytie jeho vozidiel.
              </Typography>
            </Box>

            {/* Zoznam majiteľov zoskupených podľa firmy */}
            {state.companies
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

            {state.companies?.filter(c => c.isActive !== false).length ===
              0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', py: 4 }}
              >
                Žiadni aktívni majitelia vozidiel
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* TAB 2 - POUŽÍVATELIA (SPOLUINVESTORI) */}
      <TabPanel value={currentTab} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">🤝 Správa spoluinvestorov</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Spoluinvestori s % podielmi vo firmách. Môžu byť priradení k viacerým
          firmám.
        </Typography>

        {/* Investors List */}
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Zoznam všetkých spoluinvestorov a ich podiely vo firmách.
            </Typography>

            {loadingInvestors ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <EnhancedLoading
                  variant="page"
                  showMessage={true}
                  message="Načítavam spoluinvestorov..."
                />
              </Box>
            ) : investors.length > 0 ? (
              investors.map(investor => {
                // Nájdi podiely tohto investora
                const investorShares_filtered = investorShares.filter(
                  share => share.investorId === investor.id
                );

                return (
                  <InvestorCard
                    key={investor.id}
                    investor={investor as unknown as Record<string, unknown>}
                    shares={
                      investorShares_filtered as unknown as Record<
                        string,
                        unknown
                      >[]
                    }
                    companies={
                      (state.companies || []) as unknown as Record<
                        string,
                        unknown
                      >[]
                    }
                    onShareUpdate={loadInvestors}
                    onAssignShare={investor => {
                      setSelectedInvestorForShare(
                        investor as unknown as InvestorData
                      );
                      setAssignShareDialogOpen(true);
                    }}
                  />
                );
              })
            ) : (
              <Typography
                variant="body2"
                sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}
              >
                Žiadni spoluinvestori. Kliknite na "Pridať spoluinvestora" pre
                vytvorenie nového.
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

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
        companies={
          (state.companies || []) as unknown as Record<string, unknown>[]
        }
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
    </Box>
  );
}
