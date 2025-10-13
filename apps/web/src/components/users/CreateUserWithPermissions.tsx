/**
 * CREATE USER WITH PERMISSIONS
 * Enhanced user creation with company selection and permission assignment
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { Company, CompanyPermissions, UserRole } from '@/types';

interface CreateUserWithPermissionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: () => void;
}

export default function CreateUserWithPermissions({
  open,
  onOpenChange,
  onUserCreated,
}: CreateUserWithPermissionsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'employee' as UserRole,
    companyId: '',
    employeeNumber: '',
  });

  // Permission state
  const [assignPermissions, setAssignPermissions] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<CompanyPermissions>({
    vehicles: { read: true, write: false, delete: false },
    rentals: { read: true, write: false, delete: false },
    expenses: { read: true, write: false, delete: false },
    settlements: { read: true, write: false, delete: false },
    customers: { read: true, write: false, delete: false },
    insurances: { read: true, write: false, delete: false },
    maintenance: { read: true, write: false, delete: false },
    protocols: { read: true, write: false, delete: false },
  });

  // Load companies
  useEffect(() => {
    if (open) {
      loadCompanies();
    }
  }, [open]);

  // Auto-set default permissions based on role
  useEffect(() => {
    if (formData.role === 'company_admin') {
      setPermissions({
        vehicles: { read: true, write: true, delete: true },
        rentals: { read: true, write: true, delete: true },
        expenses: { read: true, write: true, delete: true },
        settlements: { read: true, write: true, delete: true },
        customers: { read: true, write: true, delete: true },
        insurances: { read: true, write: true, delete: true },
        maintenance: { read: true, write: true, delete: true },
        protocols: { read: true, write: true, delete: true },
      });
    } else if (formData.role === 'investor') {
      setPermissions({
        vehicles: { read: true, write: false, delete: false },
        rentals: { read: true, write: false, delete: false },
        expenses: { read: true, write: false, delete: false },
        settlements: { read: true, write: false, delete: false },
        customers: { read: true, write: false, delete: false },
        insurances: { read: true, write: false, delete: false },
        maintenance: { read: true, write: false, delete: false },
        protocols: { read: true, write: false, delete: false },
      });
    } else if (formData.role === 'employee') {
      setPermissions({
        vehicles: { read: true, write: true, delete: false },
        rentals: { read: true, write: true, delete: false },
        expenses: { read: true, write: true, delete: false },
        settlements: { read: true, write: false, delete: false },
        customers: { read: true, write: true, delete: false },
        insurances: { read: true, write: false, delete: false },
        maintenance: { read: true, write: true, delete: false },
        protocols: { read: true, write: true, delete: false },
      });
    }
  }, [formData.role]);

  const loadCompanies = async () => {
    try {
      const companiesData = await apiService.getCompanies();
      setCompanies(companiesData);

      // Auto-select first company if none selected
      if (companiesData.length > 0 && !formData.companyId) {
        setFormData(prev => ({ ...prev, companyId: companiesData[0].id }));
        setSelectedCompanies([companiesData[0].id]);
      }
    } catch {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa načítať firmy',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      toast({
        title: 'Chyba',
        description: 'Vyplňte všetky povinné polia',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Chyba',
        description: 'Heslo musí mať aspoň 6 znakov',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Create user
      const newUser = await apiService.createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        role: formData.role,
        companyId: formData.companyId || undefined,
      });

      // Assign permissions if needed
      if (assignPermissions && selectedCompanies.length > 0) {
        const userId = newUser.id;

        if (userId) {
          for (const companyId of selectedCompanies) {
            await apiService.setUserCompanyPermission(
              userId,
              companyId,
              permissions as unknown as Record<string, unknown>
            );
          }
        }
      }

      toast({
        title: 'Úspech',
        description: `Používateľ ${formData.username} bol vytvorený`,
      });

      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'employee',
        companyId: '',
        employeeNumber: '',
      });
      setAssignPermissions(false);
      setSelectedCompanies([]);

      onUserCreated?.();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Nepodarilo sa vytvoriť používateľa';
      toast({
        title: 'Chyba',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions: Record<UserRole, string> = {
    admin: 'Plné práva na všetko (legacy)',
    super_admin: 'Plné práva na všetky firmy',
    platform_admin: 'Platform administrator',
    platform_employee: 'Platform employee',
    company_admin: 'Admin konkrétnej firmy',
    investor: 'Majiteľ firmy (read-only)',
    employee: 'Zamestnanec s prispôsobiteľnými právami',
    temp_worker: 'Brigádnik s obmedzenými právami',
    mechanic: 'Mechanik (údržba a opravy)',
    sales_rep: 'Obchodný zástupca',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Vytvoriť Nového Používateľa
          </DialogTitle>
          <DialogDescription>
            Vyplňte informácie o používateľovi a nastavte jeho oprávnenia
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Základné Informácie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Používateľské meno *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={e =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="jan.novak"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="jan.novak@firma.sk"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Meno</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={e =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Ján"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Priezvisko</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={e =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Novák"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Heslo *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimálne 6 znakov"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role & Company */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rola a Firma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role">Rola *</Label>
                <Select
                  value={formData.role}
                  onValueChange={value =>
                    setFormData({ ...formData, role: value as UserRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      👑 Platform Admin (úplné práva)
                    </SelectItem>
                    <SelectItem value="company_admin">
                      🏢 Company Admin
                    </SelectItem>
                    <SelectItem value="investor">👔 Company Owner</SelectItem>
                    <SelectItem value="employee">👤 Employee</SelectItem>
                    <SelectItem value="mechanic">🔧 Mechanik</SelectItem>
                    <SelectItem value="sales_rep">💼 Sales Rep</SelectItem>
                    <SelectItem value="temp_worker">⏱️ Temp Worker</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {roleDescriptions[formData.role]}
                </p>
              </div>

              <div>
                <Label htmlFor="companyId">Hlavná Firma</Label>
                <Select
                  value={formData.companyId}
                  onValueChange={value => {
                    setFormData({ ...formData, companyId: value });
                    if (!selectedCompanies.includes(value)) {
                      setSelectedCompanies([...selectedCompanies, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte firmu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Firma ku ktorej používateľ patrí (povinné pre company_admin,
                  investor)
                </p>
              </div>

              <div>
                <Label htmlFor="employeeNumber">Zamestnanecké číslo</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={e =>
                    setFormData({ ...formData, employeeNumber: e.target.value })
                  }
                  placeholder="EMP-001"
                />
              </div>
            </CardContent>
          </Card>

          {/* Permission Assignment */}
          {!['super_admin', 'company_admin'].includes(formData.role) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Oprávnenia
                  </CardTitle>
                  <Switch
                    checked={assignPermissions}
                    onCheckedChange={setAssignPermissions}
                  />
                </div>
              </CardHeader>
              {assignPermissions && (
                <CardContent className="space-y-4">
                  <div>
                    <Label>Prístup k Firmám</Label>
                    <div className="space-y-2 mt-2">
                      {companies.map(company => (
                        <div
                          key={company.id}
                          className="flex items-center gap-2"
                        >
                          <Switch
                            checked={selectedCompanies.includes(company.id)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedCompanies([
                                  ...selectedCompanies,
                                  company.id,
                                ]);
                              } else {
                                setSelectedCompanies(
                                  selectedCompanies.filter(
                                    id => id !== company.id
                                  )
                                );
                              }
                            }}
                          />
                          <Label className="font-normal">{company.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-semibold mb-3 block">
                      Default Permissions
                    </Label>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      {Object.entries(permissions).map(([resource, perms]) => (
                        <div key={resource} className="space-y-1">
                          <p className="font-medium capitalize">{resource}</p>
                          <div className="flex gap-2">
                            {perms.read && (
                              <Badge variant="outline" className="text-xs">
                                ✅ R
                              </Badge>
                            )}
                            {perms.write && (
                              <Badge variant="outline" className="text-xs">
                                ✏️ W
                              </Badge>
                            )}
                            {perms.delete && (
                              <Badge variant="outline" className="text-xs">
                                🗑️ D
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      💡 Po vytvorení môžete upraviť permissions v sekcii
                      "Oprávnenia"
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Zrušiť
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Vytváram...' : 'Vytvoriť Používateľa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
