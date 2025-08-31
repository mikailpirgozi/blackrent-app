import {
  CheckCircle as AvailableIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  DirectionsCar as CarIcon,
  Build as MaintenanceIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import React from 'react';

import type { VehicleStatus } from '../../types';

// 🎨 Vehicle Status Color Helper
export const getStatusColor = (
  status: VehicleStatus
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  switch (status) {
    case 'available':
      return 'success';
    case 'rented':
      return 'warning';
    case 'maintenance':
      return 'error';
    case 'temporarily_removed':
      return 'info';
    case 'removed':
      return 'default';
    case 'transferred':
      return 'secondary';
    case 'private':
      return 'primary';
    default:
      return 'default';
  }
};

// 🎨 Vehicle Status Background Color Helper
export const getStatusBgColor = (status: VehicleStatus) => {
  switch (status) {
    case 'available':
      return '#4caf50';
    case 'rented':
      return '#ff9800';
    case 'maintenance':
      return '#f44336';
    case 'temporarily_removed':
      return '#2196f3';
    case 'removed':
      return '#666';
    case 'transferred':
      return '#9c27b0';
    case 'private':
      return '#673ab7';
    default:
      return '#666';
  }
};

// 📝 Vehicle Status Text Helper
export const getStatusText = (status: VehicleStatus) => {
  switch (status) {
    case 'available':
      return 'Dostupné';
    case 'rented':
      return 'Prenajaté';
    case 'maintenance':
      return 'Údržba';
    case 'temporarily_removed':
      return 'Dočasne vyradené';
    case 'removed':
      return 'Vyradené';
    case 'transferred':
      return 'Prepisané';
    case 'private':
      return 'Súkromné';
    default:
      return status;
  }
};

// 🔧 Vehicle Status Icon Helper
export const getStatusIcon = (status: VehicleStatus) => {
  switch (status) {
    case 'available':
      return <AvailableIcon fontSize="small" />;
    case 'rented':
      return <CarIcon fontSize="small" />;
    case 'maintenance':
      return <MaintenanceIcon fontSize="small" />;
    case 'temporarily_removed':
      return <InfoIcon fontSize="small" />;
    case 'removed':
      return <ErrorIcon fontSize="small" />;
    case 'transferred':
      return <BusinessIcon fontSize="small" />;
    case 'private':
      return <HomeIcon fontSize="small" />;
    default:
      return <CarIcon fontSize="small" />;
  }
};
