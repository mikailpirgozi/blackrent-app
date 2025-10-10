// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { getAPI_BASE_URL } from '../../services/api';

interface ChangePasswordFormProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordForm({
  open,
  onClose,
}: ChangePasswordFormProps) {
  const { state } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Prosím vyplňte všetky polia');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nové heslo a potvrdenie hesla sa nezhodujú');
      return;
    }

    if (newPassword.length < 6) {
      setError('Nové heslo musí mať aspoň 6 znakov');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/auth/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(data.message || 'Chyba pri zmene hesla');
      }
    } catch {
      setError('Chyba pri zmene hesla');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zmeniť heslo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>Heslo bolo úspešne zmenené</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="current-password">Aktuálne heslo</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nové heslo</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-sm text-muted-foreground">Minimálne 6 znakov</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potvrdiť nové heslo</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button onClick={handleClose} disabled={loading} variant="outline">
            Zrušiť
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Menenie...
              </>
            ) : (
              'Zmeniť heslo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
