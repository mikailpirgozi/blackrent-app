import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';
import { 
  Car, 
  Building2, 
  Calendar, 
  Trash2, 
  Edit, 
  History, 
  RefreshCw, 
  Save, 
  ArrowRightLeft, 
  X, 
  Loader2 
} from 'lucide-react';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Textarea } from '../ui/textarea';

// import { useApp } from '../../context/AppContext'; // Migrated to React Query
import { useCompanies } from '../../lib/react-query/hooks/useCompanies';
import { useVehicles } from '../../lib/react-query/hooks/useVehicles';
import { apiService, getAPI_BASE_URL } from '../../services/api';

interface OwnershipHistory {
  id: string;
  ownerCompanyId: string;
  ownerCompanyName: string;
  validFrom: string;
  validTo: string | null;
  transferReason: string;
  transferNotes: string | null;
}

interface VehicleWithHistory {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  ownerCompanyId: string;
  history: OwnershipHistory[];
}

const VehicleOwnershipTransfer: React.FC = () => {
  // const { state } = useApp(); // Migrated to React Query
  const { data: vehicles = [] } = useVehicles();
  const { data: companies = [] } = useCompanies();

  // Transfer form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newOwnerCompanyId, setNewOwnerCompanyId] = useState('');
  const [transferReason, setTransferReason] = useState('sale');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferDate, setTransferDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // History states
  const [vehiclesWithHistory, setVehiclesWithHistory] = useState<
    VehicleWithHistory[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] =
    useState<OwnershipHistory | null>(null);
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');

  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferToDelete, setTransferToDelete] =
    useState<OwnershipHistory | null>(null);

  const transferReasons = [
    { value: 'sale', label: 'Predaj' },
    { value: 'acquisition', label: 'Kúpa' },
    { value: 'lease_end', label: 'Ukončenie leasingu' },
    { value: 'lease_transfer', label: 'Transfer leasingu' },
    { value: 'merger', label: 'Fúzia firiem' },
    { value: 'administrative', label: 'Administratívna zmena' },
    { value: 'manual_transfer', label: 'Manuálny transfer' },
  ];

  // Fallback metóda pre prípad zlyhania bulk requestu
  const loadVehicleHistoriesIndividually = useCallback(async () => {
    console.log(
      `🚀 FALLBACK: Loading histories for ${vehicles.length} vehicles individually...`
    );

    const historyPromises = vehicles.map(async vehicle => {
      try {
        const response = await fetch(
          `${getAPI_BASE_URL()}/vehicles/${vehicle.id}/ownership-history`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const history = data.data.ownershipHistory || [];

          const hasRealTransfers =
            history.length > 1 ||
            (history.length === 1 &&
              history[0].transferReason !== 'initial_setup');

          if (hasRealTransfers) {
            return {
              id: vehicle.id,
              brand: vehicle.brand,
              model: vehicle.model,
              licensePlate: vehicle.licensePlate,
              ownerCompanyId: vehicle.ownerCompanyId || '',
              history: history,
            };
          }
        }
        return null;
      } catch (error) {
        console.error(
          `Failed to load history for vehicle ${vehicle.id}:`,
          error
        );
        return null;
      }
    });

    const results = await Promise.all(historyPromises);
    const vehiclesWithHistoryData = results.filter(
      (vehicle): vehicle is VehicleWithHistory => vehicle !== null
    );
    vehiclesWithHistoryData.sort((a, b) => b.history.length - a.history.length);

    setVehiclesWithHistory(vehiclesWithHistoryData);
  }, [vehicles]);

  // ⚡⚡ ULTRA OPTIMALIZOVANÉ: Jediné bulk API volanie namiesto 111 requestov
  const loadAllVehicleHistories = useCallback(async () => {
    setHistoryLoading(true);
    console.log(
      `🚀 BULK: Loading ownership history for all vehicles in single request...`
    );
    const startTime = Date.now();

    try {
      // ⚡⚡ SINGLE BULK REQUEST: Namiesto 111 requestov -> 1 request
      const bulkData = await apiService.getBulkVehicleOwnershipHistory();

      console.log(
        `📊 BULK Response: ${bulkData.totalVehicles} vehicles processed in ${bulkData.loadTimeMs}ms (backend) + ${Date.now() - startTime}ms (frontend)`
      );

      // FILTER LOGIC: Zobrazuj len vozidlá s reálnymi transfermi
      const vehiclesWithHistoryData: VehicleWithHistory[] = [];

      for (const vehicleHistory of bulkData.vehicleHistories) {
        const vehicleHistoryTyped = vehicleHistory as {
          vehicle: {
            id: string;
            brand: string;
            model: string;
            licensePlate: string;
            ownerCompanyId?: string;
          };
          history: OwnershipHistory[];
        };
        const history = vehicleHistoryTyped.history;

        // 1. Vozidlá s viac ako 1 záznamom = mali aspoň 1 transfer
        // 2. Vozidlá s 1 záznamom, ale nie je to initial_setup
        // 3. Vylúč vozidlá len s initial_setup (žiadny skutočný transfer)
        const hasRealTransfers =
          history.length > 1 ||
          (history.length === 1 &&
            history[0]?.transferReason !== 'initial_setup');

        if (hasRealTransfers) {
          vehiclesWithHistoryData.push({
            id: vehicleHistoryTyped.vehicle.id,
            brand: vehicleHistoryTyped.vehicle.brand,
            model: vehicleHistoryTyped.vehicle.model,
            licensePlate: vehicleHistoryTyped.vehicle.licensePlate,
            ownerCompanyId: vehicleHistoryTyped.vehicle.ownerCompanyId || '',
            history: history,
          });
        }
      }

      // SORTING: Zoraď podľa počtu transferov (viac transferov = vyššie v zozname)
      vehiclesWithHistoryData.sort(
        (a, b) => b.history.length - a.history.length
      );

      const totalTime = Date.now() - startTime;
      console.log(
        `✅ BULK: Processed ${vehiclesWithHistoryData.length} vehicles with transfers in ${totalTime}ms total`
      );

      setVehiclesWithHistory(vehiclesWithHistoryData);
    } catch (error) {
      console.error('Failed to load bulk vehicle histories:', error);
      // Fallback na starý spôsob ak bulk zlyhá
      console.log('🔄 Falling back to individual requests...');
      await loadVehicleHistoriesIndividually();
    } finally {
      setHistoryLoading(false);
    }
  }, [loadVehicleHistoriesIndividually]);

  // Načítanie histórie pri mount
  useEffect(() => {
    if (vehicles.length > 0) {
      loadAllVehicleHistories();
    }
  }, [vehicles, loadAllVehicleHistories]);

  const handleTransferSubmit = async () => {
    if (!selectedVehicleId || !newOwnerCompanyId) {
      setMessage({ type: 'error', text: 'Vyberte vozidlo a novú firmu' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/vehicles/${selectedVehicleId}/transfer-ownership`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
          body: JSON.stringify({
            newOwnerCompanyId,
            transferReason,
            transferNotes: transferNotes.trim() || null,
            transferDate: new Date(transferDate).toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || 'Transfer ownership úspešný!',
        });

        // Reset form
        setSelectedVehicleId('');
        setNewOwnerCompanyId('');
        setTransferReason('sale');
        setTransferNotes('');
        setTransferDate(format(new Date(), 'yyyy-MM-dd'));

        // Refresh history
        await loadAllVehicleHistories();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Transfer sa nepodaril',
        });
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setMessage({
        type: 'error',
        text: 'Chyba pri transfere ownership',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransfer = (transfer: OwnershipHistory) => {
    setEditingTransfer(transfer);
    setEditCompanyId(transfer.ownerCompanyId);
    setEditReason(transfer.transferReason);
    setEditNotes(transfer.transferNotes || '');
    setEditDate(format(new Date(transfer.validFrom), 'yyyy-MM-dd'));
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingTransfer) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/vehicles/ownership-history/${editingTransfer.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
          body: JSON.stringify({
            ownerCompanyId: editCompanyId,
            transferReason: editReason,
            transferNotes: editNotes.trim() || null,
            validFrom: new Date(editDate).toISOString(),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Transfer úspešne upravený!' });
        setEditDialogOpen(false);
        await loadAllVehicleHistories();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Úprava sa nepodarila',
        });
      }
    } catch (error) {
      console.error('Edit error:', error);
      setMessage({ type: 'error', text: 'Chyba pri úprave transferu' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransfer = (transfer: OwnershipHistory) => {
    setTransferToDelete(transfer);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTransfer = async () => {
    if (!transferToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/vehicles/ownership-history/${transferToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('blackrent_token')}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Transfer úspešne vymazaný!' });
        await loadAllVehicleHistories();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Vymazanie sa nepodarilo',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Chyba pri vymazávaní transferu' });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setTransferToDelete(null);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentOwnerCompany = companies.find(
    c => c.id === selectedVehicle?.ownerCompanyId
  );

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Transfer vlastníctva vozidiel</h2>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              {message.text}
              <Button variant="ghost" size="sm" onClick={() => setMessage(null)}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Ľavá strana - Nový transfer */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Nový transfer vlastníctva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle-select">Vozidlo</Label>
                  <Select
                    value={selectedVehicleId}
                    onValueChange={setSelectedVehicleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte vozidlo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(vehicle => {
                        const ownerCompany = companies.find(
                          c => c.id === vehicle.ownerCompanyId
                        );
                        return (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <div>
                                <div className="font-medium">
                                  {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Majiteľ: {ownerCompany?.name || 'Neznámy'}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedVehicle && (
                  <Alert>
                    <AlertDescription>
                      <strong>Aktuálny majiteľ:</strong>{' '}
                      {currentOwnerCompany?.name || 'Neznámy'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new-owner-select">Nový majiteľ</Label>
                  <Select
                    value={newOwnerCompanyId}
                    onValueChange={setNewOwnerCompanyId}
                    disabled={!selectedVehicleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte nového majiteľa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies
                        .filter(c => c.id !== currentOwnerCompany?.id)
                        .map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {company.name}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transfer-reason">Dôvod transferu</Label>
                    <Select
                      value={transferReason}
                      onValueChange={setTransferReason}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transferReasons.map(reason => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transfer-date">Dátum transferu</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="transfer-date"
                        type="date"
                        value={transferDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferDate(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-notes">Poznámky (voliteľné)</Label>
                  <Textarea
                    id="transfer-notes"
                    placeholder="Ďalšie informácie o transfere..."
                    value={transferNotes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransferNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleTransferSubmit}
                  disabled={loading || !selectedVehicleId || !newOwnerCompanyId}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Spracovávam...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transferovať vlastníctvo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Pravá strana - História transferov */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Vozidlá s transfermi vlastníctva
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadAllVehicleHistories}
                        disabled={historyLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Obnoviť históriu</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Načítavam históriu transferov...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ⚡⚡ Bulk API - jediné volanie pre všetky vozidlá
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-auto">
                    {vehiclesWithHistory.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Žiadne vozidlá s transfermi vlastníctva nenájdené.
                      </p>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {vehiclesWithHistory.map(vehicle => (
                          <AccordionItem key={vehicle.id} value={vehicle.id}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                <span className="font-medium">
                                  {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                                </span>
                                <Badge variant="secondary">
                                  {vehicle.history.length} transferov
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4">
                                {vehicle.history.length === 0 ? (
                                  <p className="text-muted-foreground">
                                    Žiadna história transferov.
                                  </p>
                                ) : (
                                  vehicle.history.map((transfer, index) => (
                                    <Card key={transfer.id} className="p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            <span className="font-medium">
                                              {transfer.ownerCompanyName}
                                            </span>
                                            <Badge 
                                              variant={index === 0 ? 'default' : 'secondary'}
                                            >
                                              {index === 0 ? 'Aktuálny' : 'Historický'}
                                            </Badge>
                                          </div>

                                          <p className="text-sm text-muted-foreground">
                                            <strong>Platnosť:</strong>{' '}
                                            {format(
                                              new Date(transfer.validFrom),
                                              'dd.MM.yyyy',
                                              { locale: sk }
                                            )}
                                            {transfer.validTo &&
                                              ` - ${format(new Date(transfer.validTo), 'dd.MM.yyyy', { locale: sk })}`}
                                          </p>

                                          <p className="text-sm text-muted-foreground">
                                            <strong>Dôvod:</strong>{' '}
                                            {transferReasons.find(
                                              r => r.value === transfer.transferReason
                                            )?.label || transfer.transferReason}
                                          </p>

                                          {transfer.transferNotes && (
                                            <p className="text-sm text-muted-foreground">
                                              <strong>Poznámky:</strong>{' '}
                                              {transfer.transferNotes}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex gap-1">
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditTransfer(transfer)}
                                              >
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Upraviť transfer</TooltipContent>
                                          </Tooltip>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteTransfer(transfer)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Vymazať transfer</TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    </Card>
                                  ))
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Transfer Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Upraviť transfer vlastníctva
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Firma</Label>
                <Select
                  value={editCompanyId}
                  onValueChange={setEditCompanyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte firmu" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {company.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-reason">Dôvod transferu</Label>
                <Select
                  value={editReason}
                  onValueChange={setEditReason}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte dôvod" />
                  </SelectTrigger>
                  <SelectContent>
                    {transferReasons.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date">Dátum platnosti</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Poznámky</Label>
                <Textarea
                  id="edit-notes"
                  rows={3}
                  value={editNotes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Zrušiť
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={loading || !editCompanyId || !editReason || !editDate}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukladám...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Uložiť
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Potvrdiť vymazanie transferu
              </DialogTitle>
            </DialogHeader>
            {transferToDelete && (
              <div className="space-y-4">
                <p>
                  Naozaj chcete vymazať tento transfer vlastníctva?
                </p>

                <Alert variant="destructive">
                  <AlertDescription className="space-y-1">
                    <p>
                      <strong>Firma:</strong> {transferToDelete.ownerCompanyName}
                    </p>
                    <p>
                      <strong>Dátum:</strong>{' '}
                      {format(new Date(transferToDelete.validFrom), 'dd.MM.yyyy', {
                        locale: sk,
                      })}
                    </p>
                    <p>
                      <strong>Dôvod:</strong>{' '}
                      {transferReasons.find(
                        r => r.value === transferToDelete.transferReason
                      )?.label || transferToDelete.transferReason}
                    </p>
                    {transferToDelete.transferNotes && (
                      <p>
                        <strong>Poznámky:</strong> {transferToDelete.transferNotes}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>

                <p className="text-sm text-destructive">
                  Táto akcia sa nedá vrátiť späť.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Zrušiť
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTransfer}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vymazávam...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Vymazať
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default VehicleOwnershipTransfer;
