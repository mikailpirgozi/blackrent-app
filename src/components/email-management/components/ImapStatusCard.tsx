/**
 * IMAP Status Card Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React from 'react';

import type { ImapStatus } from '../types/email-types';

interface ImapStatusCardProps {
  imapStatus: ImapStatus | null;
}

export const ImapStatusCard: React.FC<ImapStatusCardProps> = ({
  imapStatus,
}) => {
  const theme = useTheme();
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!imapStatus) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: isExtraSmall ? 2 : 3 }}>
        <Typography
          variant={isSmallMobile ? 'subtitle1' : 'h6'}
          gutterBottom
          sx={{
            fontSize: isExtraSmall ? '1rem' : undefined,
            textAlign: isSmallMobile ? 'center' : 'left',
          }}
        >
          📧 IMAP Konfigurácia
        </Typography>
        <Grid container spacing={isSmallMobile ? 2 : 2}>
          <Grid item xs={12} sm={6} md={4}>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              justifyContent={isSmallMobile ? 'center' : 'flex-start'}
              flexDirection={isExtraSmall ? 'column' : 'row'}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}
              >
                Status:
              </Typography>
              <Chip
                label={
                  imapStatus.enabled
                    ? imapStatus.running
                      ? 'Beží'
                      : 'Zastavený'
                    : 'Vypnutý'
                }
                color={
                  imapStatus.enabled
                    ? imapStatus.running
                      ? 'success'
                      : 'warning'
                    : 'default'
                }
                size={isExtraSmall ? 'small' : 'small'}
                sx={{ fontSize: isExtraSmall ? '0.75rem' : undefined }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box textAlign={isSmallMobile ? 'center' : 'left'}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                  wordBreak: 'break-word',
                }}
              >
                Server:{' '}
                <strong>{imapStatus.config?.host || 'Nekonfigurovaný'}</strong>
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Box textAlign={isSmallMobile ? 'center' : 'left'}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: isExtraSmall ? '0.875rem' : undefined,
                  wordBreak: 'break-word',
                }}
              >
                Používateľ:{' '}
                <strong>{imapStatus.config?.user || 'Nekonfigurovaný'}</strong>
              </Typography>
            </Box>
          </Grid>
        </Grid>
        {!imapStatus.enabled && (
          <Alert
            severity="info"
            sx={{
              mt: 2,
              fontSize: isExtraSmall ? '0.875rem' : undefined,
              '& .MuiAlert-message': {
                fontSize: isExtraSmall ? '0.875rem' : undefined,
              },
            }}
          >
            IMAP monitoring je vypnutý. Skontrolujte konfiguráciu v backend/.env
            súbore.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
