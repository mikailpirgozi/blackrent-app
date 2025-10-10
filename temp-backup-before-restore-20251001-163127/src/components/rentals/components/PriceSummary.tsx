import React from 'react';
import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import { LocalOffer as DiscountIcon } from '@mui/icons-material';
import { Box, Chip, Divider, Typography } from '@mui/material';
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
    <Box
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
    >
      {/* Originálna cena (ak existuje zľava) */}
      {hasDiscount && showOriginalPrice && (
        <>
          <Typography variant="body2" color="text.secondary">
            Originálna cena:
            <span style={{ textDecoration: 'line-through', marginLeft: 8 }}>
              {originalPrice.toFixed(2)} €
            </span>
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              icon={<UnifiedIcon name="discount" />}
              label={
                discount?.type === 'percentage'
                  ? `Zľava ${discount.value}% (-${discountAmount.toFixed(2)}€)`
                  : `Zľava -${discountAmount.toFixed(2)}€`
              }
              color="secondary"
              size="small"
              variant="outlined"
            />
          </Box>
          <Divider sx={{ my: 1 }} />
        </>
      )}

      {/* Aktuálne ceny */}
      <Box>
        <Typography>
          {hasDiscount ? 'Cena po zľave' : 'Základná cena'}:{' '}
          <strong>{basePrice.toFixed(2)} €</strong>
        </Typography>

        {extraKm > 0 && (
          <Typography color="warning.main">
            Doplatok za km: <strong>+{extraKm.toFixed(2)} €</strong>
          </Typography>
        )}

        <Typography variant="h6" color="primary">
          Celková cena: <strong>{finalPrice.toFixed(2)} €</strong>
          {hasDiscount && showOriginalPrice && (
            <Typography
              component="span"
              variant="body2"
              sx={{
                ml: 1,
                textDecoration: 'line-through',
                color: 'text.secondary',
              }}
            >
              (pôvodne {originalFinalPrice.toFixed(2)} €)
            </Typography>
          )}
        </Typography>
      </Box>

      <Typography sx={{ mt: 1 }}>
        Provízia: <strong>{commission.toFixed(2)} €</strong>
      </Typography>
    </Box>
  );
}
