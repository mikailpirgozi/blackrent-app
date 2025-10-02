import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';

interface RentalSearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  filtersComponent: React.ReactNode;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  filteredCount: number;
  totalCount: number;
}

export function RentalSearchAndFilters({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onClearFilters,
  filtersComponent,
  hasActiveFilters,
  activeFiltersCount,
  filteredCount,
  totalCount,
}: RentalSearchAndFiltersProps) {
  return (
    <div className="mb-6">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 bg-background"
            placeholder="Hľadať prenájmy (zákazník, vozidlo, ŠPZ, poznámky...)"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={onToggleFilters}
            className="min-w-[120px] gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtre
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 min-w-[20px] h-5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              size="sm"
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Vymazať
            </Button>
          )}
        </div>
      </div>

      {/* Filter results info */}
      {(hasActiveFilters || searchQuery) && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Zobrazených: {filteredCount} z {totalCount} prenájmov
            {searchQuery && ` pre "${searchQuery}"`}
          </p>
        </div>
      )}

      {/* Advanced filters */}
      <Collapsible open={showFilters}>
        <CollapsibleContent>
          <Card className="mb-4 border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Pokročilé filtre
              </h3>
              {filtersComponent}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
