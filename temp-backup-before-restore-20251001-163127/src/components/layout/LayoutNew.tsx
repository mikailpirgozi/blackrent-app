import React, { useState } from 'react';
import { useMediaQuery } from '../../hooks/use-media-query';
import { cn } from '../../lib/utils';

import Header from './Header';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import ChangePasswordForm from '../auth/ChangePasswordForm';
import UserProfile from '../users/UserProfile';
import { EnhancedErrorToast } from '../common/EnhancedErrorToast';
import { SuccessToast } from '../common/SuccessToast';
import MobileDebugPanel from '../common/MobileDebugPanel';

import type { EnhancedError } from '../../utils/errorHandling';

interface LayoutProps {
  children: React.ReactNode;
}

export default function LayoutNew({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // Error handling state
  const [currentError, setCurrentError] = useState<EnhancedError | null>(null);
  
  // Success feedback state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successStats, setSuccessStats] = useState<
    { count?: number; duration?: number } | undefined
  >(undefined);

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Error handling functions
  const handleErrorClose = () => {
    setCurrentError(null);
  };

  const handleErrorRetry = async () => {
    console.log('🔄 Retry requested from ErrorToast');
  };

  // Success handling functions
  const handleSuccessClose = () => {
    setSuccessMessage(null);
    setSuccessStats(undefined);
  };

  const handlePasswordChange = () => {
    setPasswordDialogOpen(true);
  };

  const handleProfileOpen = () => {
    setProfileDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Mobile Sidebar - controlled by Header */}
      <MobileSidebar 
        open={mobileOpen} 
        onOpenChange={setMobileOpen}
      />

      {/* Header */}
      <Header
        onMenuToggle={() => setMobileOpen(true)}
        isMobile={isMobile}
        onPasswordChange={handlePasswordChange}
        onProfileOpen={handleProfileOpen}
      />

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col",
        !isMobile && "lg:pl-72"
      )}>
        {/* Content Area */}
        <div className="flex-1 pt-16">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="custom-font-app protocol-custom-font">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <ChangePasswordForm
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />

      <UserProfile
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />

      {/* Global Error Toast */}
      <EnhancedErrorToast
        error={currentError}
        context={{ location: 'global' }}
        onClose={handleErrorClose}
        onRetry={handleErrorRetry}
        position="top"
      />

      {/* Global Success Toast */}
      <SuccessToast
        message={successMessage}
        showStats={successStats}
        onClose={handleSuccessClose}
      />

      {/* Mobile Debug Panel */}
      {isMobile && <MobileDebugPanel />}
    </div>
  );
}
