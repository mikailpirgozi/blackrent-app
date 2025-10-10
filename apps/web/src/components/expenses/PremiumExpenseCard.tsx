import {
  Calendar,
  Tag,
  Car,
  FileText,
  TrendingUp,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import React from 'react';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import type { Expense } from '../../types';

interface PremiumExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

const PremiumExpenseCard: React.FC<PremiumExpenseCardProps> = ({
  expense,
  onEdit,
  onDelete,
}) => {
  // Category configuration with gradients
  const categoryConfig: Record<string, { label: string; gradient: string; icon: React.ComponentType<{ className?: string }> }> = {
    fuel: {
      label: 'Palivo',
      gradient: 'from-orange-500 to-red-600',
      icon: TrendingUp,
    },
    maintenance: {
      label: 'Údržba',
      gradient: 'from-blue-500 to-cyan-600',
      icon: Car,
    },
    insurance: {
      label: 'Poistenie',
      gradient: 'from-green-500 to-emerald-600',
      icon: CheckCircle,
    },
    repair: {
      label: 'Oprava',
      gradient: 'from-red-500 to-pink-600',
      icon: AlertCircle,
    },
    other: {
      label: 'Iné',
      gradient: 'from-purple-500 to-indigo-600',
      icon: FileText,
    },
  };

  const categoryKey = expense.category?.toLowerCase() || 'other';
  const configValue = (categoryKey in categoryConfig ? categoryConfig[categoryKey] : categoryConfig.other)!;
  const CategoryIcon = configValue.icon;
  const gradient = configValue.gradient;

  // Determine if it's a high expense
  const isHighExpense = expense.amount > 500;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
      {/* Gradient header */}
      <div className={`relative h-24 bg-gradient-to-r ${gradient} overflow-hidden`}>
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-2xl animate-blob" />
        </div>

        {/* Amount - Large and prominent */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h3" className="text-white font-bold mb-1">
              €{expense.amount.toFixed(2)}
            </Typography>
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
              <CategoryIcon className="h-3 w-3 mr-1" />
              {configValue.label}
            </Badge>
          </div>
        </div>

        {/* High expense indicator */}
        {isHighExpense && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500 text-white border-0 animate-pulse">
              Vysoký
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Description */}
        {expense.description && (
          <div>
            <Typography variant="body2" className="font-semibold line-clamp-2">
              {expense.description}
            </Typography>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Date */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <Typography variant="caption" className="text-muted-foreground">
                Dátum
              </Typography>
            </div>
            <Typography variant="body2" className="font-semibold">
              {format(new Date(expense.date), 'd. MMM yyyy', { locale: sk })}
            </Typography>
          </div>

          {/* Category Badge */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-primary" />
              <Typography variant="caption" className="text-muted-foreground">
                Kategória
              </Typography>
            </div>
            <Badge variant="outline" className="capitalize">
              {expense.category || 'N/A'}
            </Badge>
          </div>
        </div>

        {/* Vehicle Info */}
        {expense.vehicleId && (
          <div className="p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              <div>
                <Typography variant="caption" className="text-muted-foreground">
                  Vozidlo ID: {expense.vehicleId}
                </Typography>
              </div>
            </div>
          </div>
        )}

        {/* Company */}
        {expense.company && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <Typography variant="caption">
              {expense.company}
            </Typography>
          </div>
        )}

        {/* Note */}
        {expense.note && (
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Typography variant="caption" className="text-muted-foreground">
                Poznámka
              </Typography>
            </div>
            <Typography variant="body2" className="text-sm">
              {expense.note}
            </Typography>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onEdit(expense)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            <Edit className="h-4 w-4 mr-1" />
            Upraviť
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(expense.id)}
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
    </Card>
  );
};

export default PremiumExpenseCard;

