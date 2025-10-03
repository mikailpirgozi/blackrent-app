import { Button } from '@/components/ui/button';
import React from 'react';

interface QuickFiltersProps {
  showAvailable: boolean;
  setShowAvailable: (show: boolean) => void;
  showRented: boolean;
  setShowRented: (show: boolean) => void;
  showMaintenance: boolean;
  setShowMaintenance: (show: boolean) => void;
  showTransferred: boolean;
  setShowTransferred: (show: boolean) => void;
  showPrivate: boolean;
  setShowPrivate: (show: boolean) => void;
  showRemoved: boolean;
  setShowRemoved: (show: boolean) => void;
  showTempRemoved: boolean;
  setShowTempRemoved: (show: boolean) => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  showAvailable,
  setShowAvailable,
  showRented,
  setShowRented,
  showMaintenance,
  setShowMaintenance,
  showTransferred,
  setShowTransferred,
  showPrivate,
  setShowPrivate,
  showRemoved,
  setShowRemoved,
  showTempRemoved,
  setShowTempRemoved,
}) => {
  const allEnabled =
    showAvailable &&
    showRented &&
    showMaintenance &&
    showTransferred &&
    showPrivate &&
    showRemoved &&
    showTempRemoved;

  const handleShowAll = () => {
    const newValue = !allEnabled;
    setShowAvailable(newValue);
    setShowRented(newValue);
    setShowMaintenance(newValue);
    setShowTransferred(newValue);
    setShowPrivate(newValue);
    setShowRemoved(newValue);
    setShowTempRemoved(newValue);
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Button
        variant={allEnabled ? 'default' : 'outline'}
        size="sm"
        onClick={handleShowAll}
        className="text-xs"
      >
        📋 Všetky
      </Button>

      <Button
        variant={showAvailable ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowAvailable(!showAvailable)}
        className={`text-xs ${showAvailable ? 'bg-green-600 hover:bg-green-700' : ''}`}
      >
        ✅ Dostupné
      </Button>

      <Button
        variant={showRented ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowRented(!showRented)}
        className={`text-xs ${showRented ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
      >
        🚗 Prenajatý
      </Button>

      <Button
        variant={showMaintenance ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowMaintenance(!showMaintenance)}
        className={`text-xs ${showMaintenance ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
      >
        🔧 Údržba
      </Button>

      <Button
        variant={showTransferred ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowTransferred(!showTransferred)}
        className={`text-xs ${showTransferred ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
      >
        🔄 Prepisané
      </Button>

      <Button
        variant={showPrivate ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowPrivate(!showPrivate)}
        className={`text-xs ${showPrivate ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
      >
        🏠 Súkromné
      </Button>

      <Button
        variant={showRemoved ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowRemoved(!showRemoved)}
        className={`text-xs ${showRemoved ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
      >
        🗑️ Vyradené
      </Button>

      <Button
        variant={showTempRemoved ? 'default' : 'outline'}
        size="sm"
        onClick={() => setShowTempRemoved(!showTempRemoved)}
        className={`text-xs ${showTempRemoved ? 'bg-red-600 hover:bg-red-700' : ''}`}
      >
        ⏸️ Dočasne vyradené
      </Button>
    </div>
  );
};

export default QuickFilters;
