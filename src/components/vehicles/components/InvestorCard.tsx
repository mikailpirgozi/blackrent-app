import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Collapse,
  TextField,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { getApiBaseUrl } from '../../../utils/apiUrl';
import { InvestorCardProps } from '../../../types/vehicle-types';

// 🤝 INVESTOR CARD COMPONENT - Rozbaliteľná karta spoluinvestora s podielmi
const InvestorCard: React.FC<InvestorCardProps> = ({ investor, shares, companies, onShareUpdate, onAssignShare }) => {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    firstName: investor.firstName || '',
    lastName: investor.lastName || '',
    email: investor.email || '',
    phone: investor.phone || '',
    notes: investor.notes || ''
  });

  const handleSaveInvestorData = async () => {
    try {
      console.log('💾 Saving investor data:', investor.id, editData);
      
      const response = await fetch(`${getApiBaseUrl()}/company-investors/${investor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('blackrent_token')}`
        },
        body: JSON.stringify(editData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Investor data saved successfully');
        setEditMode(false);
        onShareUpdate(); // Refresh data
      } else {
        console.error('❌ Failed to save investor data:', result.error);
        alert(`Chyba pri ukladaní: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving investor data:', error);
      alert('Chyba pri ukladaní údajov investora');
    }
  };

  const totalOwnership = shares.reduce((sum, share) => sum + share.ownershipPercentage, 0);

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      {/* Header - Investor info */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: 'grey.50',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'grey.100' }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              👤 {investor.firstName} {investor.lastName}
              <Chip 
                label={`${shares.length} firiem • ${totalOwnership.toFixed(1)}% celkom`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Typography>
            
            <Box sx={{ mt: 1, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {investor.email && (
                <Typography variant="body2" color="text.secondary">
                  📧 {investor.email}
                </Typography>
              )}
              {investor.phone && (
                <Typography variant="body2" color="text.secondary">
                  📞 {investor.phone}
                </Typography>
              )}
              {shares.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  🏢 {shares.map(s => {
                    const company = companies.find(c => c.id === s.companyId);
                    return `${company?.name} (${s.ownershipPercentage}%)`;
                  }).join(', ')}
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setEditMode(!editMode);
              }}
              sx={{ bgcolor: editMode ? 'primary.main' : 'transparent', color: editMode ? 'white' : 'primary.main' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              {expanded ? '🔽' : '▶️'}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Edit Mode */}
      <Collapse in={editMode}>
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ✏️ Úprava spoluinvestora
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno"
                value={editData.firstName}
                onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={editData.lastName}
                onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                size="small"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefón"
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poznámky"
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setEditMode(false)}
              size="small"
            >
              Zrušiť
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveInvestorData}
              size="small"
            >
              💾 Uložiť
            </Button>
          </Box>
        </Box>
      </Collapse>

      {/* Podiely vo firmách - Rozbaliteľné */}
      <Collapse in={expanded}>
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            💼 Podiely vo firmách ({shares.length})
          </Typography>
          
          {shares.length > 0 ? shares.map((share) => {
            const company = companies.find(c => c.id === share.companyId);
            return (
              <Box
                key={share.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">
                    🏢 {company?.name || 'Neznáma firma'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    💰 Podiel: {share.ownershipPercentage}%
                    {share.investmentAmount && ` • Investícia: ${share.investmentAmount}€`}
                    {share.isPrimaryContact && ' • Primárny kontakt'}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${share.ownershipPercentage}%`}
                    color="primary"
                    size="small"
                    variant={share.isPrimaryContact ? 'filled' : 'outlined'}
                  />
                </Box>
              </Box>
            );
          }) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Žiadne podiely vo firmách. Investor nie je priradený k žiadnej firme.
            </Typography>
          )}
          
          {/* Tlačidlo pre pridanie nového podielu */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onAssignShare(investor)}
            >
              🏢 Priradiť k firme
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

export default InvestorCard;
