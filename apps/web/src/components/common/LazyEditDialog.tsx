// 📝 Lazy Edit Dialog - Heavy component for performance testing
// This represents a complex form component that should be lazy loaded

import React, { useState, useEffect } from 'react';

// shadcn/ui components (direct imports)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface LazyEditDialogProps {
  itemId: string;
  open: boolean;
  onClose: () => void;
}

const LazyEditDialog: React.FC<LazyEditDialogProps> = ({
  itemId,
  open,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: '',
    status: 'active',
    description: '',
  });

  // Simulate loading heavy form data
  useEffect(() => {
    if (open) {
      setLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        setFormData({
          title: `Item ${itemId}`,
          subtitle: 'Sample subtitle',
          category: 'Sample category',
          status: 'active',
          description: 'Sample description',
        });
        setLoading(false);
      }, 500);
    }
  }, [open, itemId]);

  const handleSave = () => {
    // Simulate save operation
    console.log('Saving form data:', formData);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Načítavam...</DialogTitle>
            <DialogDescription>
              Načítavam formulár pre úpravu
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Načítavam formulár...
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upraviť položku</DialogTitle>
          <DialogDescription>
            Upravte detaily vybranej položky
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Názov</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Podtitul</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategória</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: string) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktívny</SelectItem>
                <SelectItem value="inactive">Neaktívny</SelectItem>
                <SelectItem value="pending">Čakajúci</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-full space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Zrušiť
          </Button>
          <Button onClick={handleSave}>Uložiť</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LazyEditDialog;
