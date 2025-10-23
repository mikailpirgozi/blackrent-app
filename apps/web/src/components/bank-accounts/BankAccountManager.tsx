import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '@/lib/react-query/hooks/usePaymentOrders';
import type {
  BankAccount,
  CreateBankAccountRequest,
} from '@/types/payment-order.types';

export function BankAccountManager() {
  const { data: accounts = [], isLoading, error } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  // Debug logging
  console.log('🏦 BankAccountManager:', {
    accountsCount: accounts.length,
    isLoading,
    error,
    accounts: accounts.slice(0, 3), // Prvé 3 účty
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null
  );
  const [formData, setFormData] = useState<CreateBankAccountRequest>({
    name: '',
    iban: '',
    swiftBic: '',
    bankName: '',
    isActive: true,
    isDefault: false,
  });

  const handleOpenDialog = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        iban: account.iban,
        swiftBic: account.swiftBic || '',
        bankName: account.bankName || '',
        isActive: account.isActive,
        isDefault: account.isDefault,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        iban: '',
        swiftBic: '',
        bankName: '',
        isActive: true,
        isDefault: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
  };

  const handleSave = async () => {
    try {
      if (editingAccount) {
        await updateMutation.mutateAsync({
          id: editingAccount.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save bank account:', error);

      // Detekcia duplicate IBAN
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('duplicate key') ||
        errorMessage.includes('bank_accounts_iban_key')
      ) {
        alert(
          '❌ Tento IBAN už existuje v systéme!\n\nIBAN musí byť unikátny. Skontrolujte prosím existujúce bankové účty.'
        );
      } else if (
        errorMessage.includes('Invalid IBAN format') ||
        errorMessage.includes('Neplatný formát IBAN')
      ) {
        alert(
          '❌ Neplatný formát IBAN!\n\nIBAN musí začínať kódom krajiny (napr. SK) a obsahovať čísla.\nPríklad: SK00 0000 0000 0000 0000 0000'
        );
      } else {
        alert(`❌ Chyba pri ukladaní bankového účtu:\n\n${errorMessage}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Naozaj chcete zmazať tento bankový účet?')) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete bank account:', error);
      alert('Chyba pri mazaní bankového účtu');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Načítavam...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bankové účty</CardTitle>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Pridať účet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Žiadne bankové účty</p>
              <p className="text-sm mt-2">
                Pridajte bankový účet pre generovanie platobných príkazov
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{account.name}</h3>
                      {account.isDefault && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Predvolený
                        </span>
                      )}
                      {!account.isActive && (
                        <span className="text-xs bg-gray-500 text-white px-2 py-0.5 rounded">
                          Neaktívny
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {account.iban}
                    </p>
                    {account.bankName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {account.bankName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(account)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(account.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pre pridanie/úpravu účtu */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Upraviť bankový účet' : 'Nový bankový účet'}
            </DialogTitle>
            <DialogDescription>
              Zadajte údaje bankového účtu pre generovanie platobných príkazov
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Názov účtu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="napr. Hlavný účet"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN *</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={e => {
                  // Automaticky formátuj IBAN s medzerami po každých 4 znakoch
                  const value = e.target.value.replace(/\s/g, '').toUpperCase();
                  const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                  setFormData({ ...formData, iban: formatted });
                }}
                placeholder="SK00 0000 0000 0000 0000 0000"
                maxLength={34 + 8} // 34 znakov + 8 medzier
              />
              <p className="text-xs text-muted-foreground">
                Zadajte IBAN s alebo bez medzier (napr.
                SK0000000000000000000000)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Názov banky</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={e =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="napr. Tatra banka"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swiftBic">SWIFT/BIC</Label>
              <Input
                id="swiftBic"
                value={formData.swiftBic}
                onChange={e => {
                  // Automaticky veľké písmená a odstráň medzery
                  const value = e.target.value.replace(/\s/g, '').toUpperCase();
                  setFormData({ ...formData, swiftBic: value });
                }}
                placeholder="napr. TATRSKBX"
                maxLength={11}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Aktívny účet</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={checked =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isDefault">Predvolený účet</Label>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={checked =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="w-4 h-4 mr-2" />
              Zrušiť
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name ||
                !formData.iban ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              <Check className="w-4 h-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending
                ? 'Ukladám...'
                : 'Uložiť'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
