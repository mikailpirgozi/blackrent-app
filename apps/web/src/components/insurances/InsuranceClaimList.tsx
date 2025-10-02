import { UnifiedIcon } from '../ui/UnifiedIcon';
import { UnifiedCard } from '../ui/UnifiedCard';
import { UnifiedChip } from '../ui/UnifiedChip';
import { H1, H4, H6, Body2, Caption } from '../ui/UnifiedTypography';
import { Spinner } from '../ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useMemo, useState } from 'react';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useDeleteInsuranceClaim,
  useInsuranceClaims,
} from '@/lib/react-query/hooks/useInsuranceClaims';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { InsuranceClaim } from '../../types';

import InsuranceClaimForm from './InsuranceClaimForm';

const getIncidentTypeInfo = (type: string) => {
  switch (type) {
    case 'accident':
      return { label: 'Nehoda', color: '#d32f2f', bgColor: '#ffebee' };
    case 'theft':
      return { label: 'Krádež', color: '#7b1fa2', bgColor: '#f3e5f5' };
    case 'vandalism':
      return { label: 'Vandalizmus', color: '#f57c00', bgColor: '#fff3e0' };
    case 'weather':
      return { label: 'Počasie', color: '#1976d2', bgColor: '#e3f2fd' };
    default:
      return { label: 'Iné', color: '#616161', bgColor: '#f5f5f5' };
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'reported':
      return {
        label: 'Nahlásené',
        color: '#f57c00',
        bgColor: '#fff3e0',
        icon: <UnifiedIcon name="clock" size={14} />,
      };
    case 'investigating':
      return {
        label: 'Vyšetruje sa',
        color: '#1976d2',
        bgColor: '#e3f2fd',
        icon: <UnifiedIcon name="search" size={14} />,
      };
    case 'approved':
      return {
        label: 'Schválené',
        color: '#388e3c',
        bgColor: '#e8f5e8',
        icon: <UnifiedIcon name="check" size={14} />,
      };
    case 'rejected':
      return {
        label: 'Zamietnuté',
        color: '#d32f2f',
        bgColor: '#ffebee',
        icon: <UnifiedIcon name="error" size={14} />,
      };
    case 'closed':
      return {
        label: 'Uzavreté',
        color: '#616161',
        bgColor: '#f5f5f5',
        icon: <UnifiedIcon name="check" size={14} />,
      };
    default:
      return {
        label: 'Neznáme',
        color: '#616161',
        bgColor: '#f5f5f5',
        icon: <UnifiedIcon name="warning" size={14} />,
      };
  }
};

