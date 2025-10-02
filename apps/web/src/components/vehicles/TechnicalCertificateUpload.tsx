import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as DocumentIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import type { VehicleDocument } from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import R2FileUpload from '../common/R2FileUpload';

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

      console.log('📄 Loading technical certificates for vehicle:', vehicleId);

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
    console.log('📄 Technical certificates uploaded successfully:', fileData);

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

      console.log('📄 Saving technical certificates:', {
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
        console.log('✅ All technical certificates saved successfully');
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
        console.log('✅ Technical certificate deleted successfully');
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
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <DocumentIcon sx={{ color: '#1976d2' }} />
            Technický preukaz
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setUploadDialogOpen(true)}
            size="small"
            sx={{ borderRadius: 2 }}
          >
            Nahrať TP
          </Button>
        </Box>

        {loading ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 2 }}
          >
            Načítavam technické preukazy...
          </Typography>
        ) : documents.length > 0 ? (
          <List dense>
            {documents.map(doc => (
              <ListItem key={doc.id} divider>
                <ListItemText
                  primary={doc.documentNumber || 'Technický preukaz'}
                  secondary={
                    <Box>
                      {doc.notes && (
                        <Typography variant="caption" color="text.secondary">
                          {doc.notes}
                        </Typography>
                      )}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Nahraný:{' '}
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString('sk-SK')
                          : 'Neznámy dátum'}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => window.open(doc.filePath, '_blank')}
                    title="Zobraziť technický preukaz"
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteTechnicalCertificate(doc.id)}
                    title="Zmazať technický preukaz"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 2 }}
          >
            Žiadny technický preukaz nahraný
          </Typography>
        )}

        {/* UPLOAD DIALOG */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            📄 Nahrať technický preukaz pre {vehicleName}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Názov dokumentu"
                value={uploadData.documentName}
                onChange={e =>
                  setUploadData(prev => ({
                    ...prev,
                    documentName: e.target.value,
                  }))
                }
                size="small"
                required
                placeholder="napr. Technický preukaz 2024"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Poznámky (nepovinné)"
                value={uploadData.notes}
                onChange={e =>
                  setUploadData(prev => ({ ...prev, notes: e.target.value }))
                }
                size="small"
                multiline
                rows={2}
                placeholder="Dodatočné informácie..."
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" sx={{ mb: 1 }}>
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
                <Alert severity="success" sx={{ mt: 1 }}>
                  ✅ {uploadedFiles.length} súborov úspešne nahraných a
                  pripravených na uloženie
                  <Box sx={{ mt: 1 }}>
                    {uploadedFiles.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.filename}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                        onDelete={() =>
                          setUploadedFiles(prev =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                      />
                    ))}
                  </Box>
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadedFiles([]);
                setUploadData({ documentName: '', notes: '' });
              }}
            >
              Zrušiť
            </Button>
            <Button
              variant="contained"
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
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
