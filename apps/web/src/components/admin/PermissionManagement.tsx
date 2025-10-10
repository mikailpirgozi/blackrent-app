/**
 * PERMISSION MANAGEMENT
 * Complete UI for managing user permissions and company access
 */

import React, { useEffect, useState } from 'react';
import { Shield, Building2, Users, Trash2, Edit, Check, X, Save } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Switch } from '../ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import type { User, Company, CompanyPermissions, UserCompanyAccess } from '@/types';
import { getUserRoleDisplayName } from '@/hooks/usePermissions';

interface PermissionManagementProps {
  userId?: string;
}

export default function PermissionManagement({ userId: _userId }: PermissionManagementProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCompanyAccess, setUserCompanyAccess] = useState<UserCompanyAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [editingPermissions, setEditingPermissions] = useState<CompanyPermissions | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, companiesData] = await Promise.all([
        apiService.getUsers(),
        apiService.getCompanies()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa načítať dáta',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (user: User) => {
    try {
      const access = await apiService.getUserCompanyAccess(user.id);
      setUserCompanyAccess(access as unknown as UserCompanyAccess[]);
      setSelectedUser(user);
    } catch {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa načítať permissions',
        variant: 'destructive'
      });
    }
  };

  const handleAddCompanyAccess = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setEditingPermissions({
      vehicles: { read: true, write: false, delete: false },
      rentals: { read: true, write: false, delete: false },
      expenses: { read: true, write: false, delete: false },
      settlements: { read: true, write: false, delete: false },
      customers: { read: true, write: false, delete: false },
      insurances: { read: true, write: false, delete: false },
      maintenance: { read: true, write: false, delete: false },
      protocols: { read: true, write: false, delete: false }
    });
    setEditDialogOpen(true);
  };

  const handleEditCompanyAccess = (companyId: string, permissions: CompanyPermissions) => {
    setSelectedCompanyId(companyId);
    setEditingPermissions(permissions);
    setEditDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !selectedCompanyId || !editingPermissions) return;

    try {
      await apiService.setUserCompanyPermission(
        selectedUser.id,
        selectedCompanyId,
        editingPermissions as unknown as Record<string, unknown>
      );

      toast({
        title: 'Úspech',
        description: 'Permissions boli uložené'
      });

      // Reload permissions
      await loadUserPermissions(selectedUser);
      setEditDialogOpen(false);
    } catch {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa uložiť permissions',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveCompanyAccess = async (companyId: string) => {
    if (!selectedUser) return;

    try {
      await apiService.removeUserCompanyPermission(selectedUser.id, companyId);

      toast({
        title: 'Úspech',
        description: 'Prístup k firme bol odstránený'
      });

      // Reload permissions
      await loadUserPermissions(selectedUser);
    } catch {
      toast({
        title: 'Chyba',
        description: 'Nepodarilo sa odstrániť prístup',
        variant: 'destructive'
      });
    }
  };

  const updatePermission = (
    resource: keyof CompanyPermissions,
    action: 'read' | 'write' | 'delete',
    value: boolean
  ) => {
    if (!editingPermissions) return;

    setEditingPermissions({
      ...editingPermissions,
      [resource]: {
        ...editingPermissions[resource],
        [action]: value
      }
    });
  };

  const resourceLabels: Record<keyof CompanyPermissions, string> = {
    vehicles: '🚗 Vozidlá',
    rentals: '📝 Prenájmy',
    expenses: '💰 Náklady',
    settlements: '📊 Vyúčtovanie',
    customers: '👥 Zákazníci',
    insurances: '🛡️ Poistky/STK',
    maintenance: '🔧 Údržba',
    protocols: '📋 Protokoly'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Správa Oprávnení</h1>
          <p className="text-muted-foreground mt-1">
            Spravujte prístupové práva používateľov k firmám a ich dátam
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white">
          👑 Super Admin Panel
        </Badge>
      </div>

      <Separator />

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Výber Používateľa
          </CardTitle>
          <CardDescription>
            Vyberte používateľa pre správu jeho oprávnení
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <Card 
                key={user.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedUser?.id === user.id ? 'ring-2 ring-blue-600' : ''
                }`}
                onClick={() => loadUserPermissions(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {getUserRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                    {selectedUser?.id === user.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Management */}
      {selectedUser && (
        <>
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Oprávnenia: {selectedUser.username}
              </CardTitle>
              <CardDescription>
                Role: {getUserRoleDisplayName(selectedUser.role)}
                {selectedUser.platformId && ` • Platforma: ${companies.find(c => c.id === selectedUser.platformId)?.name}`}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Company Access List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Prístup k Firmám
                  </CardTitle>
                  <CardDescription>
                    Firmy ku ktorým má používateľ prístup a jeho práva
                  </CardDescription>
                </div>
                <Select onValueChange={handleAddCompanyAccess}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Pridať firmu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies
                      .filter(c => !userCompanyAccess.some(uca => uca.companyId === c.id))
                      .map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {userCompanyAccess.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Používateľ nemá prístup k žiadnej firme</p>
                  <p className="text-sm mt-1">Použite dropdown vyššie pre pridanie prístupu</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firma</TableHead>
                      <TableHead>Prístupné Sekcie</TableHead>
                      <TableHead className="text-right">Akcie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userCompanyAccess.map(access => {
                      const hasReadAccess = Object.values(access.permissions).filter(p => p.read).length;
                      const hasWriteAccess = Object.values(access.permissions).filter(p => p.write).length;
                      const hasDeleteAccess = Object.values(access.permissions).filter(p => p.delete).length;

                      return (
                        <TableRow key={access.companyId}>
                          <TableCell className="font-medium">
                            {access.companyName}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                ✅ Read: {hasReadAccess}/9
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                ✏️ Write: {hasWriteAccess}/9
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                🗑️ Delete: {hasDeleteAccess}/9
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCompanyAccess(access.companyId, access.permissions)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Upraviť
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveCompanyAccess(access.companyId)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Odstrániť
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Permission Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nastavenie Oprávnení</DialogTitle>
            <DialogDescription>
              Firma: {companies.find(c => c.id === selectedCompanyId)?.name}
              {selectedUser && ` • Používateľ: ${selectedUser.username}`}
            </DialogDescription>
          </DialogHeader>

          {editingPermissions && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead className="text-center">Čítanie</TableHead>
                    <TableHead className="text-center">Zápis</TableHead>
                    <TableHead className="text-center">Mazanie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Object.keys(resourceLabels) as Array<keyof CompanyPermissions>).map(resource => (
                    <TableRow key={resource}>
                      <TableCell className="font-medium">
                        {resourceLabels[resource]}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={editingPermissions[resource].read}
                          onCheckedChange={(value) => updatePermission(resource, 'read', value)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={editingPermissions[resource].write}
                          onCheckedChange={(value) => updatePermission(resource, 'write', value)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={editingPermissions[resource].delete}
                          onCheckedChange={(value) => updatePermission(resource, 'delete', value)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Set all read
                    const newPerms = { ...editingPermissions };
                    (Object.keys(newPerms) as Array<keyof CompanyPermissions>).forEach(key => {
                      newPerms[key].read = true;
                    });
                    setEditingPermissions(newPerms);
                  }}
                >
                  ✅ Všetko Čítanie
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Set all write
                    const newPerms = { ...editingPermissions };
                    (Object.keys(newPerms) as Array<keyof CompanyPermissions>).forEach(key => {
                      newPerms[key].read = true;
                      newPerms[key].write = true;
                    });
                    setEditingPermissions(newPerms);
                  }}
                >
                  ✏️ Všetko Zápis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Set all delete
                    const newPerms = { ...editingPermissions };
                    (Object.keys(newPerms) as Array<keyof CompanyPermissions>).forEach(key => {
                      newPerms[key].read = true;
                      newPerms[key].write = true;
                      newPerms[key].delete = true;
                    });
                    setEditingPermissions(newPerms);
                  }}
                >
                  🗑️ Plné Práva
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Clear all
                    const newPerms = { ...editingPermissions };
                    (Object.keys(newPerms) as Array<keyof CompanyPermissions>).forEach(key => {
                      newPerms[key].read = false;
                      newPerms[key].write = false;
                      newPerms[key].delete = false;
                    });
                    setEditingPermissions(newPerms);
                  }}
                >
                  ❌ Vymazať Všetko
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Zrušiť
            </Button>
            <Button onClick={handleSavePermissions}>
              <Save className="w-4 h-4 mr-2" />
              Uložiť Oprávnenia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

