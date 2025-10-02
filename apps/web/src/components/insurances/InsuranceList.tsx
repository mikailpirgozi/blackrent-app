import {
  Shield as SecurityIcon,
  AlertTriangle as WarningIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import InsuranceClaimList from './InsuranceClaimList';
import VehicleCentricInsuranceList from './VehicleCentricInsuranceList';

// Custom useMediaQuery hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export default function InsuranceList() {
  const [activeTab, setActiveTab] = useState('documents');
  const isMobile = useMediaQuery('(max-width: 768px)');
  // const isTablet = useMediaQuery('(max-width: 1024px)'); // TODO: Implement tablet-specific layout

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Responsive Tab Navigation */}
        <TabsList className={`grid w-full grid-cols-2 border-b border-border mb-2 md:mb-6 bg-background ${isMobile ? 'h-auto' : 'h-14'}`}>
          <TabsTrigger 
            value="documents" 
            className={`${isMobile ? 'flex-col gap-1 py-3' : 'flex-row gap-2 py-3'} font-semibold text-sm md:text-base`}
          >
            <SecurityIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            {isMobile ? 'Dokumenty' : 'Poistky & Dokumenty'}
          </TabsTrigger>
          <TabsTrigger 
            value="claims" 
            className={`${isMobile ? 'flex-col gap-1 py-3' : 'flex-row gap-2 py-3'} font-semibold text-sm md:text-base`}
          >
            <WarningIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            {isMobile ? 'Udalosti' : 'Poistné udalosti'}
          </TabsTrigger>
        </TabsList>

        {/* Responsive Tab Content */}
        <TabsContent 
          value="documents" 
          className="w-full min-h-[calc(100vh-200px)] overflow-hidden mt-0"
        >
          <VehicleCentricInsuranceList />
        </TabsContent>
        
        <TabsContent 
          value="claims" 
          className="w-full min-h-[calc(100vh-200px)] overflow-hidden mt-0"
        >
          <InsuranceClaimList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
