import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Collapse,
  Fab,
} from '@mui/material';
import ResponsiveTable, { ResponsiveTableColumn } from '../common/ResponsiveTable';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Vehicle, VehicleStatus } from '../../types';
import VehicleForm from './VehicleForm';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import useMediaQuery from '@mui/material/useMediaQuery';
import { v4 as uuidv4 } from 'uuid';
import { useDebounce, usePagination, useMemoizedFilter } from '../../utils/performance';

const getStatusColor = (status: VehicleStatus) => {
  switch (status) {
    case 'available':
      return 'success';
    case 'rented':
      return 'warning';
    case 'maintenance':
      return 'error';
    case 'temporarily_removed':
      return 'info';
    case 'removed':
      return 'default';
    case 'transferred':
      return 'secondary';
    default:
      return 'default';
  }
};

const getStatusText = (status: VehicleStatus) => {
  switch (status) {
    case 'available':
      return 'Dostupné';
    case 'rented':
      return 'Prenajaté';
    case 'maintenance':
      return 'Údržba';
    case 'temporarily_removed':
      return 'Dočasne vyradené';
    case 'removed':
      return 'Vyradené';
    case 'transferred':
      return 'Prepisané';
    default:
      return status;
  }
};

function exportVehiclesToCSV(vehicles: Vehicle[]) {
  const header = ['id','brand','model','licensePlate','company','cena_0_1','cena_2_3','cena_4_7','cena_8_14','cena_15_22','cena_23_30','cena_31_9999','commissionType','commissionValue','status'];
  const rows = vehicles.map(v => {
    // Získať ceny podľa pásiem
    const getPrice = (min: number, max: number) => v.pricing?.find((p: any) => p.minDays === min && p.maxDays === max)?.pricePerDay || '';
    return [
      v.id,
      v.brand,
      v.model,
      v.licensePlate,
      v.company,
      getPrice(0,1),
      getPrice(2,3),
      getPrice(4,7),
      getPrice(8,14),
      getPrice(15,22),
      getPrice(23,30),
      getPrice(31,9999),
      v.commission?.type,
      v.commission?.value,
      v.status
    ];
  });
  const csv = [header, ...rows].map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'vozidla.csv');
}

