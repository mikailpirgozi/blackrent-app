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
  Notifications as NotificationIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { RoleGuard } from '../common/PermissionGuard';
import BasicUserManagement from './BasicUserManagement';
import PushNotificationManager from '../common/PushNotificationManager';
import RolePermissionsDisplay from './RolePermissionsDisplay';

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
        return <RolePermissionsDisplay />;
      case 2:
        return <PushNotificationManager />;
      default:
        return <BasicUserManagement />;
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']} showAccessDeniedMessage>
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 },
        minHeight: '100vh',
        backgroundColor: { xs: '#f5f5f5', sm: 'transparent' }
      }}>
        {/* Header - Removed duplicate since BasicUserManagement has its own */}
        {/* Tabs */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: { xs: 2, sm: 3 },
          backgroundColor: { xs: 'background.paper', sm: 'transparent' },
          mx: { xs: -1, sm: 0 },
          px: { xs: 2, sm: 0 },
          py: { xs: 1, sm: 0 },
          borderRadius: { xs: '8px 8px 0 0', sm: 0 }
        }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange} 
            aria-label="user management tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minWidth: { xs: 100, sm: 140, md: 160 },
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                py: { xs: 1.5, sm: 1.5 }
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0'
              }
            }}
          >
            <Tab 
              icon={<PersonIcon fontSize={isMobile ? "small" : "medium"} />} 
              label="Správa používateľov"
              iconPosition="start"
            />
            <Tab 
              icon={<SecurityIcon fontSize={isMobile ? "small" : "medium"} />} 
              label="Práva rolí"
              iconPosition="start"
            />
            <Tab 
              icon={<NotificationIcon fontSize={isMobile ? "small" : "medium"} />} 
              label="Push notifikácie"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ 
          mt: 0,
          backgroundColor: { xs: 'background.paper', sm: 'transparent' },
          borderRadius: { xs: 2, sm: 0 },
          mx: { xs: -1, sm: 0 },
          overflow: 'hidden'
        }}>
          {renderTabContent()}
        </Box>
      </Box>
    </RoleGuard>
  );
}