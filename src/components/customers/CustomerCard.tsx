/**
 * 👤 CUSTOMER CARD COMPONENT
 * 
 * Optimalizovaný customer card s React.memo pre lepší performance
 */

import React, { memo, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { Customer } from '../../types';

interface CustomerCardProps {
  customer: Customer;
  index: number;
  totalCustomers: number;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  getCustomerRentalCount: (customerId: string) => number;
  isMobile?: boolean;
}

const CustomerCard = memo<CustomerCardProps>(({ 
  customer, 
  index, 
  totalCustomers, 
  onEdit, 
  onDelete, 
  getCustomerRentalCount,
  isMobile = false 
}) => {
  const theme = useTheme();
  
  // Memoized handlers
  const handleEdit = useCallback(() => onEdit(customer), [onEdit, customer]);
  const handleDelete = useCallback(() => onDelete(customer.id), [onDelete, customer.id]);

  const rentalCount = getCustomerRentalCount(customer.id);

  return (
    <Box 
      sx={{ 
        display: 'flex',
        borderBottom: index < totalCustomers - 1 ? '1px solid #e0e0e0' : 'none',
        '&:hover': { backgroundColor: '#f8f9fa' },
        minHeight: 80,
        cursor: 'pointer'
      }}
      onClick={handleEdit}
    >
      {/* Customer Info - sticky left */}
      <Box sx={{ 
        width: { xs: 140, sm: 160 },
        maxWidth: { xs: 140, sm: 160 },
        p: { xs: 1, sm: 1.5 },
        borderRight: '2px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        position: 'sticky',
        left: 0,
        zIndex: 10,
        overflow: 'hidden'
      }}>
        <Typography variant="subtitle2" sx={{ 
          fontWeight: 600, 
          fontSize: { xs: '0.75rem', sm: '0.8rem' },
          color: '#1976d2',
          lineHeight: 1.2,
          wordWrap: 'break-word',
          mb: { xs: 0.25, sm: 0.5 }
        }}>
          {customer.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ 
            color: 'text.secondary',
            fontSize: { xs: '0.65rem', sm: '0.7rem' },
            lineHeight: 1.1
          }}
        >
          {customer.email ? customer.email.substring(0, 20) + (customer.email.length > 20 ? '...' : '') : 'Bez emailu'}
        </Typography>
      </Box>

      {/* Contact Info */}
      <Box sx={{ 
        flex: 1,
        p: { xs: 1, sm: 1.5 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          {customer.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                color: 'text.primary'
              }}>
                {customer.phone}
              </Typography>
            </Box>
          )}
          {customer.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                color: 'text.primary',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {customer.email}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Company field removed - not in Customer type */}
      </Box>

      {/* Rental Count */}
      <Box sx={{ 
        width: { xs: 60, sm: 80 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRight: '1px solid #e0e0e0'
      }}>
        <Chip
          label={rentalCount}
          size="small"
          sx={{
            height: 24,
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            bgcolor: rentalCount > 0 ? '#e3f2fd' : '#f5f5f5',
            color: rentalCount > 0 ? '#1976d2' : '#666',
            fontWeight: 600,
            minWidth: { xs: 28, sm: 32 }
          }}
        />
      </Box>

      {/* Actions */}
      <Box sx={{ 
        width: { xs: 80, sm: 100 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5
      }}>
        <Tooltip title="Upraviť zákazníka">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            sx={{ 
              width: { xs: 32, sm: 36 },
              height: { xs: 32, sm: 36 },
              color: '#1976d2',
              '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.08)' }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zmazať zákazníka">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            sx={{ 
              width: { xs: 32, sm: 36 },
              height: { xs: 32, sm: 36 },
              color: '#d32f2f',
              '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.08)' }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
});

CustomerCard.displayName = 'CustomerCard';

export default CustomerCard;
