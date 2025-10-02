import {
  Trash2 as DeleteIcon,
  Download as DownloadIcon,
  Edit2 as EditIcon,
  Mail as EmailIcon,
  Filter as FilterListIcon,
  History as HistoryIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// import { useApp } from '../../context/AppContext'; // ❌ REMOVED - migrated to React Query
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/lib/react-query/hooks/useCustomers';
import {
  useRentals,
  useUpdateRental,
} from '@/lib/react-query/hooks/useRentals';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import type { Customer, Rental } from '../../types';
import { textContains } from '../../utils/textNormalization';
// Removed duplicate import - using shadcn/ui imports from above

import CustomerForm from './CustomerForm';
import CustomerRentalHistory from './CustomerRentalHistory';
import PremiumCustomerCard from './PremiumCustomerCard';

export default function CustomerListNew() {
  // ✅ MIGRATED: React Query hooks instead of AppContext
  const { data: customers = [] } = useCustomers();
  const { data: rentals = [] } = useRentals();
  const { data: vehicles = [] } = useVehicles();
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();
  const updateRentalMutation = useUpdateRental();

  // Helper functions for compatibility
  const createCustomer = async (customer: Customer) => {
    return createCustomerMutation.mutateAsync(customer);
  };
  const updateCustomer = async (customer: Customer) => {
    return updateCustomerMutation.mutateAsync(customer);
  };
  const deleteCustomer = async (id: string) => {
    return deleteCustomerMutation.mutateAsync(id);
  };
  const updateRental = async (rental: Rental) => {
    return updateRentalMutation.mutateAsync(rental);
  };
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] =
    useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [showWithEmail, setShowWithEmail] = useState(true);
  const [showWithoutEmail, setShowWithoutEmail] = useState(true);
  const [showWithPhone, setShowWithPhone] = useState(true);
  const [showWithoutPhone, setShowWithoutPhone] = useState(true);

  // 🚀 INFINITE SCROLL STATES
  const [displayedCustomers, setDisplayedCustomers] = useState(20); // Start with 20 items
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handlers
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Naozaj chcete vymazať tohto zákazníka?')) {
      try {
        setLoading(true);
        await deleteCustomer(customerId);
      } catch (error) {
        console.error('Error deleting customer:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShowHistory = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  };

  // CSV funkcionalita
  const handleExportCSV = async () => {
    try {
      const { apiService } = await import('../../services/api');
      const blob = await apiService.exportCustomersCSV();
      const filename = `zakaznici-${new Date().toISOString().split('T')[0]}.csv`;
      saveAs(blob, filename);

      window.alert('CSV export úspešný');
    } catch (error) {
      console.error('CSV export error:', error);
      window.alert('Chyba pri CSV exporte');
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<any>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: async (results: { data: unknown[][] }) => {
        try {
          // Konvertuj parsované dáta späť na CSV string
          const csvString = Papa.unparse(results.data);

          const { apiService } = await import('../../services/api');
          const result = (await apiService.importCustomersCSV(csvString)) as {
            success: boolean;
            message?: string;
            error?: string;
          };

          if (result.success) {
            window.alert(result.message);
            // Refresh customer list - force reload
            window.location.reload();
          } else {
            window.alert(result.error || 'Chyba pri importe');
          }
        } catch (error) {
          console.error('CSV import error:', error);
          window.alert('Chyba pri CSV importe');
        }
      },
      header: false,
      skipEmptyLines: true,
    });

    // Reset input
    event.target.value = '';
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (customerData: Customer) => {
    try {
      setLoading(true);
      if (editingCustomer) {
        await updateCustomer(customerData);
      } else {
        await createCustomer(customerData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExistingCustomers = async () => {
    try {
      setLoading(true);
      // Získam všetkých unikátnych zákazníkov z prenájmov
      const existingCustomerNames = Array.from(
        new Set(rentals.map(r => r.customerName).filter(Boolean))
      );

      // Filtrujem len tie, ktoré ešte neexistujú v customers
      const newCustomerNames = existingCustomerNames.filter(
        name => !customers?.some(c => c.name === name)
      );

      if (newCustomerNames.length === 0) {
        window.alert('Všetci zákazníci z prenájmov už existujú v zozname zákazníkov.');
        return;
      }

      // Vytvorím nových zákazníkov
      const newCustomers = newCustomerNames.map(name => ({
        id: uuidv4(),
        name: name,
        email: '',
        phone: '',
        createdAt: new Date(),
      }));

      // Uložím ich do databázy pomocou API
      for (const customer of newCustomers) {
        await createCustomer(customer);
      }

      // Prepojím existujúce prenájmy so zákazníkmi
      for (const rental of rentals) {
        if (rental.customerName && !rental.customerId) {
          const customer =
            newCustomers.find(c => c.name === rental.customerName) ||
            (customers || []).find(c => c.name === rental.customerName);
          if (customer) {
            await updateRental({
              ...rental,
              customerId: customer.id,
              customer: customer,
            });
          }
        }
      }

      window.alert(
        `Pridaných ${newCustomers.length} zákazníkov z existujúcich prenájmov a prepojených s prenájmi.`
      );
    } catch (error) {
      console.error('Chyba pri importe zákazníkov:', error);
      window.alert('Chyba pri importe zákazníkov');
    } finally {
      setLoading(false);
    }
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Search filter
      if (searchQuery) {
        if (
          !textContains(customer.name, searchQuery) &&
          !textContains(customer.email, searchQuery) &&
          !textContains(customer.phone, searchQuery)
        ) {
          return false;
        }
      }

      // Name filter (ignore default "all-names" value)
      if (filterName && filterName !== 'all-names' && !textContains(customer.name, filterName)) {
        return false;
      }

      // Email filter (ignore default "all-emails" value)
      if (filterEmail && filterEmail !== 'all-emails' && !textContains(customer.email, filterEmail)) {
        return false;
      }

      // Phone filter (ignore default "all-phones" value)
      if (filterPhone && filterPhone !== 'all-phones' && !textContains(customer.phone, filterPhone)) {
        return false;
      }

      // Email/Phone existence filters
      const hasEmail = !!customer.email;
      const hasPhone = !!customer.phone;

      if (!showWithEmail && hasEmail) return false;
      if (!showWithoutEmail && !hasEmail) return false;
      if (!showWithPhone && hasPhone) return false;
      if (!showWithoutPhone && !hasPhone) return false;

      return true;
    });
  }, [
    customers,
    searchQuery,
    filterName,
    filterEmail,
    filterPhone,
    showWithEmail,
    showWithoutEmail,
    showWithPhone,
    showWithoutPhone,
  ]);

  // 🚀 INFINITE SCROLL LOGIC (after filteredCustomers definition)
  const loadMoreCustomers = useCallback(() => {
    if (isLoadingMore || displayedCustomers >= filteredCustomers.length) return;

    setIsLoadingMore(true);

    // Simulate loading delay for better UX
    window.setTimeout(() => {
      setDisplayedCustomers(prev =>
        Math.min(prev + 20, filteredCustomers.length)
      );
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, displayedCustomers, filteredCustomers.length]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCustomers(20);
  }, [
    searchQuery,
    filterName,
    filterEmail,
    filterPhone,
    showWithEmail,
    showWithoutEmail,
    showWithPhone,
    showWithoutPhone,
  ]);

  // Infinite scroll event handler
  // const handleScroll = useCallback(
  //   (e: React.UIEvent<HTMLDivElement>) => {
  //     const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

  //     // Load more when user scrolls to 80% of the content
  //     if (scrollTop + clientHeight >= scrollHeight * 0.8) {
  //       loadMoreCustomers();
  //     }
  //   },
  //   [loadMoreCustomers]
  // );

  // Get customers to display (limited by infinite scroll)
  const customersToDisplay = useMemo(() => {
    return filteredCustomers.slice(0, displayedCustomers);
  }, [filteredCustomers, displayedCustomers]);

  const hasMore = displayedCustomers < filteredCustomers.length;

  // Get customer rental count
  const getCustomerRentalCount = (customerId: string) => {
    return rentals.filter(rental => rental.customerId === customerId).length;
  };

  // Generate unique options for dropdown filters
  const uniqueNames = useMemo(() => {
    return Array.from(new Set(customers.map(c => c.name).filter(Boolean))).sort();
  }, [customers]);

  const uniqueEmails = useMemo(() => {
    return Array.from(new Set(customers.map(c => c.email).filter(Boolean))).sort();
  }, [customers]);

  const uniquePhones = useMemo(() => {
    return Array.from(new Set(customers.map(c => c.phone).filter(Boolean))).sort();
  }, [customers]);

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-col sm:flex-row gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">
          👥 Databáza zákazníkov
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleImportExistingCustomers}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            <UploadIcon className="h-4 w-4 mr-2" />
            Import z prenájmov
          </Button>
          {/* CSV tlačidlá - len na desktope */}
          {!isMobile && (
            <>
              <Button
                onClick={handleExportCSV}
                size="sm"
                variant="outline"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                📊 Export CSV
              </Button>

              <label className="inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-600 hover:border-blue-700 hover:bg-blue-50"
                  onClick={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.parentElement?.querySelector('input');
                    if (input) input.click();
                  }}
                >
                  📥 Import CSV
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </label>
            </>
          )}

          <Button
           
            onClick={() => setOpenDialog(true)}
           
          >
            Nový zákazník
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              className="w-full pl-10"
              placeholder="Hľadať zákazníkov..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-10 w-10 p-0 ${filtersOpen ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <FilterListIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <Collapsible open={filtersOpen}>
          <CollapsibleContent>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter meno</Label>
                <Select
                  value={filterName}
                  onValueChange={setFilterName}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky mená" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-names">Všetky mená</SelectItem>
                    {uniqueNames.map(name => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter email</Label>
                <Select
                  value={filterEmail}
                  onValueChange={setFilterEmail}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky emaily" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-emails">Všetky emaily</SelectItem>
                    {uniqueEmails.map(email => (
                      <SelectItem key={email} value={email}>
                        {email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter telefón</Label>
                <Select
                  value={filterPhone}
                  onValueChange={setFilterPhone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všetky telefóny" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-phones">Všetky telefóny</SelectItem>
                    {uniquePhones.map(phone => (
                      <SelectItem key={phone} value={phone}>
                        {phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Info Checkboxes */}
            <div className="mt-4 pb-2">
              <p className="text-sm font-medium mb-3">
                Zobraziť zákazníkov:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-with-email"
                    checked={showWithEmail}
                    onCheckedChange={(checked) => setShowWithEmail(checked as boolean)}
                  />
                  <Label htmlFor="show-with-email" className="text-sm font-normal cursor-pointer">
                    S emailom
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-without-email"
                    checked={showWithoutEmail}
                    onCheckedChange={(checked) => setShowWithoutEmail(checked as boolean)}
                  />
                  <Label htmlFor="show-without-email" className="text-sm font-normal cursor-pointer">
                    Bez emailu
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-with-phone"
                    checked={showWithPhone}
                    onCheckedChange={(checked) => setShowWithPhone(checked as boolean)}
                  />
                  <Label htmlFor="show-with-phone" className="text-sm font-normal cursor-pointer">
                    S telefónom
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-without-phone"
                    checked={showWithoutPhone}
                    onCheckedChange={(checked) => setShowWithoutPhone(checked as boolean)}
                  />
                  <Label htmlFor="show-without-phone" className="text-sm font-normal cursor-pointer">
                    Bez telefónu
                  </Label>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Results Count */}
      <div className="my-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Zobrazených {customersToDisplay.length} z {filteredCustomers.length}{' '}
          zákazníkov
          {filteredCustomers.length !== customers.length &&
            ` (filtrovaných z ${customers.length})`}
        </p>
        {isLoadingMore && (
          <div className="flex items-center gap-2">
            <Spinner size={16} />
            <p className="text-sm text-muted-foreground">
              Načítavam ďalších...
            </p>
          </div>
        )}
        {loading && <Spinner size={16} />}
      </div>

      {/* View Mode Toggle - Desktop Only */}
      {!isMobile && (
        <div className="mb-6 flex justify-end animate-fade-in">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>
      )}

      {/* Grid View - Premium Cards (Desktop Only) */}
      {!isMobile && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {customersToDisplay.map((customer) => {
            const customerRentals = rentals.filter(r => r.customerId === customer.id);
            const totalSpent = customerRentals.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            const lastRental = customerRentals.length > 0 
              ? new Date(Math.max(...customerRentals.map(r => new Date(r.startDate).getTime())))
              : undefined;

            const enrichedCustomer: Customer & {
              rentalCount?: number | undefined;
              totalSpent?: number | undefined;
              lastRentalDate?: Date | undefined;
            } = {
              ...customer,
              rentalCount: customerRentals.length || undefined,
              totalSpent: totalSpent || undefined,
              lastRentalDate: lastRental,
            };

            return (
              <PremiumCustomerCard
                key={customer.id}
                customer={enrichedCustomer}
                onEdit={handleEdit}
                onViewHistory={(customer) => {
                  setSelectedCustomerForHistory(customer);
                  // Open history dialog
                }}
              />
            );
          })}
        </div>
      )}

      {/* List View & Mobile - Original Table */}
      {(isMobile || viewMode === 'list') && (
      <>
      {/* Customer List */}
      {isMobile ? (
        /* MOBILE CARDS VIEW */
        <Card className="p-0">
          <div className="">
            {customersToDisplay.map((customer, index) => (
              <div
                key={customer.id}
                className={`flex hover:bg-gray-50 min-h-[80px] cursor-pointer ${
                  index < customersToDisplay.length - 1 ? 'border-b border-gray-300' : ''
                }`}
                onClick={() => handleEdit(customer)}
              >
                {/* Customer Info - sticky left */}
                <div
                  className="w-[140px] sm:w-[160px] max-w-[140px] sm:max-w-[160px] p-2 sm:p-3 border-r-2 border-gray-300 flex flex-col justify-center bg-white sticky left-0 z-10 overflow-hidden"
                >
                  <p>
                    {customer.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {getCustomerRentalCount(customer.id)} prenájmov
                  </span>
                  <Badge
                    className="h-[18px] sm:h-[20px] text-[0.55rem] sm:text-[0.6rem] bg-blue-50 text-blue-700 font-bold min-w-min max-w-full overflow-hidden"
                  >
                    {format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                  </Badge>
                </div>

                {/* Customer Details - scrollable right */}
                <div
                  className="flex-1 p-2 sm:p-3 flex flex-col justify-between overflow-hidden min-w-0"
                >
                  <div className="">
                    <p>
                      📧 {customer.email || 'Nezadané'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      📱 {customer.phone || 'Nezadané'}
                    </span>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 justify-start flex-wrap">
                    {/* Edit Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 bg-blue-500 text-white hover:bg-blue-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                      title="Upraviť zákazníka"
                      onClick={e => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>

                    {/* History Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 bg-purple-600 text-white hover:bg-purple-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                      title="História prenájmov"
                      onClick={e => {
                        e.stopPropagation();
                        handleShowHistory(customer);
                      }}
                    >
                      <HistoryIcon className="h-4 w-4" />
                    </Button>

                    {/* Phone Button */}
                    {customer.phone && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 sm:h-8 sm:w-8 p-0 bg-green-500 text-white hover:bg-green-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                        title="Zavolať"
                        onClick={e => {
                          e.stopPropagation();
                          handleCall(customer.phone);
                        }}
                      >
                        <PhoneIcon className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Email Button */}
                    {customer.email && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 sm:h-8 sm:w-8 p-0 bg-orange-500 text-white hover:bg-orange-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                        title="Poslať email"
                        onClick={e => {
                          e.stopPropagation();
                          handleEmail(customer.email);
                        }}
                      >
                        <EmailIcon className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 bg-red-500 text-white hover:bg-red-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                      title="Zmazať zákazníka"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(customer.id);
                      }}
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* 🚀 INFINITE SCROLL: Load More Button */}
            {hasMore && (
              <div className="p-4 flex justify-center border-t border-gray-300">
                <Button
                  variant="outline"
                  onClick={loadMoreCustomers}
                  disabled={isLoadingMore}
                  className="w-full"
                >
                  {isLoadingMore
                    ? 'Načítavam...'
                    : `Načítať ďalších (${filteredCustomers.length - displayedCustomers} zostáva)`}
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* DESKTOP TABLE VIEW */
        <Card className="p-0">
          {/* Desktop Header */}
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_2fr] gap-4 p-4 border-b-2 border-gray-300 bg-gray-50 font-semibold">
            {/* Zákazník column */}
            <div className="flex items-center">
              <p className="text-sm">
                👤 Zákazník
              </p>
            </div>

            {/* Email column */}
            <div className="flex items-center">
              <p className="text-sm">
                📧 Email
              </p>
            </div>

            {/* Telefón column */}
            <div className="flex items-center">
              <p className="text-sm">
                📱 Telefón
              </p>
            </div>

            {/* Prenájmy column */}
            <div className="flex items-center justify-center">
              <p className="text-sm">
                🚗 Prenájmy
              </p>
            </div>

            {/* Vytvorený column */}
            <div className="flex items-center">
              <p className="text-sm">
                📅 Vytvorený
              </p>
            </div>

            {/* Akcie column */}
            <div className="flex items-center justify-center">
              <p className="text-sm">
                ⚡ Akcie
              </p>
            </div>
          </div>

          {/* Desktop Customer Rows */}
          <div className="divide-y divide-gray-200">
            {customersToDisplay.map((customer) => (
              <div
                key={customer.id}
                className="grid grid-cols-[2fr_2fr_1.5fr_1fr_1fr_2fr] gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleEdit(customer)}
              >
                {/* Zákazník column */}
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-sm">
                    {customer.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    ID: {customer.id.slice(0, 8)}...
                  </span>
                </div>

                {/* Email column */}
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    {customer.email || 'Nezadané'}
                  </p>
                </div>

                {/* Telefón column */}
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    {customer.phone || 'Nezadané'}
                  </p>
                </div>

                {/* Prenájmy column */}
                <div className="flex items-center justify-center">
                  <Badge
                    className="text-sm"
                  >
                    {getCustomerRentalCount(customer.id)}
                  </Badge>
                </div>

                {/* Vytvorený column */}
                <div className="flex items-center">
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(customer.createdAt), 'dd.MM.yyyy')}
                  </p>
                </div>

                {/* Akcie column */}
                <div className="flex items-center justify-center gap-1">
                  {/* Edit Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 bg-blue-500 text-white hover:bg-blue-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                    title="Upraviť zákazníka"
                    onClick={e => {
                      e.stopPropagation();
                      handleEdit(customer);
                    }}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>

                  {/* History Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 bg-purple-600 text-white hover:bg-purple-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                    title="História prenájmov"
                    onClick={e => {
                      e.stopPropagation();
                      handleShowHistory(customer);
                    }}
                  >
                    <HistoryIcon className="h-4 w-4" />
                  </Button>

                  {/* Phone Button */}
                  {customer.phone && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 bg-green-500 text-white hover:bg-green-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                      title="Zavolať"
                      onClick={e => {
                        e.stopPropagation();
                        handleCall(customer.phone);
                      }}
                    >
                      <PhoneIcon className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Email Button */}
                  {customer.email && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0 bg-orange-500 text-white hover:bg-orange-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                      title="Poslať email"
                      onClick={e => {
                        e.stopPropagation();
                        handleEmail(customer.email);
                      }}
                    >
                      <EmailIcon className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Delete Button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 bg-red-500 text-white hover:bg-red-700 hover:scale-110 transition-all duration-200 hover:shadow-lg"
                    title="Zmazať zákazníka"
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(customer.id);
                    }}
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* 🚀 INFINITE SCROLL: Load More Button */}
            {hasMore && (
              <div className="p-4 flex justify-center border-t border-gray-300">
                <Button
                  variant="outline"
                  onClick={loadMoreCustomers}
                  disabled={isLoadingMore}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {isLoadingMore
                    ? 'Načítavam...'
                    : `Načítať ďalších (${filteredCustomers.length - displayedCustomers} zostáva)`}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
      </>
      )}

      {/* Customer Form Dialog */}
      <Dialog
        open={openDialog}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className={`${isMobile ? 'max-w-full h-full overflow-y-auto' : 'max-w-4xl'}`}>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Upraviť zákazníka' : 'Nový zákazník'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer 
                ? 'Upravte informácie o zákazníkovi.' 
                : 'Pridajte nového zákazníka do databázy.'}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            customer={editingCustomer}
            onSave={handleSubmit}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Customer History Dialog */}
      {selectedCustomerForHistory && (
        <CustomerRentalHistory
          open={!!selectedCustomerForHistory}
          customer={selectedCustomerForHistory}
          rentals={rentals}
          vehicles={vehicles}
          onClose={() => setSelectedCustomerForHistory(null)}
        />
      )}
    </div>
  );
}
