// Lucide icons (replacing MUI icons)
import {
  Car as CarIcon,
  Euro as EuroIcon,
  DollarSign as MoneyIcon,
  User as PersonIcon,
  Gauge as SpeedIcon,
  Star as StarIcon,
  Clock as TimeIcon,
  Trophy as TrophyIcon,
} from 'lucide-react';

// shadcn/ui components
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import React from 'react';

// shadcn/ui components (additional imports)
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import TopListCard from './TopListCard';
import TopStatCard from './TopStatCard';

interface TopStatsTabProps {
  stats: Record<string, unknown>;
  formatPeriod: () => string;
  showVehiclesByUtilization: number;
  showVehiclesByRevenue: number;
  showVehiclesByRentals: number;
  showCustomersByRentals: number;
  showCustomersByRevenue: number;
  showCustomersByDays: number;
  setShowVehiclesByUtilization: React.Dispatch<React.SetStateAction<number>>;
  setShowVehiclesByRevenue: React.Dispatch<React.SetStateAction<number>>;
  setShowVehiclesByRentals: React.Dispatch<React.SetStateAction<number>>;
  setShowCustomersByRentals: React.Dispatch<React.SetStateAction<number>>;
  setShowCustomersByRevenue: React.Dispatch<React.SetStateAction<number>>;
  setShowCustomersByDays: React.Dispatch<React.SetStateAction<number>>;
}

