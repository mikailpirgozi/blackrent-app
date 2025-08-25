import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
} from '@mui/icons-material';

import { UnifiedButton, UnifiedCard, UnifiedChip } from './index';
import type { UnifiedButtonVariant, UnifiedButtonSize, UnifiedCardVariant, UnifiedChipVariant } from './index';

// 🎨 UNIFIED DESIGN SYSTEM DEMO
export const UnifiedDemo: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleButtonClick = (buttonId: string) => {
    setLoading(buttonId);
    setTimeout(() => setLoading(null), 2000);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        🎨 Unified Design System Demo
      </Typography>
      
      <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: 'text.secondary' }}>
        Konzistentné UI komponenty pre BlackRent aplikáciu
      </Typography>

      {/* BUTTON VARIANTS */}
      <UnifiedCard variant="glass" padding="lg" sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🔘 Button Variants
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Všetky button varianty s konzistentným štýlom a animáciami
        </Typography>
        
        <Grid container spacing={2}>
          {(['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'ghost', 'gradient'] as UnifiedButtonVariant[]).map((variant) => (
            <Grid item xs={12} sm={6} md={3} key={variant}>
              <UnifiedButton
                variant={variant}
                fullWidth
                loading={loading === variant}
                loadingText="Načítava..."
                onClick={() => handleButtonClick(variant)}
                icon={<SaveIcon />}
              >
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
              </UnifiedButton>
            </Grid>
          ))}
        </Grid>
      </UnifiedCard>

      {/* BUTTON SIZES */}
      <UnifiedCard variant="outlined" padding="lg" sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          📏 Button Sizes
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Rôzne veľkosti pre rôzne použitia
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as UnifiedButtonSize[]).map((size) => (
            <UnifiedButton
              key={size}
              variant="primary"
              size={size}
              icon={<AddIcon />}
            >
              Size {size.toUpperCase()}
            </UnifiedButton>
          ))}
        </Box>
      </UnifiedCard>

      {/* BUTTON WITH ICONS */}
      <UnifiedCard variant="elevated" padding="lg" sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🎯 Buttons with Icons
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Ikony na ľavej alebo pravej strane
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <UnifiedButton variant="success" icon={<SaveIcon />} fullWidth>
              Uložiť
            </UnifiedButton>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <UnifiedButton variant="warning" icon={<EditIcon />} fullWidth>
              Upraviť
            </UnifiedButton>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <UnifiedButton variant="danger" icon={<DeleteIcon />} iconPosition="right" fullWidth>
              Vymazať
            </UnifiedButton>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <UnifiedButton variant="info" icon={<ViewIcon />} iconPosition="right" fullWidth>
              Zobraziť
            </UnifiedButton>
          </Grid>
        </Grid>
      </UnifiedCard>

      {/* CARD VARIANTS */}
      <UnifiedCard variant="gradient" padding="lg" sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🃏 Card Variants
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Rôzne štýly kariet pre rôzne účely
        </Typography>
        
        <Grid container spacing={3}>
          {(['default', 'elevated', 'outlined', 'glass', 'mobile', 'premium'] as UnifiedCardVariant[]).map((variant) => (
            <Grid item xs={12} sm={6} md={4} key={variant}>
              <UnifiedCard 
                variant={variant} 
                clickable
                header={
                  <Typography variant="h6">
                    {variant.charAt(0).toUpperCase() + variant.slice(1)} Card
                  </Typography>
                }
                actions={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <UnifiedButton variant="ghost" size="sm" icon={<ViewIcon />}>
                      View
                    </UnifiedButton>
                    <UnifiedButton variant="primary" size="sm" icon={<EditIcon />}>
                      Edit
                    </UnifiedButton>
                  </Box>
                }
              >
                <Typography variant="body2" color="text.secondary">
                  Toto je ukážka {variant} card variantu s konzistentným štýlom a animáciami.
                </Typography>
              </UnifiedCard>
            </Grid>
          ))}
        </Grid>
      </UnifiedCard>

      {/* CHIP VARIANTS */}
      <UnifiedCard variant="interactive" padding="lg" sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          🏷️ Chip Variants
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Štítky a indikátory stavu
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          {(['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info'] as UnifiedChipVariant[]).map((variant) => (
            <UnifiedChip
              key={variant}
              variant={variant}
              label={variant.charAt(0).toUpperCase() + variant.slice(1)}
            />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Special Chips
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <UnifiedChip variant="gradient" label="Premium" glow />
          <UnifiedChip variant="status" label="Active" pulse />
          <UnifiedChip variant="protocol" label="Protocol" animated />
          <UnifiedChip variant="outline" label="Outlined" />
          <UnifiedChip variant="ghost" label="Ghost" />
        </Box>
      </UnifiedCard>

      {/* REAL WORLD EXAMPLES */}
      <UnifiedCard variant="premium" padding="lg">
        <Typography variant="h5" gutterBottom>
          🌟 Real World Examples
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Praktické použitie v BlackRent aplikácii
        </Typography>
        
        <Grid container spacing={3}>
          {/* Vehicle Card Example */}
          <Grid item xs={12} md={6}>
            <UnifiedCard variant="glass" clickable>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">BMW X5 2023</Typography>
                  <Typography variant="body2" color="text.secondary">BA123AB</Typography>
                </Box>
                <UnifiedChip variant="success" label="Dostupné" size="sm" />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <UnifiedChip variant="info" label="SUV" size="xs" />
                <UnifiedChip variant="secondary" label="Premium Cars" size="xs" />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <UnifiedButton variant="ghost" size="sm" icon={<ViewIcon />}>
                  Detail
                </UnifiedButton>
                <UnifiedButton variant="primary" size="sm" icon={<EditIcon />}>
                  Upraviť
                </UnifiedButton>
              </Box>
            </UnifiedCard>
          </Grid>

          {/* Rental Card Example */}
          <Grid item xs={12} md={6}>
            <UnifiedCard variant="elevated" clickable>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">Ján Novák</Typography>
                  <Typography variant="body2" color="text.secondary">25.08.2025 - 30.08.2025</Typography>
                </Box>
                <UnifiedChip variant="warning" label="Aktívny" size="sm" />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <UnifiedChip variant="protocol" label="H" size="sm" />
                <UnifiedChip variant="danger" label="R" size="sm" />
                <UnifiedChip variant="info" label="€450" size="sm" />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <UnifiedButton variant="info" size="sm" icon={<DownloadIcon />}>
                  Protokol
                </UnifiedButton>
                <UnifiedButton variant="success" size="sm" icon={<SaveIcon />}>
                  Dokončiť
                </UnifiedButton>
              </Box>
            </UnifiedCard>
          </Grid>
        </Grid>
      </UnifiedCard>
    </Box>
  );
};

export default UnifiedDemo;
