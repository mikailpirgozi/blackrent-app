import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { apiService } from '../../services/api';
import type { ExpenseCategory } from '../../types';

interface ExpenseCategoryManagerProps {
  open: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

const AVAILABLE_ICONS = [
  { value: 'receipt', label: 'Účtenka', icon: '🧾' },
  { value: 'local_gas_station', label: 'Palivo', icon: '⛽' },
  { value: 'build', label: 'Servis', icon: '🔧' },
  { value: 'security', label: 'Poistenie', icon: '🛡️' },
  { value: 'category', label: 'Kategória', icon: '📂' },
  { value: 'euro', label: 'Euro', icon: '💶' },
  { value: 'shopping_cart', label: 'Nákup', icon: '🛒' },
  { value: 'home', label: 'Dom', icon: '🏠' },
  { value: 'work', label: 'Práca', icon: '💼' },
  { value: 'restaurant', label: 'Reštaurácia', icon: '🍽️' },
  { value: 'local_hospital', label: 'Nemocnica', icon: '🏥' },
  { value: 'school', label: 'Škola', icon: '🏫' },
  { value: 'fitness_center', label: 'Fitness', icon: '💪' },
  { value: 'phone', label: 'Telefón', icon: '📱' },
  { value: 'computer', label: 'Počítač', icon: '💻' },
  { value: 'flight', label: 'Let', icon: '✈️' },
  { value: 'hotel', label: 'Hotel', icon: '🏨' },
  { value: 'local_taxi', label: 'Taxi', icon: '🚕' },
  { value: 'train', label: 'Vlak', icon: '🚆' },
  { value: 'directions_bus', label: 'Autobus', icon: '🚌' },
];

const AVAILABLE_COLORS = [
  { value: 'primary', label: 'Modrá', color: '#1976d2' },
  { value: 'secondary', label: 'Fialová', color: '#9c27b0' },
  { value: 'success', label: 'Zelená', color: '#2e7d32' },
  { value: 'error', label: 'Červená', color: '#d32f2f' },
  { value: 'warning', label: 'Oranžová', color: '#ed6c02' },
  { value: 'info', label: 'Svetlomodrá', color: '#0288d1' },
];

const ExpenseCategoryManager: React.FC<ExpenseCategoryManagerProps> = ({
  open,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    icon: 'receipt',
    color: 'primary' as
      | 'primary'
      | 'secondary'
      | 'success'
      | 'error'
      | 'warning'
      | 'info',
    sortOrder: 0,
  });

