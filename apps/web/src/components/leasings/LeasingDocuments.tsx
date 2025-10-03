/**
 * ===================================================================
 * LEASING DOCUMENTS - Správa dokumentov leasingu
 * ===================================================================
 */

import { Download, FileText, Image, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LeasingDocument } from '@/types/leasing-types';

interface LeasingDocumentsProps {
  leasingId: string;
  documents: LeasingDocument[];
}

export function LeasingDocuments({ documents }: LeasingDocumentsProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('sk-SK');

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="h-5 w-5" />;
      case 'contract':
      case 'payment_schedule':
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'contract':
        return 'Zmluva';
      case 'payment_schedule':
        return 'Splátkový kalendár';
      case 'photo':
        return 'Fotka';
      default:
        return 'Iný dokument';
    }
  };

  const photos = documents.filter(doc => doc.type === 'photo');
  const otherDocs = documents.filter(doc => doc.type !== 'photo');

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <Card>
        <CardContent className="p-4">
          <Button className="w-full" variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Nahrať dokument
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Zmluvy, splátkové kalendáre, fotky vozidla
          </p>
        </CardContent>
      </Card>

      {/* Documents List */}
      {otherDocs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Dokumenty</h3>
          <div className="space-y-2">
            {otherDocs.map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded">
                      {getIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.fileName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(doc.type)}
                        </Badge>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Fotky vozidla ({photos.length})
            </h3>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Stiahnuť ZIP
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(0, 6).map(photo => (
              <div
                key={photo.id}
                className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(photo.fileUrl, '_blank')}
              >
                <img
                  src={photo.fileUrl}
                  alt={photo.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {photos.length > 6 && (
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                +{photos.length - 6} ďalších
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Žiadne dokumenty</p>
              <p className="text-xs text-muted-foreground">
                Nahraj zmluvy, kalendáre alebo fotky
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
