import {
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  FileText as DocumentIcon,
  Eye as ViewIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Typography,
} from '../ui';
import { useCallback, useEffect, useState } from 'react';

import type { VehicleDocument } from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import R2FileUpload from '../common/R2FileUpload';
import { logger } from '@/utils/smartLogger';

interface TechnicalCertificateUploadProps {
  vehicleId: string;
  vehicleName: string; // brand + model + licensePlate
}

interface UploadData {
  documentName: string;
  notes: string;
}

export default function TechnicalCertificateUpload({
  vehicleId,
  vehicleName,
}: TechnicalCertificateUploadProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState<UploadData>({
    documentName: '',
    notes: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; key: string; filename: string }>
  >([]);

  // Načítanie technických preukazov
  const loadTechnicalCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      logger.debug('📄 Loading technical certificates for vehicle:', vehicleId);

      const response = await fetch(
        `${getApiBaseUrl()}/vehicle-documents?vehicleId=${vehicleId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        // Filtrovať len technické preukazy
        const technicalCerts = result.data.filter(
          (doc: VehicleDocument) => doc.documentType === 'technical_certificate'
        );
        setDocuments(technicalCerts);
      } else {
        console.error('Error loading technical certificates:', result.error);
      }
    } catch (error) {
      console.error('Error loading technical certificates:', error);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    loadTechnicalCertificates();
  }, [vehicleId, loadTechnicalCertificates]);

  // Upload súborov
  const handleFileUploadSuccess = (
    fileData:
      | { url: string; key: string; filename: string }
      | { url: string; key: string; filename: string }[]
  ) => {
    logger.debug('📄 Technical certificates uploaded successfully:', fileData);

    if (Array.isArray(fileData)) {
      setUploadedFiles(prev => [...prev, ...fileData]);
    } else {
      setUploadedFiles(prev => [...prev, fileData]);
    }
  };

  // Uloženie technických preukazov
  const handleSaveTechnicalCertificates = async () => {
    if (uploadedFiles.length === 0 || !uploadData.documentName.trim()) {
      alert('Nahrajte súbory a zadajte názov dokumentu');
      return;
    }

    try {
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      logger.debug('📄 Saving technical certificates:', {
        vehicleId,
        documentName: uploadData.documentName,
        fileCount: uploadedFiles.length,
        hasToken: !!token,
      });

      // Uložíme každý súbor osobne
      const savePromises = uploadedFiles.map(async (file, index) => {
        const documentName =
          uploadedFiles.length > 1
            ? `${uploadData.documentName} (${index + 1})`
            : uploadData.documentName;

        const response = await fetch(`${getApiBaseUrl()}/vehicle-documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            vehicleId,
            documentType: 'technical_certificate',
            validTo: new Date(
              Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // 10 rokov platnosť
            documentNumber: documentName,
            notes: uploadData.notes,
            filePath: file.url,
          }),
        });

        return response.json();
      });

      const results = await Promise.all(savePromises);
      const successfulSaves = results.filter(result => result.success);

      if (successfulSaves.length === uploadedFiles.length) {
        logger.debug('✅ All technical certificates saved successfully');
        setUploadDialogOpen(false);
        setUploadData({ documentName: '', notes: '' });
        setUploadedFiles([]);
        loadTechnicalCertificates();
      } else {
        console.error('Some technical certificates failed to save');
        alert(
          `Uložených ${successfulSaves.length}/${uploadedFiles.length} súborov`
        );
      }
    } catch (error) {
      console.error('Error saving technical certificates:', error);
      alert('Chyba pri ukladaní technických preukazov');
    }
  };

  // Zmazanie technického preukazu
  const handleDeleteTechnicalCertificate = async (documentId: string) => {
    if (!window.confirm('Naozaj chcete vymazať tento technický preukaz?'))
      return;

    try {
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      const response = await fetch(
        `${getApiBaseUrl()}/vehicle-documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        logger.debug('✅ Technical certificate deleted successfully');
        loadTechnicalCertificates();
      } else {
        console.error('Error deleting technical certificate:', result.error);
        alert(`Chyba pri mazaní: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting technical certificate:', error);
      alert('Chyba pri mazaní technického preukazu');
    }
  };

  return (
    <Card className="mt-2">
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <Typography variant="h6" className="flex items-center gap-2">
            <DocumentIcon className="h-5 w-5 text-blue-600" />
            Technický preukaz
          </Typography>
          <Button
            type="button"
            variant="outline"
            onClick={() => setUploadDialogOpen(true)}
            size="sm"
            className="rounded-lg"
          >
            <AddIcon className="h-4 w-4 mr-2" />
            Nahrať TP
          </Button>
        </div>

        {loading ? (
          <Typography
            variant="body2"
            className="text-center py-2 text-muted-foreground"
          >
            Načítavam technické preukazy...
          </Typography>
        ) : documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <Typography variant="body1" className="font-medium">
                    {doc.documentNumber || 'Technický preukaz'}
                  </Typography>
                  <div className="mt-1">
                    {doc.notes && (
                      <Typography
                        variant="caption"
                        className="text-muted-foreground"
                      >
                        {doc.notes}
                      </Typography>
                    )}
                    <br />
                    <Typography
                      variant="caption"
                      className="text-muted-foreground"
                    >
                      Nahraný:{' '}
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString('sk-SK')
                        : 'Neznámy dátum'}
                    </Typography>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.filePath, '_blank')}
                    title="Zobraziť technický preukaz"
                  >
                    <ViewIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTechnicalCertificate(doc.id)}
                    title="Zmazať technický preukaz"
                    className="text-destructive hover:text-destructive"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Typography
            variant="body2"
            className="text-center py-2 text-muted-foreground"
          >
            Žiadny technický preukaz nahraný
          </Typography>
        )}

        {/* UPLOAD DIALOG */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                📄 Nahrať technický preukaz pre {vehicleName}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="documentName">Názov dokumentu</Label>
                <Input
                  id="documentName"
                  value={uploadData.documentName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUploadData(prev => ({
                      ...prev,
                      documentName: e.target.value,
                    }))
                  }
                  placeholder="napr. Technický preukaz 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes">Poznámky (nepovinné)</Label>
                <Input
                  id="notes"
                  value={uploadData.notes}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUploadData(prev => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Dodatočné informácie..."
                />
              </div>

              <Typography variant="body2" className="mb-2">
                Nahrať technický preukaz:
              </Typography>

              <R2FileUpload
                type="vehicle"
                entityId={vehicleId}
                mediaType="technical-certificate"
                onUploadSuccess={handleFileUploadSuccess}
                onUploadError={error => console.error('Upload error:', error)}
                acceptedTypes={[
                  'application/pdf',
                  'image/jpeg',
                  'image/png',
                  'image/webp',
                ]}
                maxSize={50}
                multiple={true}
                label="Vybrať súbory (PDF, obrázky)"
              />

              {uploadedFiles.length > 0 && (
                <Alert className="mt-2">
                  <AlertDescription>
                    ✅ {uploadedFiles.length} súborov úspešne nahraných a
                    pripravených na uloženie
                    <div className="mt-2 flex flex-wrap gap-2">
                      {uploadedFiles.map((file, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="px-2 py-1"
                        >
                          {file.filename}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setUploadedFiles(prev =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="ml-2 h-4 w-4 p-0"
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setUploadedFiles([]);
                  setUploadData({ documentName: '', notes: '' });
                }}
              >
                Zrušiť
              </Button>
              <Button
                onClick={handleSaveTechnicalCertificates}
                disabled={
                  uploadedFiles.length === 0 || !uploadData.documentName.trim()
                }
              >
                💾 Uložiť{' '}
                {uploadedFiles.length > 1
                  ? `${uploadedFiles.length} súborov`
                  : 'technický preukaz'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
