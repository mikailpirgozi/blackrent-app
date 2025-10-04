import { useState } from 'react';
import {
  Building2,
  Plus,
  Settings,
  Trash2,
  Users,
  Car,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePlatforms,
  useCreatePlatform,
  useUpdatePlatform,
  useDeletePlatform,
  usePlatformStats,
} from '@/lib/react-query/hooks/usePlatforms';
import { useAuth } from '@/context/AuthContext';
import type { Platform } from '@/types';

export default function PlatformManagementDashboard() {
  const { isSuperAdmin, state } = useAuth();

  // 🛡️ HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  const { data: platforms, isLoading } = usePlatforms();
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    subdomain: '',
  });

  // 🛡️ SECURITY: Only super_admin or admin can access (AFTER ALL HOOKS)
  const isAdmin =
    state.user?.role === 'admin' || state.user?.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <p className="text-destructive">
            Prístup zamietnutý. Len super admin môže spravovať platformy.
          </p>
        </Card>
      </div>
    );
  }

  const handleCreate = async () => {
    try {
      await createPlatform.mutateAsync({
        name: formData.name,
        displayName: formData.displayName,
        subdomain: formData.subdomain,
      });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', displayName: '', subdomain: '' });
    } catch (error) {
      console.error('Create platform error:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedPlatform) return;

    try {
      await updatePlatform.mutateAsync({
        id: selectedPlatform.id,
        data: {
          name: formData.name,
          displayName: formData.displayName,
          subdomain: formData.subdomain,
        },
      });
      setIsEditDialogOpen(false);
      setSelectedPlatform(null);
      setFormData({ name: '', displayName: '', subdomain: '' });
    } catch (error) {
      console.error('Update platform error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Naozaj chceš vymazať túto platformu? Vymažú sa všetky related dáta!'
      )
    ) {
      return;
    }

    try {
      await deletePlatform.mutateAsync(id);
    } catch (error) {
      console.error('Delete platform error:', error);
    }
  };

  const openEditDialog = (platform: Platform) => {
    setSelectedPlatform(platform);
    setFormData({
      name: platform.name,
      displayName: platform.displayName || '',
      subdomain: platform.subdomain || '',
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🌐 Platform Management</h1>
          <p className="text-muted-foreground mt-2">
            Spravuj platformy, priraď firmy a users
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nová Platforma
        </Button>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms?.map(platform => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            onEdit={openEditDialog}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vytvor novú platformu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Názov *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Blackrent"
              />
            </div>
            <div>
              <Label htmlFor="displayName">Zobrazovaný názov</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={e =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Blackrent - Premium Car Rental"
              />
            </div>
            <div>
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={e =>
                  setFormData({ ...formData, subdomain: e.target.value })
                }
                placeholder="blackrent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || createPlatform.isPending}
            >
              {createPlatform.isPending ? 'Vytvára sa...' : 'Vytvoriť'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uprav platformu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Názov *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-displayName">Zobrazovaný názov</Label>
              <Input
                id="edit-displayName"
                value={formData.displayName}
                onChange={e =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-subdomain">Subdomain</Label>
              <Input
                id="edit-subdomain"
                value={formData.subdomain}
                onChange={e =>
                  setFormData({ ...formData, subdomain: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name || updatePlatform.isPending}
            >
              {updatePlatform.isPending ? 'Ukladá sa...' : 'Uložiť'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Platform Card Component
function PlatformCard({
  platform,
  onEdit,
  onDelete,
}: {
  platform: Platform;
  onEdit: (platform: Platform) => void;
  onDelete: (id: string) => void;
}) {
  const { data: stats, isLoading } = usePlatformStats(platform.id);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {platform.name}
            </CardTitle>
            {platform.displayName && (
              <p className="text-sm text-muted-foreground mt-1">
                {platform.displayName}
              </p>
            )}
          </div>
          <Badge variant={platform.isActive ? 'default' : 'secondary'}>
            {platform.isActive ? 'Aktívna' : 'Neaktívna'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatItem
              icon={Building2}
              label="Firmy"
              value={stats?.totalCompanies || 0}
            />
            <StatItem
              icon={Users}
              label="Users"
              value={stats?.totalUsers || 0}
            />
            <StatItem
              icon={Car}
              label="Vozidlá"
              value={stats?.totalVehicles || 0}
            />
            <StatItem
              icon={FileText}
              label="Prenájmy"
              value={stats?.totalRentals || 0}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(platform)}
            className="flex-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Upraviť
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(platform.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Stat Item Component
function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
