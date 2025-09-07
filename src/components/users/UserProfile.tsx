import { Save, Person, Edit } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  // Divider, // Nepoužívané
  Alert,
  Paper,
} from '@mui/material';
import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import SignaturePad from '../common/SignaturePad';

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
}

export default function UserProfile({ open, onClose }: UserProfileProps) {
  const { state, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: state.user?.firstName || '',
    lastName: state.user?.lastName || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage(null);

    try {
      console.log('👤 Sending profile data:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      console.log('👤 Current user state:', state.user);

      const response = await apiService.updateUserProfile(
        formData.firstName,
        formData.lastName
      );
      console.log('👤 Profile update response:', response);

      // Aktualizuj user state s dátami z backendu
      if (response && response.user) {
        console.log('✅ Backend returned user data:', response.user);
        updateUser({
          firstName: response.user.firstName,
          lastName: response.user.lastName,
        });
        console.log('✅ User state updated with backend data');
      } else if (response && response.success) {
        // Fallback ak response nemá user objekt ale má success
        console.log('⚠️ Backend returned success but no user data');
        updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        console.log('⚠️ Using frontend data as fallback (success response)');
      } else {
        // Fallback na frontend data
        console.log('⚠️ Backend returned no data');
        updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        console.log('⚠️ Using frontend data as fallback (no response data)');
      }

      setMessage({ type: 'success', text: '✅ Profil úspešne aktualizovaný!' });
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Fallback na frontend data aj pri chybe
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      console.log('⚠️ Using frontend data as fallback (error occurred)');

      setMessage({
        type: 'error',
        text: '❌ Chyba pri aktualizácii profilu - dáta uložené lokálne',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSave = async (
    signatureData: Record<string, unknown>
  ) => {
    setLoading(true);
    setMessage(null);

    try {
      const signature = signatureData.signature as string;
      console.log('🖊️ Sending signature data:', {
        signatureLength: signature?.length || 0,
      });
      console.log('🖊️ Current user state:', state.user);

      const response = await apiService.updateSignatureTemplate(signature);
      console.log('🖊️ Signature update response:', response);

      // Aktualizuj user state s dátami z backendu
      if (response && response.user) {
        console.log('✅ Backend returned user data:', response.user);
        updateUser({
          signatureTemplate: response.user.signatureTemplate,
        });
        console.log('✅ User state updated with backend signature data');
      } else if (response && response.success) {
        // Fallback ak response nemá user objekt ale má success
        console.log('⚠️ Backend returned success but no user data');
        updateUser({
          signatureTemplate: signature,
        });
        console.log(
          '⚠️ Using frontend signature data as fallback (success response)'
        );
      } else {
        // Fallback na frontend data
        console.log('⚠️ Backend returned no data');
        updateUser({
          signatureTemplate: signature,
        });
        console.log(
          '⚠️ Using frontend signature data as fallback (no response data)'
        );
      }

      setMessage({
        type: 'success',
        text: '✅ Podpis úspešne uložený ako template!',
      });
      setShowSignaturePad(false);
    } catch (error) {
      console.error('❌ Error saving signature template:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Fallback na frontend data aj pri chybe
      const signature = signatureData.signature as string;
      updateUser({
        signatureTemplate: signature,
      });
      console.log(
        '⚠️ Using frontend signature data as fallback (error occurred)'
      );

      setMessage({
        type: 'error',
        text: '❌ Chyba pri ukladaní podpisu - podpis uložený lokálne',
      });
      setShowSignaturePad(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        p: 2,
      }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          maxWidth: 800,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          p: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          👤 Môj Profil
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Osobné údaje
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Meno"
                value={formData.firstName}
                onChange={e => handleInputChange('firstName', e.target.value)}
                fullWidth
                helperText="Vaše meno sa použije v protokoloch"
              />
              <TextField
                label="Priezvisko"
                value={formData.lastName}
                onChange={e => handleInputChange('lastName', e.target.value)}
                fullWidth
                helperText="Vaše priezvisko sa použije v protokoloch"
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveProfile}
              disabled={loading}
            >
              {loading ? 'Ukladám...' : 'Uložiť profil'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Edit sx={{ mr: 1, verticalAlign: 'middle' }} />
              Môj podpis
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Váš podpis sa automaticky použije pri vytváraní protokolov ako
              zamestnanec.
            </Typography>

            {state.user?.signatureTemplate && (
              <Paper sx={{ p: 2, mb: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Aktuálny podpis:
                </Typography>
                <img
                  src={state.user.signatureTemplate}
                  alt="Aktuálny podpis"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 100,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                  }}
                />
              </Paper>
            )}

            <Button
              variant="outlined"
              onClick={() => setShowSignaturePad(true)}
              disabled={loading}
            >
              {state.user?.signatureTemplate
                ? 'Zmeniť podpis'
                : 'Pridať podpis'}
            </Button>
          </CardContent>
        </Card>

        {/* Close button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Zavrieť
          </Button>
        </Box>
      </Box>

      {/* SignaturePad modal */}
      {showSignaturePad && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            p: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
              signerName={
                `${formData.firstName} ${formData.lastName}`.trim() ||
                'Zamestnanec'
              }
              signerRole="employee"
              location="Kancelária"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
