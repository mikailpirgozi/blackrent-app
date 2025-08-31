/**
 * Email Detail Dialog Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { Email as EmailIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React from 'react';

import type { EmailDetail } from '../../types/email-types';
import { StatusChip } from '../StatusChip';

interface EmailDetailDialogProps {
  open: boolean;
  email: EmailDetail | null;
  onClose: () => void;
}

export const EmailDetailDialog: React.FC<EmailDetailDialogProps> = ({
  open,
  email,
  onClose,
}) => {
  const theme = useTheme();
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isSmallMobile}
      PaperProps={{
        sx: {
          margin: isSmallMobile ? 0 : isTablet ? 1 : 2,
          maxHeight: isSmallMobile ? '100vh' : 'calc(100vh - 64px)',
          borderRadius: isSmallMobile ? 0 : undefined,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: isExtraSmall ? '1.1rem' : undefined,
          p: isExtraSmall ? 2 : undefined,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <EmailIcon sx={{ fontSize: isExtraSmall ? 20 : undefined }} />
          <Typography variant={isExtraSmall ? 'h6' : 'h5'} component="span">
            {isExtraSmall ? 'Detail' : 'Email Detail'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: isExtraSmall ? 2 : undefined }}>
        {email && (
          <Box>
            <Typography
              variant={isExtraSmall ? 'subtitle1' : 'h6'}
              gutterBottom
              sx={{
                fontSize: isExtraSmall ? '1rem' : undefined,
                wordBreak: 'break-word',
              }}
            >
              {email.email.subject}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{
                fontSize: isExtraSmall ? '0.875rem' : undefined,
                wordBreak: 'break-word',
              }}
            >
              Od: {email.email.sender} |{' '}
              {new Date(email.email.received_at).toLocaleString('sk')}
            </Typography>

            <StatusChip
              status={email.email.status}
              actionTaken={email.email.action_taken}
            />

            {email.email.email_content && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Obsah emailu:
                </Typography>
                <Paper
                  elevation={1}
                  sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {email.email.email_content.substring(0, 1000)}
                    {email.email.email_content.length > 1000 && '...'}
                  </Typography>
                </Paper>
              </Box>
            )}

            {email.email.parsed_data && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Parsované údaje:
                </Typography>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <pre
                    style={{
                      fontSize: '12px',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {JSON.stringify(email.email.parsed_data, null, 2)}
                  </pre>
                </Paper>
              </Box>
            )}

            {email.actions && email.actions.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  História akcií:
                </Typography>
                {email.actions.map(action => (
                  <Box
                    key={action.id}
                    display="flex"
                    justifyContent="space-between"
                    py={1}
                  >
                    <Typography variant="body2">
                      {action.action} - {action.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(action.created_at).toLocaleString('sk')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zatvoriť</Button>
      </DialogActions>
    </Dialog>
  );
};
