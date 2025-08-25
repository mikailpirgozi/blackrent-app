// 🔍 DEBUG: Null Children Detector
// Dočasný komponent na identifikáciu null children problémov

import React from 'react';

interface NullChildrenDetectorProps {
  children: React.ReactNode;
  componentName?: string;
}

export const NullChildrenDetector: React.FC<NullChildrenDetectorProps> = ({ 
  children, 
  componentName = 'Unknown' 
}) => {
  // Debug log pre null children
  if (children === null) {
    console.error(`🚨 NULL CHILDREN DETECTED in ${componentName}:`, children);
    console.trace('Stack trace:');
    return <div style={{ color: 'red', padding: '10px', border: '2px solid red' }}>
      ⚠️ NULL CHILDREN in {componentName}
    </div>;
  }

  if (children === undefined) {
    console.warn(`⚠️ UNDEFINED CHILDREN in ${componentName}:`, children);
    return <div style={{ color: 'orange', padding: '10px', border: '2px solid orange' }}>
      ⚠️ UNDEFINED CHILDREN in {componentName}
    </div>;
  }

  // Ak je všetko OK, vráť children
  return <>{children}</>;
};

export default NullChildrenDetector;
