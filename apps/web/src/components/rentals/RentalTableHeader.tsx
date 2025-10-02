/**
 * 📊 RENTAL TABLE HEADER
 *
 * Memoized header komponent pre RentalList tabuľku
 */

// Lucide icons (replacing MUI icons)
import {
  Plus as AddIcon,
  Search as SearchIcon,
  Filter as FilterListIcon,
  RefreshCw as RefreshIcon,
  Download as ExportIcon,
  X as ClearIcon,
} from 'lucide-react';

// shadcn/ui components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React, { memo } from 'react';


interface RentalTableHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onAddRental: () => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading?: boolean;
  totalCount: number;
  filteredCount: number;
}

const RentalTableHeader: React.FC<RentalTableHeaderProps> = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onAddRental,
  onRefresh,
  onExport,
  isLoading = false,
  totalCount,
  filteredCount,
}) => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 mb-6 p-4 bg-background rounded-lg shadow-sm border`}>
      {/* Title and Stats */}
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-xl font-semibold text-primary">
          📋 Rezervácie
        </h2>
        <span className="text-sm text-muted-foreground">
          {filteredCount !== totalCount
            ? `${filteredCount} z ${totalCount}`
            : `${totalCount} celkom`}
        </span>
      </div>

      {/* Search Bar */}
      <div className={`${isMobile ? 'flex-1 order-1' : 'w-80 order-0'}`}>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Vyhľadať rezervácie..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onSearchChange(e.target.value)}
            disabled={isLoading}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              disabled={isLoading}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <ClearIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-2 ${isMobile ? 'order-2 justify-center' : 'order-0 justify-end'}`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={onToggleFilters}
                disabled={isLoading}
                className={showFilters ? "bg-primary/20 hover:bg-primary/30" : ""}
              >
                <FilterListIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filtrovať</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Obnoviť</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isLoading}
              >
                <ExportIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exportovať</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          onClick={onAddRental}
          disabled={isLoading}
          className="px-6"
        >
          <AddIcon className="h-4 w-4 mr-2" />
          {isMobile ? 'Pridať' : 'Nová rezervácia'}
        </Button>
      </div>
    </div>
  );
};

// Export memoized component
export default memo(RentalTableHeader);
