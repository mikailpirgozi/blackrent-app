import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  SupervisorAccount as AdvancedIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { RoleGuard } from '../common/PermissionGuard';
import BasicUserManagement from './BasicUserManagement';
import PushNotificationManager from '../common/PushNotificationManager';

export default function IntegratedUserManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Tab management - start with Basic tab (index 0) as it's the main feature
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Basic User Management is now the main component - no placeholder needed

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <BasicUserManagement />;
      case 1:
        return <PushNotificationManager />;
      default:
        return <BasicUserManagement />;
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']} showAccessDeniedMessage>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: '#1976d2',
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            👥 Správa používateľov
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            aria-label="user management tabs"
            variant={isMobile ? "scrollable" : "standard"}
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
              }
            }}
          >
            <Tab 
              icon={<PersonIcon />} 
              label="Správa používateľov"
            />
            <Tab 
              icon={<NotificationIcon />} 
              label="Push notifikácie"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
          {renderTabContent()}
        </Box>
      </Box>
    </RoleGuard>
  );
}