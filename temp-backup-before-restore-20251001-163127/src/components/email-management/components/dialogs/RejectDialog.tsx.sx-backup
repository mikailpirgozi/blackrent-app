/**
 * Reject Dialog Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React from 'react';

interface RejectDialogProps {
  open: boolean;
  isRental?: boolean;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RejectDialog: React.FC<RejectDialogProps> = ({
  open,
  isRental = false,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullScreen={isExtraSmall}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          margin: isExtraSmall ? 0 : isSmallMobile ? 1 : 2,
          borderRadius: isExtraSmall ? 0 : undefined,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: isExtraSmall ? '1.1rem' : undefined,
          p: isExtraSmall ? 2 : undefined,
        }}
      >
        <Typography variant={isExtraSmall ? 'h6' : 'h5'} component="span">
          {isRental
            ? isExtraSmall
              ? 'Zamietnuť'
              : 'Zamietnuť prenájom'
            : isExtraSmall
              ? 'Zamietnuť'
              : 'Zamietnuť email'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: isExtraSmall ? 2 : undefined }}>
        <TextField
          fullWidth
          multiline
          rows={isExtraSmall ? 2 : 3}
          label={isExtraSmall ? 'Dôvod' : 'Dôvod zamietnutia'}
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
          margin="normal"
          size={isExtraSmall ? 'small' : 'medium'}
          sx={{
            '& .MuiInputLabel-root': {
              fontSize: isExtraSmall ? '0.875rem' : undefined,
            },
            '& .MuiInputBase-input': {
              fontSize: isExtraSmall ? '0.875rem' : undefined,
            },
          }}
        />
      </DialogContent>
      <DialogActions
        sx={{
          p: isExtraSmall ? 2 : undefined,
          gap: isExtraSmall ? 1 : undefined,
        }}
      >
        <Button
          onClick={onCancel}
          size={isExtraSmall ? 'small' : 'medium'}
          sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}
        >
          {isExtraSmall ? 'Zrušiť' : 'Zrušiť'}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          size={isExtraSmall ? 'small' : 'medium'}
          sx={{ fontSize: isExtraSmall ? '0.875rem' : undefined }}
        >
          {isExtraSmall ? 'Zamietnuť' : 'Zamietnuť'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
