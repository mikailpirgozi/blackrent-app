import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  MergeType as MergeIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Euro as EuroIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { customerMergeService, DuplicateGroup, CustomerWithStats, MergeRequest } from '../../services/customerMergeService';
import { useApp } from '../../context/AppContext';

interface CustomerMergeManagerProps {
  onMergeComplete?: () => void;
}

export default function CustomerMergeManager({ onMergeComplete }: CustomerMergeManagerProps) {
  const { loadData } = useApp();
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [merging, setMerging] = useState(false);
  const [mergeData, setMergeData] = useState({
    name: '',
    email: '',
    phone: '',
    targetCustomerId: '',
    sourceCustomerId: ''
  });

  // Načítaj duplicitných zákazníkov
  const loadDuplicates = async () => {
    setLoading(true);
    setError(null);
    try {
      const duplicateGroups = await customerMergeService.findDuplicateCustomers();
      setDuplicates(duplicateGroups);
    } catch (err) {
      setError('Chyba pri načítavaní duplicitných zákazníkov');
      console.error('Error loading duplicates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  // Otvor merge dialog
  const handleMergeClick = (group: DuplicateGroup) => {
    const suggestion = customerMergeService.suggestMergedData(group.group[0], group.group[1]);
    
    setSelectedGroup(group);
    setMergeData({
      name: suggestion.name,
      email: suggestion.email,
      phone: suggestion.phone,
      targetCustomerId: suggestion.primaryCustomer.id,
      sourceCustomerId: suggestion.secondaryCustomer.id
    });
    setMergeDialogOpen(true);
  };

  // Vykonaj merge
  const handleMerge = async () => {
    if (!selectedGroup || !mergeData.targetCustomerId || !mergeData.sourceCustomerId) return;

    setMerging(true);
    try {
      const mergeRequest: MergeRequest = {
        targetCustomerId: mergeData.targetCustomerId,
        sourceCustomerId: mergeData.sourceCustomerId,
        mergedData: {
          name: mergeData.name,
          email: mergeData.email,
          phone: mergeData.phone
        }
      };

      await customerMergeService.mergeCustomers(mergeRequest);
      
      // Refresh data
      await loadData();
      await loadDuplicates();
      
      setMergeDialogOpen(false);
      setSelectedGroup(null);
      
      if (onMergeComplete) {
        onMergeComplete();
      }
    } catch (err) {
      setError('Chyba pri zjednocovaní zákazníkov');
      console.error('Error merging customers:', err);
    } finally {
      setMerging(false);
    }
  };

  // Renderuj štatistiky zákazníka
  const renderCustomerStats = (customer: CustomerWithStats) => (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body2" color="text.secondary">
        <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
        {customer.stats.rentalCount} prenájmov
        {customer.stats.firstRental && (
          <> • Od {new Date(customer.stats.firstRental).toLocaleDateString('sk-SK')}</>
        )}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <EuroIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
        {customer.stats.totalRevenue.toFixed(2)}€ celkový obrat
      </Typography>
    </Box>
  );

  // Renderuj kartu zákazníka
  const renderCustomerCard = (customer: CustomerWithStats, isPrimary: boolean = false) => (
    <Card variant="outlined" sx={{ mb: 2, bgcolor: isPrimary ? 'action.selected' : 'background.paper' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PersonIcon sx={{ mr: 1, color: isPrimary ? 'primary.main' : 'text.secondary' }} />
          <Typography variant="h6">
            {customer.name}
            {isPrimary && <Chip label="Primárny" size="small" color="primary" sx={{ ml: 1 }} />}
          </Typography>
        </Box>
        
        {customer.email && (
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <EmailIcon sx={{ fontSize: 16, mr: 1 }} />
            {customer.email}
          </Typography>
        )}
        
        {customer.phone && (
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
            {customer.phone}
          </Typography>
        )}
        
        {renderCustomerStats(customer)}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Hľadám duplicitných zákazníkov...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Správa duplicitných zákazníkov</Typography>
        <Button variant="outlined" onClick={loadDuplicates} disabled={loading}>
          Obnoviť
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {duplicates.length === 0 ? (
        <Alert severity="success">
          Žiadni duplicitní zákazníci neboli nájdení! 🎉
        </Alert>
      ) : (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Nájdených {duplicates.length} skupín možných duplicitných zákazníkov.
          </Alert>

          {duplicates.map((group, index) => (
            <Card key={index} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Duplicitní zákazníci #{index + 1}
                    </Typography>
                    <Chip 
                      label={customerMergeService.getSimilarityDescription(group.similarity, group.score)}
                      color={customerMergeService.getSimilarityColor(group.similarity, group.score)}
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<MergeIcon />}
                    onClick={() => handleMergeClick(group)}
                    color="primary"
                  >
                    Zjednotiť
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {group.group.map((customer, customerIndex) => (
                    <Grid item xs={12} md={6} key={customer.id}>
                      {renderCustomerCard(customer)}
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MergeIcon sx={{ mr: 1 }} />
            Zjednotiť zákazníkov
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedGroup && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Táto akcia je nevratná! Všetky prenájmy sa presunú na vybraného primárneho zákazníka 
                a duplicitný záznam sa vymaže.
              </Alert>

              <Typography variant="h6" sx={{ mb: 2 }}>Zákazníci na zjednotenie:</Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedGroup.group.map((customer) => (
                  <Grid item xs={12} md={6} key={customer.id}>
                    {renderCustomerCard(
                      customer, 
                      customer.id === mergeData.targetCustomerId
                    )}
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>Finálne údaje zákazníka:</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Meno zákazníka"
                    value={mergeData.name}
                    onChange={(e) => setMergeData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={mergeData.email}
                    onChange={(e) => setMergeData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefón"
                    value={mergeData.phone}
                    onChange={(e) => setMergeData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Primárny zákazník (zostane)</InputLabel>
                    <Select
                      value={mergeData.targetCustomerId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        const sourceId = selectedGroup.group.find(c => c.id !== targetId)?.id || '';
                        setMergeData(prev => ({ 
                          ...prev, 
                          targetCustomerId: targetId,
                          sourceCustomerId: sourceId
                        }));
                      }}
                    >
                      {selectedGroup.group.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.stats.rentalCount} prenájmov)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)} disabled={merging}>
            Zrušiť
          </Button>
          <Button 
            onClick={handleMerge} 
            variant="contained" 
            disabled={merging || !mergeData.name.trim()}
            startIcon={merging ? <CircularProgress size={20} /> : <MergeIcon />}
          >
            {merging ? 'Zjednocujem...' : 'Zjednotiť zákazníkov'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