const TopStatsTab: React.FC<TopStatsTabProps> = ({
  stats,
  formatPeriod,
  showVehiclesByUtilization,
  showVehiclesByRevenue,
  showVehiclesByRentals,
  showCustomersByRentals,
  showCustomersByRevenue,
  showCustomersByDays,
  setShowVehiclesByUtilization,
  setShowVehiclesByRevenue,
  setShowVehiclesByRentals,
  setShowCustomersByRentals,
  setShowCustomersByRevenue,
  setShowCustomersByDays,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Úvodný prehľad */}
      <div className="col-span-1">
        <Card className="mb-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TrophyIcon className="h-10 w-10" />
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  TOP Štatistiky
                </h2>
                <p className="text-white/90">
                  Najlepšie výkony za obdobie: {formatPeriod()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🏆 NAJLEPŠIE VÝKONY - Prehľadové karty */}
      <div className="col-span-1">
        <h3 className="text-xl font-bold mb-6 text-blue-500 flex items-center gap-2">
          <StarIcon className="h-5 w-5" />
          🏆 Najlepšie výkony
        </h3>
      </div>

      {/* Top výkony v 3 kartách */}
      <div className="col-span-1 md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
        <TopStatCard
          title="Najvyťaženejšie auto"
          icon={<SpeedIcon />}
          data={stats.topVehicleByUtilization as Record<string, unknown>}
          primaryValue={
            stats.topVehicleByUtilization
              ? `${((stats.topVehicleByUtilization as Record<string, unknown>).utilizationPercentage as number).toFixed(1)}%`
              : 'N/A'
          }
          secondaryValue={
            stats.topVehicleByUtilization
              ? `${(stats.topVehicleByUtilization as Record<string, unknown>).totalDaysRented as number} dní prenájmu`
              : ''
          }
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          percentage={
            (stats.topVehicleByUtilization as Record<string, unknown>)
              ?.utilizationPercentage as number
          }
        />
        </div>

        <div>
        <TopStatCard
          title="Najvýnosnejšie auto"
          icon={<EuroIcon />}
          data={stats.topVehicleByRevenue as Record<string, unknown>}
          primaryValue={
            stats.topVehicleByRevenue
              ? `${(stats.topVehicleByRevenue as Record<string, unknown>).totalRevenue as number} €`
              : 'N/A'
          }
          secondaryValue={
            stats.topVehicleByRevenue
              ? `${(stats.topVehicleByRevenue as Record<string, unknown>).rentalCount as number} prenájmov`
              : ''
          }
          gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
        />
        </div>

        <div>
        <TopStatCard
          title="Najaktívnejší zákazník"
          icon={<PersonIcon />}
          data={stats.topCustomerByRentals as Record<string, unknown>}
          primaryValue={
            stats.topCustomerByRentals
              ? `${(stats.topCustomerByRentals as Record<string, unknown>).rentalCount as number}x`
              : 'N/A'
          }
          secondaryValue={
            stats.topCustomerByRentals
              ? `${(stats.topCustomerByRentals as Record<string, unknown>).totalRevenue as number} € celkom`
              : ''
          }
          gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
        />
        </div>
      </div>

      {/* Divider */}
      
        <Separator className="my-4" />
      

      {/* 🚗 TOP AUTÁ - Detailné rebríčky */}
      
        <h3 className="text-xl font-bold text-blue-500 mb-6 flex items-center gap-2">
          <CarIcon className="h-5 w-5" />
          🚗 TOP Autá - Detailné rebríčky
        </h3>
      

      {/* Najvyťaženejšie autá */}
      
        <TopListCard
          title="Najvyťaženejšie autá"
          icon={<SpeedIcon />}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          data={stats.vehiclesByUtilization as Record<string, unknown>[]}
          showCount={showVehiclesByUtilization}
          onLoadMore={() => setShowVehiclesByUtilization(prev => prev + 10)}
          renderItem={(vehicle, index) => (
            <div
              key={
                (
                  (vehicle as Record<string, unknown>).vehicle as Record<
                    string,
                    unknown
                  >
                ).id as string
              }
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                index < 3 
                  ? 'bg-blue-50/40 border border-gray-200' 
                  : 'bg-gray-50 border border-gray-200'
              } ${
                index === 0 ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div
                className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gray-400'
                }`}
              >
                {index + 1}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-500 text-white">
                  <CarIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-bold">
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).brand as string
                  }{' '}
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).model as string
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).licensePlate as string
                  }{' '}
                  •{' '}
                  {
                    (vehicle as Record<string, unknown>)
                      .totalDaysRented as number
                  }{' '}
                  dní
                </p>
              </div>

              <div className="text-right min-w-20">
                <p
                  className={`text-lg font-bold ${
                    ((vehicle as Record<string, unknown>)
                      .utilizationPercentage as number) > 70
                      ? 'text-green-600'
                      : ((vehicle as Record<string, unknown>)
                            .utilizationPercentage as number) > 40
                        ? 'text-orange-500'
                        : 'text-red-500'
                  }`}
                >
                  {(
                    (vehicle as Record<string, unknown>)
                      .utilizationPercentage as number
                  ).toFixed(1)}
                  %
                </p>
                <Progress
                  value={Math.min(
                    (vehicle as Record<string, unknown>)
                      .utilizationPercentage as number,
                    100
                  )}
                  className={`h-1.5 rounded-full ${
                    ((vehicle as Record<string, unknown>)
                      .utilizationPercentage as number) > 70
                      ? '[&>div]:bg-green-500'
                      : ((vehicle as Record<string, unknown>)
                            .utilizationPercentage as number) > 40
                        ? '[&>div]:bg-orange-500'
                        : '[&>div]:bg-red-500'
                  }`}
                />
              </div>
            </div>
          )}
          emptyMessage="Žiadne autá v tomto období"
        />
      

      {/* Najvýnosnejšie autá */}
      
        <TopListCard
          title="Najvýnosnejšie autá"
          icon={<EuroIcon />}
          gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
          data={stats.vehiclesByRevenue as Record<string, unknown>[]}
          showCount={showVehiclesByRevenue}
          onLoadMore={() => setShowVehiclesByRevenue(prev => prev + 10)}
          renderItem={(vehicle, index) => (
            <div
              key={
                (
                  (vehicle as Record<string, unknown>).vehicle as Record<
                    string,
                    unknown
                  >
                ).id as string
              }
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                index < 3 
                  ? 'bg-teal-50/40 border border-gray-200' 
                  : 'bg-gray-50 border border-gray-200'
              } ${
                index === 0 ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div
                className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-teal-600 to-green-500'
                    : 'bg-gray-400'
                }`}
              >
                {index + 1}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-teal-600 text-white">
                  <CarIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-bold">
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).brand as string
                  }{' '}
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).model as string
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).licensePlate as string
                  }{' '}
                  • {(vehicle as Record<string, unknown>).rentalCount as number}{' '}
                  prenájmov
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-teal-600">
                  {(
                    (vehicle as Record<string, unknown>).totalRevenue as number
                  ).toLocaleString()}{' '}
                  €
                </p>
                <p className="text-xs text-muted-foreground">
                  {(
                    (vehicle as Record<string, unknown>)
                      .avgRevenuePerRental as number
                  ).toFixed(0)}{' '}
                  €/prenájom
                </p>
              </div>
            </div>
          )}
          emptyMessage="Žiadne autá v tomto období"
        />
      

      {/* Najčastejšie prenajímané */}
      
        <TopListCard
          title="Najčastejšie prenajímané"
          icon={<CarIcon />}
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          data={stats.vehiclesByRentals as Record<string, unknown>[]}
          showCount={showVehiclesByRentals}
          onLoadMore={() => setShowVehiclesByRentals(prev => prev + 10)}
          renderItem={(vehicle, index) => (
            <div
              key={
                (
                  (vehicle as Record<string, unknown>).vehicle as Record<
                    string,
                    unknown
                  >
                ).id as string
              }
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                index < 3 
                  ? 'bg-pink-50/40 border border-gray-200' 
                  : 'bg-gray-50 border border-gray-200'
              } ${
                index === 0 ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div
                className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-pink-400 to-red-500'
                    : 'bg-gray-400'
                }`}
              >
                {index + 1}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-pink-400 text-white">
                  <CarIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-bold">
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).brand as string
                  }{' '}
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).model as string
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {
                    (
                      (vehicle as Record<string, unknown>).vehicle as Record<
                        string,
                        unknown
                      >
                    ).licensePlate as string
                  }{' '}
                  •{' '}
                  {
                    (vehicle as Record<string, unknown>)
                      .totalDaysRented as number
                  }{' '}
                  dní celkom
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-pink-400">
                  {(vehicle as Record<string, unknown>).rentalCount as number}x
                </p>
                <p className="text-xs text-muted-foreground">
                  {(
                    (vehicle as Record<string, unknown>).totalRevenue as number
                  ).toLocaleString()}{' '}
                  € celkom
                </p>
              </div>
            </div>
          )}
          emptyMessage="Žiadne autá v tomto období"
        />
      

      {/* Divider */}
      
        <Separator className="my-4" />
      

      {/* 👥 TOP ZÁKAZNÍCI - Detailné rebríčky */}
      
        <h3 className="text-xl font-bold text-blue-500 mb-6 flex items-center gap-2">
          <PersonIcon className="h-5 w-5" />
          👥 TOP Zákazníci - Detailné rebríčky
        </h3>
      

      {/* Najaktívnejší zákazníci */}
      
        <TopListCard
          title="Najaktívnejší zákazníci"
          icon={<StarIcon />}
          gradient="linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)"
          data={stats.customersByRentals as Record<string, unknown>[]}
          showCount={showCustomersByRentals}
          onLoadMore={() => setShowCustomersByRentals(prev => prev + 10)}
          renderItem={(customer, index) => (
            <div
              key={(customer as Record<string, unknown>).customerName as string}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                index < 3 
                  ? 'bg-pink-50/40 border border-gray-200' 
                  : 'bg-gray-50 border border-gray-200'
              } ${
                index === 0 ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div
                className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-pink-300 to-pink-100'
                    : 'bg-gray-400'
                }`}
              >
                {index + 1}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-pink-300 text-white">
                  <PersonIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-bold">
                  {(customer as Record<string, unknown>).customerName as string}
                </p>
                <p className="text-xs text-muted-foreground">
                  {
                    (customer as Record<string, unknown>)
                      .totalDaysRented as number
                  }{' '}
                  dní celkom • Priemer:{' '}
                  {(
                    (customer as Record<string, unknown>)
                      .avgRentalDuration as number
                  ).toFixed(1)}{' '}
                  dní
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-pink-300">
                  {(customer as Record<string, unknown>).rentalCount as number}x
                </p>
                <p className="text-xs text-muted-foreground">
                  {(
                    (customer as Record<string, unknown>).totalRevenue as number
                  ).toLocaleString()}{' '}
                  € celkom
                </p>
              </div>
            </div>
          )}
          emptyMessage="Žiadni zákazníci v tomto období"
        />
      

      {/* Najziskovejší zákazníci */}
      
        <TopListCard
          title="Najziskovejší zákazníci"
          icon={<MoneyIcon />}
          gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
          data={stats.customersByRevenue as Record<string, unknown>[]}
          showCount={showCustomersByRevenue}
          onLoadMore={() => setShowCustomersByRevenue(prev => prev + 10)}
          renderItem={(customer, index) => (
            <div
              key={(customer as Record<string, unknown>).customerName as string}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                index < 3 
                  ? 'bg-red-50/40 border border-gray-200' 
                  : 'bg-gray-50 border border-gray-200'
              } ${
                index === 0 ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div
                className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-red-400 to-red-600'
                    : 'bg-gray-400'
                }`}
              >
                {index + 1}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-red-400 text-white">
                  <PersonIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-bold">
                  {(customer as Record<string, unknown>).customerName as string}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(customer as Record<string, unknown>).rentalCount as number}{' '}
                  prenájmov •{' '}
                  {
                    (customer as Record<string, unknown>)
                      .totalDaysRented as number
                  }{' '}
                  dní
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-red-400">
                  {(
                    (customer as Record<string, unknown>).totalRevenue as number
                  ).toLocaleString()}{' '}
                  €
                </p>
                <p className="text-xs text-muted-foreground">
                  {(
                    ((customer as Record<string, unknown>)
                      .totalRevenue as number) /
                    ((customer as Record<string, unknown>)
                      .rentalCount as number)
                  ).toFixed(0)}{' '}
                  €/prenájom
                </p>
              </div>
            </div>
          )}
          emptyMessage="Žiadni zákazníci v tomto období"
        />
      

      {/* Najdlhodobejší zákazníci */}
      <div>
        <TopListCard
          title="Najdlhodobejší zákazníci"
          icon={<TimeIcon />}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          data={stats.customersByDays as Record<string, unknown>[]}
          showCount={showCustomersByDays}
          onLoadMore={() => setShowCustomersByDays(prev => prev + 10)}
          renderItem={(customer, index) => (
            <div
              key={(customer as Record<string, unknown>).customerName as string}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:translate-x-1 hover:shadow-md ${
                index < 3 
                  ? 'bg-blue-50/40 border border-gray-200' 
                  : 'bg-gray-50 border border-gray-200'
              } ${
                index === 0 ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div
                className={`min-w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index < 3
                    ? 'bg-gradient-to-br from-blue-400 to-cyan-400'
                    : 'bg-gray-400'
                }`}
              >
                {index + 1}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-400 text-white">
                  <PersonIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <p className="text-sm font-bold">
                  {(customer as Record<string, unknown>).customerName as string}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(customer as Record<string, unknown>).rentalCount as number}{' '}
                  prenájmov •{' '}
                  {(
                    (customer as Record<string, unknown>).totalRevenue as number
                  ).toLocaleString()}{' '}
                  €
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-blue-400">
                  {
                    (customer as Record<string, unknown>)
                      .totalDaysRented as number
                  }{' '}
                  dní
                </p>
                <p className="text-xs text-muted-foreground">
                  Priemer:{' '}
                  {(
                    (customer as Record<string, unknown>)
                      .avgRentalDuration as number
                  ).toFixed(1)}{' '}
                  dní/prenájom
                </p>
              </div>
            </div>
          )}
          emptyMessage="Žiadni zákazníci v tomto období"
        />
      </div>
    </div>
  );
};

export default TopStatsTab;
