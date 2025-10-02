// Lucide icons (replacing MUI icons)
import { Tag as DiscountIcon } from 'lucide-react';

// shadcn/ui components
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import type { Rental } from '../../../types';
import { calculateOriginalPriceFromDiscounted } from '../../../utils/priceCalculator';

interface PriceSummaryProps {
  calculatedPrice: number;
  extraKmCharge: number;
  calculatedCommission: number;
  discount?: Rental['discount'];
  showOriginalPrice?: boolean;
}

/**
 * 💰 Komponent pre zobrazenie súhrnu cien v RentalForm
 * Zobrazuje originálnu cenu, zľavu, a finálnu cenu
 */
export default function PriceSummary({
  calculatedPrice,
  extraKmCharge,
  calculatedCommission,
  discount,
  showOriginalPrice = true,
}: PriceSummaryProps) {
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  const basePrice = calculatedPrice || 0;
  const extraKm = extraKmCharge || 0;
  const commission = calculatedCommission || 0;

  // Vypočítaj originálnu cenu ak existuje zľava
  let originalPrice = basePrice;
  let discountAmount = 0;
  let hasDiscount = false;

  if (discount?.value && discount.value > 0) {
    hasDiscount = true;
    originalPrice = calculateOriginalPriceFromDiscounted(basePrice, discount);
    discountAmount = originalPrice - basePrice;
  }

  const finalPrice = basePrice + extraKm;
  const originalFinalPrice = originalPrice + extraKm;

  return (
    <Card className="bg-background">
      <CardContent className="p-4">
        {/* Originálna cena (ak existuje zľava) */}
        {hasDiscount && showOriginalPrice && (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              Originálna cena:
              <span className="line-through ml-2">
                {formatPrice(originalPrice)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <DiscountIcon className="w-3 h-3" />
                {discount?.type === 'percentage'
                  ? `Zľava ${discount.value}% (-${formatPrice(discountAmount)})`
                  : `Zľava -${formatPrice(discountAmount)}`
                }
              </Badge>
            </div>
            <Separator className="my-2" />
          </>
        )}

        {/* Aktuálne ceny */}
        <div className="space-y-2">
          <div className="text-sm">
            {hasDiscount ? 'Cena po zľave' : 'Základná cena'}:{' '}
            <strong>{formatPrice(basePrice)}</strong>
          </div>

          {extraKm > 0 && (
            <div className="text-sm text-orange-600 dark:text-orange-400">
              Doplatok za km: <strong>+{formatPrice(extraKm)}</strong>
            </div>
          )}

          <div className="text-lg font-semibold text-primary">
            Celková cena: <strong>{formatPrice(finalPrice)}</strong>
            {hasDiscount && showOriginalPrice && (
              <span className="ml-2 text-sm font-normal line-through text-muted-foreground">
                (pôvodne {formatPrice(originalFinalPrice)})
              </span>
            )}
          </div>
        </div>

        <div className="text-sm mt-3 pt-2 border-t">
          Provízia: <strong>{formatPrice(commission)}</strong>
        </div>
      </CardContent>
    </Card>
  );
}
