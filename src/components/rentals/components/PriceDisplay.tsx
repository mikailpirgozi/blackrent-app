import React from 'react';
import {
  LocalOffer as DiscountIcon,
  Euro as EuroIcon,
  Add as PlusIcon,
  TrendingDown as SavingsIcon,
} from '@mui/icons-material';
import { Box, Chip, Fade, Grow, Typography } from '@mui/material';
import type { Rental } from '../../../types';
import {
  calculatePriceBreakdown,
  formatPriceWithDiscount,
} from '../../../utils/priceCalculator';

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.75,
          width: '100%',
          p: 1,
        }}
      >
        {priceBreakdown.hasDiscount ? (
          <Fade in timeout={300}>
            <Box sx={{ width: '100%' }}>
              {/* Pôvodná cena a zľava - na jednom riadku */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    textDecoration: 'line-through',
                    color: '#9e9e9e',
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    opacity: 0.8,
                  }}
                >
                  {priceBreakdown.originalPrice.toFixed(2)}€
                </Typography>
                <Chip
                  icon={<DiscountIcon sx={{ fontSize: '10px !important' }} />}
                  label={`-${priceBreakdown.discountPercentage}%`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #ff4444, #ff6b6b)',
                    color: 'white',
                    border: 'none',
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                    '& .MuiChip-label': {
                      px: 0.5,
                    },
                  }}
                />
              </Box>

              {/* Zľavnená cena - hlavná, centrovaná */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <EuroIcon
                  sx={{
                    fontSize: 18,
                    color: '#2e7d32',
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                  }}
                >
                  {priceBreakdown.finalPrice.toFixed(2)}€
                </Typography>
              </Box>

              {/* Zľava info - centrované */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  p: 0.5,
                  borderRadius: 1,
                  background: 'rgba(46, 125, 50, 0.1)',
                  width: '100%',
                }}
              >
                <SavingsIcon sx={{ fontSize: 12, color: '#2e7d32' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    color: '#2e7d32',
                    fontWeight: 700,
                  }}
                >
                  Zľava {priceBreakdown.discountAmount.toFixed(2)}€
                </Typography>
              </Box>
            </Box>
          </Fade>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EuroIcon
                sx={{
                  fontSize: 20,
                  color: '#2e7d32',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                {priceBreakdown.finalPrice.toFixed(2)}€
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                color: '#666',
                fontWeight: 500,
              }}
            >
              Základná cena
            </Typography>
          </Box>
        )}

        {/* Extra km poplatky - kompaktne a centrované */}
        {showExtraKm && priceBreakdown.extraKmCharge > 0 && (
          <Grow in timeout={400}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                p: 0.5,
                borderRadius: 1,
                background: 'rgba(255, 152, 0, 0.1)',
                width: '100%',
              }}
            >
              <PlusIcon sx={{ fontSize: 12, color: '#ff9800' }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: '#ff9800',
                  fontWeight: 600,
                }}
              >
                +{priceBreakdown.extraKmCharge.toFixed(2)}€ km
              </Typography>
            </Box>
          </Grow>
        )}
      </Box>
    );
  }

  // Mobilný variant - optimalizovaný pre malé obrazovky
  if (variant === 'mobile') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          p: 1.5,
          borderRadius: 2,
          background: priceBreakdown.hasDiscount
            ? 'linear-gradient(135deg, #fff3e0 0%, #e8f5e8 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          border: '1px solid',
          borderColor: priceBreakdown.hasDiscount ? '#e8f5e8' : '#f0f0f0',
          position: 'relative',
        }}
      >
        {priceBreakdown.hasDiscount ? (
          <Fade in timeout={300}>
            <Box>
              {/* Discount badge pre mobil */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      textDecoration: 'line-through',
                      color: '#9e9e9e',
                      fontSize: '0.8rem',
                      fontWeight: 400,
                      display: 'block',
                    }}
                  >
                    {priceBreakdown.originalPrice.toFixed(2)}€
                  </Typography>
                </Box>
                <Chip
                  icon={<DiscountIcon sx={{ fontSize: '14px !important' }} />}
                  label={`-${priceBreakdown.discountPercentage}%`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #ff4444, #ff6b6b)',
                    color: 'white',
                    border: 'none',
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
              </Box>

              {/* Hlavná cena pre mobil */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EuroIcon
                    sx={{
                      fontSize: 20,
                      color: '#2e7d32',
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.2,
                    }}
                  >
                    {priceBreakdown.finalPrice.toFixed(2)}€
                  </Typography>
                </Box>
              </Box>

              {/* Ušetrené pre mobil */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  p: 0.75,
                  borderRadius: 1,
                  background: 'rgba(46, 125, 50, 0.1)',
                }}
              >
                <SavingsIcon sx={{ fontSize: 14, color: '#2e7d32' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#2e7d32',
                    fontWeight: 700,
                  }}
                >
                  Zľava {priceBreakdown.discountAmount.toFixed(2)}€
                </Typography>
              </Box>
            </Box>
          </Fade>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <EuroIcon
              sx={{
                fontSize: 20,
                color: '#2e7d32',
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#2e7d32',
                lineHeight: 1.2,
              }}
            >
              {priceBreakdown.finalPrice.toFixed(2)}€
            </Typography>
          </Box>
        )}

        {/* Extra poplatky pre mobil */}
        {showExtraKm && priceBreakdown.extraKmCharge > 0 && (
          <Grow in timeout={400}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                p: 0.5,
                borderRadius: 1,
                background: 'rgba(255, 152, 0, 0.1)',
              }}
            >
              <PlusIcon sx={{ fontSize: 12, color: '#ff9800' }} />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: '#ff9800',
                  fontWeight: 600,
                }}
              >
                +{priceBreakdown.extraKmCharge.toFixed(2)}€ km
              </Typography>
            </Box>
          </Grow>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        background: priceBreakdown.hasDiscount
          ? 'linear-gradient(135deg, #f8f9fa 0%, #e8f5e8 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        border: '1px solid',
        borderColor: priceBreakdown.hasDiscount ? '#e8f5e8' : '#f0f0f0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Discount badge - absolútne pozicionovaný */}
      {priceBreakdown.hasDiscount && (
        <Grow in timeout={500}>
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #ff4444, #ff6b6b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(15deg)',
              boxShadow: '0 4px 12px rgba(255, 68, 68, 0.3)',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                fontWeight: 800,
                fontSize: '0.7rem',
                transform: 'rotate(-15deg)',
              }}
            >
              -{priceBreakdown.discountPercentage}%
            </Typography>
          </Box>
        </Grow>
      )}

      {/* Hlavná cena */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 40,
            height: 40,
          }}
        >
          <EuroIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          {priceBreakdown.hasDiscount ? (
            <Fade in timeout={300}>
              <Box>
                {/* Pôvodná cena */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      textDecoration: 'line-through',
                      color: '#9e9e9e',
                      fontSize: '1.1rem',
                      fontWeight: 500,
                    }}
                  >
                    Pôvodná cena: {priceBreakdown.originalPrice.toFixed(2)}€
                  </Typography>
                </Box>

                {/* Zľavnená cena */}
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                    mb: 1,
                  }}
                >
                  {priceBreakdown.finalPrice.toFixed(2)}€
                </Typography>

                {/* Ušetrené */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    background: 'rgba(46, 125, 50, 0.1)',
                  }}
                >
                  <SavingsIcon sx={{ color: '#2e7d32', fontSize: 18 }} />
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#2e7d32',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    Zľava: {priceBreakdown.discountAmount.toFixed(2)}€
                  </Typography>
                  <Chip
                    label={priceFormat.discountText}
                    size="small"
                    sx={{
                      background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </Fade>
          ) : (
            <Typography
              variant="h4"
              sx={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#2e7d32',
                lineHeight: 1.2,
              }}
            >
              {priceBreakdown.finalPrice.toFixed(2)}€
            </Typography>
          )}
        </Box>
      </Box>

      {/* Extra poplatky */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {showExtraKm && priceBreakdown.extraKmCharge > 0 && (
          <Grow in timeout={400}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                background: 'rgba(255, 152, 0, 0.1)',
              }}
            >
              <PlusIcon sx={{ color: '#ff9800', fontSize: 16 }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#ff9800',
                  fontWeight: 600,
                }}
              >
                Extra km: +{priceBreakdown.extraKmCharge.toFixed(2)}€
              </Typography>
            </Box>
          </Grow>
        )}

        {rental.commission && rental.commission > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              borderRadius: 1,
              background: 'rgba(158, 158, 158, 0.1)',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#666',
                fontWeight: 500,
              }}
            >
              Provízia: {rental.commission.toFixed(2)}€
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
