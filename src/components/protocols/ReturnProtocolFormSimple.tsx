import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Rental, HandoverProtocol, ReturnProtocol } from '../../types';

interface ReturnProtocolFormSimpleProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  handoverProtocol?: HandoverProtocol;
  onSave: (protocol: ReturnProtocol) => void;
}

export default function ReturnProtocolFormSimple({ 
  open, 
  onClose, 
  rental, 
  handoverProtocol, 
  onSave 
}: ReturnProtocolFormSimpleProps) {
  if (!open) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Preberací protokol - Test
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Rental ID: {rental.id}
      </Typography>
      
      {handoverProtocol ? (
        <Typography variant="body1" sx={{ mb: 2, color: 'success.main' }}>
          ✅ Odovzdávací protokol načítaný: {handoverProtocol.id}
        </Typography>
      ) : (
        <Typography variant="body1" sx={{ mb: 2, color: 'error.main' }}>
          ❌ Odovzdávací protokol nenačítaný
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button variant="contained" onClick={onClose}>
          Zatvoriť
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => {
            // Mock protocol data
            const mockProtocol: ReturnProtocol = {
              id: 'test-' + Date.now(),
              rentalId: rental.id,
              handoverProtocolId: handoverProtocol?.id || '',
              createdAt: new Date(),
              completedAt: new Date(),
              customerSignature: { id: '', url: '', timestamp: Date.now() },
              employeeSignature: { id: '', url: '', timestamp: Date.now() },
              images: [],
              videos: [],
              notes: 'Test protokol',
              damages: [],
              finalMileage: 0,
              fuelLevel: 'full',
              returnLocation: 'Test location',
              returnedBy: 'Test user',
              employeeId: 'test-employee'
            };
            onSave(mockProtocol);
          }}
        >
          Test uložiť
        </Button>
      </Box>
    </Box>
  );
}
