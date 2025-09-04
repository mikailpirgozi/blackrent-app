import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import {
  Euro as EuroIcon,
  LocalOffer as DiscountIcon,
} from '@mui/icons-material';
import type { Rental } from '../../../types';
import {
  calculatePriceBreakdown,
  formatPriceWithDiscount,
} from '../../../utils/priceCalculator';

interface PriceDisplayProps {
  rental: Rental;
  variant?: 'compact' | 'detailed';
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EuroIcon color="success" fontSize="small" />
        {priceBreakdown.hasDiscount ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                textDecoration: 'line-through',
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              {priceBreakdown.originalPrice.toFixed(2)}€
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {priceBreakdown.finalPrice.toFixed(2)}€
            </Typography>
            <Chip
              icon={<DiscountIcon />}
              label={`-${priceBreakdown.discountPercentage}%`}
              color="secondary"
              size="small"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Box>
        ) : (
          <Typography variant="h6" fontWeight="bold" color="success.main">
            {priceBreakdown.finalPrice.toFixed(2)}€
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {/* Hlavná cena */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <EuroIcon color="success" fontSize="small" />
        {priceBreakdown.hasDiscount ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: 'line-through',
                  color: 'text.secondary',
                }}
              >
                {priceBreakdown.originalPrice.toFixed(2)}€
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">
                {priceBreakdown.finalPrice.toFixed(2)}€
              </Typography>
            </Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}
            >
              <Chip
                icon={<DiscountIcon />}
                label={priceFormat.discountText}
                color="secondary"
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        ) : (
          <Typography variant="h6" fontWeight="bold" color="success.main">
            {priceBreakdown.finalPrice.toFixed(2)}€
          </Typography>
        )}
      </Box>

      {/* Extra km poplatky */}
      {showExtraKm && priceBreakdown.extraKmCharge > 0 && (
        <Typography variant="body2" color="warning.main" sx={{ ml: 3 }}>
          + Extra km: {priceBreakdown.extraKmCharge.toFixed(2)}€
        </Typography>
      )}

      {/* Provízia */}
      {rental.commission && rental.commission > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
          Provízia: {rental.commission.toFixed(2)}€
        </Typography>
      )}
    </Box>
  );
}

