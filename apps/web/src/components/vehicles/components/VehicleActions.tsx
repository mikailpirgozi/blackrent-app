import { Plus as AddIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';

import { Can } from '../../common/PermissionGuard';

interface VehicleActionsProps {
  loading: boolean;
  isMobile: boolean;
  onAddVehicle: () => void;
  onCreateCompany: () => void;
  onCreateInvestor: () => void;
}

const VehicleActions: React.FC<VehicleActionsProps> = ({
  loading,
  isMobile,
  onAddVehicle,
  onCreateCompany,
  onCreateInvestor,
}) => {
  return (
    <div
      className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 ${isMobile ? 'items-stretch' : 'items-center'} mb-6`}
    >
      {/* Add Vehicle Button */}
      <Can create="vehicles">
        <Button
          variant="default"
          onClick={onAddVehicle}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 flex items-center gap-2"
        >
          <AddIcon className="w-4 h-4" />
          Nové vozidlo
        </Button>
      </Can>

      {/* Create Company Button */}
      <Button
        variant="outline"
        onClick={onCreateCompany}
        disabled={loading}
        className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 rounded-lg px-6 py-2 flex items-center gap-2"
      >
        <AddIcon className="w-4 h-4" />
        🏢 Pridať firmu
      </Button>

      {/* Create Investor Button */}
      <Button
        variant="outline"
        onClick={onCreateInvestor}
        disabled={loading}
        className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 rounded-lg px-6 py-2 flex items-center gap-2"
      >
        <AddIcon className="w-4 h-4" />
        👤 Pridať spoluinvestora
      </Button>
    </div>
  );
};

export default VehicleActions;
