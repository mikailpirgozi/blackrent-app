import {
  FileText as DescriptionIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Eye as VisibilityIcon,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import { useCallback, useEffect, useState } from 'react';

import type { ProtocolImage } from '../../types';

interface ProtocolDetailViewerProps {
  protocolId: string;
  onClose?: () => void;
}

interface ProtocolData {
  id: string;
  type: 'handover' | 'return';
  rental: {
    vehicle?: {
      brand?: string;
      model?: string;
      licensePlate?: string;
    };
    customer?: {
      name?: string;
    };
  };
  location: string;
  vehicleCondition: {
    odometer?: number;
    fuelLevel?: number;
    fuelType?: string;
    condition?: string;
  };
  vehicleImages: ProtocolImage[];
  documentImages: ProtocolImage[];
  damageImages: ProtocolImage[];
  damages: Array<{
    description?: string;
    location?: string;
  }>;
  signatures: Array<{
    signature?: string;
    url?: string;
    signerName?: string;
    signerRole?: string;
  }>;
  notes: string;
  createdAt: Date;
  completedAt: Date;
  pdfUrl?: string;
}

export function ProtocolDetailViewer({
  protocolId,
  onClose,
}: ProtocolDetailViewerProps) {
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedImage, setSelectedImage] = useState<ProtocolImage | null>(
  //   null
  // ); // TODO: Implement image selection functionality

  const loadProtocol = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/protocols/${protocolId}`);
      if (!response.ok) {
        throw new Error('Protokol sa nenašiel');
      }

      const data = await response.json();
      setProtocol(data);
    } catch (error) {
      console.error('❌ Chyba pri načítaní protokolu:', error);
      setError(error instanceof Error ? error.message : 'Neznáma chyba');
    } finally {
      setLoading(false);
    }
  }, [protocolId]);

  useEffect(() => {
    loadProtocol();
  }, [loadProtocol]);

  const handleDownloadPDF = async () => {
    if (!protocol?.pdfUrl) {
      // Ak nemáme PDF URL, vygenerujeme nové PDF
      try {
        const response = await fetch(`/api/protocols/${protocolId}/pdf`);
        if (!response.ok) {
          throw new Error('Nepodarilo sa vygenerovať PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `protokol-${protocolId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('❌ Chyba pri sťahovaní PDF:', error);
        // 🔴 REMOVED: Alert notification that was causing UI issues
      }
    } else {
      // Stiahnutie existujúceho PDF
      const a = document.createElement('a');
      a.href = protocol.pdfUrl;
      a.download = `protokol-${protocolId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleViewOriginalImage = (image: ProtocolImage) => {
    window.open(image.url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!protocol) {
    return (
      <Alert className="m-4">
        <AlertDescription>Protokol sa nenašiel</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4">
      {/* Záhlavie */}
      <div className="mb-6 flex justify-between items-center">
        <Typography variant="h4" className="text-primary">
          {protocol.type === 'handover' ? 'Preberací' : 'Vratný'} Protokol
        </Typography>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            size="sm"
            title="Stiahnuť PDF"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            PDF
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              <VisibilityIcon className="w-4 h-4 mr-2" />
              Zavrieť
            </Button>
          )}
        </div>
      </div>

      {/* Základné informácie */}
      <Card className="p-4 mb-6">
        <Typography variant="h6" className="mb-4">
          Základné informácie
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Typography variant="body2" className="text-muted-foreground">
              <strong>ID Protokolu:</strong> {protocol.id}
            </Typography>
            <Typography variant="body2" className="text-muted-foreground">
              <strong>Dátum:</strong>{' '}
              {new Date(protocol.createdAt).toLocaleDateString('sk-SK')}
            </Typography>
            <Typography variant="body2" className="text-muted-foreground">
              <strong>Miesto:</strong> {protocol.location || 'N/A'}
            </Typography>
          </div>
          <div className="space-y-2">
            <Typography variant="body2" className="text-muted-foreground">
              <strong>Vozidlo:</strong>{' '}
              {protocol.rental?.vehicle?.brand || 'N/A'}{' '}
              {protocol.rental?.vehicle?.model || 'N/A'}
            </Typography>
            <Typography variant="body2" className="text-muted-foreground">
              <strong>ŠPZ:</strong>{' '}
              {protocol.rental?.vehicle?.licensePlate || 'N/A'}
            </Typography>
            <Typography variant="body2" className="text-muted-foreground">
              <strong>Zákazník:</strong>{' '}
              {protocol.rental?.customer?.name || 'N/A'}
            </Typography>
          </div>
        </div>
      </Card>

      {/* Stav vozidla */}
      <Card className="p-4 mb-6">
        <Typography variant="h6" className="mb-4">
          Stav vozidla
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Badge variant="outline" className="flex items-center gap-2 p-2">
            <DescriptionIcon className="w-4 h-4" />
            {protocol.vehicleCondition?.odometer || 0} km
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2 p-2">
            <ImageIcon className="w-4 h-4" />
            {protocol.vehicleCondition?.fuelLevel || 100}%
          </Badge>
          <Badge variant="outline" className="p-2">
            {protocol.vehicleCondition?.fuelType || 'N/A'}
          </Badge>
          <Badge variant="outline" className="p-2">
            {protocol.vehicleCondition?.condition || 'Výborný'}
          </Badge>
        </div>
      </Card>

      {/* Obrázky vozidla */}
      {protocol.vehicleImages && protocol.vehicleImages.length > 0 && (
        <Card className="p-4 mb-6">
          <Typography variant="h6" className="mb-4">
            Fotky vozidla ({protocol.vehicleImages.length})
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {protocol.vehicleImages.map((image, index) => (
              <Card key={index} className="overflow-hidden">
                <img
                  src={image.url}
                  alt={`Fotka vozidla ${index + 1}`}
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleViewOriginalImage(image)}
                />
                <CardContent className="p-2">
                  <Typography
                    variant="caption"
                    className="text-muted-foreground"
                  >
                    {image.type} -{' '}
                    {new Date(image.timestamp).toLocaleString('sk-SK')}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-muted-foreground block"
                  >
                    {image.originalSize
                      ? formatFileSize(image.originalSize)
                      : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Dokumenty */}
      {protocol.documentImages && protocol.documentImages.length > 0 && (
        <Card className="p-4 mb-6">
          <Typography variant="h6" className="mb-4">
            Dokumenty ({protocol.documentImages.length})
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {protocol.documentImages.map((image, index) => (
              <Card key={index} className="overflow-hidden">
                <img
                  src={image.url}
                  alt={`Dokument ${index + 1}`}
                  className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleViewOriginalImage(image)}
                />
                <CardContent className="p-2">
                  <Typography
                    variant="caption"
                    className="text-muted-foreground"
                  >
                    {image.type} -{' '}
                    {new Date(image.timestamp).toLocaleString('sk-SK')}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-muted-foreground block"
                  >
                    {image.originalSize
                      ? formatFileSize(image.originalSize)
                      : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Škody */}
      {protocol.damages && protocol.damages.length > 0 && (
        <Card className="p-4 mb-6">
          <Typography variant="h6" className="mb-4">
            Škody a poškodenia ({protocol.damages.length})
          </Typography>
          <div className="space-y-4">
            {protocol.damages.map((damage, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <Typography
                  variant="caption"
                  className="text-primary font-semibold"
                >
                  Škoda {index + 1}
                </Typography>
                <Typography variant="caption" className="mt-1">
                  {damage.description || 'N/A'}
                </Typography>
                {damage.location && (
                  <Typography
                    variant="caption"
                    className="text-muted-foreground mt-1"
                  >
                    Lokalizácia: {damage.location}
                  </Typography>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Poznámky */}
      {protocol.notes && (
        <Card className="p-4 mb-6">
          <Typography variant="h6" className="mb-4">
            Poznámky
          </Typography>
          <Typography variant="caption">{protocol.notes}</Typography>
        </Card>
      )}

      {/* Podpisy */}
      {protocol.signatures && protocol.signatures.length > 0 && (
        <Card className="p-4">
          <Typography variant="h6" className="mb-4">
            Podpisy ({protocol.signatures.length})
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {protocol.signatures.map((signature, index) => (
              <Card key={index} className="overflow-hidden">
                <img
                  src={(signature.signature || signature.url) as string}
                  alt={`Podpis ${signature.signerName || index + 1}`}
                  className="w-full h-24 object-contain"
                />
                <CardContent className="p-2">
                  <Typography
                    variant="caption"
                    className="text-muted-foreground"
                  >
                    {signature.signerName || `Podpis ${index + 1}`}
                  </Typography>
                  {signature.signerRole && (
                    <Typography
                      variant="caption"
                      className="text-muted-foreground block"
                    >
                      {signature.signerRole}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default ProtocolDetailViewer;
