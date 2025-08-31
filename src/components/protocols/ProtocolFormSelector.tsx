/**
 * ProtocolFormSelector - Inteligentný selector pre V1/V2 protokoly
 *
 * KONCEPT:
 * - Automaticky rozhoduje či použiť V1 Enhanced alebo V2 formulár
 * - Zachováva V1 UI/UX ale s V2 backend výhodami
 * - Umožňuje postupný prechod na V2 bez prerušenia workflow
 */

import { Box, CircularProgress } from '@mui/material';
import React from 'react';
import { featureManager } from '../../config/featureFlags';
import type { HandoverProtocol, Rental, ReturnProtocol } from '../../types';

// 🚀 LAZY LOADING: Všetky komponenty sa načítavajú len keď sú potrebné
const HandoverProtocolFormV1Enhanced = React.lazy(
  () => import('./HandoverProtocolFormV1Enhanced')
);
const ReturnProtocolFormV1Enhanced = React.lazy(
  () => import('./ReturnProtocolFormV1Enhanced')
);

const HandoverProtocolFormV2 = React.lazy(
  () => import('./v2/HandoverProtocolFormV2Wrapper')
);
const ReturnProtocolFormV2 = React.lazy(
  () => import('./v2/ReturnProtocolFormV2Wrapper')
);

const HandoverProtocolForm = React.lazy(() => import('./HandoverProtocolForm'));
const ReturnProtocolForm = React.lazy(() => import('./ReturnProtocolForm'));

/**
 * 🔄 Loading Fallback Component
 */
const LoadingFallback: React.FC = () => (
  <Box display="flex" alignItems="center" justifyContent="center" p={4}>
    <CircularProgress />
    <Box ml={2}>Načítavam protokol...</Box>
  </Box>
);

interface HandoverProtocolSelectorProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
}

interface ReturnProtocolSelectorProps {
  open: boolean;
  onClose: () => void;
  rental: Rental;
  handoverProtocol: HandoverProtocol;
  onSave: (protocol: ReturnProtocol) => void;
}

/**
 * 🎯 HANDOVER PROTOCOL SELECTOR
 */
export const HandoverProtocolSelector: React.FC<
  HandoverProtocolSelectorProps
> = props => {
  // 🚀 Feature flags pre rozhodovanie
  const isV2Enabled = featureManager.isEnabled('PROTOCOL_V2_ENABLED');
  const useV1UI = featureManager.isEnabled('PROTOCOL_V1_UI_PREFERRED') || true; // Default: V1 UI
  const useV2Backend =
    featureManager.isEnabled('PROTOCOL_V2_BACKEND_ENABLED') || isV2Enabled;

  // 🎯 ROZHODOVACIA LOGIKA
  if (isV2Enabled && !useV1UI) {
    // Čistý V2: Nový UI + V2 Backend
    console.log('🚀 Using V2 Protocol (New UI + V2 Backend)');
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <HandoverProtocolFormV2 {...props} />
      </React.Suspense>
    );
  }

  if (useV2Backend || isV2Enabled) {
    // V1 Enhanced: V1 UI + V2 Backend (ODPORÚČANÉ)
    console.log('🎯 Using V1 Enhanced Protocol (V1 UI + V2 Backend)');
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <HandoverProtocolFormV1Enhanced {...props} />
      </React.Suspense>
    );
  }

  // Fallback: Pôvodný V1
  console.log('⚠️ Using Original V1 Protocol (Fallback)');
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <HandoverProtocolForm {...props} />
    </React.Suspense>
  );
};

/**
 * 🎯 RETURN PROTOCOL SELECTOR
 */
export const ReturnProtocolSelector: React.FC<
  ReturnProtocolSelectorProps
> = props => {
  // 🚀 Feature flags pre rozhodovanie
  const isV2Enabled = featureManager.isEnabled('PROTOCOL_V2_ENABLED');
  const useV1UI = featureManager.isEnabled('PROTOCOL_V1_UI_PREFERRED') || true; // Default: V1 UI
  const useV2Backend =
    featureManager.isEnabled('PROTOCOL_V2_BACKEND_ENABLED') || isV2Enabled;

  // 🎯 ROZHODOVACIA LOGIKA
  if (isV2Enabled && !useV1UI) {
    // Čistý V2: Nový UI + V2 Backend
    console.log('🚀 Using V2 Return Protocol (New UI + V2 Backend)');
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <ReturnProtocolFormV2 {...props} />
      </React.Suspense>
    );
  }

  if (useV2Backend || isV2Enabled) {
    // V1 Enhanced: V1 UI + V2 Backend (ODPORÚČANÉ)
    console.log('🎯 Using V1 Enhanced Return Protocol (V1 UI + V2 Backend)');
    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <ReturnProtocolFormV1Enhanced {...props} />
      </React.Suspense>
    );
  }

  // Fallback: Pôvodný V1
  console.log('⚠️ Using Original V1 Return Protocol (Fallback)');
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <ReturnProtocolForm {...props} />
    </React.Suspense>
  );
};

/**
 * 🔧 HELPER FUNCTIONS
 */
export const getProtocolVersion = (): 'v1' | 'v1-enhanced' | 'v2' => {
  const isV2Enabled = featureManager.isEnabled('PROTOCOL_V2_ENABLED');
  const useV1UI = featureManager.isEnabled('PROTOCOL_V1_UI_PREFERRED') || true;
  const useV2Backend =
    featureManager.isEnabled('PROTOCOL_V2_BACKEND_ENABLED') || isV2Enabled;

  if (isV2Enabled && !useV1UI) return 'v2';
  if (useV2Backend || isV2Enabled) return 'v1-enhanced';
  return 'v1';
};

export const getProtocolFeatures = () => {
  const version = getProtocolVersion();

  return {
    version,
    hasV2Backend: version === 'v1-enhanced' || version === 'v2',
    hasV1UI: version === 'v1' || version === 'v1-enhanced',
    hasSmartCaching: version === 'v1-enhanced' || version === 'v2',
    hasEmailStatus: version === 'v1-enhanced' || version === 'v2',
    hasPerformanceMonitoring: version === 'v1-enhanced' || version === 'v2',
    hasPhotoCategories: version === 'v1-enhanced' || version === 'v2',
  };
};

// Default exports pre jednoduchšie importovanie
export default {
  HandoverProtocol: HandoverProtocolSelector,
  ReturnProtocol: ReturnProtocolSelector,
  getVersion: getProtocolVersion,
  getFeatures: getProtocolFeatures,
};
