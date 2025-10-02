import {
  Plus as AddIcon,
  X as CancelIcon,
  Tag as CategoryIcon,
  Trash2 as DeleteIcon,
  GripVertical as DragIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from 'lucide-react';
// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useEffect, useState } from 'react';

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
      setError('Chyba pri načítavaní kategórií: ' + (error as Error).message);
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
        setError('Chyba pri mazaní kategórie: ' + (error as Error).message);
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
      setError('Chyba pri ukladaní kategórie: ' + (error as Error).message);
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gray-50 border-b border-gray-200 -m-6 mb-6 p-6">
            <CategoryIcon className="h-5 w-5 text-blue-600" />
            Správa kategórií nákladov
          </DialogTitle>
        </DialogHeader>
        {/* Error/Success alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Header s tlačidlom pridať */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            Existujúce kategórie ({categories.length})
          </h3>
          <Button
            onClick={handleAddCategory}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <AddIcon className="h-4 w-4" />
            Pridať kategóriu
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center my-6">
            <Spinner />
          </div>
        )}

        {/* Zoznam kategórií */}
        <Card className="shadow-md">
          <div className="divide-y">
            {categories.map((category) => (
              <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <DragIcon className="h-4 w-4 text-gray-500 cursor-grab" />
                      <span className="min-w-[30px] text-center font-semibold text-gray-500 text-sm">
                        {category.sortOrder}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={category.color === 'primary' ? 'default' : 'secondary'}
                          className="font-semibold"
                        >
                          {category.displayName}
                        </Badge>
                        {category.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Základná
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {category.name} | Ikona: {category.icon}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                      disabled={loading}
                      className="h-8 w-8 p-0"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    {!category.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {categories.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                Žiadne kategórie nenájdené
              </div>
            )}
          </div>
        </Card>
      </DialogContent>

      <DialogFooter className="bg-gray-50 border-t border-gray-200 -m-6 mt-6 p-6">
        <Button onClick={onClose} variant="outline">
          Zavrieť
        </Button>
      </DialogFooter>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && handleFormCancel()}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5" />
              {editingCategory ? 'Upraviť kategóriu' : 'Pridať kategóriu'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Zobrazovaný názov *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData(prev => ({
                    ...prev,
                    displayName: e.target.value,
                    name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  }))
                }
                placeholder="Názov ktorý sa zobrazí v aplikácii"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Systémový názov</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Automaticky generovaný z zobrazovaného názvu"
                disabled={!!editingCategory} // Nemožno meniť pri úprave
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Popis</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Voliteľný popis kategórie"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Ikona</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, icon: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte ikonu" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map(icon => (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <span>{icon.icon}</span>
                          {icon.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Farba</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) =>
                    setFormData(prev => ({
                      ...prev,
                      color: value as
                        | 'primary'
                        | 'secondary'
                        | 'success'
                        | 'error'
                        | 'warning'
                        | 'info',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte farbu" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLORS.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.color }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Poradie</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setFormData(prev => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="Poradie zobrazovania v zoznamoch"
              />
            </div>

            {/* Náhľad */}
            <div className="space-y-2">
              <Label>Náhľad:</Label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-semibold mb-2">Náhľad:</div>
                <Badge 
                  variant={formData.color === 'primary' ? 'default' : 'secondary'}
                  className="font-semibold"
                >
                  {formData.displayName || 'Názov kategórie'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogFooter className="gap-2">
          <Button
            onClick={handleFormCancel}
            variant="outline"
          >
            <CancelIcon className="h-4 w-4 mr-2" />
            Zrušiť
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={loading || !formData.displayName.trim()}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {editingCategory ? 'Aktualizovať' : 'Vytvoriť'}
          </Button>
        </DialogFooter>
      </Dialog>
    </Dialog>
  );
};

export default ExpenseCategoryManager;
