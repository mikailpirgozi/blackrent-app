import { UnifiedIcon } from '../ui/UnifiedIcon';
import {
  UnifiedCard,
  StatisticsCard,
  InteractiveCard,
} from '../ui/UnifiedCard';
import { UnifiedButton } from '../ui/UnifiedButton';
import { UnifiedChip } from '../ui/UnifiedChip';
import { UnifiedTextField } from '../ui/UnifiedTextField';
import { UnifiedSelect } from '../ui/UnifiedSelect';
import { UnifiedDialog } from '../ui/UnifiedDialog';
import { UnifiedTypography } from '../ui/UnifiedTypography';
import { Alert, AlertTitle } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { addDays, format, isAfter, isValid, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { UnifiedDocumentData } from '../common/UnifiedDocumentForm';

import {
  useCreateInsurance,
  useCreateVehicleDocument,
  useDeleteInsurance,
  useDeleteVehicleDocument,
  useInsurancesPaginated,
  useInsurers,
  useUpdateInsurance,
  useUpdateVehicleDocument,
  useVehicleDocuments,
  useVehicles,
} from '../../lib/react-query/hooks';
import { useCustomers } from '../../lib/react-query/hooks/useCustomers';
import type {
  DocumentType,
  Insurance,
  PaymentFrequency,
  Vehicle,
  VehicleDocument,
  VignetteCountry,
} from '../../types';
import UnifiedDocumentForm from '../common/UnifiedDocumentForm';
import BatchDocumentForm from './BatchDocumentForm';
import { getDocumentTypeConfig } from './documentTypeConfig';

import InsuranceClaimList from './InsuranceClaimList';

// Unified document type for table display
interface UnifiedDocument {
  id: string;
  vehicleId: string;
  type:
    | 'insurance_pzp'
    | 'insurance_kasko'
    | 'insurance_pzp_kasko'
    | 'stk'
    | 'ek'
    | 'vignette'
    | 'technical_certificate';
  documentNumber?: string | undefined;
  policyNumber?: string | undefined;
  validFrom?: Date | string | undefined;
  validTo: Date | string;
  price?: number | undefined;
  company?: string | undefined;
  paymentFrequency?: PaymentFrequency | undefined;
  notes?: string | undefined;
  filePath?: string | undefined;
  filePaths?: string[] | undefined;
  createdAt: Date | string;
  originalData: Insurance | VehicleDocument;
  kmState?: number | undefined; // 🚗 Stav kilometrov
  country?: string | undefined; // 🌍 Krajina pre dialničné známky
  isRequired?: boolean | undefined; // ⚠️ Povinná dialničná známka
}

// Vehicle with documents grouped
interface VehicleWithDocuments {
  vehicle: Vehicle;
  documents: UnifiedDocument[];
  stats: {
    total: number;
    valid: number;
    expiring: number;
    expired: number;
    nextExpiry?: Date | undefined;
    hasProblems: boolean;
  };
}

type SortOption = 'name' | 'problems' | 'expiry';

// Interface pre status filter
type StatusFilter = 'all' | 'valid' | 'expiring' | 'expired';

// Interface pre expiry status
interface ExpiryStatus {
  status: 'valid' | 'expiring' | 'expired' | 'invalid';
  text: string;
  color:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral';
  bgColor?: string;
  daysLeft?: number;
}

const getExpiryStatus = (
  validTo: Date | string,
  documentType: string
): ExpiryStatus => {
  try {
    const today = new Date();

    let warningDays: number;
    switch (documentType) {
      case 'insurance':
      case 'vignette':
      case 'greencard':
        warningDays = 15;
        break;
      case 'stk':
      case 'ek':
        warningDays = 30;
        break;
      default:
        warningDays = 30;
    }

    const warningDate = addDays(today, warningDays);
    const validToDate =
      typeof validTo === 'string' ? parseISO(validTo) : validTo;

    if (!isValid(validToDate)) {
      return {
        status: 'invalid',
        color: 'neutral',
        text: 'Neplatný dátum',
        bgColor: '#f5f5f5',
      };
    }

    if (isAfter(today, validToDate)) {
      return {
        status: 'expired',
        color: 'error',
        text: 'Vypršalo',
        bgColor: '#ffebee',
      };
    } else if (isAfter(validToDate, warningDate)) {
      return {
        status: 'valid',
        color: 'success',
        text: 'Platné',
        bgColor: '#e8f5e8',
      };
    } else {
      const daysLeft = Math.ceil(
        (validToDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        status: 'expiring',
        color: 'warning',
        text: `Vyprší za ${daysLeft} dní`,
        bgColor: '#fff3e0',
      };
    }
  } catch {
    return {
      status: 'invalid',
      color: 'neutral',
      text: 'Neplatný dátum',
      bgColor: '#f5f5f5',
    };
  }
};

const getDocumentTypeInfo = (type: string) => {
  const config = getDocumentTypeConfig(type);
  const IconComponent = config.icon as unknown as React.ComponentType<{
    className?: string;
  }>;

  return {
    label: config.label,
    icon: <IconComponent className="h-5 w-5" />,
    color: config.color,
    gradientFrom: config.gradientFrom,
    gradientTo: config.gradientTo,
  };
};

export default function VehicleCentricInsuranceList() {
  // React Query hooks for data
  const { data: vehicles = [] } = useVehicles();
  const { data: insurers = [] } = useInsurers();
  const { data: customers = [] } = useCustomers();
  const { data: vehicleDocuments = [], dataUpdatedAt } = useVehicleDocuments();

  // 🔍 DEBUG: Log when vehicleDocuments change
  useEffect(() => {
    console.log('🔄 VehicleDocuments updated:', {
      count: vehicleDocuments?.length,
      dataUpdatedAt: new Date(dataUpdatedAt),
      timestamp: Date.now(),
      data: vehicleDocuments,
    });
  }, [vehicleDocuments, dataUpdatedAt]);

  // React Query mutations for vehicle documents
  const createVehicleDocumentMutation = useCreateVehicleDocument();
  const updateVehicleDocumentMutation = useUpdateVehicleDocument();
  const deleteVehicleDocumentMutation = useDeleteVehicleDocument();

  // Media queries using window.innerWidth
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
      setIsTablet(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // React Query hooks for insurances
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    type: undefined as string | undefined,
    company: undefined as string | undefined,
    status: 'all' as string,
    vehicleId: undefined as string | undefined,
  });

  const {
    data: insurancesData,
    isLoading: loading,
    error,
  } = useInsurancesPaginated({
    page: currentPage,
    limit: 20,
    search: filters.search,
    ...(filters.type && { type: filters.type }),
    ...(filters.company && { company: filters.company }),
    status: filters.status,
    ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
  });

  // Per-entity cache invalidation is now handled in useInsurances hook

  const insurances = useMemo(
    () => insurancesData?.insurances || [],
    [insurancesData?.insurances]
  );
  const totalCount = insurancesData?.pagination?.totalItems || 0;
  const hasMore = insurancesData?.pagination?.hasMore || false;

  // React Query mutations
  const createInsuranceMutation = useCreateInsurance();
  const updateInsuranceMutation = useUpdateInsurance();
  const deleteInsuranceMutation = useDeleteInsurance();

  const setSearchTerm = useCallback((term: string) => {
    setFilters(prev => ({ ...prev, search: term }));
    setCurrentPage(1);
  }, []);

  const loadMore = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const [activeTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<UnifiedDocumentData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('expiry'); // Default: najbližšia expirácia
  // ✅ FIX: Predvolene všetky vozidlá zbalené (prázdny Set)
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(
    new Set()
  );

  // Synchronize search and filters
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery, setSearchTerm]);

  useEffect(() => {
    setFilters({
      search: searchQuery,
      type: filterType || undefined,
      company: filterCompany || undefined,
      status: (filterStatus as StatusFilter) || 'all',
      vehicleId: filterVehicle || undefined,
    });
    setCurrentPage(1); // Reset page when filters change
  }, [searchQuery, filterType, filterCompany, filterStatus, filterVehicle]);

  // Create unified documents
  const unifiedDocuments = useMemo(() => {
    const docs: UnifiedDocument[] = [];

    // Add insurances
    insurances.forEach((insurance: Insurance) => {
      // Determine insurance type based on existing data
      let insuranceType:
        | 'insurance_pzp'
        | 'insurance_kasko'
        | 'insurance_pzp_kasko' = 'insurance_pzp';

      // Check if it's PZP + Kasko (has both green card and km state)
      if (
        insurance.kmState !== undefined &&
        (insurance.greenCardValidFrom || insurance.greenCardValidTo)
      ) {
        insuranceType = 'insurance_pzp_kasko';
      }
      // If insurance has kmState only, it's Kasko
      else if (insurance.kmState !== undefined) {
        insuranceType = 'insurance_kasko';
      }
      // Check if it's explicitly marked as PZP+Kasko in type field (more specific first)
      else if (
        insurance.type &&
        insurance.type.toLowerCase().includes('pzp') &&
        insurance.type.toLowerCase().includes('kasko')
      ) {
        insuranceType = 'insurance_pzp_kasko';
      }
      // Check if it's explicitly marked as Kasko in type field
      else if (
        insurance.type &&
        insurance.type.toLowerCase().includes('kasko')
      ) {
        insuranceType = 'insurance_kasko';
      }
      // Default to PZP
      else {
        insuranceType = 'insurance_pzp';
      }

      docs.push({
        id: insurance.id,
        vehicleId: insurance.vehicleId,
        type: insuranceType,
        policyNumber: insurance.policyNumber || undefined,
        validFrom: insurance.validFrom,
        validTo: insurance.validTo,
        price: insurance.price || undefined,
        company: insurance.company || undefined,
        paymentFrequency: insurance.paymentFrequency || undefined,
        filePath: insurance.filePath || undefined,
        filePaths: insurance.filePaths || undefined,
        createdAt: insurance.validTo,
        originalData: insurance,
        kmState: insurance.kmState || undefined,
      });
    });

    // Add vehicle documents (exclude technical certificates from main list)
    if (vehicleDocuments) {
      vehicleDocuments.forEach(doc => {
        // 🔍 DEBUG: Log vignette documents
        if (doc.documentType === 'vignette') {
          console.log('🔍 VIGNETTE DOCUMENT from API:', {
            id: doc.id,
            country: doc.country,
            isRequired: doc.isRequired,
            fullDoc: doc,
          });
        }

        docs.push({
          id: doc.id,
          vehicleId: doc.vehicleId,
          type: doc.documentType,
          documentNumber: doc.documentNumber || undefined,
          validFrom: doc.validFrom || undefined,
          validTo: doc.validTo,
          price: doc.price || undefined,
          notes: doc.notes || undefined,
          filePath: doc.filePath || undefined,
          createdAt: doc.validTo,
          originalData: doc,
          kmState: doc.kmState || undefined, // STK/EK môžu mať stav km
          country: doc.country || undefined, // 🌍 Krajina pre dialničné známky
          isRequired: doc.isRequired || undefined, // ⚠️ Povinná dialničná známka
        });
      });
    }

    return docs;
  }, [insurances, vehicleDocuments]);

  // Group documents by vehicle
  const vehiclesWithDocuments = useMemo(() => {
    if (!vehicles) return [];

    const vehicleGroups: VehicleWithDocuments[] = [];

    vehicles.forEach(vehicle => {
      const vehicleDocs = unifiedDocuments.filter(
        doc => doc.vehicleId === vehicle.id
      );

      // Skip vehicles with no documents
      if (vehicleDocs.length === 0) return;

      // Apply filtering
      const filteredDocs = vehicleDocs.filter(doc => {
        const vehicleText = `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}`;

        const matchesSearch =
          !searchQuery ||
          (doc.policyNumber &&
            doc.policyNumber
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (doc.documentNumber &&
            doc.documentNumber
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (doc.company &&
            doc.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
          vehicleText.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesVehicle =
          !filterVehicle || doc.vehicleId === filterVehicle;
        const matchesCompany = !filterCompany || doc.company === filterCompany;
        const matchesType = !filterType || doc.type === filterType;
        const matchesStatus =
          !filterStatus ||
          getExpiryStatus(doc.validTo, doc.type).status === filterStatus;

        return (
          matchesSearch &&
          matchesVehicle &&
          matchesCompany &&
          matchesType &&
          matchesStatus
        );
      });

      // Skip if no documents match filters
      if (filteredDocs.length === 0) return;

      // Calculate stats
      const nextExpiryDate = filteredDocs
        .map(doc =>
          typeof doc.validTo === 'string' ? parseISO(doc.validTo) : doc.validTo
        )
        .filter(date => isValid(date) && isAfter(date, new Date()))
        .sort((a, b) => a.getTime() - b.getTime())[0];

      const stats = {
        total: filteredDocs.length,
        valid: filteredDocs.filter(
          doc => getExpiryStatus(doc.validTo, doc.type).status === 'valid'
        ).length,
        expiring: filteredDocs.filter(
          doc => getExpiryStatus(doc.validTo, doc.type).status === 'expiring'
        ).length,
        expired: filteredDocs.filter(
          doc => getExpiryStatus(doc.validTo, doc.type).status === 'expired'
        ).length,
        nextExpiry: nextExpiryDate || undefined,
        hasProblems: false,
      };

      stats.hasProblems = stats.expiring > 0 || stats.expired > 0;

      vehicleGroups.push({
        vehicle,
        documents: filteredDocs,
        stats,
      });
    });

    return vehicleGroups;
  }, [
    vehicles,
    unifiedDocuments,
    searchQuery,
    filterVehicle,
    filterCompany,
    filterType,
    filterStatus,
  ]);

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    const sorted = [...vehiclesWithDocuments];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) =>
          `${a.vehicle.brand} ${a.vehicle.model}`.localeCompare(
            `${b.vehicle.brand} ${b.vehicle.model}`
          )
        );
      case 'problems':
        return sorted.sort((a, b) => {
          // First by problems (expired + expiring), then by next expiry
          const aProblems = a.stats.expired + a.stats.expiring;
          const bProblems = b.stats.expired + b.stats.expiring;
          if (aProblems !== bProblems) return bProblems - aProblems;

          if (a.stats.nextExpiry && b.stats.nextExpiry) {
            return a.stats.nextExpiry.getTime() - b.stats.nextExpiry.getTime();
          }
          return a.stats.nextExpiry ? -1 : 1;
        });
      case 'expiry':
      default:
        return sorted.sort((a, b) => {
          // 1. Najprv vypršané dokumenty (najviac vypršaných najprv)
          if (a.stats.expired !== b.stats.expired) {
            return b.stats.expired - a.stats.expired;
          }

          // 2. Ak oba majú vypršané dokumenty, zoraď podľa počtu vypršaných
          if (a.stats.expired > 0 && b.stats.expired > 0) {
            return b.stats.expired - a.stats.expired;
          }

          // 3. Potom tie čo vypršia čoskoro (podľa najbližšieho dátumu)
          if (a.stats.expiring > 0 || b.stats.expiring > 0) {
            // Ak jeden má expirujúce a druhý nie, expirujúce má prioritu
            if (a.stats.expiring > 0 && b.stats.expiring === 0) return -1;
            if (b.stats.expiring > 0 && a.stats.expiring === 0) return 1;

            // Ak oba majú expirujúce, zoraď podľa najbližšieho dátumu
            if (a.stats.nextExpiry && b.stats.nextExpiry) {
              return (
                a.stats.nextExpiry.getTime() - b.stats.nextExpiry.getTime()
              );
            }
          }

          // 4. Nakoniec tie v poriadku - zoraď abecedne
          if (
            a.stats.expired === 0 &&
            a.stats.expiring === 0 &&
            b.stats.expired === 0 &&
            b.stats.expiring === 0
          ) {
            return `${a.vehicle.brand} ${a.vehicle.model}`.localeCompare(
              `${b.vehicle.brand} ${b.vehicle.model}`
            );
          }

          // 5. Fallback - ak má jeden nextExpiry a druhý nie
          if (a.stats.nextExpiry && b.stats.nextExpiry) {
            return a.stats.nextExpiry.getTime() - b.stats.nextExpiry.getTime();
          }
          if (a.stats.nextExpiry) return -1;
          if (b.stats.nextExpiry) return 1;

          // 6. Posledný fallback - abecedne
          return `${a.vehicle.brand} ${a.vehicle.model}`.localeCompare(
            `${b.vehicle.brand} ${b.vehicle.model}`
          );
        });
    }
  }, [vehiclesWithDocuments, sortBy]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const allDocs = vehiclesWithDocuments.flatMap(v => v.documents);
    return {
      totalVehicles: vehiclesWithDocuments.length,
      totalDocuments: allDocs.length,
      validDocs: allDocs.filter(
        doc => getExpiryStatus(doc.validTo, doc.type).status === 'valid'
      ).length,
      expiringDocs: allDocs.filter(
        doc => getExpiryStatus(doc.validTo, doc.type).status === 'expiring'
      ).length,
      expiredDocs: allDocs.filter(
        doc => getExpiryStatus(doc.validTo, doc.type).status === 'expired'
      ).length,
    };
  }, [vehiclesWithDocuments]);

  const toggleVehicleExpansion = (vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles);
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId);
    } else {
      newExpanded.add(vehicleId);
    }
    setExpandedVehicles(newExpanded);
  };

  const handleAdd = () => {
    setEditingDocument(null);
    setOpenDialog(true);
  };

  const handleEdit = (doc: UnifiedDocument) => {
    const formData = {
      id: doc.id,
      vehicleId: doc.vehicleId,
      type: doc.type,
      policyNumber: doc.policyNumber || '',
      company: doc.company || '',
      paymentFrequency: doc.paymentFrequency || 'yearly',
      documentNumber: doc.documentNumber || '',
      notes: doc.notes || '',
      validFrom: doc.validFrom
        ? typeof doc.validFrom === 'string'
          ? new Date(doc.validFrom)
          : doc.validFrom
        : new Date(),
      validTo:
        typeof doc.validTo === 'string' ? new Date(doc.validTo) : doc.validTo,
      price: doc.price || 0,
      filePath: doc.filePath || '',
      filePaths: doc.filePaths || (doc.filePath ? [doc.filePath] : []),
      greenCardValidFrom:
        doc.originalData && 'greenCardValidFrom' in doc.originalData
          ? doc.originalData.greenCardValidFrom
          : new Date(),
      greenCardValidTo:
        doc.originalData && 'greenCardValidTo' in doc.originalData
          ? doc.originalData.greenCardValidTo
          : new Date(),
      kmState: doc.kmState || 0, // 🚗 Stav kilometrov
    };
    setEditingDocument(formData);
    setOpenDialog(true);
  };

  const handleDelete = async (doc: UnifiedDocument) => {
    if (window.confirm('Naozaj chcete vymazať tento dokument?')) {
      try {
        if (
          doc.type === 'insurance_pzp' ||
          doc.type === 'insurance_kasko' ||
          doc.type === 'insurance_pzp_kasko'
        ) {
          await deleteInsuranceMutation.mutateAsync(doc.id);
        } else {
          await deleteVehicleDocumentMutation.mutateAsync(doc.id);
        }
      } catch (error) {
        console.error('Chyba pri mazaní dokumentu:', error);
        window.alert('Chyba pri mazaní dokumentu');
      }
    }
  };

  const handleBatchSave = useCallback(
    async (
      documents: Array<{
        type: string;
        data: {
          vehicleId?: string;
          validFrom?: Date;
          validTo?: Date;
          price?: number;
          documentNumber?: string;
          notes?: string;
          filePaths?: string[];
          policyNumber?: string;
          company?: string;
          brokerCompany?: string; // 🆕 Maklerská spoločnosť
          paymentFrequency?: PaymentFrequency;
          greenCardValidFrom?: Date;
          greenCardValidTo?: Date;
          kmState?: number;
          // Service book fields
          serviceDate?: Date;
          serviceDescription?: string;
          serviceKm?: number;
          serviceProvider?: string;
          // Fines fields
          fineDate?: Date;
          customerId?: string;
          isPaid?: boolean;
          ownerPaidDate?: Date;
          customerPaidDate?: Date;
          country?: string;
          enforcementCompany?: string;
          fineAmount?: number;
          fineAmountLate?: number;
          // Vignette fields
          vignetteCountry?: string;
          isRequired?: boolean;
        };
      }>
    ) => {
      console.log('🟢 handleBatchSave CALLED with documents:', documents);

      try {
        // Process each document
        for (const doc of documents) {
          const { type, data } = doc;

          // Determine if it's insurance or vehicle document
          const isInsurance =
            type === 'insurance_pzp' ||
            type === 'insurance_kasko' ||
            type === 'insurance_pzp_kasko' ||
            type === 'insurance_leasing';

          if (isInsurance) {
            // Create insurance
            const selectedInsurer = insurers.find(
              insurer => insurer.name === data.company
            );

            let insuranceType = 'Poistenie';
            if (type === 'insurance_kasko') insuranceType = 'Kasko poistenie';
            else if (type === 'insurance_pzp') insuranceType = 'PZP poistenie';
            else if (type === 'insurance_pzp_kasko')
              insuranceType = 'PZP + Kasko poistenie';
            else if (type === 'insurance_leasing')
              insuranceType = 'Leasingová poistka';

            if (!data.vehicleId || !data.validTo) {
              console.error('Missing required fields for insurance');
              continue;
            }

            const insuranceData = {
              id: uuidv4(),
              vehicleId: data.vehicleId,
              type: insuranceType,
              policyNumber: data.policyNumber || '',
              validFrom: data.validFrom || new Date(),
              validTo: data.validTo,
              price: data.price || 0,
              company: data.company || '',
              insurerId: selectedInsurer?.id || null,
              brokerCompany: data.brokerCompany || '', // 🆕 Maklerská spoločnosť
              paymentFrequency: data.paymentFrequency || 'yearly',
              filePath: data.filePaths?.[0] || '',
              filePaths: data.filePaths || [],
              greenCardValidFrom: data.greenCardValidFrom,
              greenCardValidTo: data.greenCardValidTo,
              kmState: data.kmState || 0,
            };

            await createInsuranceMutation.mutateAsync(insuranceData);
          } else if (type === 'service_book') {
            // Service Book - special handling
            if (!data.vehicleId || !data.serviceDate) {
              console.error('Missing required fields for service book');
              continue;
            }

            const serviceNotes = `
📋 SERVISNÁ KNIŽKA

Servis: ${data.serviceProvider || 'N/A'}
Dátum servisu: ${data.serviceDate ? new Date(data.serviceDate).toLocaleDateString('sk-SK') : 'N/A'}
Stav KM: ${data.serviceKm || 'N/A'} km

Popis vykonaných prác:
${data.serviceDescription || 'Bez popisu'}
            `.trim();

            const vehicleDocData = {
              id: uuidv4(),
              vehicleId: data.vehicleId,
              documentType: 'stk' as DocumentType, // Temporary mapping
              validFrom: data.serviceDate,
              validTo: data.serviceDate, // Same as validFrom for service book
              documentNumber: `SERVIS-${Date.now()}`,
              price: data.price || 0,
              notes: serviceNotes,
              filePath: data.filePaths?.[0] || '',
              kmState: data.serviceKm || 0,
            };

            await createVehicleDocumentMutation.mutateAsync(vehicleDocData);
          } else if (type === 'fines_record') {
            // Fines - special handling
            if (!data.vehicleId || !data.fineDate) {
              console.error('Missing required fields for fine');
              continue;
            }

            // Get customer name
            const customer = customers?.find(c => c.id === data.customerId);
            const customerName = customer
              ? customer.name || customer.email
              : 'Neznámy zákazník';

            const fineNotes = `
🚨 POKUTA

Krajina: ${data.country || 'Neznáma'}
Vymáhajúca spoločnosť: ${data.enforcementCompany || 'N/A'}
Zákazník: ${customerName}

Sumy:
- Pri včasnej platbe: ${data.fineAmount || 0}€
- Po splatnosti: ${data.fineAmountLate || data.fineAmount || 0}€

Stav úhrad:
- Majiteľ zaplatil: ${data.ownerPaidDate ? '✅ Áno (' + new Date(data.ownerPaidDate).toLocaleDateString('sk-SK') + ')' : '❌ Nie'}
- Zákazník zaplatil: ${data.customerPaidDate ? '✅ Áno (' + new Date(data.customerPaidDate).toLocaleDateString('sk-SK') + ')' : '❌ Nie'}

Status: ${data.ownerPaidDate && data.customerPaidDate ? 'Úplne uhradená' : 'Čaká na úhradu'}
            `.trim();

            const vehicleDocData = {
              id: uuidv4(),
              vehicleId: data.vehicleId,
              documentType: 'stk' as DocumentType, // Temporary mapping
              validFrom: data.fineDate,
              validTo: data.fineDate, // Same as validFrom for fines
              documentNumber: `POKUTA-${Date.now()}`,
              price: data.fineAmount || 0,
              notes: fineNotes,
              filePath: data.filePaths?.[0] || '',
              kmState: 0,
            };

            await createVehicleDocumentMutation.mutateAsync(vehicleDocData);
          } else {
            // Regular vehicle documents (STK, EK, Vignette)
            let documentType: DocumentType = 'stk';
            if (type === 'ek') documentType = 'ek';
            else if (type === 'vignette') documentType = 'vignette';

            if (!data.vehicleId || !data.validTo) {
              console.error('Missing required fields for vehicle document');
              continue;
            }

            const vehicleDocData = {
              id: uuidv4(),
              vehicleId: data.vehicleId,
              documentType,
              validFrom: data.validFrom || new Date(),
              validTo: data.validTo,
              documentNumber: data.documentNumber || '',
              price: data.price || 0,
              notes: data.notes || '',
              filePath: data.filePaths?.[0] || '',
              kmState: data.kmState || 0,
              // 🌍 Vignette fields
              ...(type === 'vignette' &&
                data.vignetteCountry && {
                  country: data.vignetteCountry as VignetteCountry,
                }),
              ...(type === 'vignette' &&
                data.isRequired !== undefined && {
                  isRequired: data.isRequired,
                }),
            };

            await createVehicleDocumentMutation.mutateAsync(vehicleDocData);
          }
        }

        // Close dialog on success
        setOpenDialog(false);
        setEditingDocument(null);
      } catch (error) {
        console.error('Chyba pri ukladaní dokumentov:', error);
        window.alert('Chyba pri ukladaní dokumentov');
      }
    },
    [
      createInsuranceMutation,
      createVehicleDocumentMutation,
      insurers,
      customers,
    ]
  );

  const handleSave = useCallback(
    (data: UnifiedDocumentData) => {
      console.log('🟢 handleSave CALLED with data:', data);
      console.log('🟢 editingDocument:', editingDocument);

      const closeDialog = () => {
        setOpenDialog(false);
        setEditingDocument(null);
      };

      if (editingDocument) {
        if (
          editingDocument.type === 'insurance_pzp' ||
          editingDocument.type === 'insurance_kasko' ||
          editingDocument.type === 'insurance_pzp_kasko'
        ) {
          const selectedInsurer = insurers.find(
            insurer => insurer.name === data.company
          );
          const insuranceData = {
            id: editingDocument.id || '',
            vehicleId: data.vehicleId,
            type:
              data.type === 'insurance_kasko'
                ? 'Kasko poistenie'
                : data.type === 'insurance_pzp'
                  ? 'PZP poistenie'
                  : data.type === 'insurance_pzp_kasko'
                    ? 'PZP + Kasko poistenie'
                    : 'Poistenie',
            policyNumber: data.policyNumber || '',
            validFrom: data.validFrom || new Date(),
            validTo: data.validTo,
            price: data.price || 0,
            company: data.company || '',
            insurerId: selectedInsurer?.id || null,
            paymentFrequency: data.paymentFrequency || 'yearly',
            filePath: data.filePath || '',
            filePaths: data.filePaths || [],
            greenCardValidFrom: data.greenCardValidFrom || new Date(),
            greenCardValidTo: data.greenCardValidTo || new Date(),
            kmState: data.kmState || 0, // 🚗 Stav kilometrov
          };
          console.log(
            '🔵 BEFORE MUTATION: Calling updateInsuranceMutation.mutate with:',
            insuranceData
          );
          updateInsuranceMutation.mutate(insuranceData, {
            onSuccess: data => {
              console.log('✅ UPDATE SUCCESS:', data);
              closeDialog();
            },
            onError: error => {
              console.error('❌ UPDATE ERROR:', error);
              console.error('Chyba pri ukladaní insurance:', error);
              window.alert('Chyba pri ukladaní insurance: ' + error.message);
            },
            onSettled: () => {
              // Ensure cache invalidation happens
              console.log('🔄 onSettled called for updateInsurance');
              // Per-entity cache invalidation is handled in useInsurances hook
            },
          });
          console.log('🔵 AFTER MUTATION: Mutation called');
        } else {
          // Type guard pre DocumentType
          const isValidDocumentType = (type: string): type is DocumentType => {
            return ['stk', 'ek', 'vignette', 'technical_certificate'].includes(
              type
            );
          };

          if (isValidDocumentType(data.type)) {
            console.log('🔍 DEBUG handleSave - data object:', {
              dataCountry: data.country,
              dataIsRequired: data.isRequired,
              dataType: data.type,
              fullData: data,
            });

            const vehicleDocData = {
              id: editingDocument.id || '',
              vehicleId: data.vehicleId,
              documentType: data.type,
              validFrom: data.validFrom || new Date(),
              validTo: data.validTo,
              documentNumber: data.documentNumber || '',
              price: data.price || 0,
              notes: data.notes || '',
              filePath: data.filePath || '',
              kmState: data.kmState || 0, // 🚗 Stav kilometrov pre STK/EK
              ...(data.country && { country: data.country }), // 🌍 Krajina pre dialničné známky
              ...(data.isRequired !== undefined && {
                isRequired: data.isRequired,
              }), // ⚠️ Povinná dialničná známka
            };
            console.log(
              '🔵 BEFORE MUTATION: Calling updateVehicleDocumentMutation.mutate with:',
              vehicleDocData
            );
            updateVehicleDocumentMutation.mutate(vehicleDocData, {
              onSuccess: data => {
                console.log('✅ VEHICLE DOCUMENT UPDATE SUCCESS:', data);
                closeDialog();
              },
              onError: error => {
                console.error('❌ VEHICLE DOCUMENT UPDATE ERROR:', error);
                console.error('Chyba pri ukladaní vehicle document:', error);
                window.alert(
                  'Chyba pri ukladaní vehicle document: ' + error.message
                );
              },
            });
            console.log('🔵 AFTER MUTATION: Mutation called');
          }
        }
      } else {
        if (
          data.type === 'insurance_pzp' ||
          data.type === 'insurance_kasko' ||
          data.type === 'insurance_pzp_kasko'
        ) {
          const insuranceData = {
            id: '',
            vehicleId: data.vehicleId,
            type:
              data.type === 'insurance_kasko'
                ? 'Kasko poistenie'
                : data.type === 'insurance_pzp'
                  ? 'PZP poistenie'
                  : data.type === 'insurance_pzp_kasko'
                    ? 'PZP + Kasko poistenie'
                    : 'Poistenie',
            policyNumber: data.policyNumber || '',
            validFrom: data.validFrom || new Date(),
            validTo: data.validTo,
            price: data.price || 0,
            company: data.company || '',
            paymentFrequency: data.paymentFrequency || 'yearly',
            filePath: data.filePath || '',
            filePaths: data.filePaths || [],
            greenCardValidFrom: data.greenCardValidFrom || new Date(),
            greenCardValidTo: data.greenCardValidTo || new Date(),
            kmState: data.kmState || 0, // 🚗 Stav kilometrov pre Kasko
          };
          createInsuranceMutation.mutate(insuranceData, {
            onSuccess: closeDialog,
            onError: error => {
              console.error('Chyba pri ukladaní insurance:', error);
              window.alert('Chyba pri ukladaní insurance: ' + error.message);
            },
            onSettled: () => {
              // Ensure cache invalidation happens
              console.log('🔄 onSettled called for createInsurance');
              // Per-entity cache invalidation is handled in useInsurances hook
            },
          });
        } else {
          const vehicleDocData = {
            id: '',
            vehicleId: data.vehicleId,
            documentType: data.type as DocumentType,
            validFrom: data.validFrom || new Date(),
            validTo: data.validTo,
            documentNumber: data.documentNumber || '',
            price: data.price || 0,
            notes: data.notes || '',
            filePath: data.filePath || '',
            kmState: data.kmState || 0, // 🚗 Stav kilometrov pre STK/EK
          };
          createVehicleDocumentMutation.mutate(vehicleDocData, {
            onSuccess: closeDialog,
            onError: error => {
              console.error('Chyba pri ukladaní vehicle document:', error);
              window.alert(
                'Chyba pri ukladaní vehicle document: ' + error.message
              );
            },
          });
        }
      }
    },
    [
      editingDocument,
      insurers,
      updateInsuranceMutation,
      updateVehicleDocumentMutation,
      createInsuranceMutation,
      createVehicleDocumentMutation,
    ]
  );

  const clearFilters = () => {
    setSearchQuery('');
    setFilterVehicle('');
    setFilterCompany('');
    setFilterType('');
    setFilterStatus('');
  };

  const hasActiveFilters =
    searchQuery || filterVehicle || filterCompany || filterType || filterStatus;

  return (
    <div
      className={cn(
        'w-full max-w-full overflow-hidden',
        isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8'
      )}
    >
      {/* Modern Responsive Header */}
      <UnifiedCard
        variant="elevated"
        className={cn('mb-6', isMobile ? 'rounded-lg' : 'rounded-xl')}
      >
        <div
          className={cn(
            'relative text-white',
            'bg-gradient-to-br from-blue-600 to-purple-600',
            isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8'
          )}
        >
          <div
            className={cn(
              'flex justify-between',
              isMobile
                ? 'flex-col items-start gap-4'
                : 'flex-row items-center gap-4'
            )}
          >
            <div
              className={cn(
                'flex items-center',
                isMobile ? 'w-full gap-3' : 'gap-4'
              )}
            >
              <UnifiedIcon
                name="security"
                size={isMobile ? 24 : isTablet ? 28 : 32}
                className="flex-shrink-0"
              />
              <div>
                <UnifiedTypography
                  variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
                  className={cn(
                    'font-bold mb-2 leading-tight',
                    isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'
                  )}
                >
                  {isMobile ? 'Poistky & STK' : 'Poistky/STK/Dialničné'}
                </UnifiedTypography>
                <UnifiedTypography
                  variant={isMobile ? 'body2' : 'body1'}
                  className={cn(
                    'opacity-90 flex flex-wrap',
                    isMobile ? 'text-sm gap-2' : 'text-base gap-4'
                  )}
                >
                  <span>{overallStats.totalVehicles} vozidiel</span>
                  <span>•</span>
                  <span>{overallStats.totalDocuments} dokumentov</span>
                </UnifiedTypography>
              </div>
            </div>

            {!isMobile && (
              <UnifiedButton
                variant="default"
                startIcon={<UnifiedIcon name="add" size={20} />}
                onClick={handleAdd}
                size={isTablet ? 'medium' : 'large'}
                className="bg-white/20 backdrop-blur-sm border border-white/30 whitespace-nowrap flex-shrink-0 hover:bg-white/30"
              >
                Pridať dokument
              </UnifiedButton>
            )}
          </div>
        </div>
      </UnifiedCard>

      {/* Responsive Statistics Cards */}
      {activeTab === 0 && (
        <div
          className={cn(
            'grid grid-cols-2 md:grid-cols-4 gap-4',
            isMobile ? 'mb-4' : 'mb-6'
          )}
        >
          <StatisticsCard className="bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg h-full transition-transform duration-200 hover:-translate-y-0.5">
            <div
              className={cn(
                'flex items-center justify-between',
                isMobile ? 'flex-col text-center gap-4' : 'flex-row text-left'
              )}
            >
              <div className={cn(isMobile ? 'order-2' : 'order-1')}>
                <UnifiedTypography
                  variant={isMobile ? 'caption' : isTablet ? 'subtitle2' : 'h6'}
                  className={cn(
                    'font-semibold tracking-wider',
                    isMobile
                      ? 'mb-2 text-xs'
                      : isTablet
                        ? 'mb-2 text-sm'
                        : 'mb-4 text-base'
                  )}
                >
                  VOZIDLÁ
                </UnifiedTypography>
                <UnifiedTypography
                  variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
                  className={cn(
                    'font-bold',
                    isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
                  )}
                >
                  {overallStats.totalVehicles}
                </UnifiedTypography>
              </div>
              <UnifiedIcon
                name="car"
                size={isMobile ? 20 : isTablet ? 32 : 40}
                className={cn('opacity-80', isMobile ? 'order-1' : 'order-2')}
              />
            </div>
          </StatisticsCard>

          <StatisticsCard className="bg-gradient-to-br from-green-500 to-green-400 text-white shadow-lg h-full transition-transform duration-200 hover:-translate-y-0.5">
            <div
              className={cn(
                'flex items-center justify-between',
                isMobile ? 'flex-col text-center gap-4' : 'flex-row text-left'
              )}
            >
              <div className={cn(isMobile ? 'order-2' : 'order-1')}>
                <UnifiedTypography
                  variant={isMobile ? 'caption' : isTablet ? 'subtitle2' : 'h6'}
                  className={cn(
                    'font-semibold tracking-wider',
                    isMobile
                      ? 'mb-2 text-xs'
                      : isTablet
                        ? 'mb-2 text-sm'
                        : 'mb-4 text-base'
                  )}
                >
                  PLATNÉ
                </UnifiedTypography>
                <UnifiedTypography
                  variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
                  className={cn(
                    'font-bold',
                    isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
                  )}
                >
                  {overallStats.validDocs}
                </UnifiedTypography>
              </div>
              <UnifiedIcon
                name="success"
                size={isMobile ? 20 : isTablet ? 32 : 40}
                className={cn('opacity-80', isMobile ? 'order-1' : 'order-2')}
              />
            </div>
          </StatisticsCard>

          <StatisticsCard className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg h-full transition-transform duration-200 hover:-translate-y-0.5">
            <div
              className={cn(
                'flex items-center justify-between',
                isMobile ? 'flex-col text-center gap-4' : 'flex-row text-left'
              )}
            >
              <div className={cn(isMobile ? 'order-2' : 'order-1')}>
                <UnifiedTypography
                  variant={isMobile ? 'caption' : isTablet ? 'subtitle2' : 'h6'}
                  className={cn(
                    'font-semibold tracking-wider',
                    isMobile
                      ? 'mb-2 text-xs'
                      : isTablet
                        ? 'mb-2 text-sm'
                        : 'mb-4 text-base'
                  )}
                >
                  VYPRŠÍ
                </UnifiedTypography>
                <UnifiedTypography
                  variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
                  className={cn(
                    'font-bold',
                    isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
                  )}
                >
                  {overallStats.expiringDocs}
                </UnifiedTypography>
              </div>
              <UnifiedIcon
                name="clock"
                size={isMobile ? 20 : isTablet ? 32 : 40}
                className={cn('opacity-80', isMobile ? 'order-1' : 'order-2')}
              />
            </div>
          </StatisticsCard>

          <StatisticsCard className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg h-full transition-transform duration-200 hover:-translate-y-0.5">
            <div
              className={cn(
                'flex items-center justify-between',
                isMobile ? 'flex-col text-center gap-4' : 'flex-row text-left'
              )}
            >
              <div className={cn(isMobile ? 'order-2' : 'order-1')}>
                <UnifiedTypography
                  variant={isMobile ? 'caption' : isTablet ? 'subtitle2' : 'h6'}
                  className={cn(
                    'font-semibold tracking-wider',
                    isMobile
                      ? 'mb-2 text-xs'
                      : isTablet
                        ? 'mb-2 text-sm'
                        : 'mb-4 text-base'
                  )}
                >
                  VYPRŠANÉ
                </UnifiedTypography>
                <UnifiedTypography
                  variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
                  className={cn(
                    'font-bold',
                    isMobile ? 'text-xl' : isTablet ? 'text-2xl' : 'text-3xl'
                  )}
                >
                  {overallStats.expiredDocs}
                </UnifiedTypography>
              </div>
              <UnifiedIcon
                name="error"
                size={isMobile ? 20 : isTablet ? 32 : 40}
                className={cn('opacity-80', isMobile ? 'order-1' : 'order-2')}
              />
            </div>
          </StatisticsCard>
        </div>
      )}

      {/* Responsive Search, Filters and Sorting */}
      {activeTab === 0 && (
        <UnifiedCard
          variant="default"
          className={cn(
            'shadow-md',
            isMobile ? 'mb-4 rounded-lg' : 'mb-6 rounded-xl'
          )}
        >
          {/* Mobile-first Search and main controls */}
          <div
            className={cn(
              'flex gap-4',
              showFilters ? (isMobile ? 'mb-4' : 'mb-6') : 'mb-0',
              isMobile
                ? 'flex-col items-stretch'
                : 'flex-row items-center flex-wrap'
            )}
          >
            {/* Search Field */}
            <UnifiedTextField
              placeholder={
                isMobile ? 'Vyhľadať...' : 'Vyhľadať vozidlo alebo dokument...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              startAdornment={
                <UnifiedIcon
                  name="search"
                  size={isMobile ? 20 : 24}
                  className="text-muted-foreground mr-2"
                />
              }
              className={cn(isMobile ? 'w-full' : 'flex-1 min-w-[250px]')}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
            />

            {/* Controls Row for Mobile */}
            <div
              className={cn(
                'flex gap-4 flex-wrap',
                isMobile ? 'w-full' : 'w-auto'
              )}
            >
              {/* Sort dropdown */}
              <UnifiedSelect
                value={sortBy}
                onChange={(value: string | string[]) =>
                  setSortBy(
                    (Array.isArray(value) ? value[0] : value) as SortOption
                  )
                }
                options={[
                  {
                    value: 'expiry',
                    label: isMobile ? 'Expirácia' : 'Najbližšia expirácia',
                  },
                  {
                    value: 'problems',
                    label: isMobile ? 'Problémy' : 'Počet problémov',
                  },
                  {
                    value: 'name',
                    label: isMobile ? 'Názov' : 'Názov vozidla',
                  },
                ]}
                placeholder={isMobile ? 'Triediť' : 'Triediť podľa'}
                className={cn(
                  isMobile ? 'w-[calc(50%-8px)] flex-1' : 'w-[180px]'
                )}
                size={isMobile ? 'sm' : 'default'}
              />

              {/* Filter Button */}
              <UnifiedButton
                variant={showFilters ? 'contained' : 'outlined'}
                startIcon={<UnifiedIcon name="filter" size={20} />}
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'whitespace-nowrap',
                  isMobile ? 'w-[calc(50%-8px)] flex-1' : 'w-auto'
                )}
                size={isMobile ? 'small' : 'medium'}
              >
                {isMobile
                  ? `Filtre${hasActiveFilters ? ` (${Object.values({ searchQuery, filterVehicle, filterCompany, filterType, filterStatus }).filter(Boolean).length})` : ''}`
                  : `Filtre ${hasActiveFilters ? `(${Object.values({ searchQuery, filterVehicle, filterCompany, filterType, filterStatus }).filter(Boolean).length})` : ''}`}
              </UnifiedButton>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <UnifiedButton
                  variant="outline"
                  startIcon={<UnifiedIcon name="close" size={20} />}
                  onClick={clearFilters}
                  color="secondary"
                  className={cn(
                    'whitespace-nowrap',
                    isMobile ? 'w-full' : 'w-auto'
                  )}
                  size={isMobile ? 'small' : 'medium'}
                  fullWidth={isMobile}
                >
                  {isMobile ? 'Zrušiť filtre' : 'Zrušiť'}
                </UnifiedButton>
              )}
            </div>
          </div>

          {/* Responsive Advanced filters */}
          {showFilters && (
            <>
              <Separator className={cn(isMobile ? 'my-4' : 'my-6')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <UnifiedSelect
                  value={filterVehicle}
                  onChange={(value: string | string[]) =>
                    setFilterVehicle(
                      Array.isArray(value) ? value[0] || '' : value
                    )
                  }
                  options={[
                    { value: '', label: 'Všetky vozidlá' },
                    ...(vehicles?.map(vehicle => ({
                      value: vehicle.id,
                      label: `${vehicle.brand} ${vehicle.model}`,
                      description: vehicle.licensePlate,
                    })) || []),
                  ]}
                  placeholder="Vozidlo"
                  fullWidth
                  size={isMobile ? 'sm' : 'default'}
                />
                <UnifiedSelect
                  value={filterType}
                  onChange={(value: string | string[]) =>
                    setFilterType(Array.isArray(value) ? value[0] || '' : value)
                  }
                  options={[
                    { value: '', label: 'Všetky typy' },
                    {
                      value: 'insurance_pzp',
                      label: 'Poistka - PZP',
                      icon: <UnifiedIcon name="security" size={16} />,
                    },
                    {
                      value: 'insurance_kasko',
                      label: 'Poistka - Kasko',
                      icon: <UnifiedIcon name="security" size={16} />,
                    },
                    {
                      value: 'insurance_pzp_kasko',
                      label: 'Poistka - PZP + Kasko',
                      icon: <UnifiedIcon name="security" size={16} />,
                    },
                    {
                      value: 'stk',
                      label: 'STK',
                      icon: <UnifiedIcon name="build" size={16} />,
                    },
                    {
                      value: 'ek',
                      label: 'EK',
                      icon: <UnifiedIcon name="assignment" size={16} />,
                    },
                    {
                      value: 'vignette',
                      label: 'Dialničná',
                      icon: <UnifiedIcon name="truck" size={16} />,
                    },
                  ]}
                  placeholder="Typ dokumentu"
                  fullWidth
                  size={isMobile ? 'sm' : 'default'}
                />
                <UnifiedSelect
                  value={filterCompany}
                  onChange={(value: string | string[]) =>
                    setFilterCompany(
                      Array.isArray(value) ? value[0] || '' : value
                    )
                  }
                  options={[
                    { value: '', label: 'Všetky spoločnosti' },
                    ...Array.from(
                      new Set(
                        unifiedDocuments.map(d => d.company).filter(Boolean)
                      )
                    ).map(company => ({
                      value: company || '',
                      label: company || '',
                    })),
                  ]}
                  placeholder="Spoločnosť"
                  fullWidth
                  size={isMobile ? 'sm' : 'default'}
                />
                <UnifiedSelect
                  value={filterStatus}
                  onChange={(value: string | string[]) =>
                    setFilterStatus(
                      Array.isArray(value) ? value[0] || '' : value
                    )
                  }
                  options={[
                    { value: '', label: 'Všetky stavy' },
                    {
                      value: 'valid',
                      label: 'Platné',
                      icon: <UnifiedIcon name="success" size={16} />,
                    },
                    {
                      value: 'expiring',
                      label: 'Vypršia čoskoro',
                      icon: <UnifiedIcon name="clock" size={16} />,
                    },
                    {
                      value: 'expired',
                      label: 'Vypršané',
                      icon: (
                        <UnifiedIcon
                          name="error"
                          size={16}
                          className="text-red-600"
                        />
                      ),
                    },
                  ]}
                  placeholder="Stav"
                  fullWidth
                  size={isMobile ? 'sm' : 'default'}
                />
              </div>
            </>
          )}
        </UnifiedCard>
      )}

      {/* Alerts */}
      {activeTab === 0 && overallStats.expiredDocs > 0 && (
        <Alert variant="destructive" className="mb-6">
          <UnifiedIcon name="warning" size={20} />
          <AlertTitle>
            <UnifiedTypography variant="body1" className="font-semibold">
              Pozor! {overallStats.expiredDocs} dokumentov už vypršalo
            </UnifiedTypography>
          </AlertTitle>
        </Alert>
      )}

      {activeTab === 0 && overallStats.expiringDocs > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50 text-orange-800">
          <UnifiedIcon name="clock" size={20} />
          <AlertTitle>
            <UnifiedTypography variant="body1" className="font-semibold">
              Upozornenie: {overallStats.expiringDocs} dokumentov vyprší čoskoro
            </UnifiedTypography>
          </AlertTitle>
        </Alert>
      )}

      {/* Vehicle List */}
      {activeTab === 0 && (
        <div className="mb-6">
          {sortedVehicles.map(vehicleGroup => (
            <VehicleCard
              key={vehicleGroup.vehicle.id}
              vehicleGroup={vehicleGroup}
              expanded={expandedVehicles.has(vehicleGroup.vehicle.id)}
              onToggleExpand={() =>
                toggleVehicleExpansion(vehicleGroup.vehicle.id)
              }
              onEditDocument={handleEdit}
              onDeleteDocument={handleDelete}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center p-4">
              <Spinner size={32} />
            </div>
          )}

          {/* Load more button */}
          {hasMore && !loading && (
            <div className="flex justify-center p-4">
              <UnifiedButton variant="outline" onClick={loadMore}>
                Načítať viac ({totalCount - insurances.length} zostáva)
              </UnifiedButton>
            </div>
          )}

          {/* Error handling */}
          {error && (
            <Alert variant="destructive" className="m-4">
              <UnifiedIcon name="error" size={20} />
              <AlertTitle>
                {error instanceof Error ? error.message : String(error)}
              </AlertTitle>
            </Alert>
          )}
        </div>
      )}

      {/* Empty State */}
      {activeTab === 0 && sortedVehicles.length === 0 && !loading && (
        <UnifiedCard>
          <UnifiedIcon
            name="security"
            size={64}
            className="text-muted-foreground mb-4"
          />
          <UnifiedTypography
            variant="h6"
            color="textSecondary"
            className="mb-2"
          >
            {hasActiveFilters
              ? 'Žiadne vozidlá nevyhovujú filtrom'
              : 'Žiadne vozidlá s dokumentmi'}
          </UnifiedTypography>
          <UnifiedTypography
            variant="body2"
            color="textSecondary"
            className="mb-6"
          >
            {hasActiveFilters
              ? 'Skúste zmeniť filtre alebo vyhľadávanie'
              : 'Začnite pridaním prvého dokumentu'}
          </UnifiedTypography>
          {!hasActiveFilters && (
            <UnifiedButton
              variant="default"
              startIcon={<UnifiedIcon name="add" size={20} />}
              onClick={handleAdd}
              className="mt-4"
            >
              Pridať dokument
            </UnifiedButton>
          )}
        </UnifiedCard>
      )}

      {/* Insurance Claims Tab */}
      {activeTab === 1 && <InsuranceClaimList />}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <UnifiedButton
          variant="default"
          onClick={handleAdd}
          className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full w-14 h-14 p-0 shadow-lg z-50"
          aria-label="add"
        >
          <UnifiedIcon name="add" size={24} />
        </UnifiedButton>
      )}

      {/* Document Form Dialog */}
      {activeTab === 0 && openDialog && (
        <>
          {editingDocument ? (
            // Edit mode - use old UnifiedDocumentForm
            <UnifiedDialog
              open={openDialog}
              onClose={() => setOpenDialog(false)}
              maxWidth="lg"
              fullWidth
              fullScreen={isMobile}
              keepMounted={false}
              title="Upraviť dokument"
              subtitle="Upravte údaje dokumentu"
            >
              <UnifiedDocumentForm
                document={editingDocument}
                onSave={handleSave}
                onCancel={() => setOpenDialog(false)}
              />
            </UnifiedDialog>
          ) : (
            // Add mode - use new BatchDocumentForm (full screen overlay)
            <div className="fixed inset-0 z-50 bg-white overflow-auto">
              <BatchDocumentForm
                onSave={handleBatchSave}
                onCancel={() => setOpenDialog(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Vehicle Card Component
interface VehicleCardProps {
  vehicleGroup: VehicleWithDocuments;
  expanded: boolean;
  onToggleExpand: () => void;
  onEditDocument: (_doc: UnifiedDocument) => void;
  onDeleteDocument: (_doc: UnifiedDocument) => void;
  isMobile: boolean;
  isTablet: boolean;
}

function VehicleCard({
  vehicleGroup,
  expanded,
  onToggleExpand,
  onEditDocument,
  onDeleteDocument,
  isMobile,
  isTablet,
}: VehicleCardProps) {
  const { vehicle, documents, stats } = vehicleGroup;

  return (
    <InteractiveCard
      className={cn(
        'mb-4 overflow-hidden transition-all duration-200',
        isMobile ? 'rounded-lg' : 'rounded-xl',
        stats.hasProblems
          ? 'shadow-lg border border-red-200 hover:shadow-xl'
          : 'shadow-md hover:shadow-lg',
        !isMobile && 'hover:-translate-y-0.5'
      )}
    >
      {/* Responsive Vehicle Header */}
      <div
        className={cn(
          'cursor-pointer hover:bg-gray-50/50 transition-colors',
          isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8'
        )}
        onClick={onToggleExpand}
      >
        <div
          className={cn(
            'flex justify-between',
            isMobile
              ? 'flex-col items-start gap-4'
              : 'flex-row items-center gap-4'
          )}
        >
          <div
            className={cn(
              'flex items-center flex-1 min-w-0',
              isMobile ? 'w-full gap-3' : 'gap-4'
            )}
          >
            {/* Vehicle Avatar/Icon */}
            <Avatar
              className={cn(
                'flex-shrink-0',
                stats.hasProblems ? 'bg-red-600' : 'bg-blue-600',
                isMobile ? 'w-9 h-9' : isTablet ? 'w-10 h-10' : 'w-12 h-12'
              )}
            >
              <AvatarFallback>
                <UnifiedIcon
                  name="car"
                  size={isMobile ? 18 : isTablet ? 20 : 24}
                  className="text-white"
                />
              </AvatarFallback>
            </Avatar>

            {/* Vehicle Info */}
            <div>
              <UnifiedTypography
                variant={isMobile ? 'subtitle1' : isTablet ? 'h6' : 'h5'}
                className={cn(
                  'font-bold mb-2 leading-tight overflow-hidden text-ellipsis whitespace-nowrap',
                  isMobile ? 'text-base' : isTablet ? 'text-lg' : 'text-xl'
                )}
              >
                {vehicle.brand} {vehicle.model}
              </UnifiedTypography>
              <div>
                <UnifiedTypography
                  variant="body2"
                  color="textSecondary"
                  className={cn(
                    'flex flex-wrap items-center gap-2',
                    isMobile ? 'text-sm' : 'text-sm'
                  )}
                >
                  <span className="font-semibold">{vehicle.licensePlate}</span>
                  <span>•</span>
                  {!isMobile && (
                    <>
                      <span>VIN: {vehicle.vin || 'N/A'}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{stats.total} dokumentov</span>
                </UnifiedTypography>
                {isMobile && (
                  <UnifiedTypography
                    variant="caption"
                    color="textSecondary"
                    className="block text-xs mt-1"
                  >
                    VIN: {vehicle.vin || 'Neuvedené'}
                  </UnifiedTypography>
                )}
              </div>

              {/* Next expiry info */}
              {stats.nextExpiry && (
                <UnifiedTypography
                  variant="caption"
                  color="textSecondary"
                  className="block mt-2 text-xs"
                >
                  Najbližšia expirácia:{' '}
                  {format(stats.nextExpiry, 'dd.MM.yyyy', { locale: sk })}
                </UnifiedTypography>
              )}
            </div>
          </div>

          {/* Responsive Status Badges */}
          <div
            className={cn(
              'flex items-center flex-wrap',
              isMobile ? 'justify-between w-full gap-2' : 'justify-end gap-4'
            )}
          >
            {/* Status Chips */}
            <div className="flex gap-2 flex-wrap items-center">
              {stats.expired > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    'flex items-center gap-1',
                    isMobile ? 'text-xs h-6 px-2' : 'text-sm h-8 px-3'
                  )}
                >
                  <UnifiedIcon name="error" size={isMobile ? 12 : 14} />
                  <span className="font-medium">Vypršané</span>
                  <span className="ml-1 font-bold">{stats.expired}</span>
                </Badge>
              )}
              {stats.expiring > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200',
                    isMobile ? 'text-xs h-6 px-2' : 'text-sm h-8 px-3'
                  )}
                >
                  <UnifiedIcon name="clock" size={isMobile ? 12 : 14} />
                  <span className="font-medium">Vyprší</span>
                  <span className="ml-1 font-bold">{stats.expiring}</span>
                </Badge>
              )}
              {!stats.hasProblems && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'flex items-center gap-1 bg-green-100 text-green-800 border-green-200',
                    isMobile ? 'text-xs h-6 px-2' : 'text-sm h-8 px-3'
                  )}
                >
                  <UnifiedIcon name="check" size={isMobile ? 12 : 14} />
                  <span className="font-medium">
                    {isMobile ? 'OK' : 'V poriadku'}
                  </span>
                </Badge>
              )}
            </div>

            {/* Expand/Collapse Icon */}
            <UnifiedButton
              variant="ghost"
              onClick={e => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={cn('p-2 flex-shrink-0', isMobile ? 'ml-0' : 'ml-4')}
              aria-label={expanded ? 'Schovať dokumenty' : 'Zobraziť dokumenty'}
            >
              {expanded ? (
                <UnifiedIcon name="chevronUp" size={isMobile ? 20 : 24} />
              ) : (
                <UnifiedIcon name="chevronDown" size={isMobile ? 20 : 24} />
              )}
            </UnifiedButton>
          </div>
        </div>
      </div>

      {/* Expandable Documents List */}
      <Collapsible open={expanded}>
        <CollapsibleContent>
          <Separator />
          <div className="pt-0">
            {documents.map((doc, index) => (
              <DocumentListItem
                key={`${doc.type}-${doc.id || index}`}
                document={doc}
                onEdit={() => onEditDocument(doc)}
                onDelete={() => onDeleteDocument(doc)}
                isMobile={isMobile}
                isLast={index === documents.length - 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </InteractiveCard>
  );
}

// Document List Item Component
interface DocumentListItemProps {
  document: UnifiedDocument;
  onEdit: () => void;
  onDelete: () => void;
  isMobile: boolean;
  isLast: boolean;
}

function DocumentListItem({
  document,
  onEdit,
  onDelete,
  isMobile,
  isLast,
}: DocumentListItemProps) {
  const typeInfo = getDocumentTypeInfo(document.type);
  const expiryStatus = getExpiryStatus(document.validTo, document.type);

  return (
    <>
      <div
        className={cn(
          'flex transition-colors hover:bg-gray-50/50',
          isMobile
            ? 'flex-col items-stretch gap-4 py-4 px-6'
            : 'flex-row items-center gap-0 py-6 px-8'
        )}
      >
        {!isMobile && (
          <div className="min-w-10 mr-8">
            <div style={{ color: typeInfo.color }}>{typeInfo.icon}</div>
          </div>
        )}

        <div className={cn('flex-1', isMobile ? 'mr-0' : 'mr-8')}>
          <div
            className={cn(
              'flex gap-2 flex-wrap',
              isMobile ? 'flex-col items-start' : 'flex-row items-center'
            )}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {isMobile && (
                <div
                  style={{
                    color: typeInfo.color,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {typeInfo.icon}
                </div>
              )}
              <UnifiedTypography
                component="span"
                variant={isMobile ? 'subtitle2' : 'body1'}
                className={cn(
                  'font-semibold',
                  isMobile ? 'text-sm' : 'text-base'
                )}
              >
                {typeInfo.label}
                {document.type === 'vignette' && document.country && (
                  <span className="ml-2">
                    {document.country === 'SK' && '🇸🇰'}
                    {document.country === 'CZ' && '🇨🇿'}
                    {document.country === 'AT' && '🇦🇹'}
                    {document.country === 'HU' && '🇭🇺'}
                    {document.country === 'SI' && '🇸🇮'}
                  </span>
                )}
              </UnifiedTypography>
              {(document.policyNumber ||
                document.documentNumber ||
                document.kmState ||
                (document.type === 'vignette' && document.isRequired)) && (
                <UnifiedTypography
                  component="span"
                  variant="body2"
                  color="textSecondary"
                  className={cn('font-mono', isMobile ? 'text-xs' : 'text-sm')}
                >
                  {document.type === 'vignette' && document.isRequired
                    ? '⚠️ Povinná'
                    : document.type === 'stk' || document.type === 'ek'
                      ? document.kmState
                        ? `${document.kmState.toLocaleString()} km`
                        : document.documentNumber
                      : document.type === 'insurance_kasko' && document.kmState
                        ? `${document.kmState.toLocaleString()} km`
                        : document.policyNumber || document.documentNumber}
                </UnifiedTypography>
              )}
            </div>
          </div>
        </div>

        <div className={cn('block', isMobile ? 'mt-2' : 'mt-1')}>
          <div
            className={cn(
              'flex flex-wrap',
              isMobile
                ? 'flex-col items-start gap-2'
                : 'flex-row items-center gap-4'
            )}
          >
            {/* Date and Status Row */}
            <div
              className={cn('flex items-center', isMobile ? 'gap-2' : 'gap-3')}
            >
              <UnifiedTypography
                component="span"
                variant="body2"
                color="textSecondary"
                className={cn(isMobile ? 'text-xs' : 'text-sm')}
              >
                {(() => {
                  try {
                    const date =
                      typeof document.validTo === 'string'
                        ? parseISO(document.validTo)
                        : document.validTo;
                    return isValid(date)
                      ? `Platné do ${format(date, 'dd.MM.yyyy', { locale: sk })}`
                      : 'Neplatný dátum';
                  } catch {
                    return 'Neplatný dátum';
                  }
                })()}
              </UnifiedTypography>

              <UnifiedChip
                label={expiryStatus.text}
                variant="default"
                className={cn(
                  isMobile ? 'text-xs h-5' : 'text-xs h-6',
                  expiryStatus.status === 'expired'
                    ? 'bg-red-100 text-red-800'
                    : expiryStatus.status === 'expiring'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-green-100 text-green-800'
                )}
              />
            </div>

            {/* Company and Price Row */}
            <div className="flex items-center gap-3">
              {document.company && (
                <UnifiedTypography
                  component="span"
                  variant="body2"
                  color="textSecondary"
                  className={cn(
                    'font-medium',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}
                >
                  {document.company}
                </UnifiedTypography>
              )}

              {document.price && (
                <UnifiedTypography
                  component="span"
                  variant="body2"
                  color="primary"
                  className={cn(
                    'font-semibold text-primary',
                    isMobile ? 'text-xs' : 'text-sm'
                  )}
                >
                  €{document.price.toFixed(2)}
                </UnifiedTypography>
              )}
            </div>
          </div>

          {/* Green Card info for insurance */}
          {(document.type === 'insurance_pzp' ||
            document.type === 'insurance_kasko' ||
            document.type === 'insurance_pzp_kasko') &&
            document.originalData &&
            'greenCardValidTo' in document.originalData &&
            document.originalData.greenCardValidTo && (
              <div className="mt-2 flex items-center gap-2">
                <UnifiedTypography
                  component="span"
                  variant="caption"
                  color="textSecondary"
                >
                  🟢 Biela karta:
                </UnifiedTypography>
                <UnifiedTypography
                  component="span"
                  variant="caption"
                  color="textSecondary"
                >
                  {(() => {
                    try {
                      const date =
                        typeof document.originalData.greenCardValidTo ===
                        'string'
                          ? parseISO(document.originalData.greenCardValidTo)
                          : document.originalData.greenCardValidTo;
                      return isValid(date)
                        ? format(date, 'dd.MM.yyyy', { locale: sk })
                        : 'Neplatný';
                    } catch {
                      return 'Neplatný';
                    }
                  })()}
                </UnifiedTypography>
                <span>
                  <UnifiedChip
                    label={
                      getExpiryStatus(
                        document.originalData.greenCardValidTo,
                        'greencard'
                      ).text
                    }
                    variant="default"
                    className="h-8 px-3 text-sm border border-gray-300"
                  />
                </span>
              </div>
            )}

          {/* Files */}
          {(() => {
            const filePaths =
              (document.originalData as Insurance)?.filePaths ||
              (document.filePath ? [document.filePath] : []);

            if (filePaths.length > 0) {
              return (
                <div>
                  <UnifiedIcon
                    name="file"
                    size={16}
                    className="text-muted-foreground"
                  />
                  {filePaths.length === 1 ? (
                    <UnifiedButton
                      className="h-8 px-3 text-sm min-w-auto p-2"
                      variant="ghost"
                      onClick={() => window.open(filePaths[0], '_blank')}
                    >
                      Zobraziť súbor
                    </UnifiedButton>
                  ) : (
                    <span>
                      <UnifiedChip
                        label={`${filePaths.length} súborov`}
                        className="h-8 px-3 text-sm"
                        variant="default"
                        onClick={() => {
                          // ZIP download logic here
                          console.log('Download ZIP for files:', filePaths);
                        }}
                      />
                    </span>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Responsive Action Buttons */}
        {isMobile ? (
          <div>
            <UnifiedButton
              className="h-8 px-3 text-sm"
              variant="outline"
              startIcon={<UnifiedIcon name="edit" size={16} />}
              onClick={onEdit}
            >
              Upraviť
            </UnifiedButton>
            <UnifiedButton
              className="h-8 px-3 text-sm"
              variant="outline"
              color="error"
              startIcon={<UnifiedIcon name="delete" size={16} />}
              onClick={onDelete}
            >
              Vymazať
            </UnifiedButton>
          </div>
        ) : (
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <UnifiedButton
                  variant="ghost"
                  className="h-8 px-3 text-sm text-primary p-2"
                  onClick={onEdit}
                >
                  <UnifiedIcon name="edit" size={18} />
                </UnifiedButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upraviť</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <UnifiedButton
                  variant="ghost"
                  className="h-8 px-3 text-sm text-error p-2"
                  onClick={onDelete}
                >
                  <UnifiedIcon name="delete" size={18} />
                </UnifiedButton>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vymazať</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      {!isLast && <Separator className="mx-6" />}
    </>
  );
}