export default function InsuranceClaimList() {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: insuranceClaims = [] } = useInsuranceClaims();
  const { data: vehicles = [] } = useVehicles();
  const deleteInsuranceClaimMutation = useDeleteInsuranceClaim();

  // Helper functions for compatibility
  const createInsuranceClaim = async (claim: InsuranceClaim) => {
    // TODO: Implement createInsuranceClaim in React Query hooks
    console.warn(
      'createInsuranceClaim not yet implemented in React Query hooks',
      claim
    );
  };
  const updateInsuranceClaim = async (claim: InsuranceClaim) => {
    // TODO: Implement updateInsuranceClaim in React Query hooks
    console.warn(
      'updateInsuranceClaim not yet implemented in React Query hooks',
      claim
    );
  };
  const deleteInsuranceClaim = async (id: string) => {
    return deleteInsuranceClaimMutation.mutateAsync(id);
  };

  // Media queries using window.innerWidth
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
      setIsTablet(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);

  // Get insurance claims from React Query
  const claims = insuranceClaims || [];

  // Filter claims
  const filteredClaims = useMemo(() => {
    const claims = insuranceClaims || [];
    return claims.filter(claim => {
      const matchesSearch =
        !searchQuery ||
        claim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (claim.claimNumber &&
          claim.claimNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (claim.location &&
          claim.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesVehicle =
        !filterVehicle || filterVehicle === 'all-vehicles' || claim.vehicleId === filterVehicle;
      const matchesStatus = !filterStatus || filterStatus === 'all-statuses' || claim.status === filterStatus;
      const matchesType = !filterType || filterType === 'all-types' || claim.incidentType === filterType;

      return matchesSearch && matchesVehicle && matchesStatus && matchesType;
    });
  }, [insuranceClaims, searchQuery, filterVehicle, filterStatus, filterType]);

  // Paginated claims
  const paginatedClaims = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredClaims.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredClaims, page, rowsPerPage]);

  const handleAdd = () => {
    setEditingClaim(null);
    setOpenDialog(true);
  };

  const handleEdit = (claim: InsuranceClaim) => {
    setEditingClaim(claim);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať túto poistnú udalosť?')) {
      try {
        await deleteInsuranceClaim(id);
      } catch (error) {
        console.error('Chyba pri mazaní poistnej udalosti:', error);
      }
    }
  };

  const handleSave = async (claimData: InsuranceClaim) => {
    try {
      if (editingClaim && editingClaim.id) {
        await updateInsuranceClaim(claimData);
      } else {
        await createInsuranceClaim(claimData);
      }
      setOpenDialog(false);
      setEditingClaim(null);
    } catch (error) {
      console.error('Chyba pri ukladaní poistnej udalosti:', error);
      console.error(
        'Chyba pri ukladaní poistnej udalosti: ' +
          (error instanceof Error ? error.message : 'Neznáma chyba')
      );
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterVehicle('');
    setFilterStatus('');
    setFilterType('');
  };

  const hasActiveFilters =
    searchQuery || filterVehicle || filterStatus || filterType;

  // Pagination handlers are now inline in the JSX

  if (!insuranceClaims) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full max-w-full overflow-hidden">
      {/* Responsive Header */}
      <UnifiedCard
        variant="elevated"
        className="mb-4 sm:mb-6 shadow-lg rounded-lg sm:rounded-xl"
      >
        <div className="relative text-white bg-gradient-to-br from-red-600 to-red-800 p-4 sm:p-5 md:p-6 rounded-t-lg sm:rounded-t-xl">
          <div
            className={cn(
              "flex",
              isMobile ? "flex-col items-start" : "flex-row items-center",
              "justify-between",
              "gap-2"
            )}
          >
            <div
              className={cn(
                "flex items-center",
                "gap-1.5 sm:gap-2",
                isMobile ? "w-full" : "w-auto"
              )}
            >
              <UnifiedIcon
                name="claim"
                size={isMobile ? 24 : isTablet ? 28 : 32}
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <H1
                  className={cn(
                    "font-bold mb-0.5 leading-tight",
                    isMobile ? "text-lg" : isTablet ? "text-xl" : "text-2xl lg:text-3xl"
                  )}
                >
                  {isMobile ? 'Poistné udalosti' : 'Poistné udalosti'}
                </H1>
                <Body2
                  className={cn(
                    "opacity-90",
                    isMobile ? "text-sm" : "text-base"
                  )}
                >
                  {claims.length} udalostí celkom
                </Body2>
              </div>
            </div>

            {!isMobile && (
              <Button
                onClick={handleAdd}
                size={isTablet ? "default" : "lg"}
                className="bg-white/20 backdrop-blur-sm border border-white/30 whitespace-nowrap flex-shrink-0 hover:bg-white/30"
              >
                <UnifiedIcon name="plus" size={16} className="mr-2" />
                Pridať udalosť
              </Button>
            )}
          </div>
        </div>
      </UnifiedCard>

      {/* Responsive Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 mb-2 sm:mb-3">
        <div className="col-span-1">
          <Card
            className={cn(
              "h-full bg-gradient-to-br from-orange-500 to-orange-600 text-white",
              "min-h-20 sm:min-h-24 md:min-h-28",
              "rounded-lg sm:rounded-xl",
              "transition-transform duration-200 ease-in-out",
              !isMobile && "hover:-translate-y-0.5"
            )}
          >
            <CardContent className="p-3 sm:p-4 md:p-5">
              <div
                className={cn(
                  "flex justify-between items-center",
                  isMobile ? "flex-col text-center gap-1" : "flex-row text-left gap-0"
                )}
              >
                <div className={cn(isMobile ? "order-2" : "order-1")}>
                  <Caption
                    className={cn(
                      "font-semibold tracking-wider mb-0.5 sm:mb-1",
                      isMobile ? "text-xs" : isTablet ? "text-sm" : "text-base"
                    )}
                  >
                    CELKOM
                  </Caption>
                  <H4
                    className={cn(
                      "font-bold",
                      isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl"
                    )}
                  >
                    {claims.length}
                  </H4>
                </div>
                <UnifiedIcon
                  name="claim"
                  size={isMobile ? 20 : isTablet ? 32 : 40}
                  className={cn(
                    "opacity-80",
                    isMobile ? "order-1" : "order-2"
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card
            className="h-full bg-gradient-to-br from-blue-500 to-blue-700 text-white min-h-24 sm:min-h-28"
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center flex-col sm:flex-row text-center sm:text-left gap-1 sm:gap-0">
                <div>
                  <H6 className="font-semibold text-xs sm:text-xl">
                    VYŠETRUJE SA
                  </H6>
                  <H4 className="font-bold text-2xl sm:text-3xl">
                    {claims.filter(c => c.status === 'investigating').length}
                  </H4>
                </div>
                <UnifiedIcon
                  name="search"
                  size={isMobile ? 24 : 40}
                  className="opacity-80 hidden sm:block"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card
            className="h-full bg-gradient-to-br from-green-500 to-green-700 text-white min-h-24 sm:min-h-28"
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center flex-col sm:flex-row text-center sm:text-left gap-1 sm:gap-0">
                <div>
                  <H6 className="font-semibold text-xs sm:text-xl">
                    SCHVÁLENÉ
                  </H6>
                  <H4 className="font-bold text-2xl sm:text-3xl">
                    {claims.filter(c => c.status === 'approved').length}
                  </H4>
                </div>
                <UnifiedIcon
                  name="check"
                  size={isMobile ? 24 : 40}
                  className="opacity-80 hidden sm:block"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card
            className="h-full bg-gradient-to-br from-red-500 to-red-700 text-white min-h-24 sm:min-h-28"
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center flex-col sm:flex-row text-center sm:text-left gap-1 sm:gap-0">
                <div>
                  <H6 className="font-semibold text-xs sm:text-xl">
                    ZAMIETNUTÉ
                  </H6>
                  <H4 className="font-bold text-2xl sm:text-3xl">
                    {claims.filter(c => c.status === 'rejected').length}
                  </H4>
                </div>
                <UnifiedIcon
                  name="error"
                  size={isMobile ? 24 : 40}
                  className="opacity-80 hidden sm:block"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-3 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div
            className={cn(
              "flex gap-1 sm:gap-2",
              showFilters ? "mb-4" : "mb-0",
              "flex-col sm:flex-row",
              "items-stretch sm:items-center"
            )}
          >
            <div className="relative flex-1 min-w-0 sm:min-w-64 mb-1 sm:mb-0">
              <UnifiedIcon
                name="search"
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Vyhľadať udalosť..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 flex-row justify-between sm:justify-start">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 flex-1 sm:flex-none"
              >
                <UnifiedIcon name="filter" size={isMobile ? 18 : 20} className="mr-2" />
                <span className="hidden sm:inline">
                  Filtre{' '}
                  {hasActiveFilters &&
                    `(${[searchQuery, filterVehicle, filterStatus, filterType].filter(Boolean).length})`}
                </span>
                <span className="sm:hidden">
                  Filtre
                </span>
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="whitespace-nowrap text-sm sm:text-base px-4 sm:px-6 flex-1 sm:flex-none"
                >
                  <UnifiedIcon name="close" size={isMobile ? 18 : 20} className="mr-2" />
                  <span className="hidden sm:inline">
                    Vyčistiť
                  </span>
                  <span className="sm:hidden">
                    Reset
                  </span>
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-filter">Vozidlo</Label>
                <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                  <SelectTrigger id="vehicle-filter">
                    <SelectValue placeholder="Všetky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-vehicles">Všetky</SelectItem>
                    {vehicles?.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        <div className="flex flex-col text-sm">
                          <span>
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <Caption className="text-muted-foreground">
                            {vehicle.licensePlate}
                          </Caption>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter">Stav</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Všetky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">Všetky</SelectItem>
                    <SelectItem value="reported">Nahlásené</SelectItem>
                    <SelectItem value="investigating">Vyšetruje sa</SelectItem>
                    <SelectItem value="approved">Schválené</SelectItem>
                    <SelectItem value="rejected">Zamietnuté</SelectItem>
                    <SelectItem value="closed">Uzavreté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-filter">Typ udalosti</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Všetky" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-types">Všetky</SelectItem>
                    <SelectItem value="accident">Nehoda</SelectItem>
                    <SelectItem value="theft">Krádež</SelectItem>
                    <SelectItem value="vandalism">Vandalizmus</SelectItem>
                    <SelectItem value="weather">Počasie</SelectItem>
                    <SelectItem value="other">Iné</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claims Table/Cards */}
      {filteredClaims.length === 0 ? (
        <Card className="text-center py-8 sm:py-12">
          <CardContent>
            <UnifiedIcon
              name="claim"
              size={isMobile ? 48 : 64}
              className="text-muted-foreground mb-4"
            />
            <H6 className="mb-2 text-base sm:text-xl text-muted-foreground">
              {hasActiveFilters ? 'Žiadne výsledky' : 'Žiadne poistné udalosti'}
            </H6>
            <Body2 className="text-muted-foreground mb-6">
              {hasActiveFilters
                ? 'Skúste zmeniť filter alebo vyhľadávací výraz'
                : 'Zatiaľ neboli vytvorené žiadne poistné udalosti'}
            </Body2>
            {!hasActiveFilters && (
              <Button
                onClick={handleAdd}
                size="default"
              >
                <UnifiedIcon name="plus" size={16} className="mr-2" />
                Pridať prvú udalosť
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">
                      Dátum udalosti
                    </TableHead>
                    <TableHead className="font-semibold">Vozidlo</TableHead>
                    <TableHead className="font-semibold">Typ</TableHead>
                    <TableHead className="font-semibold">Popis</TableHead>
                    <TableHead className="font-semibold">Stav</TableHead>
                    <TableHead className="font-semibold">Škoda</TableHead>
                    <TableHead className="font-semibold">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClaims.map(claim => {
                    const vehicle = vehicles?.find(
                      v => v.id === claim.vehicleId
                    );
                    const typeInfo = getIncidentTypeInfo(claim.incidentType);
                    const statusInfo = getStatusInfo(claim.status);

                    return (
                      <TableRow key={claim.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UnifiedIcon
                              name="event"
                              size={18}
                              className="text-muted-foreground"
                            />
                            {format(
                              new Date(claim.incidentDate),
                              'dd.MM.yyyy',
                              { locale: sk }
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UnifiedIcon
                              name="car"
                              size={18}
                              className="text-blue-600"
                            />
                            <div>
                              <div>
                                {vehicle
                                  ? `${vehicle.brand} ${vehicle.model}`
                                  : 'Neznáme vozidlo'}
                              </div>
                              <Caption className="text-muted-foreground">
                                {vehicle?.licensePlate}
                              </Caption>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UnifiedChip
                            label={typeInfo.label}
                            className="h-8 px-3 text-sm"
                            style={{
                              backgroundColor: typeInfo.bgColor,
                              color: typeInfo.color,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Body2 className="max-w-48">
                            {claim.description.length > 50
                              ? `${claim.description.substring(0, 50)}...`
                              : claim.description}
                          </Body2>
                          {claim.location && (
                            <Caption className="text-muted-foreground">
                              📍 {claim.location}
                            </Caption>
                          )}
                        </TableCell>
                        <TableCell>
                          <UnifiedChip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            className="h-8 px-3 text-sm"
                            style={{
                              backgroundColor: statusInfo.bgColor,
                              color: statusInfo.color,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {claim.estimatedDamage ? (
                            <div className="flex items-center gap-2">
                              <UnifiedIcon
                                name="euro"
                                size={16}
                                className="text-muted-foreground"
                              />
                              {claim.estimatedDamage.toLocaleString()} €
                            </div>
                          ) : (
                            <Body2 className="text-muted-foreground">
                              -
                            </Body2>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(claim)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                >
                                  <UnifiedIcon name="edit" size={18} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Upraviť</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(claim.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <UnifiedIcon name="delete" size={18} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Vymazať</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden">
            <div className="grid grid-cols-1 gap-4">
              {paginatedClaims.map(claim => {
                const vehicle = vehicles?.find(v => v.id === claim.vehicleId);
                const typeInfo = getIncidentTypeInfo(claim.incidentType);
                const statusInfo = getStatusInfo(claim.status);

                return (
                  <div key={claim.id}>
                    <Card
                      className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow"
                    >
                      <CardContent className="p-4">
                        {/* Header with date and actions */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <UnifiedIcon
                              name="event"
                              size={18}
                              className="text-muted-foreground"
                            />
                            <Body2 className="font-semibold">
                              {format(
                                new Date(claim.incidentDate),
                                'dd.MM.yyyy',
                                { locale: sk }
                              )}
                            </Body2>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(claim)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            >
                              <UnifiedIcon name="edit" size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(claim.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <UnifiedIcon name="delete" size={16} />
                            </Button>
                          </div>
                        </div>

                        {/* Vehicle info */}
                        <div className="flex items-center gap-2 mb-4">
                          <UnifiedIcon
                            name="car"
                            size={18}
                            className="text-blue-600"
                          />
                          <div>
                            <Body2 className="font-semibold">
                              {vehicle
                                ? `${vehicle.brand} ${vehicle.model}`
                                : 'Neznáme vozidlo'}
                            </Body2>
                            <Caption className="text-muted-foreground">
                              {vehicle?.licensePlate}
                            </Caption>
                          </div>
                        </div>

                        {/* Type and Status */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                          <UnifiedChip
                            label={typeInfo.label}
                            className="h-8 px-3 text-sm"
                            style={{
                              backgroundColor: typeInfo.bgColor,
                              color: typeInfo.color,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                          <UnifiedChip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            className="h-8 px-3 text-sm"
                            style={{
                              backgroundColor: statusInfo.bgColor,
                              color: statusInfo.color,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                        </div>

                        {/* Description */}
                        <Body2 className="mb-2 leading-relaxed">
                          {claim.description}
                        </Body2>

                        {/* Location */}
                        {claim.location && (
                          <Caption className="text-muted-foreground mb-4 block">
                            📍 {claim.location}
                          </Caption>
                        )}

                        {/* Damage amount */}
                        {claim.estimatedDamage && (
                          <div className="flex items-center gap-2 mt-2">
                            <UnifiedIcon
                              name="euro"
                              size={16}
                              className="text-muted-foreground"
                            />
                            <Body2 className="font-semibold text-primary">
                              {claim.estimatedDamage.toLocaleString()} €
                            </Body2>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-2 sm:p-4">
            <div className="flex items-center gap-2 text-sm">
              <span>Riadkov na stránku:</span>
              <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredClaims.length)} z {filteredClaims.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Predchádzajúca
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(Math.ceil(filteredClaims.length / rowsPerPage) - 1, page + 1))}
                disabled={page >= Math.ceil(filteredClaims.length / rowsPerPage) - 1}
              >
                Ďalšia
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Responsive Floating Action Button for Mobile */}
      {isMobile && (
        <Button
          onClick={handleAdd}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/30"
          size="lg"
        >
          <UnifiedIcon name="plus" size={24} />
        </Button>
      )}

      {/* Responsive Insurance Claim Form Dialog */}
      {openDialog && (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className={cn(
            "max-w-5xl w-full",
            isMobile ? "h-screen max-h-screen rounded-none overflow-y-auto" : "max-h-[90vh] rounded-lg"
          )}>
            <DialogHeader>
              <DialogTitle>
                {editingClaim ? 'Upraviť poistnú udalosť' : 'Nová poistná udalosť'}
              </DialogTitle>
            </DialogHeader>
            <InsuranceClaimForm
              claim={editingClaim}
              onSave={handleSave}
              onCancel={() => setOpenDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
