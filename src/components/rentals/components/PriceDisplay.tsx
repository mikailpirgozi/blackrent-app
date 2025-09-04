import React from 'react';
import {
  LocalOffer as DiscountIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: 'line-through',
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {priceBreakdown.originalPrice.toFixed(2)}€
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  mx: 0.5,
                }}
              >
                →
              </Typography>
            </Box>
            <Typography
              variant="h6"
              fontWeight="bold"
              color="success.main"
              sx={{ fontSize: '1.1rem' }}
            >
              {priceBreakdown.finalPrice.toFixed(2)}€
            </Typography>
            <Chip
              icon={<DiscountIcon />}
              label={`-${priceBreakdown.discountPercentage}%`}
              color="error"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                '& .MuiChip-icon': {
                  fontSize: '0.8rem',
                },
              }}
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
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
            >
              <Typography
                variant="body2"
                sx={{
                  textDecoration: 'line-through',
                  color: 'text.secondary',
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                {priceBreakdown.originalPrice.toFixed(2)}€
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  mx: 0.5,
                }}
              >
                →
              </Typography>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="success.main"
                sx={{ fontSize: '1.25rem' }}
              >
                {priceBreakdown.finalPrice.toFixed(2)}€
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<DiscountIcon />}
                label={priceFormat.discountText}
                color="error"
                size="small"
                variant="filled"
                sx={{
                  fontWeight: 'bold',
                  '& .MuiChip-icon': {
                    fontSize: '0.9rem',
                  },
                }}
              />
              <Typography
                variant="caption"
                color="success.main"
                sx={{ fontWeight: 500 }}
              >
                Ušetrené: {priceBreakdown.discountAmount.toFixed(2)}€
              </Typography>
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
