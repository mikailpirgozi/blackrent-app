// Lucide icons (replacing MUI icons)
import {
  Tag as DiscountIcon,
  Euro as EuroIcon,
  Plus as PlusIcon,
  TrendingDown as SavingsIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Rental } from '../../../types';
import {
  calculatePriceBreakdown,
  formatPriceWithDiscount,
} from '../../../utils/priceCalculator';

// Helper function for consistent price formatting
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface PriceDisplayProps {
  rental: Rental;
  variant?: 'compact' | 'detailed' | 'mobile';
  showExtraKm?: boolean;
}

/**
 * 💰 Komponent pre zobrazenie ceny prenájmu so zľavami
 * Zobrazuje originálnu cenu (prečiarknutú) a zľavnenú cenu ak existuje zľava
 */
export default function PriceDisplay({
  rental,
  variant = 'detailed',
  showExtraKm = true,
}: PriceDisplayProps) {
  const priceBreakdown = calculatePriceBreakdown(rental);
  const priceFormat = formatPriceWithDiscount(priceBreakdown);

  if (variant === 'compact') {
    return (
      <div className="flex flex-col items-center gap-1 w-full p-1">
        {priceBreakdown.hasDiscount ? (
          <div className="w-full">
            {/* Pôvodná cena a zľava - na jednom riadku */}
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] line-through text-muted-foreground opacity-80">
                {formatPrice(priceBreakdown.originalPrice)}
              </span>
              <Badge 
                variant="destructive"
                className="h-[14px] text-[0.5rem] font-bold bg-red-500 text-white border-none px-1"
              >
                -{priceBreakdown.discountPercentage}%
              </Badge>
            </div>

            {/* Zľavnená cena - hlavná, centrovaná */}
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm font-bold text-green-600 leading-tight">
                {formatPrice(priceBreakdown.finalPrice)}
              </span>
            </div>

            {/* Zľava info - centrované */}
            <div className="flex items-center justify-center gap-1 p-1 rounded bg-green-50 w-full">
              <span className="text-[10px] text-green-700 font-medium">
                Zľava {formatPrice(priceBreakdown.discountAmount)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 w-full">
            <div className="flex items-center justify-center">
              <span className="text-sm font-bold text-green-600 leading-tight">
                {formatPrice(priceBreakdown.finalPrice)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              Základná cena
            </span>
          </div>
        )}

        {/* Extra km poplatky - kompaktne a centrované */}
        {showExtraKm && priceBreakdown.extraKmCharge > 0 && (
          <div className="flex items-center justify-center gap-1 p-1 rounded bg-orange-50 w-full">
            <span className="text-[10px] text-orange-500 font-medium">
              +{formatPrice(priceBreakdown.extraKmCharge)} km
            </span>
          </div>
        )}
      </div>
    );
  }

  // Mobilný variant - optimalizovaný pre malé obrazovky
  if (variant === 'mobile') {
    return (
      <div className={cn(
        "flex flex-col gap-4 p-6 rounded-lg border relative",
        priceBreakdown.hasDiscount
          ? "bg-gradient-to-br from-orange-50 to-green-50 border-green-200"
          : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
      )}>
        {priceBreakdown.hasDiscount ? (
          <div className="animate-in fade-in duration-300">
            {/* Discount badge pre mobil */}
            <div className="flex justify-between items-flex-start mb-4">
              <div>
                <span className="text-sm line-through text-muted-foreground font-normal block">
                  {formatPrice(priceBreakdown.originalPrice)}
                </span>
              </div>
              <Badge 
                variant="destructive"
                className="h-5 text-xs font-bold bg-gradient-to-r from-red-500 to-red-400 text-white border-none"
              >
                <DiscountIcon className="w-3.5 h-3.5 mr-1" />
                -{priceBreakdown.discountPercentage}%
              </Badge>
            </div>

            {/* Hlavná cena pre mobil */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <EuroIcon className="w-5 h-5 text-green-700" />
                <span className="text-2xl font-extrabold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent leading-tight">
                  {formatPrice(priceBreakdown.finalPrice)}
                </span>
              </div>
            </div>

            {/* Ušetrené pre mobil */}
            <div className="flex items-center justify-center gap-2 p-3 rounded bg-green-50">
              <SavingsIcon className="w-3.5 h-3.5 text-green-700" />
              <span className="text-sm text-green-700 font-bold">
                Zľava {formatPrice(priceBreakdown.discountAmount)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <EuroIcon className="w-5 h-5 text-green-700" />
            <span className="text-2xl font-extrabold text-green-700 leading-tight">
              {formatPrice(priceBreakdown.finalPrice)}
            </span>
          </div>
        )}

        {/* Extra poplatky pre mobil */}
        {showExtraKm && priceBreakdown.extraKmCharge > 0 && (
          <div className="flex items-center justify-center gap-2 p-2 rounded bg-orange-50 animate-in slide-in-from-bottom duration-400">
            <PlusIcon className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-500 font-semibold">
              +{formatPrice(priceBreakdown.extraKmCharge)} km
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "mb-8 p-8 rounded-lg border relative overflow-hidden",
      priceBreakdown.hasDiscount
        ? "bg-gradient-to-br from-gray-50 to-green-50 border-green-200"
        : "bg-gradient-to-br from-gray-50 to-white border-gray-200"
    )}>
      {/* Discount badge - absolútne pozicionovaný */}
      {priceBreakdown.hasDiscount && (
        <div className="absolute -top-2 -right-2 w-15 h-15 rounded-full bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center rotate-12 shadow-lg animate-in zoom-in duration-500">
          <span className="text-white font-extrabold text-xs -rotate-12">
            -{priceBreakdown.discountPercentage}%
          </span>
        </div>
      )}

      {/* Hlavná cena */}
      <div className="flex items-flex-start gap-8 mb-8">
        <div className="p-4 rounded-full bg-gradient-to-r from-green-700 to-green-500 flex items-center justify-center min-w-[40px] h-10">
          <EuroIcon className="text-white w-5 h-5" />
        </div>

        <div className="flex-1">
          {priceBreakdown.hasDiscount ? (
            <div className="animate-in fade-in duration-300">
              {/* Pôvodná cena */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-lg line-through text-muted-foreground font-medium">
                  Pôvodná cena: {formatPrice(priceBreakdown.originalPrice)}
                </span>
              </div>

              {/* Zľavnená cena */}
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent leading-tight mb-4">
                {formatPrice(priceBreakdown.finalPrice)}
              </h2>

              {/* Ušetrené */}
              <div className="flex items-center gap-4 p-4 rounded bg-green-50">
                <SavingsIcon className="text-green-700 w-[18px] h-[18px]" />
                <span className="text-green-700 font-bold text-base">
                  Zľava: {formatPrice(priceBreakdown.discountAmount)}
                </span>
                <Badge 
                  variant="default"
                  className="bg-gradient-to-r from-green-700 to-green-500 text-white font-semibold"
                >
                  {priceFormat.discountText}
                </Badge>
              </div>
            </div>
          ) : (
            <h2 className="text-4xl font-extrabold text-green-700 leading-tight">
              {formatPrice(priceBreakdown.finalPrice)}
            </h2>
          )}
        </div>
      </div>

      {/* Extra poplatky */}
      <div className="flex flex-col gap-4">
        {showExtraKm && priceBreakdown.extraKmCharge > 0 && (
          <div className="flex items-center gap-4 p-4 rounded bg-orange-50 animate-in slide-in-from-bottom duration-400">
            <PlusIcon className="text-orange-500 w-4 h-4" />
            <span className="text-orange-500 font-semibold">
              Extra km: +{formatPrice(priceBreakdown.extraKmCharge)}
            </span>
          </div>
        )}

        {rental.commission && rental.commission > 0 && (
          <div className="flex items-center gap-4 p-4 rounded bg-gray-50">
            <span className="text-muted-foreground font-medium">
              Provízia: {formatPrice(rental.commission)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}