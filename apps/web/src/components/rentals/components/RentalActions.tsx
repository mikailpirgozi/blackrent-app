import { Plus as AddIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

interface RentalActionsProps {
  isMobile: boolean;
  handleAdd: () => void;
}

export const RentalActions: React.FC<RentalActionsProps> = ({
  isMobile,
  handleAdd,
}) => {
  return (
    <div className="flex gap-2 md:gap-4 mb-6 mx-2 md:mx-0 flex-wrap items-center">
      {/* Pridať prenájom */}
      <Button
        onClick={handleAdd}
        className="min-w-0 md:min-w-[140px] text-xs md:text-sm px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold shadow-lg shadow-blue-500/30"
      >
        <AddIcon className="h-4 w-4 mr-2" />
        {isMobile ? 'Pridať' : 'Nový prenájom'}
      </Button>
    </div>
  );
};
