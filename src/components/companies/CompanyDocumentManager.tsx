import {
  Add as AddIcon,
  Assignment as ContractIcon,
  Delete as DeleteIcon,
  // Download as DownloadIcon, // TODO: Implement download functionality
  ExpandMore as ExpandMoreIcon,
  // Description as DocumentIcon, // TODO: Implement document icons
  Receipt as InvoiceIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  // Divider, // TODO: Implement dividers
  Alert,
  Box,
  Button,
  Chip,
  // Card, // TODO: Implement card layout
  // CardContent, // TODO: Implement card content
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import type { CompanyDocument } from '../../types';
import { getApiBaseUrl } from '../../utils/apiUrl';
import BulkDownload from '../common/BulkDownload';
import R2FileUpload from '../common/R2FileUpload';

interface CompanyDocumentManagerProps {
  companyId: string | number;
  companyName: string;
}

interface DocumentUploadData {
  documentType: 'contract' | 'invoice';
  documentName: string;
  description: string;
  documentMonth?: number;
  documentYear?: number;
}

export default function CompanyDocumentManager({
  companyId,
  companyName,
}: CompanyDocumentManagerProps) {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState<DocumentUploadData>({
    documentType: 'contract',
    documentName: '',
    description: '',
    documentYear: new Date().getFullYear(),
    documentMonth: new Date().getMonth() + 1,
  });
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; key: string; filename: string }>
  >([]);

  // Načítanie dokumentov
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      console.log('📄 Loading documents for company:', companyId);
      console.log('📄 Using token:', token ? 'EXISTS' : 'MISSING');

      const response = await fetch(
        `${getApiBaseUrl()}/company-documents/${companyId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      console.log('📄 Response status:', response.status);

      const result = await response.json();
      console.log('📄 Response data:', result);
      console.log('📄 Documents array length:', result.data?.length);
      console.log('📄 First document:', result.data?.[0]);

      if (result.success) {
        setDocuments(result.data || []);
        console.log('📄 Documents set to state:', result.data?.length || 0);
      } else {
        console.error('Error loading documents:', result.error);
      }
    } catch (error) {
      console.error('Error loading company documents:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadDocuments();
  }, [companyId, loadDocuments]);

  // Upload súborov
  const handleFileUploadSuccess = (
    fileData:
      | { url: string; key: string; filename: string }
      | { url: string; key: string; filename: string }[]
  ) => {
    console.log('📄 Files uploaded successfully:', fileData);

    if (Array.isArray(fileData)) {
      setUploadedFiles(prev => [...prev, ...fileData]);
    } else {
      setUploadedFiles(prev => [...prev, fileData]);
    }
  };

  // Uloženie dokumentov
  const handleSaveDocuments = async () => {
    if (uploadedFiles.length === 0 || !uploadData.documentName.trim()) {
      alert('Nahrajte súbory a zadajte názov dokumentu');
      return;
    }

    try {
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      console.log('📄 Saving documents metadata:', {
        companyId,
        documentType: uploadData.documentType,
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

        const response = await fetch(
          `${getApiBaseUrl()}/company-documents/save-metadata`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              companyId:
                typeof companyId === 'string' ? parseInt(companyId) : companyId,
              documentType: uploadData.documentType,
              documentName: documentName,
              description: uploadData.description,
              documentMonth:
                uploadData.documentType === 'invoice'
                  ? uploadData.documentMonth
                  : null,
              documentYear:
                uploadData.documentType === 'invoice'
                  ? uploadData.documentYear
                  : null,
              filePath: file.url,
            }),
          }
        );

        return response.json();
      });

      const results = await Promise.all(savePromises);
      const successfulSaves = results.filter(result => result.success);

      if (successfulSaves.length === uploadedFiles.length) {
        console.log('✅ All documents saved successfully');
        setUploadDialogOpen(false);
        setUploadData({
          documentType: 'contract',
          documentName: '',
          description: '',
          documentYear: new Date().getFullYear(),
          documentMonth: new Date().getMonth() + 1,
        });
        setUploadedFiles([]);
        loadDocuments();
      } else {
        console.error('Some documents failed to save');
        alert(
          `Uložených ${successfulSaves.length}/${uploadedFiles.length} súborov`
        );
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Chyba pri ukladaní dokumentov');
    }
  };

  // Zmazanie dokumentu
  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Naozaj chcete vymazať tento dokument?')) return;

    try {
      const token =
        localStorage.getItem('blackrent_token') ||
        sessionStorage.getItem('blackrent_token');

      console.log('📄 Deleting document:', documentId);

      const response = await fetch(
        `${getApiBaseUrl()}/company-documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      console.log('📄 Delete response status:', response.status);

      const result = await response.json();

      if (result.success) {
        console.log('✅ Document deleted successfully');
        loadDocuments();
      } else {
        console.error('Error deleting document:', result.error);
        alert(`Chyba pri mazaní: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Chyba pri mazaní dokumentu');
    }
  };

  // Rozdelenie dokumentov podľa typu
  const contracts = documents.filter(doc => doc.documentType === 'contract');
  const invoices = documents.filter(doc => doc.documentType === 'invoice');

  // Zoskupenie faktúr podľa rokov a mesiacov
  const invoicesByYear = invoices.reduce(
    (acc, invoice) => {
      const year = invoice.documentYear || new Date().getFullYear();
      const month = invoice.documentMonth || 1;

      if (!acc[year]) acc[year] = {};
      if (!acc[year][month]) acc[year][month] = [];

      acc[year][month].push(invoice);
      return acc;
    },
    {} as Record<number, Record<number, CompanyDocument[]>>
  );

  const getMonthName = (month: number) => {
    const months = [
      'Január',
      'Február',
      'Marec',
      'Apríl',
      'Máj',
      'Jún',
      'Júl',
      'August',
      'September',
      'Október',
      'November',
      'December',
    ];
    return months[month - 1] || `Mesiac ${month}`;
  };

  return (
    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
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
          📄 Dokumenty majiteľa
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
          size="small"
          sx={{ borderRadius: 2 }}
        >
          Pridať dokument
        </Button>
      </Box>

      {loading ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', py: 2 }}
        >
          Načítavam dokumenty...
        </Typography>
      ) : (
        <Box>
          {/* ZMLUVY O SPOLUPRÁCI */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="subtitle2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <ContractIcon sx={{ color: '#1976d2' }} />
                Zmluvy o spolupráci ({contracts.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {contracts.length > 0 ? (
                <Box>
                  <BulkDownload
                    files={contracts.map(doc => ({
                      url: doc.filePath,
                      filename: doc.documentName,
                    }))}
                    zipFilename={`zmluvy_${companyName}_${new Date().toISOString().split('T')[0]}.zip`}
                    label="Stiahnuť všetky zmluvy"
                  />
                  <List dense>
                    {contracts.map(contract => (
                      <ListItem key={contract.id} divider>
                        <ListItemText
                          primary={contract.documentName}
                          secondary={
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {contract.description}
                              </Typography>
                              <br />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Nahraný:{' '}
                                {new Date(
                                  contract.createdAt
                                ).toLocaleDateString('sk-SK')}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() =>
                              window.open(contract.filePath, '_blank')
                            }
                            title="Zobraziť dokument"
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteDocument(contract.id)}
                            title="Zmazať dokument"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  Žiadne zmluvy o spolupráci
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* FAKTÚRY ROZDELENÉ PO MESIACOCH */}
          <Accordion defaultExpanded sx={{ mt: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography
                variant="subtitle2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <InvoiceIcon sx={{ color: '#4caf50' }} />
                Faktúry ({invoices.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {Object.keys(invoicesByYear).length > 0 ? (
                <Box>
                  {Object.entries(invoicesByYear)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Najnovšie roky najprv
                    .map(([year, months]) => (
                      <Box key={year} sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, color: 'primary.main' }}
                        >
                          📅 Rok {year}
                        </Typography>

                        {Object.entries(months)
                          .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Najnovšie mesiace najprv
                          .map(([month, monthInvoices]) => (
                            <Box key={month} sx={{ ml: 2, mb: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ mb: 1, fontWeight: 600 }}
                              >
                                {getMonthName(parseInt(month))} (
                                {monthInvoices.length})
                              </Typography>

                              <List dense sx={{ ml: 2 }}>
                                {monthInvoices.map(invoice => (
                                  <ListItem key={invoice.id} divider>
                                    <ListItemText
                                      primary={invoice.documentName}
                                      secondary={
                                        <Box>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {invoice.description}
                                          </Typography>
                                          <br />
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            Nahraný:{' '}
                                            {new Date(
                                              invoice.createdAt
                                            ).toLocaleDateString('sk-SK')}
                                          </Typography>
                                        </Box>
                                      }
                                    />
                                    <ListItemSecondaryAction>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          window.open(
                                            invoice.filePath,
                                            '_blank'
                                          )
                                        }
                                        title="Zobraziť faktúru"
                                      >
                                        <ViewIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleDeleteDocument(invoice.id)
                                        }
                                        title="Zmazať faktúru"
                                        color="error"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          ))}
                      </Box>
                    ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  Žiadne faktúry
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* UPLOAD DIALOG */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📄 Pridať dokument pre {companyName}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Typ dokumentu</InputLabel>
                <Select
                  value={uploadData.documentType}
                  onChange={e =>
                    setUploadData(prev => ({
                      ...prev,
                      documentType: e.target.value as 'contract' | 'invoice',
                    }))
                  }
                  label="Typ dokumentu"
                >
                  <MenuItem value="contract">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContractIcon fontSize="small" />
                      Zmluva o spolupráci
                    </Box>
                  </MenuItem>
                  <MenuItem value="invoice">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InvoiceIcon fontSize="small" />
                      Faktúra
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
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
                placeholder={
                  uploadData.documentType === 'contract'
                    ? 'napr. Zmluva o spolupráci 2024'
                    : 'napr. Faktúra január 2024'
                }
              />
            </Grid>

            {/* Pre faktúry - výber mesiaca a roku */}
            {uploadData.documentType === 'invoice' && (
              <>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Rok</InputLabel>
                    <Select
                      value={uploadData.documentYear}
                      onChange={e =>
                        setUploadData(prev => ({
                          ...prev,
                          documentYear: parseInt(e.target.value as string),
                        }))
                      }
                      label="Rok"
                    >
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i
                      ).map(year => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Mesiac</InputLabel>
                    <Select
                      value={uploadData.documentMonth}
                      onChange={e =>
                        setUploadData(prev => ({
                          ...prev,
                          documentMonth: parseInt(e.target.value as string),
                        }))
                      }
                      label="Mesiac"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        month => (
                          <MenuItem key={month} value={month}>
                            {getMonthName(month)}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Popis (nepovinné)"
                value={uploadData.description}
                onChange={e =>
                  setUploadData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                size="small"
                multiline
                rows={2}
                placeholder="Dodatočné informácie o dokumente..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Nahrať súbor:
                </Typography>
                <R2FileUpload
                  type="company-document"
                  entityId={companyId.toString()}
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
                  label="Vybrať súbor (PDF, obrázok)"
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setUploadDialogOpen(false);
              setUploadedFiles([]);
            }}
          >
            Zrušiť
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveDocuments}
            disabled={
              uploadedFiles.length === 0 || !uploadData.documentName.trim()
            }
          >
            💾 Uložiť{' '}
            {uploadedFiles.length > 1
              ? `${uploadedFiles.length} súborov`
              : 'dokument'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