export default function VehicleList() {
  const { state, dispatch, createVehicle, updateVehicle, deleteVehicle, getFilteredVehicles } = useApp();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterLicensePlate, setFilterLicensePlate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistoryVehicle, setSelectedHistoryVehicle] = useState<Vehicle | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Hook na detekciu mobilu
  const isMobile = useMediaQuery('(max-width:600px)');

  // 🚀 PERFORMANCE OPTIMIZATION: Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 🚀 PERFORMANCE OPTIMIZATION: Memoized filtering
  const filteredVehicles = useMemoizedFilter(
    getFilteredVehicles(),
    (vehicle) => {
      if (filterBrand && !vehicle.brand.toLowerCase().includes(filterBrand.toLowerCase())) return false;
      if (filterModel && !vehicle.model.toLowerCase().includes(filterModel.toLowerCase())) return false;
      if (filterCompany && vehicle.company !== filterCompany) return false;
      if (filterLicensePlate && !vehicle.licensePlate.toLowerCase().includes(filterLicensePlate.toLowerCase())) return false;
      if (filterStatus && vehicle.status !== filterStatus) return false;
      
      // 🚀 OPTIMIZED: Debounced search
      if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase();
        if (
          !vehicle.brand.toLowerCase().includes(q) &&
          !vehicle.model.toLowerCase().includes(q) &&
          !vehicle.licensePlate.toLowerCase().includes(q) &&
          !vehicle.company.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    },
    [filterBrand, filterModel, filterCompany, filterLicensePlate, filterStatus, debouncedSearchQuery]
  );

  // 🚀 PERFORMANCE OPTIMIZATION: Pagination
  const {
    currentData: paginatedVehicles,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    pageInfo
  } = usePagination(filteredVehicles, 20);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filteredVehicles.map(v => v.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelected(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) return;
    if (window.confirm(`Naozaj chcete vymazať ${selected.length} označených vozidiel?`)) {
      try {
        await Promise.all(selected.map(id => deleteVehicle(id)));
        setSelected([]);
      } catch (error) {
        console.error('Chyba pri mazaní vozidiel:', error);
      }
    }
  };

  const handleShowHistory = (vehicle: Vehicle) => {
    setSelectedHistoryVehicle(vehicle);
  };
  const handleCloseHistory = () => {
    setSelectedHistoryVehicle(null);
  };

  const handleAdd = () => {
    setEditingVehicle(null);
    setOpenDialog(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať toto vozidlo?')) {
      try {
        await deleteVehicle(id);
      } catch (error) {
        console.error('Chyba pri mazaní vozidla:', error);
      }
    }
  };

  const handleSave = async (vehicle: Vehicle) => {
    try {
      if (editingVehicle) {
        await updateVehicle(vehicle);
      } else {
        await createVehicle(vehicle);
      }
      setOpenDialog(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error('Chyba pri ukladaní vozidla:', error);
    }
  };

  // Column definitions for ResponsiveTable
  const columns: ResponsiveTableColumn[] = useMemo(() => [
    {
      id: 'brand',
      label: 'Značka',
      width: { xs: '80px', md: '100px' }
    },
    {
      id: 'model',
      label: 'Model',
      width: { xs: '80px', md: '100px' }
    },
    {
      id: 'licensePlate',
      label: 'ŠPZ',
      width: { xs: '80px', md: '100px' }
    },
    {
      id: 'company',
      label: 'Firma',
      width: { xs: '80px', md: '100px' },
      hideOnMobile: true
    },
    {
      id: 'status',
      label: 'Stav',
      width: { xs: '80px', md: '100px' },
      render: (value: VehicleStatus) => (
        <Chip
          label={getStatusText(value)}
          color={getStatusColor(value) as any}
          size="small"
        />
      )
    },
    {
      id: 'actions',
      label: 'Akcie',
      width: { xs: '100px', md: '120px' },
      render: (value: any, vehicle: Vehicle) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); handleShowHistory(vehicle); }}
            sx={{ color: 'info.main' }}
            title="História zmien"
          >
            <HistoryIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); handleEdit(vehicle); }}
            sx={{ color: 'primary.main' }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); handleDelete(vehicle.id); }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ], [handleEdit, handleDelete, handleShowHistory]);

  function handleImportCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: ReturnType<typeof Papa.parse>) => {
        try {
          const imported: any[] = [];
          let skippedDuplicates = 0;
          
          for (const row of results.data as any[]) {
            // Preskočíme prázdne riadky
            if (!row.licensePlate || !row.brand || !row.model) {
              console.log(`⚠️ Preskakujem neúplný riadok:`, row);
              continue;
            }
            
            // KONTROLA DUPLICÍT VOZIDLA
            // Skontroluj, či už existuje vozidlo s touto ŠPZ
            const duplicateVehicle = state.vehicles.find(existingVehicle => 
              existingVehicle.licensePlate?.toLowerCase().trim() === row.licensePlate?.toLowerCase().trim()
            );
            
            if (duplicateVehicle) {
              console.log(`🔄 Preskakujem duplicitné vozidlo: ${row.licensePlate} (už existuje)`);
              skippedDuplicates++;
              continue;
            }
            
            // Kontrola duplicít aj v rámci tohto CSV (ak má niekto v CSV duplicate)
            const duplicateInImported = imported.find(importedVehicle => 
              importedVehicle.licensePlate?.toLowerCase().trim() === row.licensePlate?.toLowerCase().trim()
            );
            
            if (duplicateInImported) {
              console.log(`🔄 Preskakujem duplicitné vozidlo v CSV: ${row.licensePlate}`);
              skippedDuplicates++;
              continue;
            }
            
            // Ak sú v CSV stĺpce cena_0_1 atď., vytvor pricing pole
            let pricing = [];
            if (
              row.cena_0_1 || row.cena_2_3 || row.cena_4_7 ||
              row.cena_8_14 || row.cena_15_22 || row.cena_23_30 || row.cena_31_9999
            ) {
              pricing = [
                { id: '1', minDays: 0, maxDays: 1, pricePerDay: Number(row.cena_0_1) || 0 },
                { id: '2', minDays: 2, maxDays: 3, pricePerDay: Number(row.cena_2_3) || 0 },
                { id: '3', minDays: 4, maxDays: 7, pricePerDay: Number(row.cena_4_7) || 0 },
                { id: '4', minDays: 8, maxDays: 14, pricePerDay: Number(row.cena_8_14) || 0 },
                { id: '5', minDays: 15, maxDays: 22, pricePerDay: Number(row.cena_15_22) || 0 },
                { id: '6', minDays: 23, maxDays: 30, pricePerDay: Number(row.cena_23_30) || 0 },
                { id: '7', minDays: 31, maxDays: 9999, pricePerDay: Number(row.cena_31_9999) || 0 },
              ];
            } else if (row.pricing) {
              pricing = JSON.parse(row.pricing);
            }
            
            const vehicle = {
              id: row.id || uuidv4(),
              brand: row.brand?.trim() || 'Neznáma značka',
              model: row.model?.trim() || 'Neznámy model',
              licensePlate: row.licensePlate?.trim(),
              company: row.company?.trim() || 'Neznáma firma',
              pricing,
              commission: { 
                type: row.commissionType || 'percentage', 
                value: Number(row.commissionValue) || 20 
              },
              status: row.status || 'available',
            };
            
            console.log(`📋 Pripravujem vozidlo na import: ${vehicle.licensePlate} - ${vehicle.brand} ${vehicle.model}`);
            imported.push(vehicle);
          }
          
          // Vytvoríme všetky vozidlá cez API s error handlingom
          let successCount = 0;
          let errorCount = 0;
          const errors: string[] = [];
          
          console.log(`🚗 Spracovávam ${imported.length} vozidiel...`);
          
          for (let i = 0; i < imported.length; i++) {
            const vehicle = imported[i];
            try {
              console.log(`Vytváram vozidlo ${i + 1}/${imported.length}: ${vehicle.licensePlate} - ${vehicle.brand} ${vehicle.model}`);
              await createVehicle(vehicle);
              successCount++;
              console.log(`✅ Vozidlo úspešne vytvorené: ${vehicle.licensePlate}`);
            } catch (error: any) {
              console.error(`Chyba pri vytváraní vozidla ${vehicle.licensePlate}:`, error);
              errorCount++;
              const errorMessage = error.message || 'Neznáma chyba';
              errors.push(`${vehicle.licensePlate}: ${errorMessage}`);
              
              // Ak je chyba kvôli duplicite, pokračujeme
              if (errorMessage.includes('už existuje')) {
                console.log(`🔄 Preskakujem duplicitné vozidlo: ${vehicle.licensePlate}`);
              }
            }
            
            // Pridáme malé oneskorenie medzi requestmi aby sa nepreťažil server
            if (i < imported.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          setImportError('');
          const totalProcessed = results.data.length;
          
          let message = `Import vozidiel dokončený!\n\n`;
          message += `📊 Spracované riadky: ${totalProcessed}\n`;
          message += `✅ Úspešne importované: ${successCount}\n`;
          if (skippedDuplicates > 0) {
            message += `🔄 Preskočené duplicity: ${skippedDuplicates}\n`;
          }
          if (errorCount > 0) {
            message += `❌ Chyby: ${errorCount}\n\n`;
            message += `Problémy:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
              message += `\n... a ďalších ${errors.length - 5} chýb`;
            }
          }
          alert(message);
        } catch (err) {
          setImportError('Chyba pri importe CSV: ' + (err as any).message);
          console.error('Import error:', err);
        }
      },
      error: (err: any) => setImportError('Chyba pri čítaní CSV: ' + err.message)
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Databáza vozidiel</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ 
              minWidth: isMobile ? 'auto' : 'auto',
              px: isMobile ? 2 : 3
            }}
          >
            {isMobile ? 'Pridať' : 'Pridať vozidlo'}
          </Button>
          
          {/* Desktop tlačidlá */}
          {!isMobile && (
            <>
              <Button
                variant="outlined"
                onClick={() => exportVehiclesToCSV(getFilteredVehicles())}
              >
                Export vozidiel
              </Button>
              <Button
                variant="outlined"
                component="label"
              >
                Import vozidiel
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImportCSV}
                />
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteSelected}
                disabled={selected.length === 0}
              >
                Vymazať označené
              </Button>
            </>
          )}
        </Box>
      </Box>

      {importError && (
        <Box sx={{ color: 'error.main', mb: 2 }}>{importError}</Box>
      )}

      {/* Filtre */}
      {isMobile ? (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
            sx={{ mb: 1 }}
          >
            {isMobileFiltersOpen ? 'Skryť filtre' : 'Zobraziť filtre'}
          </Button>
          <Collapse in={isMobileFiltersOpen}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Značka"
                    value={filterBrand}
                    onChange={e => setFilterBrand(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="Model"
                    value={filterModel}
                    onChange={e => setFilterModel(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    label="ŠPZ"
                    value={filterLicensePlate}
                    onChange={e => setFilterLicensePlate(e.target.value)}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Firma</InputLabel>
                    <Select
                      value={filterCompany}
                      label="Firma"
                      onChange={e => setFilterCompany(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      {Array.from(new Set(getFilteredVehicles().map(v => v.company))).map(company => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Stav</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Stav"
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">Všetky</MenuItem>
                      <MenuItem value="available">Dostupné</MenuItem>
                      <MenuItem value="rented">Prenajaté</MenuItem>
                      <MenuItem value="maintenance">Údržba</MenuItem>
                      <MenuItem value="temporarily_removed">Dočasne vyradené</MenuItem>
                      <MenuItem value="removed">Vyradené</MenuItem>
                      <MenuItem value="transferred">Prepisané</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Collapse>
        </Box>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Značka"
                value={filterBrand}
                onChange={e => setFilterBrand(e.target.value)}
              />
              <TextField
                fullWidth
                label="Model"
                value={filterModel}
                onChange={e => setFilterModel(e.target.value)}
              />
              <TextField
                fullWidth
                label="ŠPZ"
                value={filterLicensePlate}
                onChange={e => setFilterLicensePlate(e.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel>Firma</InputLabel>
                <Select
                  value={filterCompany}
                  label="Firma"
                  onChange={e => setFilterCompany(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  {Array.from(new Set(getFilteredVehicles().map(v => v.company))).map(company => (
                    <MenuItem key={company} value={company}>{company}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Stav</InputLabel>
                <Select
                  value={filterStatus}
                  label="Stav"
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">Všetky</MenuItem>
                  <MenuItem value="available">Dostupné</MenuItem>
                  <MenuItem value="rented">Prenajaté</MenuItem>
                  <MenuItem value="maintenance">Údržba</MenuItem>
                  <MenuItem value="temporarily_removed">Dočasne vyradené</MenuItem>
                  <MenuItem value="removed">Vyradené</MenuItem>
                  <MenuItem value="transferred">Prepisané</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Vyhľadávacie pole */}
      <Box sx={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', mb: 2 }}>
        <TextField
          label={isMobile ? "Vyhľadávanie..." : "Rýchle vyhľadávanie (značka, model, ŠPZ, firma)"}
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sx={{ 
            minWidth: isMobile ? '100%' : 320,
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? 2 : 1
            }
          }}
          placeholder={isMobile ? "Značka, model, ŠPZ, firma..." : undefined}
        />
      </Box>

      <ResponsiveTable
        columns={columns}
        data={paginatedVehicles}
        selectable={true}
        selected={selected}
        onSelectionChange={setSelected}
        emptyMessage="Žiadne vozidlá"
      />

      {/* 🚀 OPTIMIZED: Pagination controls */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={prevPage}
            disabled={!hasPrevPage}
            size="small"
          >
            Predchádzajúca
          </Button>
          
          <Typography variant="body2" sx={{ alignSelf: 'center', mx: 2 }}>
            {pageInfo.showing}
          </Typography>
          
          <Button
            variant="outlined"
            onClick={nextPage}
            disabled={!hasNextPage}
            size="small"
          >
            Ďalšia
          </Button>
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingVehicle ? 'Upraviť vozidlo' : 'Pridať nové vozidlo'}
        </DialogTitle>
        <DialogContent>
          <VehicleForm
            vehicle={editingVehicle}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedHistoryVehicle}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>História zmien vozidla</DialogTitle>
        <DialogContent>
          {(selectedHistoryVehicle as any)?.history && (selectedHistoryVehicle as any).history.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(selectedHistoryVehicle as any).history.map((entry: any, idx: number) => (
                <Card key={idx} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(entry.date).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.user}
                    </Typography>
                  </Box>
                  <Box>
                    {entry.changes.map((c: any, i: number) => (
                      <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                        <strong>{c.field}:</strong> {String(c.oldValue)} → {String(c.newValue)}
                      </Typography>
                    ))}
                  </Box>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography>Žiadne zmeny.</Typography>
          )}
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button onClick={handleCloseHistory} variant="outlined">Zavrieť</Button>
        </Box>
      </Dialog>

      {/* Plávajúce tlačidlo pre mobil */}
      {isMobile && (
        <Fab 
          color="primary" 
          aria-label="Pridať vozidlo"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1201,
            boxShadow: 4,
            width: 56,
            height: 56
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
} 