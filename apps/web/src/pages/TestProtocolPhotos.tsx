/**
 * Test Page pre Perfect Protocols V1
 *
 * Jednoduchá stránka pre testovanie nového photo systému
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';
import { ModernPhotoCapture } from '@/components/common/ModernPhotoCapture';
import { ProtocolGallery } from '@/components/common/ProtocolGallery';
import { generateProtocolPDFQuick } from '@/utils/protocolPhotoWorkflow';
import { SessionStorageManager } from '@/utils/sessionStorageManager';
import { perfMonitor } from '@/utils/performanceMonitor';
import type { ProtocolImage, HandoverProtocol } from '@/types';
import { logger } from '@/utils/logger';

export default function TestProtocolPhotos() {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [images, setImages] = useState<ProtocolImage[]>([]);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    photoCount: number;
    processingTime: number;
    uploadTime: number;
    pdfTime: number;
    totalTime: number;
  } | null>(null);

  const handlePhotoCaptureSuccess = (capturedImages: ProtocolImage[]) => {
    setImages(prev => [...prev, ...capturedImages]);
    setCaptureOpen(false);

    logger.info('Photos captured successfully', {
      count: capturedImages.length,
      totalImages: images.length + capturedImages.length,
    });
  };

  const handleGeneratePDF = async () => {
    if (images.length === 0) {
      alert('Najprv pridaj nejaké fotky!');
      return;
    }

    setPdfGenerating(true);

    try {
      // Create mock protocol s reálnymi dátami
      const mockProtocol: HandoverProtocol = {
        id: window.crypto.randomUUID(),
        type: 'handover',
        rentalId: 'test-rental-123',
        rental: {} as any,
        location: 'Košice',
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date(),
        vehicleCondition: {
          odometer: 555,
          fuelLevel: 100,
          fuelType: 'gasoline',
          exteriorCondition: 'Dobrý',
          interiorCondition: 'Dobrý',
        },
        vehicleImages: images,
        documentImages: [],
        damageImages: [],
        vehicleVideos: [],
        documentVideos: [],
        damageVideos: [],
        damages: [],
        signatures: [],
        rentalData: {
          orderNumber: '123',
          vehicle: {
            id: 'vehicle-c95246',
            brand: 'BMW',
            model: 'X5 - záložená',
            licensePlate: 'C95246',
          } as any,
          customer: {
            id: 'customer-mikail',
            name: 'Mikail Pirgozi',
            email: 'mikail@blackrent.sk',
            phone: '+421900123456',
          } as any,
          startDate: new Date('2025-10-21'),
          endDate: new Date('2025-10-30'),
          totalPrice: 600,
          deposit: 130,
          currency: 'EUR',
        },
        createdBy: 'admin',
        notes: 'Testovací protokol - Perfect V1 System',
      };

      logger.info('Generating PDF...', { imageCount: images.length });

      const startTime = performance.now();
      const result = await generateProtocolPDFQuick(mockProtocol);
      const totalTime = performance.now() - startTime;

      setPdfUrl(result.pdfUrl);

      // Get performance metrics
      const metrics = perfMonitor.getMetrics();
      logger.info('Performance metrics:', metrics);

      setTestResults({
        photoCount: images.length,
        processingTime: metrics['photo-processing']?.avg || 0,
        uploadTime: metrics['photo-upload']?.avg || 0,
        pdfTime: result.generationTime,
        totalTime,
      });

      alert(
        `✅ PDF vygenerované úspešne!\nČas: ${(totalTime / 1000).toFixed(2)}s`
      );
    } catch (error) {
      logger.error('PDF generation failed', { error });
      alert(
        `❌ Chyba pri generovaní PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleClearAll = () => {
    setImages([]);
    setPdfUrl(null);
    setTestResults(null);
    SessionStorageManager.clearPDFImages();
    perfMonitor.reset();
    logger.info('Test cleared');
  };

  const sessionStats = SessionStorageManager.getStats();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">
          🧪 Perfect Protocols V1 - Test Page
        </h1>
        <p className="text-muted-foreground">
          Testovacia stránka pre nový ultra-rýchly photo systém
        </p>
      </div>

      {/* Test Results */}
      {testResults && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            <div className="font-bold mb-2">✅ Test Results:</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="font-semibold">Fotky</div>
                <div>{testResults.photoCount}</div>
              </div>
              <div>
                <div className="font-semibold">Processing</div>
                <div>{(testResults.processingTime / 1000).toFixed(2)}s</div>
              </div>
              <div>
                <div className="font-semibold">Upload</div>
                <div>{(testResults.uploadTime / 1000).toFixed(2)}s</div>
              </div>
              <div>
                <div className="font-semibold">PDF</div>
                <div>{(testResults.pdfTime / 1000).toFixed(2)}s</div>
              </div>
              <div>
                <div className="font-semibold">Total</div>
                <div className="text-lg font-bold">
                  {(testResults.totalTime / 1000).toFixed(2)}s
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Images Count */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nahraté fotky</p>
                <p className="text-3xl font-bold text-white">{images.length}</p>
              </div>
              <Camera className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* SessionStorage */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SessionStorage</p>
                <p className="text-xl font-bold text-white">
                  {sessionStats.usedFormatted}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sessionStats.imageCount} JPEG fotiek
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant={
                    sessionStats.percentUsed > 80 ? 'destructive' : 'default'
                  }
                >
                  {sessionStats.percentUsed.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">PDF Status</p>
                <p className="text-xl font-bold text-white">
                  {pdfUrl ? (
                    <span className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-gray-400">
                      <XCircle className="h-5 w-5" />
                      Not generated
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Button onClick={() => setCaptureOpen(true)} size="lg" className="h-20">
          <Camera className="mr-2 h-6 w-6" />
          Pridať fotky
        </Button>

        <Button
          onClick={() => setGalleryOpen(true)}
          disabled={images.length === 0}
          size="lg"
          className="h-20"
          variant="outline"
        >
          <Eye className="mr-2 h-6 w-6" />
          Zobraziť galériu ({images.length})
        </Button>

        <Button
          onClick={handleGeneratePDF}
          disabled={images.length === 0 || pdfGenerating}
          size="lg"
          className="h-20"
          variant="default"
        >
          {pdfGenerating ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Generujem PDF...
            </>
          ) : (
            <>📄 Generovať PDF</>
          )}
        </Button>

        <Button
          onClick={handleClearAll}
          disabled={images.length === 0}
          size="lg"
          className="h-20"
          variant="destructive"
        >
          <Trash2 className="mr-2 h-6 w-6" />
          Vyčistiť všetko
        </Button>
      </div>

      {/* PDF Download */}
      {pdfUrl && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                ✅ PDF je pripravené na stiahnutie
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                📥 Stiahnuť PDF
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Nahraté fotografie ({images.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image, idx) => (
                <div
                  key={`${image.id || idx}-preview`}
                  className="relative group rounded-lg overflow-hidden border cursor-pointer"
                  onClick={() => {
                    setGalleryOpen(true);
                  }}
                >
                  <img
                    src={image.originalUrl}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="text-white h-6 w-6" />
                  </div>
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-xs">
                      {idx + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            📋 Testovací Postup
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Klikni "Pridať fotky" a vyber fotky z galérie</li>
            <li>Počkaj kým sa uploadnú (sleduj progress)</li>
            <li>
              Skontroluj SessionStorage stats (malo by byť ~30KB × počet fotiek)
            </li>
            <li>Klikni "Generovať PDF" (malo trvať 1-2s)</li>
            <li>Stiahnuť PDF a overiť že obsahuje fotky</li>
            <li>Klikni "Zobraziť galériu" a testuj zoom/swipe</li>
            <li>Skontroluj performance metrics v konzole</li>
          </ol>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-2 text-white">
              🎯 Performance Targets:
            </p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• 1 fotka: &lt;3s</li>
              <li>• 10 fotiek: &lt;15s</li>
              <li>• 30 fotiek: &lt;45s</li>
              <li>• PDF generation: &lt;2s</li>
            </ul>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('=== PERFORMANCE METRICS ===');
                console.log(perfMonitor.getMetricsFormatted());
                console.log('=== SESSION STORAGE ===');
                console.log(SessionStorageManager.getStats());
                console.log('=== IMAGES ===');
                console.log(images);
              }}
            >
              📊 Zobraziť Debug Info v konzole
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modern Photo Capture Modal */}
      <ModernPhotoCapture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onSave={imgs => handlePhotoCaptureSuccess(imgs)}
        title="Test Photo Capture"
        entityId="test-protocol-123"
        mediaType="vehicle"
        maxImages={50}
      />

      {/* Protocol Gallery */}
      <ProtocolGallery
        images={images}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}
