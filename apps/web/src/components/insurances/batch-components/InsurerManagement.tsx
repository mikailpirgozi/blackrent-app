import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Settings, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  useCreateInsurer,
  useDeleteInsurer,
} from '@/lib/react-query/hooks/useInsurers';

interface InsurerManagementProps {
  insurers: Array<{ id: string; name: string }>;
  value: string;
  onChange: (company: string) => void;
  label?: string;
}

export function InsurerManagement({
  insurers,
  value,
  onChange,
  label = 'Poisťovňa *',
}: InsurerManagementProps) {
  const createInsurerMutation = useCreateInsurer();
  const deleteInsurerMutation = useDeleteInsurer();

  const [addingInsurer, setAddingInsurer] = useState(false);
  const [newInsurerName, setNewInsurerName] = useState('');
  const [manageInsurersOpen, setManageInsurersOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [insurerToDelete, setInsurerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleAddInsurer = async () => {
    if (!newInsurerName.trim()) return;

    try {
      const trimmedName = newInsurerName.trim();

      // Check duplicates
      const duplicate = insurers.find(
        ins => ins.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (duplicate) {
        alert(
          `Poisťovňa "${trimmedName}" už existuje! Prosím vyber ju zo zoznamu.`
        );
        return;
      }

      const id = uuidv4();
      await createInsurerMutation.mutateAsync({ id, name: trimmedName });
      onChange(trimmedName);
      setNewInsurerName('');
      setAddingInsurer(false);
    } catch (error) {
      console.error('Chyba pri vytváraní poisťovne:', error);
      alert('Chyba pri vytváraní poisťovne');
    }
  };

  const handleDeleteInsurer = async () => {
    if (!insurerToDelete) return;

    try {
      await deleteInsurerMutation.mutateAsync(insurerToDelete.id);

      // Clear selection if deleted insurer was selected
      if (value === insurerToDelete.name) {
        onChange('');
      }

      setInsurerToDelete(null);
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Chyba pri vymazávaní poisťovne:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Chyba pri vymazávaní poisťovne. Skontroluj či nie je priradená k žiadnej poistke.'
      );
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setManageInsurersOpen(true)}
          >
            <Settings className="h-3.5 w-3.5 mr-1" />
            Spravovať
          </Button>
        </div>
        <Select
          value={value}
          onValueChange={val => {
            if (val === '__add_new__') {
              setAddingInsurer(true);
            } else {
              onChange(val);
            }
          }}
        >
          <SelectTrigger className="border-2">
            <SelectValue placeholder="Vyberte poisťovňu..." />
          </SelectTrigger>
          <SelectContent>
            {insurers
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
              .map(insurer => (
                <SelectItem key={insurer.id} value={insurer.name}>
                  {insurer.name}
                </SelectItem>
              ))}
            <SelectItem value="__add_new__">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Pridať novú poisťovňu
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {addingInsurer && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Nová poisťovňa"
              value={newInsurerName}
              onChange={e => setNewInsurerName(e.target.value)}
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInsurer();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={!newInsurerName.trim()}
              onClick={handleAddInsurer}
            >
              Pridať
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAddingInsurer(false);
                setNewInsurerName('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Manage Insurers Dialog */}
      <Dialog open={manageInsurersOpen} onOpenChange={setManageInsurersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Spravovať poisťovne</DialogTitle>
            <DialogDescription>
              Vymazanie poisťovne je možné len ak nie je priradená k žiadnej
              poistke.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {insurers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Zatiaľ nie sú vytvorené žiadne poisťovne.
              </p>
            ) : (
              insurers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, 'sk'))
                .map(insurer => (
                  <div
                    key={insurer.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-medium">{insurer.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setInsurerToDelete(insurer);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManageInsurersOpen(false)}
            >
              Zavrieť
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať poisťovňu?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chceš vymazať poisťovňu{' '}
              <strong>{insurerToDelete?.name}</strong>?
              <br />
              Táto akcia je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteInsurer}
            >
              Vymazať
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
