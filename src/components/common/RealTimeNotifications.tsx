// 🔴 REAL-TIME NOTIFICATIONS - BlackRent
// Komponent pre zobrazenie WebSocket notifikácií

import React, { useState } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Menu,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  Wifi as WiFiIcon,
  WifiOff as WiFiOffIcon,
  Clear as ClearIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';

const RealTimeNotifications: React.FC = () => {
  const { isConnected, connectedUsers, notifications, unreadCount, markNotificationRead, clearNotifications } = useWebSocket();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
  };

  const handleClearAll = () => {
    clearNotifications();
    handleClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'rental_created':
        return <AddIcon color="success" />;
      case 'rental_updated':
        return <EditIcon color="info" />;
      case 'rental_deleted':
        return <DeleteIcon color="error" />;
      case 'vehicle_updated':
        return <CarIcon color="primary" />;
      case 'customer_created':
        return <PersonIcon color="success" />;
      case 'system':
        return <InfoIcon color="warning" />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Box>
      {/* Connection Status Indicator */}
      <Tooltip title={isConnected ? `Pripojené - ${connectedUsers.count} užívateľov online` : 'Odpojené od real-time updates'}>
        <Chip
          icon={isConnected ? <WiFiIcon /> : <WiFiOffIcon />}
          label={isConnected ? 'Live' : 'Offline'}
          color={isConnected ? 'success' : 'error'}
          size="small"
          variant="outlined"
          sx={{ mr: 1 }}
        />
      </Tooltip>

      {/* Notifications Button */}
      <Tooltip title="Real-time notifikácie">
        <IconButton
          onClick={handleClick}
          color={unreadCount > 0 ? 'primary' : 'default'}
          size="large"
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              🔴 Real-time Updates
            </Typography>
            {notifications.length > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearAll}
              >
                Vymazať všetko
              </Button>
            )}
          </Box>
          
          {/* Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
            <Chip
              icon={isConnected ? <WiFiIcon /> : <WiFiOffIcon />}
              label={isConnected ? `${connectedUsers.count} online` : 'Offline'}
              color={isConnected ? 'success' : 'error'}
              size="small"
            />
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} nových`}
                color="primary"
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Connection Warning */}
        {!isConnected && (
          <Alert severity="warning" sx={{ m: 1 }}>
            Real-time updates sú momentálne nedostupné. Obnovte stránku pre opätovné pripojenie.
          </Alert>
        )}

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                Žiadne notifikácie
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time updates sa zobrazia tu
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" component="span">
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip
                              label="NOVÉ"
                              color="primary"
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.timestamp), { 
                              addSuffix: true,
                              locale: sk 
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                    {!notification.read && (
                      <Box sx={{ ml: 1 }}>
                        <CheckIcon color="primary" fontSize="small" />
                      </Box>
                    )}
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Zobrazených {Math.min(notifications.length, 50)} zo všetkých notifikácií
            </Typography>
          </Box>
        )}
      </Menu>
    </Box>
  );
};

export default RealTimeNotifications;