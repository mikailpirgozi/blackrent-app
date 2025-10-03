/**
 * ===================================================================
 * LEASING FILTERS FORM - Filtrovanie leasingov
 * ===================================================================
 */

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { LeasingFilters, LoanCategory } from '@/types/leasing-types';
import { LEASING_COMPANIES } from '@/types/leasing-types';

interface LeasingFiltersFormProps {
  filters: LeasingFilters;
  onFiltersChange: (filters: LeasingFilters) => void;
}

export function LeasingFiltersForm({
  filters,
  onFiltersChange,
}: LeasingFiltersFormProps) {
  const handleReset = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(
    key => filters[key as keyof LeasingFilters] !== undefined
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search query */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1.5 block">
              Vyhľadávanie
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hľadať..."
                value={filters.searchQuery || ''}
                onChange={e =>
                  onFiltersChange({ ...filters, searchQuery: e.target.value })
                }
                className="pl-9"
              />
            </div>
          </div>

          {/* Leasing company */}
          <div className="w-[200px]">
            <label className="text-sm font-medium mb-1.5 block">
              Spoločnosť
            </label>
            <Select
              value={filters.leasingCompany || 'all'}
              onValueChange={value =>
                onFiltersChange({
                  ...filters,
                  leasingCompany: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Všetky" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                {LEASING_COMPANIES.map(company => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loan category */}
          <div className="w-[180px]">
            <label className="text-sm font-medium mb-1.5 block">
              Kategória
            </label>
            <Select
              value={filters.loanCategory || 'all'}
              onValueChange={value =>
                onFiltersChange({
                  ...filters,
                  loanCategory:
                    value === 'all' ? undefined : (value as LoanCategory),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Všetky" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                <SelectItem value="autoúver">Autoúver</SelectItem>
                <SelectItem value="operatívny_leasing">
                  Operatívny leasing
                </SelectItem>
                <SelectItem value="pôžička">Pôžička</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="w-[150px]">
            <label className="text-sm font-medium mb-1.5 block">Stav</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={value =>
                onFiltersChange({
                  ...filters,
                  status:
                    value === 'all'
                      ? undefined
                      : (value as 'active' | 'completed'),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Všetky" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                <SelectItem value="active">Aktívne</SelectItem>
                <SelectItem value="completed">Dokončené</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
