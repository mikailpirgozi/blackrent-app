import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { ProcessedImage } from '../../utils/imageProcessor';

interface ProtocolDetailViewerProps {
  protocolId: string;
  onClose?: () => void;
}

interface ProtocolData {
  id: string;
  type: 'handover' | 'return';
  rental: any;
  location: string;
  vehicleCondition: any;
  vehicleImages: ProcessedImage[];
  documentImages: ProcessedImage[];
  damageImages: ProcessedImage[];
  damages: any[];
  signatures: any[];
  notes: string;
  createdAt: Date;
  completedAt: Date;
  pdfUrl?: string;
}

export function ProtocolDetailViewer({ protocolId, onClose }: ProtocolDetailViewerProps) {
  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  useEffect(() => {
    loadProtocol();
  }, [protocolId]);

  const loadProtocol = async () => {
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
  };

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
        alert('Nepodarilo sa stiahnuť PDF');
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

  const handleViewOriginalImage = (image: ProcessedImage) => {
    window.open(image.original, '_blank');
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!protocol) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Protokol sa nenašiel
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Záhlavie */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" color="primary">
          {protocol.type === 'handover' ? 'Preberací' : 'Vratný'} Protokol
        </Typography>
        <Box>
          <IconButton 
            onClick={handleDownloadPDF}
            color="primary"
            title="Stiahnuť PDF"
          >
            <DownloadIcon />
          </IconButton>
          {onClose && (
            <IconButton onClick={onClose} color="secondary">
              <VisibilityIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Základné informácie */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Základné informácie
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>ID Protokolu:</strong> {protocol.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Dátum:</strong> {new Date(protocol.createdAt).toLocaleDateString('sk-SK')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Miesto:</strong> {protocol.location || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              <strong>Vozidlo:</strong> {protocol.rental?.vehicle?.brand} {protocol.rental?.vehicle?.model}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>ŠPZ:</strong> {protocol.rental?.vehicle?.licensePlate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Zákazník:</strong> {protocol.rental?.customer?.name}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Stav vozidla */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stav vozidla
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Chip 
              label={`${protocol.vehicleCondition?.odometer || 0} km`}
              icon={<DescriptionIcon />}
              color="primary"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Chip 
              label={`${protocol.vehicleCondition?.fuelLevel || 100}%`}
              icon={<ImageIcon />}
              color="secondary"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Chip 
              label={protocol.vehicleCondition?.fuelType || 'N/A'}
              color="info"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Chip 
              label={protocol.vehicleCondition?.condition || 'Výborný'}
              color="success"
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Obrázky vozidla */}
      {protocol.vehicleImages && protocol.vehicleImages.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Fotky vozidla ({protocol.vehicleImages.length})
          </Typography>
          <Grid container spacing={2}>
            {protocol.vehicleImages.map((image, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={image.thumbnail}
                    alt={`Fotka vozidla ${index + 1}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewOriginalImage(image)}
                  />
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {image.filename}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatFileSize(image.size)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Dokumenty */}
      {protocol.documentImages && protocol.documentImages.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dokumenty ({protocol.documentImages.length})
          </Typography>
          <Grid container spacing={2}>
            {protocol.documentImages.map((image, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="150"
                    image={image.thumbnail}
                    alt={`Dokument ${index + 1}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewOriginalImage(image)}
                  />
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {image.filename}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatFileSize(image.size)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Škody */}
      {protocol.damages && protocol.damages.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Škody a poškodenia ({protocol.damages.length})
          </Typography>
          {protocol.damages.map((damage, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="primary">
                Škoda {index + 1}
              </Typography>
              <Typography variant="body2">
                {damage.description || 'N/A'}
              </Typography>
              {damage.location && (
                <Typography variant="caption" color="text.secondary">
                  Lokalizácia: {damage.location}
                </Typography>
              )}
            </Box>
          ))}
        </Paper>
      )}

      {/* Poznámky */}
      {protocol.notes && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Poznámky
          </Typography>
          <Typography variant="body2">
            {protocol.notes}
          </Typography>
        </Paper>
      )}

      {/* Podpisy */}
      {protocol.signatures && protocol.signatures.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Podpisy ({protocol.signatures.length})
          </Typography>
          <Grid container spacing={2}>
            {protocol.signatures.map((signature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="100"
                    image={signature.signature || signature.url}
                    alt={`Podpis ${signature.signerName || index + 1}`}
                  />
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {signature.signerName || `Podpis ${index + 1}`}
                    </Typography>
                    {signature.signerRole && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {signature.signerRole}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default ProtocolDetailViewer; 