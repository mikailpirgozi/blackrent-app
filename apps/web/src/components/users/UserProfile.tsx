// Lucide icons (replacing MUI icons)
import {
  Edit,
  User as Person,
  Save,
} from 'lucide-react';

// shadcn/ui components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState } from 'react';

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
          firstName: response.user.firstName as string,
          lastName: response.user.lastName as string,
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
          signatureTemplate: response.user.signatureTemplate as string,
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            👤 Môj Profil
          </DialogTitle>
          <DialogDescription>
            Spravujte svoje osobné údaje a nastavenia účtu
          </DialogDescription>
        </DialogHeader>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Person className="h-5 w-5" />
              Osobné údaje
            </CardTitle>
          </CardHeader>
          <CardContent>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Label htmlFor="firstName">Meno</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange('firstName', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Vaše meno sa použije v protokoloch
                </p>
              </div>
              <div className="flex-1">
                <Label htmlFor="lastName">Priezvisko</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange('lastName', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Vaše priezvisko sa použije v protokoloch
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Ukladám...' : 'Uložiť profil'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Môj podpis
            </CardTitle>
          </CardHeader>
          <CardContent>

            <p className="text-sm text-muted-foreground mb-4">
              Váš podpis sa automaticky použije pri vytváraní protokolov ako
              zamestnanec.
            </p>

            {state.user?.signatureTemplate && (
              <div className="p-4 mb-4 text-center bg-card border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Aktuálny podpis:
                </p>
                <img
                  src={state.user.signatureTemplate}
                  alt="Aktuálny podpis"
                  className="max-w-full max-h-24 border border-border rounded"
                />
              </div>
            )}

            <Button
              variant="outline"
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
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Zavrieť
          </Button>
        </div>
      </DialogContent>

      {/* SignaturePad modal */}
      {showSignaturePad && (
        <Dialog open={showSignaturePad} onOpenChange={setShowSignaturePad}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Podpis</DialogTitle>
              <DialogDescription>
                Vytvorte svoj podpis pre protokoly
              </DialogDescription>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
