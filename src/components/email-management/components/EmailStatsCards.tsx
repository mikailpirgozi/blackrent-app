/**
 * Email Statistics Cards Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React from 'react';

import { EmailStats } from '../types/email-types';

interface EmailStatsCardsProps {
  stats: EmailStats | null;
}

export const EmailStatsCards: React.FC<EmailStatsCardsProps> = ({ stats }) => {
  const theme = useTheme();
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!stats) return null;

  return (
    <Grid container spacing={isExtraSmall ? 1 : isMobile ? 2 : 3} mb={3}>
      <Grid item xs={6} sm={6} md={3}>
        <Card
          sx={{
            height: '100%',
            minHeight: isExtraSmall ? '80px' : '100px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <CardContent
            sx={{
              p: isExtraSmall ? 1 : isMobile ? 1.5 : 2,
              '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography
              variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
              color="primary"
              sx={{
                fontSize: isExtraSmall
                  ? '0.75rem'
                  : isMobile
                    ? '0.875rem'
                    : undefined,
                mb: 0.5,
                fontWeight: 500,
              }}
            >
              {isExtraSmall ? '📬' : '📬 Celkom'}
            </Typography>
            <Typography
              variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
              fontWeight="bold"
              sx={{
                fontSize: isExtraSmall ? '1.25rem' : undefined,
                lineHeight: 1,
              }}
            >
              {stats.today.total}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <Card
          sx={{
            height: '100%',
            minHeight: isExtraSmall ? '80px' : '100px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <CardContent
            sx={{
              p: isExtraSmall ? 1 : isMobile ? 1.5 : 2,
              '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography
              variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
              color="success.main"
              sx={{
                fontSize: isExtraSmall
                  ? '0.75rem'
                  : isMobile
                    ? '0.875rem'
                    : undefined,
                mb: 0.5,
                fontWeight: 500,
              }}
            >
              {isExtraSmall ? '✅' : '✅ Schválené'}
            </Typography>
            <Typography
              variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
              fontWeight="bold"
              sx={{
                fontSize: isExtraSmall ? '1.25rem' : undefined,
                lineHeight: 1,
              }}
            >
              {stats.today.processed}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <Card
          sx={{
            height: '100%',
            minHeight: isExtraSmall ? '80px' : '100px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <CardContent
            sx={{
              p: isExtraSmall ? 1 : isMobile ? 1.5 : 2,
              '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography
              variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
              color="error.main"
              sx={{
                fontSize: isExtraSmall
                  ? '0.75rem'
                  : isMobile
                    ? '0.875rem'
                    : undefined,
                mb: 0.5,
                fontWeight: 500,
              }}
            >
              {isExtraSmall ? '❌' : '❌ Zamietnuté'}
            </Typography>
            <Typography
              variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
              fontWeight="bold"
              sx={{
                fontSize: isExtraSmall ? '1.25rem' : undefined,
                lineHeight: 1,
              }}
            >
              {stats.today.rejected}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} sm={6} md={3}>
        <Card
          sx={{
            height: '100%',
            minHeight: isExtraSmall ? '80px' : '100px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <CardContent
            sx={{
              p: isExtraSmall ? 1 : isMobile ? 1.5 : 2,
              '&:last-child': { pb: isExtraSmall ? 1 : isMobile ? 1.5 : 2 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography
              variant={isExtraSmall ? 'caption' : isMobile ? 'body2' : 'h6'}
              color="warning.main"
              sx={{
                fontSize: isExtraSmall
                  ? '0.75rem'
                  : isMobile
                    ? '0.875rem'
                    : undefined,
                mb: 0.5,
                fontWeight: 500,
              }}
            >
              {isExtraSmall ? '⏳' : '⏳ Čakajúce'}
            </Typography>
            <Typography
              variant={isExtraSmall ? 'h6' : isMobile ? 'h5' : 'h4'}
              fontWeight="bold"
              sx={{
                fontSize: isExtraSmall ? '1.25rem' : undefined,
                lineHeight: 1,
              }}
            >
              {stats.today.pending}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
