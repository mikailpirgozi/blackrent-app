import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Box, Paper, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';

import InsuranceClaimList from './InsuranceClaimList';
import VehicleCentricInsuranceList from './VehicleCentricInsuranceList';

export default function InsuranceList() {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // const isTablet = useMediaQuery(theme.breakpoints.down('lg')); // TODO: Implement tablet-specific layout

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Responsive Tab Navigation */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: { xs: 1, sm: 2, md: 3 },
          backgroundColor: 'background.paper',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          scrollButtons={isMobile ? false : 'auto'}
          allowScrollButtonsMobile={!isMobile}
          sx={{
            minHeight: { xs: 48, sm: 56 },
            '& .MuiTab-root': {
              fontWeight: 600,
              textTransform: 'none',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 48, sm: 56 },
              padding: {
                xs: '8px 12px',
                sm: '12px 16px',
                md: '12px 24px',
              },
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-iconWrapper': {
              fontSize: { xs: 18, sm: 20, md: 24 },
              marginRight: { xs: 0.5, sm: 1 },
              marginBottom: 0,
            },
          }}
        >
          <Tab
            label={isMobile ? 'Dokumenty' : 'Poistky & Dokumenty'}
            icon={<UnifiedIcon name="security" />}
            iconPosition={isMobile ? 'top' : 'start'}
            sx={{
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 0.5 : 1,
            }}
          />
          <Tab
            label={isMobile ? 'Udalosti' : 'Poistné udalosti'}
            icon={<UnifiedIcon name="warning" />}
            iconPosition={isMobile ? 'top' : 'start'}
            sx={{
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 0.5 : 1,
            }}
          />
        </Tabs>
      </Paper>

      {/* Responsive Tab Content */}
      <Box
        sx={{
          width: '100%',
          minHeight: 'calc(100vh - 200px)',
          overflow: 'hidden',
        }}
      >
        {activeTab === 0 && <VehicleCentricInsuranceList />}
        {activeTab === 1 && <InsuranceClaimList />}
      </Box>
    </Box>
  );
}