  // Načítanie kategórií
  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getExpenseCategories();
      setCategories(result);
    } catch (error: unknown) {
      setError('Chyba pri načítavaní kategórií: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      icon: 'receipt',
      color: 'primary' as
        | 'primary'
        | 'secondary'
        | 'success'
        | 'error'
        | 'warning'
        | 'info',
      sortOrder: categories.length,
    });
    setEditingCategory(null);
  };

  // Handlers
  const handleAddCategory = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setFormData({
      name: category.name,
      displayName: category.displayName,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      sortOrder: category.sortOrder,
    });
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleDeleteCategory = async (category: ExpenseCategory) => {
    if (category.isDefault) {
      setError('Nemožno zmazať základnú kategóriu');
      return;
    }

    if (
      window.confirm(
        `Naozaj chcete zmazať kategóriu "${category.displayName}"?`
      )
    ) {
      setLoading(true);
      setError(null);
      try {
        await apiService.deleteExpenseCategory(category.id);
        setSuccess('Kategória úspešne zmazaná');
        await loadCategories();
        onCategoriesChanged?.();
      } catch (error: unknown) {
        setError('Chyba pri mazaní kategórie: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.displayName.trim()) {
      setError('Zobrazovaný názov je povinný');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editingCategory) {
        // Aktualizácia
        const updatedCategory: ExpenseCategory = {
          ...editingCategory,
          displayName: formData.displayName.trim(),
          description: formData.description.trim() || undefined,
          icon: formData.icon,
          color: formData.color,
          sortOrder: formData.sortOrder,
        };
        await apiService.updateExpenseCategory(updatedCategory);
        setSuccess('Kategória úspešne aktualizovaná');
      } else {
        // Vytvorenie
        await apiService.createExpenseCategory({
          name:
            formData.name ||
            formData.displayName.toLowerCase().replace(/\s+/g, '_'),
          displayName: formData.displayName.trim(),
          description: formData.description.trim() || undefined,
          icon: formData.icon,
          color: formData.color,
          sortOrder: formData.sortOrder,
        });
        setSuccess('Kategória úspešne vytvorená');
      }

      setFormOpen(false);
      await loadCategories();
      onCategoriesChanged?.();
    } catch (error: unknown) {
      setError('Chyba pri ukladaní kategórie: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setFormOpen(false);
    resetForm();
    setError(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <CategoryIcon sx={{ color: '#1976d2' }} />
        Správa kategórií nákladov
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Error/Success alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Header s tlačidlom pridať */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Existujúce kategórie ({categories.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCategory}
            disabled={loading}
          >
            Pridať kategóriu
          </Button>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Zoznam kategórií */}
        <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <List>
            {categories.map((category, index) => (
              <React.Fragment key={category.id}>
                <ListItem
                  sx={{
                    py: 2,
                    '&:hover': { backgroundColor: '#f5f5f5' },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mr: 2,
                    }}
                  >
                    <DragIcon
                      sx={{ color: 'text.secondary', cursor: 'grab' }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        minWidth: 30,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {category.sortOrder}
                    </Typography>
                  </Box>

                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Chip
                          label={category.displayName}
                          color={category.color}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {category.isDefault && (
                          <Chip
                            label="Základná"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          ID: {category.name} | Ikona: {category.icon}
                        </Typography>
                        {category.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {category.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditCategory(category)}
                        disabled={loading}
                        sx={{
                          backgroundColor: '#f5f5f5',
                          '&:hover': { backgroundColor: '#e0e0e0' },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {!category.isDefault && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCategory(category)}
                          disabled={loading}
                          sx={{
                            backgroundColor: '#ffebee',
                            color: '#d32f2f',
                            '&:hover': { backgroundColor: '#ffcdd2' },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < categories.length - 1 && <Divider />}
              </React.Fragment>
            ))}

            {categories.length === 0 && !loading && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      Žiadne kategórie nenájdené
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Button onClick={onClose} variant="outlined">
          Zavrieť
        </Button>
      </DialogActions>

      {/* Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CategoryIcon />
          {editingCategory ? 'Upraviť kategóriu' : 'Pridať kategóriu'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zobrazovaný názov *"
                value={formData.displayName}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    displayName: e.target.value,
                    name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  }))
                }
                required
                helperText="Názov ktorý sa zobrazí v aplikácii"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Systémový názov"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                helperText="Automaticky generovaný z zobrazovaného názvu"
                disabled={!!editingCategory} // Nemožno meniť pri úprave
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                multiline
                rows={2}
                helperText="Voliteľný popis kategórie"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ikona</InputLabel>
                <Select
                  value={formData.icon}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, icon: e.target.value }))
                  }
                  label="Ikona"
                >
                  {AVAILABLE_ICONS.map(icon => (
                    <MenuItem key={icon.value} value={icon.value}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <span>{icon.icon}</span>
                        {icon.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Farba</InputLabel>
                <Select
                  value={formData.color}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      color: e.target.value as any,
                    }))
                  }
                  label="Farba"
                >
                  {AVAILABLE_COLORS.map(color => (
                    <MenuItem key={color.value} value={color.value}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: color.color,
                          }}
                        />
                        {color.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poradie"
                type="number"
                value={formData.sortOrder}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
                helperText="Poradie zobrazovania v zoznamoch"
              />
            </Grid>

            {/* Náhľad */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Náhľad:
                </Typography>
                <Chip
                  label={formData.displayName || 'Názov kategórie'}
                  color={formData.color}
                  size="medium"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleFormCancel}
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Zrušiť
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading || !formData.displayName.trim()}
          >
            {editingCategory ? 'Aktualizovať' : 'Vytvoriť'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ExpenseCategoryManager;
