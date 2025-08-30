/**
 * Email Filters Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React from 'react';

import { STATUS_OPTIONS } from '../utils/email-constants';

interface EmailFiltersProps {
  statusFilter: string;
  senderFilter: string;
  onStatusFilterChange: (value: string) => void;
  onSenderFilterChange: (value: string) => void;
  onClearFilters: () => void;
}

export const EmailFilters: React.FC<EmailFiltersProps> = ({
  statusFilter,
  senderFilter,
  onStatusFilterChange,
  onSenderFilterChange,
  onClearFilters,
}) => {
  const theme = useTheme();
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: isExtraSmall ? 2 : isMobile ? 2 : 3 }}>
        <Typography
          variant={isExtraSmall ? 'body1' : isMobile ? 'subtitle1' : 'h6'}
          gutterBottom
          sx={{
            fontSize: isExtraSmall ? '1rem' : undefined,
            textAlign: isSmallMobile ? 'center' : 'left',
            fontWeight: 600,
          }}
        >
          🔍 Filtre
        </Typography>
        <Grid container spacing={isExtraSmall ? 1.5 : isMobile ? 2 : 2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value)}
              fullWidth
              size={isExtraSmall ? 'small' : isMobile ? 'medium' : 'small'}
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                },
                '& .MuiInputBase-input': {
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                },
              }}
            >
              {STATUS_OPTIONS.map(option => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Odosielateľ"
              value={senderFilter}
              onChange={e => onSenderFilterChange(e.target.value)}
              fullWidth
              size={isExtraSmall ? 'small' : isMobile ? 'medium' : 'small'}
              placeholder={
                isExtraSmall ? 'Hľadať...' : 'Hľadať podľa odosielateľa...'
              }
              sx={{
                '& .MuiInputLabel-root': {
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                },
                '& .MuiInputBase-input': {
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              onClick={onClearFilters}
              fullWidth
              size={isExtraSmall ? 'small' : 'medium'}
              sx={{
                fontSize: isExtraSmall ? '0.875rem' : undefined,
                py: isExtraSmall ? 1 : undefined,
              }}
            >
              {isExtraSmall ? 'Vyčistiť' : 'Vyčistiť filtre'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
