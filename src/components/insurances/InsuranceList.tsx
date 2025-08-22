import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import VehicleCentricInsuranceList from './VehicleCentricInsuranceList';
import InsuranceClaimList from './InsuranceClaimList';

export default function InsuranceList() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      {/* Tab Navigation */}
      <Tabs
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem'
          }
        }}
      >
        <Tab label="Dokumenty" icon={<SecurityIcon />} iconPosition="start" />
        <Tab label="Poistné udalosti" icon={<WarningIcon />} iconPosition="start" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && <VehicleCentricInsuranceList />}
      {activeTab === 1 && <InsuranceClaimList />}
    </Box>
  );
}