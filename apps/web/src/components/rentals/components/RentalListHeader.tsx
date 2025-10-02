import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RentalListHeaderProps {
  filteredRentalsCount: number;
  activeRentalsCount: number;
  waitingForReturnCount: number;
  onAddRental: () => void;
  onExport: () => void;
  onRefresh: () => void;
}

export function RentalListHeader({
  filteredRentalsCount,
  activeRentalsCount,
  waitingForReturnCount,
  onAddRental,
  onExport,
  onRefresh,
}: RentalListHeaderProps) {
  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 md:gap-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Prenájmy
            </h1>
            <p className="opacity-90 text-sm md:text-base">
              Správa a prehľad všetkých prenájmov vozidiel
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Stats */}
            <div className="text-center md:text-right mr-0 md:mr-4 mb-4 md:mb-0">
              <div className="flex gap-4 md:gap-6 justify-center md:justify-end">
                <div>
                  <div className="text-xl font-bold">
                    {filteredRentalsCount}
                  </div>
                  <div className="text-xs opacity-80">
                    zobrazených
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-300">
                    {activeRentalsCount}
                  </div>
                  <div className="text-xs opacity-80">
                    aktívnych
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-300">
                    {waitingForReturnCount}
                  </div>
                  <div className="text-xs opacity-80">
                    čakajú na vrátenie
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <Button
                onClick={onAddRental}
                className="bg-white/20 hover:bg-white/30 text-white border-0 min-w-[140px]"
                size="sm"
              >
                <UnifiedIcon name="add" className="w-4 h-4 mr-2" />
                Nový prenájom
              </Button>

              <Button
                variant="outline"
                onClick={onRefresh}
                className="border-white/30 text-white hover:border-white/50 hover:bg-white/10"
                size="sm"
              >
                <UnifiedIcon name="refresh" className="w-4 h-4 mr-2" />
                Obnoviť
              </Button>

              <Button
                variant="outline"
                onClick={onExport}
                className="border-white/30 text-white hover:border-white/50 hover:bg-white/10"
                size="sm"
              >
                <UnifiedIcon name="export" className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
