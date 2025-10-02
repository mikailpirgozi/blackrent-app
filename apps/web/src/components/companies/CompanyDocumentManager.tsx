import { useCallback, useEffect, useState } from 'react';

// Lucide icons (replacing MUI icons)
import {
  Plus as AddIcon,
  FileText as ContractIcon,
  Trash2 as DeleteIcon,
  Receipt as InvoiceIcon,
  Eye as ViewIcon,
} from 'lucide-react';

// shadcn/ui components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Removed all MUI imports - fully migrated to shadcn/ui

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
      console.log('Nahrajte súbory a zadajte názov dokumentu');
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
        console.log(
          `Uložených ${successfulSaves.length}/${uploadedFiles.length} súborov`
        );
      }
    } catch (error) {
      console.error('Error saving document:', error);
      console.log('Chyba pri ukladaní dokumentov');
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
        console.log(`Chyba pri mazaní: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      console.log('Chyba pri mazaní dokumentu');
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
    <div className="mt-6 pt-4 border-t border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          📄 Dokumenty majiteľa
        </h2>
        <Button
          variant="outline"
          onClick={() => setUploadDialogOpen(true)}
          size="sm"
          className="gap-2"
        >
          <AddIcon className="h-4 w-4" />
          Pridať dokument
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-4 text-muted-foreground text-sm">
          Načítavam dokumenty...
        </p>
      ) : (
        <div>
          {/* ZMLUVY O SPOLUPRÁCI */}
          <Accordion type="single" defaultValue="contracts" collapsible>
            <AccordionItem value="contracts">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <ContractIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Zmluvy o spolupráci ({contracts.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
              {contracts.length > 0 ? (
                <div>
                  <BulkDownload
                    files={contracts.map(doc => ({
                      url: doc.filePath,
                      filename: doc.documentName,
                    }))}
                    zipFilename={`zmluvy_${companyName}_${new Date().toISOString().split('T')[0]}.zip`}
                    label="Stiahnuť všetky zmluvy"
                  />
                  <div className="space-y-2">
                    {contracts.map(contract => (
                      <Card key={contract.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{contract.documentName}</h4>
                              <div className="mt-1 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  {contract.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Nahraný:{' '}
                                  {new Date(
                                    contract.createdAt
                                  ).toLocaleDateString('sk-SK')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(contract.filePath, '_blank')
                                }
                                title="Zobraziť dokument"
                              >
                                <ViewIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(contract.id)}
                                title="Zmazať dokument"
                                className="text-destructive hover:text-destructive"
                              >
                                <DeleteIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Žiadne zmluvy o spolupráci
                </p>
              )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* FAKTÚRY ROZDELENÉ PO MESIACOCH */}
          <Accordion type="single" defaultValue="invoices" collapsible className="mt-2">
            <AccordionItem value="invoices">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <InvoiceIcon className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Faktúry ({invoices.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
              {Object.keys(invoicesByYear).length > 0 ? (
                <div>
                  {Object.entries(invoicesByYear)
                    .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Najnovšie roky najprv
                    .map(([year, months]) => (
                      <div key={year} className="mb-4">
                        <h3 className="text-sm font-medium text-primary mb-2">
                          📅 Rok {year}
                        </h3>

                        {Object.entries(months)
                          .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Najnovšie mesiace najprv
                          .map(([month, monthInvoices]) => (
                            <div key={month} className="ml-4 mb-2">
                              <h4 className="text-sm font-semibold mb-2">
                                {getMonthName(parseInt(month))} (
                                {monthInvoices.length})
                              </h4>

                              <div className="ml-4 space-y-2">
                                {monthInvoices.map(invoice => (
                                  <Card key={invoice.id}>
                                    <CardContent className="p-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-sm">{invoice.documentName}</h5>
                                          <div className="mt-1 space-y-1">
                                            <p className="text-xs text-muted-foreground">
                                              {invoice.description}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              Nahraný:{' '}
                                              {new Date(
                                                invoice.createdAt
                                              ).toLocaleDateString('sk-SK')}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                invoice.filePath,
                                                '_blank'
                                              )
                                            }
                                            title="Zobraziť faktúru"
                                          >
                                            <ViewIcon className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteDocument(invoice.id)
                                            }
                                            title="Zmazať faktúru"
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <DeleteIcon className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  Žiadne faktúry
                </p>
              )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* UPLOAD DIALOG */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>📄 Pridať dokument pre {companyName}</DialogTitle>
            <DialogDescription>
              Nahrajte nový dokument pre túto firmu
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Typ dokumentu</Label>
              <Select
                value={uploadData.documentType}
                onValueChange={(value: 'contract' | 'invoice') =>
                  setUploadData(prev => ({
                    ...prev,
                    documentType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte typ dokumentu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">
                    <div className="flex items-center gap-2">
                      <ContractIcon className="h-4 w-4" />
                      Zmluva o spolupráci
                    </div>
                  </SelectItem>
                  <SelectItem value="invoice">
                    <div className="flex items-center gap-2">
                      <InvoiceIcon className="h-4 w-4" />
                      Faktúra
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentName">Názov dokumentu *</Label>
              <Input
                id="documentName"
                value={uploadData.documentName}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setUploadData(prev => ({
                    ...prev,
                    documentName: e.target.value,
                  }))
                }
                placeholder={
                  uploadData.documentType === 'contract'
                    ? 'napr. Zmluva o spolupráci 2024'
                    : 'napr. Faktúra január 2024'
                }
                required
              />
            </div>

            {/* Pre faktúry - výber mesiaca a roku */}
            {uploadData.documentType === 'invoice' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentYear">Rok</Label>
                  <Select
                    value={uploadData.documentYear?.toString() || ''}
                    onValueChange={(value) =>
                      setUploadData(prev => ({
                        ...prev,
                        documentYear: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte rok" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i
                      ).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentMonth">Mesiac</Label>
                  <Select
                    value={uploadData.documentMonth?.toString() || ''}
                    onValueChange={(value) =>
                      setUploadData(prev => ({
                        ...prev,
                        documentMonth: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte mesiac" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        month => (
                          <SelectItem key={month} value={month.toString()}>
                            {getMonthName(month)}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Popis (nepovinné)</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setUploadData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Dodatočné informácie o dokumente..."
              />
            </div>

            <div className="space-y-2">
              <Label>Nahrať súbor:</Label>
              <div>
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
                  <Alert className="mt-2">
                    <AlertDescription>
                      ✅ {uploadedFiles.length} súborov úspešne nahraných a
                      pripravených na uloženie
                      <div className="mt-2 flex flex-wrap gap-1">
                        {uploadedFiles.map((file, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() =>
                              setUploadedFiles(prev =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                          >
                            {file.filename} ×
                          </Badge>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadedFiles([]);
              }}
            >
              Zrušiť
            </Button>
            <Button
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
