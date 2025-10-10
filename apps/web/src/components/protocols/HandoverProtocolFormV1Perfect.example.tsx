/**
 * HandoverProtocolForm V1 Perfect - Integration Example
 * 
 * Tento súbor ukazuje ako integrovať nový photo systém do existujúceho formulára.
 * 
 * KROK 1: Nahradiť SerialPhotoCapture za ModernPhotoCapture
 * KROK 2: Použiť generateProtocolPDFQuick() namiesto starého PDF generátora
 * KROK 3: Po PDF generovaní vyčistiť SessionStorage
 */

import React, { useCallback, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ModernPhotoCapture } from '../common/ModernPhotoCapture';
import { ProtocolGallery } from '../common/ProtocolGallery';
import { generateProtocolPDFQuick } from '@/utils/protocolPhotoWorkflow';
import type {
  HandoverProtocol,
  ProtocolImage,
  ProtocolVideo,
  Rental,
} from '@/types';
import { logger } from '@/utils/logger';

interface Props {
  rental: Rental;
  onSave: (protocol: HandoverProtocol) => void;
  onClose: () => void;
}

export const HandoverProtocolFormV1Perfect: React.FC<Props> = ({
  rental,
  onSave,
  onClose,
}) => {
  // Photo capture state
  const [activePhotoCapture, setActivePhotoCapture] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    location: '',
    odometer: 0,
    fuelLevel: 100,
    vehicleImages: [] as ProtocolImage[],
    documentImages: [] as ProtocolImage[],
    damageImages: [] as ProtocolImage[],
    vehicleVideos: [] as ProtocolVideo[],
    documentVideos: [] as ProtocolVideo[],
    damageVideos: [] as ProtocolVideo[],
    signatures: [],
  });

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<ProtocolImage[]>([]);

  // Save state
  const [saving, setSaving] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  /**
   * KROK 1: Handler pre photo capture - používa ModernPhotoCapture
   */
  const handlePhotoCapture = useCallback((mediaType: string) => {
    setActivePhotoCapture(mediaType);
  }, []);

  /**
   * Handler pre photo capture success
   */
  const handlePhotoCaptureSuccess = useCallback(
    (mediaType: string, images: ProtocolImage[], videos: ProtocolVideo[]) => {
      setFormData((prev) => {
        const imagesKey = `${mediaType}Images` as 'vehicleImages' | 'documentImages' | 'damageImages';
        const videosKey = `${mediaType}Videos` as 'vehicleVideos' | 'documentVideos' | 'damageVideos';
        
        return {
          ...prev,
          [imagesKey]: [...(prev[imagesKey] || []), ...images],
          [videosKey]: [...(prev[videosKey] || []), ...videos],
        };
      });
      setActivePhotoCapture(null);

      logger.info('Photos captured', {
        mediaType,
        imageCount: images.length,
        videoCount: videos.length,
      });
    },
    []
  );

  /**
   * KROK 2: Uloženie protokolu s novým PDF generovaním
   */
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setPdfProgress('Ukladám protokol...');

      // Create protocol object
      const protocol: HandoverProtocol = {
        id: crypto.randomUUID(),
        rentalId: rental.id,
        rental,
        type: 'handover',
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date(),
        location: formData.location,
        vehicleCondition: {
          odometer: formData.odometer,
          fuelLevel: formData.fuelLevel,
          fuelType: 'gasoline',
          exteriorCondition: 'Dobrý',
          interiorCondition: 'Dobrý',
        },
        vehicleImages: formData.vehicleImages,
        vehicleVideos: formData.vehicleVideos,
        documentImages: formData.documentImages,
        documentVideos: formData.documentVideos,
        damageImages: formData.damageImages,
        damageVideos: formData.damageVideos,
        damages: [],
        signatures: formData.signatures,
        rentalData: {
          orderNumber: rental.orderNumber || '',
          vehicle: rental.vehicle!,
          customer: rental.customer!,
          startDate: rental.startDate as Date,
          endDate: rental.endDate as Date,
          totalPrice: rental.totalPrice,
          deposit: rental.deposit || 0,
          currency: 'EUR',
        },
        createdBy: 'admin',
      };

      // KROK 2: Použiť nový PDF generator
      setPdfProgress('Generujem PDF (1-2s)...');
      const { pdfUrl, generationTime } = await generateProtocolPDFQuick(protocol);

      logger.info('PDF generated', { url: pdfUrl, time: generationTime });

      // Update protocol with PDF URL
      protocol.pdfUrl = pdfUrl;

      // KROK 3: SessionStorage sa automaticky vyčistil v generateProtocolPDFQuick()
      logger.debug('SessionStorage cleaned automatically');

      // Save protocol to DB
      onSave(protocol);

      logger.info('Protocol saved successfully', {
        protocolId: protocol.id,
        pdfUrl,
      });
    } catch (error) {
      logger.error('Protocol save failed', { error });
      alert(
        `Chyba pri ukladaní protokolu: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setSaving(false);
      setPdfProgress('');
    }
  }, [formData, rental, onSave]);

  /**
   * Open gallery
   */
  const handleOpenGallery = (images: ProtocolImage[]) => {
    setGalleryImages(images);
    setGalleryOpen(true);
  };

  return (
    <div className="p-6">
      {/* Saving Progress */}
      {saving && (
        <div className="mb-4">
          <Progress value={undefined} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{pdfProgress}</p>
        </div>
      )}

      {/* Basic Fields */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Základné informácie</h3>
        {/* ... existing form fields ... */}
      </div>

      {/* Photo Sections */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Fotodokumentácia</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vehicle Photos */}
          <div>
            <Button
              variant="outline"
              onClick={() => handlePhotoCapture('vehicle')}
              disabled={saving}
              className="w-full"
            >
              Fotky vozidla ({formData.vehicleImages.length})
            </Button>
            {formData.vehicleImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenGallery(formData.vehicleImages)}
                className="w-full mt-2"
              >
                Zobraziť galériu
              </Button>
            )}
          </div>

          {/* Document Photos */}
          <div>
            <Button
              variant="outline"
              onClick={() => handlePhotoCapture('document')}
              disabled={saving}
              className="w-full"
            >
              Dokumenty ({formData.documentImages.length})
            </Button>
            {formData.documentImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenGallery(formData.documentImages)}
                className="w-full mt-2"
              >
                Zobraziť galériu
              </Button>
            )}
          </div>

          {/* Damage Photos */}
          <div>
            <Button
              variant="outline"
              onClick={() => handlePhotoCapture('damage')}
              disabled={saving}
              className="w-full"
            >
              Poškodenia ({formData.damageImages.length})
            </Button>
            {formData.damageImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenGallery(formData.damageImages)}
                className="w-full mt-2"
              >
                Zobraziť galériu
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Zrušiť
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Ukladám...' : 'Uložiť protokol'}
        </Button>
      </div>

      {/* Modern Photo Capture Modal */}
      {activePhotoCapture && (
        <ModernPhotoCapture
          open={true}
          onClose={() => setActivePhotoCapture(null)}
          onSave={(images, videos) =>
            handlePhotoCaptureSuccess(activePhotoCapture, images, videos)
          }
          title={`Fotografie - ${activePhotoCapture}`}
          entityId={rental.id}
          mediaType={
            activePhotoCapture as 'vehicle' | 'document' | 'damage' | 'odometer' | 'fuel'
          }
        />
      )}

      {/* Protocol Gallery */}
      <ProtocolGallery
        images={galleryImages}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
};

