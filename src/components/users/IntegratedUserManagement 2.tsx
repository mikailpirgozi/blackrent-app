import {
  Person as PersonIcon,
  SupervisorAccount as AdvancedIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';

import AdvancedUserManagement from '../admin/AdvancedUserManagement';
import { RoleGuard } from '../common/PermissionGuard';
import PushNotificationManager from '../common/PushNotificationManager';

export default function IntegratedUserManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Tab management - start with Advanced tab (index 1) as it's the main feature
  const [currentTab, setCurrentTab] = useState(1);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const BasicUserManagementPlaceholder = () => (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ mb: 2, color: 'primary.main' }}>
        🚧 Základná správa používateľov
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Pôvodná funkcionalita bude integrovaná v ďalšej verzii.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        💡 <strong>Tip:</strong> Použite záložku "Pokročilá správa" pre
        kompletné user management s organizáciami, rolami, tímami a audit logom.
      </Typography>
    </Box>
  );

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <BasicUserManagementPlaceholder />;
      case 2:
        return <PushNotificationManager />;
      default: // case 1 - Advanced User Management
        return <AdvancedUserManagement />;
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']} showAccessDeniedMessage>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1976d2',
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            👥 Správa používateľov
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="user management tabs"
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minWidth: { xs: 120, sm: 160 },
                fontSize: '0.9rem',
                fontWeight: 500,
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
            }}
          >
            <Tab icon={<PersonIcon />} label="Základná správa" />
            <Tab icon={<AdvancedIcon />} label="Pokročilá správa" />
            <Tab icon={<NotificationIcon />} label="Push notifikácie" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>{renderTabContent()}</Box>
      </Box>
    </RoleGuard>
  );
}
