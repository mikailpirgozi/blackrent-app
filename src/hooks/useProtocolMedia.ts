import { useState, useEffect } from 'react';

import { ProtocolImage, ProtocolVideo } from '../types';

interface UseProtocolMediaProps {
  protocolId: string;
  protocolType: 'handover' | 'return';
  initialMedia?: {
    images: ProtocolImage[];
    videos: ProtocolVideo[];
  };
}

interface UseProtocolMediaReturn {
  media: {
    images: ProtocolImage[];
    videos: ProtocolVideo[];
  };
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useProtocolMedia = ({
  protocolId,
  protocolType,
  initialMedia,
}: UseProtocolMediaProps): UseProtocolMediaReturn => {
  const [media, setMedia] = useState({
    images: initialMedia?.images || [],
    videos: initialMedia?.videos || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMedia = async () => {
    if (!protocolId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📥 Loading media for protocol:', protocolId, protocolType);

      const apiBaseUrl =
        import.meta.env.VITE_API_URL ||
        'https://blackrent-app-production-4d6f.up.railway.app/api';
      const response = await fetch(
        `${apiBaseUrl}/protocols/media/${protocolId}?type=${protocolType}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load media: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ Media loaded successfully:', {
          images: data.images?.length || 0,
          videos: data.videos?.length || 0,
        });

        setMedia({
          images: data.images || [],
          videos: data.videos || [],
        });
      } else {
        throw new Error(data.error || 'Failed to load media');
      }
    } catch (error) {
      console.error('❌ Error loading protocol media:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [protocolId, protocolType]);

  return {
    media,
    loading,
    error,
    reload: loadMedia,
  };
};
