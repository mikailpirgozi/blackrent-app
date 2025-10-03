/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Gauge as KmIcon,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import React, { useState, useEffect } from 'react';

import type { Vehicle } from '../../../types';
import {
  // getStatusColor, // Nepoužívané
  getStatusBgColor,
  getStatusIcon,
  getStatusText,
} from '../../../utils/vehicles/vehicleHelpers';
import { Can } from '../../common/PermissionGuard';
import PremiumVehicleCard from './PremiumVehicleCard';

interface VehicleTableProps {
  vehiclesToDisplay: Vehicle[];
  filteredVehicles: Vehicle[];
  displayedVehicles: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  selectedVehicles: Set<string>;
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onVehicleSelect: (vehicleId: string, checked: boolean) => void;
  onLoadMore: () => void;
  onKmHistory?: (vehicle: Vehicle) => void; // 🚗 História kilometrov
}

// Custom hook for responsive design
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const VehicleTable: React.FC<VehicleTableProps> = ({
  vehiclesToDisplay,
  filteredVehicles,
  displayedVehicles,
  hasMore,
  isLoadingMore,
  selectedVehicles,
  mobileScrollRef,
  desktopScrollRef,
  onScroll,
  onEdit,
  onDelete,
  onVehicleSelect,
  onLoadMore,
  onKmHistory,
}) => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default: List view

  return (
    <>
      {/* View Mode Toggle - Desktop Only */}
      {!isMobile && (
        <div className="mb-4 flex justify-end">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
        </div>
      )}

      {/* Grid View - Premium Cards */}
      {!isMobile && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
          {vehiclesToDisplay.map(vehicle => (
            <PremiumVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={selectedVehicles.has(vehicle.id)}
              onSelect={onVehicleSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              {...(onKmHistory && { onKmHistory })}
            />
          ))}
        </div>
      )}

      {/* List View & Mobile - Original Table */}
      {(isMobile || viewMode === 'list') && (
        <>
          {isMobile ? (
            /* MOBILE CARDS VIEW */
            <Card className="overflow-hidden shadow-lg rounded-xl">
              <CardContent className="p-0">
                <div
                  ref={mobileScrollRef}
                  className="max-h-[70vh] overflow-y-auto"
                  onScroll={onScroll}
                >
                  {vehiclesToDisplay.map((vehicle, index) => (
                    <div
                      key={vehicle.id}
                      className={`flex items-center p-0 min-h-20 cursor-pointer hover:bg-gray-50 ${
                        index < vehiclesToDisplay.length - 1
                          ? 'border-b border-gray-200'
                          : ''
                      }`}
                      onClick={() => onEdit(vehicle)}
                    >
                      {/* ✅ NOVÉ: Checkbox pre výber vozidla */}
                      <div className="w-12 flex items-center justify-center border-r border-gray-200 bg-gray-50">
                        <Checkbox
                          checked={selectedVehicles.has(vehicle.id)}
                          onCheckedChange={(checked: boolean) => {
                            onVehicleSelect(vehicle.id, !!checked);
                          }}
                          className="h-4 w-4"
                        />
                      </div>

                      {/* Vehicle Info - sticky left */}
                      <div className="w-32 sm:w-40 max-w-32 sm:max-w-40 p-2 sm:p-3 border-r-2 border-gray-200 flex flex-col justify-center bg-white sticky left-0 z-10 overflow-hidden">
                        <p className="font-semibold text-xs sm:text-sm text-blue-600 leading-tight break-words mb-1 sm:mb-2">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-gray-600 text-xs sm:text-xs mb-1 sm:mb-2 font-semibold">
                          {vehicle.licensePlate}
                        </p>
                        {vehicle.vin && (
                          <p className="text-gray-500 text-xs font-mono">
                            VIN: {vehicle.vin.slice(-6)}
                          </p>
                        )}
                        <Badge
                          variant="default"
                          className={`h-4 sm:h-5 text-xs font-bold text-white min-w-0 max-w-full overflow-hidden ${
                            vehicle.status === 'available'
                              ? 'bg-green-500'
                              : vehicle.status === 'rented'
                                ? 'bg-blue-500'
                                : vehicle.status === 'maintenance'
                                  ? 'bg-yellow-500'
                                  : vehicle.status === 'temporarily_removed'
                                    ? 'bg-red-500'
                                    : 'bg-gray-500'
                          }`}
                        >
                          {getStatusText(vehicle.status)}
                        </Badge>
                      </div>

                      {/* Vehicle Details - scrollable right */}
                      <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between overflow-hidden min-w-0">
                        <div className="overflow-hidden">
                          <p className="font-semibold text-xs sm:text-sm text-gray-700 mb-1 sm:mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                            🏢 {vehicle.company}
                          </p>
                          <p className="text-gray-600 text-xs sm:text-xs block mb-1 sm:mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                            📊 Status: {getStatusText(vehicle.status)}
                          </p>
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-3 justify-start flex-wrap">
                          {/* Edit Button */}
                          <Can
                            update="vehicles"
                            context={{
                              resourceOwnerId: vehicle.assignedMechanicId,
                              resourceCompanyId: vehicle.ownerCompanyId,
                            }}
                          >
                            <Button
                              variant="default"
                              size="sm"
                              title="Upraviť vozidlo"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onEdit(vehicle);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 sm:w-8 sm:h-8 hover:scale-110 hover:shadow-lg transition-all duration-200 p-0"
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          </Can>

                          {/* Delete Button */}
                          <Can
                            delete="vehicles"
                            context={{
                              resourceOwnerId: vehicle.assignedMechanicId,
                              resourceCompanyId: vehicle.ownerCompanyId,
                            }}
                          >
                            <Button
                              variant="destructive"
                              size="sm"
                              title="Zmazať vozidlo"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                onDelete(vehicle.id);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 sm:w-8 sm:h-8 hover:scale-110 hover:shadow-lg transition-all duration-200 p-0"
                            >
                              <DeleteIcon className="h-4 w-4" />
                            </Button>
                          </Can>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 🚀 INFINITE SCROLL: Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center p-6 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="min-w-48 py-3 rounded-xl text-base font-semibold"
                      >
                        {isLoadingMore
                          ? 'Načítavam...'
                          : `Načítať ďalších (${filteredVehicles.length - displayedVehicles} zostáva)`}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* DESKTOP TABLE VIEW */
            <Card className="overflow-hidden shadow-lg rounded-xl">
              <CardContent className="p-0">
                {/* Desktop Header */}
                <div className="flex bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-50 min-h-14">
                  {/* Vozidlo column */}
                  <div className="w-[200px] min-w-[200px] p-2 border-r border-gray-300 flex items-center">
                    <span className="text-sm font-bold text-gray-800">
                      🚗 Vozidlo
                    </span>
                  </div>

                  {/* ŠPZ a VIN column */}
                  <div className="w-[140px] min-w-[140px] p-2 border-r border-gray-300 flex items-center">
                    <span className="text-sm font-bold text-gray-800">
                      📋 ŠPZ / VIN
                    </span>
                  </div>

                  {/* Firma column */}
                  <div className="w-[150px] min-w-[150px] p-2 border-r border-gray-300 flex items-center">
                    <span className="text-sm font-bold text-gray-800">
                      🏢 Firma
                    </span>
                  </div>

                  {/* Status column */}
                  <div className="w-[140px] min-w-[140px] p-2 border-r border-gray-300 flex items-center">
                    <span className="text-sm font-bold text-gray-800">
                      📊 Status
                    </span>
                  </div>

                  {/* Ceny column */}
                  <div className="w-[200px] min-w-[200px] p-2 border-r border-gray-300 flex items-center">
                    <span className="text-sm font-bold text-gray-800">
                      💰 Ceny
                    </span>
                  </div>

                  {/* Akcie column */}
                  <div className="w-[120px] min-w-[120px] p-2 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-800">
                      ⚡ Akcie
                    </span>
                  </div>
                </div>

                {/* Desktop Vehicle Rows */}
                <div
                  ref={desktopScrollRef}
                  className="max-h-[70vh] overflow-y-auto"
                  onScroll={onScroll}
                >
                  {vehiclesToDisplay.map((vehicle, index) => (
                    <div
                      key={vehicle.id}
                      className={`flex items-center p-0 min-h-[72px] cursor-pointer hover:bg-gray-50 ${
                        index < vehiclesToDisplay.length - 1
                          ? 'border-b border-gray-300'
                          : ''
                      }`}
                      onClick={() => onEdit(vehicle)}
                    >
                      {/* Vozidlo column */}
                      <div className="w-[200px] min-w-[200px] p-2 border-r border-gray-300 flex flex-col justify-center">
                        <span className="text-sm font-semibold text-blue-600 mb-1">
                          {vehicle.brand} {vehicle.model}
                        </span>
                        <span className="text-xs text-gray-600">
                          ID: {vehicle.id.slice(0, 8)}...
                        </span>
                      </div>

                      {/* ŠPZ a VIN column */}
                      <div className="w-[140px] min-w-[140px] p-2 border-r border-gray-300 flex flex-col justify-center">
                        <span className="text-sm font-semibold text-gray-800 font-mono">
                          {vehicle.licensePlate}
                        </span>
                        {vehicle.vin && (
                          <span className="text-xs text-gray-600 font-mono mt-1">
                            VIN: {vehicle.vin.slice(-8)}
                          </span>
                        )}
                      </div>

                      {/* Firma column */}
                      <div className="w-[150px] min-w-[150px] p-2 border-r border-gray-300 flex items-center">
                        <span className="text-sm text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                          {vehicle.company}
                        </span>
                      </div>

                      {/* Status column */}
                      <div className="w-[140px] min-w-[140px] p-2 border-r border-gray-300 flex items-center">
                        <Badge
                          className="h-6 text-xs font-bold text-white"
                          style={{
                            backgroundColor: getStatusBgColor(vehicle.status),
                          }}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(vehicle.status)}
                            {getStatusText(vehicle.status)}
                          </span>
                        </Badge>
                      </div>

                      {/* Ceny column */}
                      <div className="w-[200px] min-w-[200px] p-2 border-r border-gray-300 flex flex-col justify-center">
                        {vehicle.pricing && vehicle.pricing.length > 0 ? (
                          <>
                            <span className="text-xs text-gray-600 mb-1">
                              1 deň:{' '}
                              {vehicle.pricing.find(
                                p => p.minDays === 0 && p.maxDays === 1
                              )?.pricePerDay || 0}
                              €
                            </span>
                            <span className="text-xs text-gray-600">
                              7+ dní:{' '}
                              {vehicle.pricing.find(
                                p => p.minDays === 4 && p.maxDays === 7
                              )?.pricePerDay || 0}
                              €
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Nezadané
                          </span>
                        )}
                      </div>

                      {/* Akcie column */}
                      <div className="w-[120px] min-w-[120px] p-2 flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <Can
                          update="vehicles"
                          context={{
                            resourceOwnerId: vehicle.assignedMechanicId,
                            resourceCompanyId: vehicle.ownerCompanyId,
                          }}
                        >
                          <Button
                            size="sm"
                            title="Upraviť vozidlo"
                            onClick={e => {
                              e.stopPropagation();
                              onEdit(vehicle);
                            }}
                            className="w-7 h-7 p-0 bg-blue-500 hover:bg-blue-600 text-white hover:scale-110 transition-all duration-200 hover:shadow-lg"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                        </Can>

                        {/* Km History Button */}
                        {onKmHistory && (
                          <Button
                            size="sm"
                            title="História kilometrov"
                            onClick={e => {
                              e.stopPropagation();
                              onKmHistory(vehicle);
                            }}
                            className="w-7 h-7 p-0 bg-blue-500 hover:bg-blue-600 text-white hover:scale-110 transition-all duration-200 hover:shadow-lg"
                          >
                            <KmIcon className="h-4 w-4" />
                          </Button>
                        )}

                        {/* History Button */}
                        <Button
                          size="sm"
                          title="História vozidla"
                          onClick={e => {
                            e.stopPropagation();
                            // TODO: Implement history view
                          }}
                          className="w-7 h-7 p-0 bg-purple-500 hover:bg-purple-600 text-white hover:scale-110 transition-all duration-200 hover:shadow-lg"
                        >
                          <HistoryIcon className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
                        <Can
                          delete="vehicles"
                          context={{
                            resourceOwnerId: vehicle.assignedMechanicId,
                            resourceCompanyId: vehicle.ownerCompanyId,
                          }}
                        >
                          <Button
                            size="sm"
                            title="Zmazať vozidlo"
                            onClick={e => {
                              e.stopPropagation();
                              onDelete(vehicle.id);
                            }}
                            className="w-7 h-7 p-0 bg-red-500 hover:bg-red-600 text-white hover:scale-110 transition-all duration-200 hover:shadow-lg"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    </div>
                  ))}

                  {/* 🚀 INFINITE SCROLL: Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center p-3 border-t border-gray-300">
                      <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="min-w-[200px] py-2 rounded-xl text-base font-semibold"
                      >
                        {isLoadingMore
                          ? 'Načítavam...'
                          : `Načítať ďalších (${filteredVehicles.length - displayedVehicles} zostáva)`}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export default VehicleTable;
