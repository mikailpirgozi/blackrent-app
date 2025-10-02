// Lucide icons (replacing MUI icons)
import {
  List as ViewListIcon,
  Grid3X3 as ViewModuleIcon,
  Layout as ViewComfyIcon,
  Grid as GridViewIcon,
  Columns as ViewColumnIcon,
  ListOrdered as ViewAgendaIcon,
} from 'lucide-react';

// shadcn/ui components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

export type ViewMode =
  | 'table'
  | 'cards'
  | 'grid'
  | 'list'
  | 'compact'
  | 'detailed';

interface RentalViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalCount: number;
  filteredCount: number;
  showCounts?: boolean;
}

const RentalViewToggle: React.FC<RentalViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  showCounts = true,
}) => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const viewModes = [
    {
      value: 'table' as ViewMode,
      icon: <ViewListIcon />,
      label: 'Tabuľka',
      description: 'Klasické zobrazenie v tabuľke',
    },
    {
      value: 'cards' as ViewMode,
      icon: <ViewModuleIcon />,
      label: 'Karty',
      description: 'Zobrazenie v kartách',
    },
    {
      value: 'grid' as ViewMode,
      icon: <GridViewIcon />,
      label: 'Mriežka',
      description: 'Kompaktné zobrazenie v mriežke',
    },
    {
      value: 'list' as ViewMode,
      icon: <ViewAgendaIcon />,
      label: 'Zoznam',
      description: 'Jednoduchý zoznam',
    },
    {
      value: 'compact' as ViewMode,
      icon: <ViewComfyIcon />,
      label: 'Kompaktné',
      description: 'Minimálne zobrazenie',
    },
    {
      value: 'detailed' as ViewMode,
      icon: <ViewColumnIcon />,
      label: 'Detailné',
      description: 'Rozšírené informácie',
    },
  ];

  // Na mobile zobrazíme len najdôležitejšie režimy
  const mobileViewModes = viewModes.filter(mode =>
    ['table', 'cards', 'compact'].includes(mode.value)
  );

  const availableModes = isMobile ? mobileViewModes : viewModes;

  return (
    <div className="flex items-center gap-2 md:gap-4 flex-wrap">
      {/* Počty */}
      {showCounts && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Zobrazených:
          </span>
          <Badge 
            variant={filteredCount < totalCount ? "default" : "outline"}
            className="text-xs"
          >
            {filteredCount} z {totalCount}
          </Badge>
        </div>
      )}

      {/* Prepínače zobrazenia */}
      <div className="flex gap-1">
        {availableModes.map(mode => (
          <TooltipProvider key={mode.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === mode.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onViewModeChange(mode.value)}
                  className={`flex items-center gap-1 px-2 py-1 h-8 ${
                    isMobile ? 'flex-col' : 'flex-row'
                  }`}
                >
                  <span className={`${isMobile ? 'text-lg' : 'text-sm'}`}>
                    {mode.icon}
                  </span>
                  {!isMobile && (
                    <span className="text-sm font-medium">
                      {mode.label}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mode.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

export default RentalViewToggle;
