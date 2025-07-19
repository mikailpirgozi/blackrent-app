import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

export default function RentalList() {
  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ConstructionIcon sx={{ mr: 2, color: 'warning.main' }} />
            <Typography variant="h5" component="h1" color="warning.main">
              Prenájmy - Refactoring v priebehu
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>🚀 Aktuálne pracujeme na zlepšení mobile responsivity!</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Prenájmy komponent je momentálne refactorovaný pre lepšiu podporu mobilných zariadení.
              Nahrádzame klasické tabuľky s modernými responsive komponentami.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Progress refactoringu:
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={50} 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              50% - VehicleList ✅ dokončený, RentalList 🔄 v priebehu
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>
            ✅ Už dokončené komponenty:
          </Typography>
          <Box component="ul" sx={{ mb: 3 }}>
            <li><strong>VehicleList</strong> - ResponsiveTable implementované ✅</li>
            <li><strong>ResponsiveTable</strong> - Univerzálny komponent ✅</li>
            <li><strong>PDF Generation</strong> - Cloudflare R2 integrácia ✅</li>
            <li><strong>Protocols Storage</strong> - PostgreSQL + R2 hybrid ✅</li>
          </Box>

          <Alert severity="success">
            <Typography variant="body2">
              <strong>Dobré správy:</strong> Všetky ostatné funkcie aplikácie fungujú normálne! 
              Môžete pokračovať v práci s vozidlami, zákazníkmi, nákladmi a protokolmi.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
