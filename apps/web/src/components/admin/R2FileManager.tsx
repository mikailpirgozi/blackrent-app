import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Folder,
  Home,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  type R2File,
  type R2StatsResponse,
  bulkDeleteR2Files,
  deleteByPrefix,
  deleteR2File,
  formatFileSize,
  getFilenameFromKey,
  getFolderFromKey,
  getR2Stats,
  listR2Files,
} from '../../services/r2-files';
import { Alert, AlertDescription } from '../ui/alert';
import { UnifiedButton } from '../ui/UnifiedButton';
import { UnifiedCard } from '../ui/UnifiedCard';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { UnifiedTextField } from '../ui/UnifiedTextField';
import { UnifiedTypography } from '../ui/UnifiedTypography';

type SortBy = 'name' | 'size' | 'date';
type SortOrder = 'asc' | 'desc';

export default function R2FileManager() {
  // State
  const [files, setFiles] = useState<R2File[]>([]);
  const [stats, setStats] = useState<R2StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [prefix, setPrefix] = useState('__all__');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection
  const [selected, setSelected] = useState<string[]>([]);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [prefixDeleteDialogOpen, setPrefixDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [prefixToDelete, setPrefixToDelete] = useState('');
  
  // Preview Modal
  const [previewFile, setPreviewFile] = useState<R2File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Navigation breadcrumbs
  const [navigationPath, setNavigationPath] = useState<string[]>([]);
  
  // View mode: 'flat' or 'hierarchical'
  const [viewMode, setViewMode] = useState<'flat' | 'hierarchical'>('flat');

  /**
   * Load files from R2
   */
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listR2Files({
        prefix: prefix === '__all__' ? undefined : prefix,
        search,
        limit: 1000, // Load more for client-side pagination
        sortBy,
        sortOrder,
      });

      setFiles(response.files);
    } catch (err) {
      console.error('Failed to load R2 files:', err);
      setError('Nepodarilo sa načítať súbory z R2');
    } finally {
      setLoading(false);
    }
  }, [prefix, search, sortBy, sortOrder]);

  /**
   * Load stats from R2
   */
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getR2Stats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load R2 stats:', err);
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    loadFiles();
    loadStats();
  }, [loadFiles, loadStats]);

  /**
   * Handle sort change
   */
  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  /**
   * Handle select one
   */
  const handleSelectOne = (key: string) => {
    const selectedIndex = selected.indexOf(key);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, key);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  /**
   * Handle single file delete
   */
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      setLoading(true);
      await deleteR2File(fileToDelete);
      setSuccess('Súbor vymazaný úspešne');
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      loadFiles();
      loadStats();
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('Nepodarilo sa vymazať súbor');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    try {
      setLoading(true);
      const result = await bulkDeleteR2Files(selected);
      setSuccess(
        `Vymazané ${result.deleted} súborov (${result.failed} zlyhalo)`
      );
      setBulkDeleteDialogOpen(false);
      setSelected([]);
      loadFiles();
      loadStats();
    } catch (err) {
      console.error('Failed to bulk delete files:', err);
      setError('Nepodarilo sa vymazať súbory');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle prefix delete
   */
  const handlePrefixDelete = async () => {
    if (!prefixToDelete) return;

    try {
      setLoading(true);
      const result = await deleteByPrefix(prefixToDelete);
      setSuccess(
        `Vymazané ${result.deleted} súborov z prefix "${result.prefix}"`
      );
      setPrefixDeleteDialogOpen(false);
      setPrefixToDelete('');
      loadFiles();
      loadStats();
    } catch (err) {
      console.error('Failed to delete by prefix:', err);
      setError('Nepodarilo sa vymazať súbory podľa prefixu');
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const paginatedFiles = files.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const isSelected = (key: string) => selected.indexOf(key) !== -1;
  
  // Group files by folder for hierarchical view
  const groupedFiles = files.reduce((acc, file) => {
    const folder = getFolderFromKey(file.key);
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, R2File[]>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <UnifiedTypography variant="h4">R2 File Manager</UnifiedTypography>
        <UnifiedTypography variant="body2" className="text-muted-foreground">
          Správa súborov v Cloudflare R2 Storage
        </UnifiedTypography>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UnifiedCard variant="statistics">
            <UnifiedTypography variant="h6" className="mb-2">
              Celkový počet súborov
            </UnifiedTypography>
            <UnifiedTypography variant="h3">
              {stats.totalFiles.toLocaleString()}
            </UnifiedTypography>
          </UnifiedCard>
          <UnifiedCard variant="statistics">
            <UnifiedTypography variant="h6" className="mb-2">
              Celková veľkosť
            </UnifiedTypography>
            <UnifiedTypography variant="h3">
              {formatFileSize(stats.totalSize)}
            </UnifiedTypography>
          </UnifiedCard>
          <UnifiedCard variant="statistics">
            <UnifiedTypography variant="h6" className="mb-2">
              Počet priečinkov
            </UnifiedTypography>
            <UnifiedTypography variant="h3">
              {Object.keys(stats.byFolder).length}
            </UnifiedTypography>
          </UnifiedCard>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Breadcrumbs Navigation */}
      {(prefix !== '__all__' || search) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
          <Home className="h-4 w-4" />
          <button
            onClick={() => {
              setPrefix('__all__');
              setSearch('');
            }}
            className="hover:text-foreground transition-colors"
          >
            Všetky súbory
          </button>
          {prefix !== '__all__' && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Folder className="h-4 w-4" />
              <span className="font-medium text-foreground">{prefix}</span>
            </>
          )}
          {search && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Search className="h-4 w-4" />
              <span className="font-medium text-foreground">"{search}"</span>
            </>
          )}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search */}
          <div className="md:col-span-4">
            <UnifiedTextField
              placeholder="Hľadať súbory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search className="h-4 w-4 text-muted-foreground" />
                ),
              }}
            />
          </div>

          {/* Prefix Filter */}
          <div className="md:col-span-3 space-y-2">
            <Label>Filter podľa priečinka</Label>
            <Select value={prefix} onValueChange={setPrefix}>
              <SelectTrigger>
                <SelectValue placeholder="Všetky priečinky" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Všetky priečinky</SelectItem>
                {stats &&
                  Object.keys(stats.byFolder)
                    .filter(folder => folder !== '')
                    .map(folder => (
                      <SelectItem key={folder} value={folder}>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {folder} ({stats?.byFolder[folder]?.count || 0})
                        </div>
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="md:col-span-5 flex gap-2 justify-end flex-wrap">
            {/* View Mode Toggle */}
            <Select
              value={viewMode}
              onValueChange={(value: 'flat' | 'hierarchical') => setViewMode(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">📋 Plochý zoznam</SelectItem>
                <SelectItem value="hierarchical">📁 Hierarchický</SelectItem>
              </SelectContent>
            </Select>
            
            <UnifiedButton
              variant="outlined"
              startIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                loadFiles();
                loadStats();
              }}
            >
              Obnoviť
            </UnifiedButton>
            {selected.length > 0 && (
              <UnifiedButton
                variant="contained"
                color="error"
                startIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                Vymazať ({selected.length})
              </UnifiedButton>
            )}
            <UnifiedButton
              variant="outlined"
              color="error"
              onClick={() => setPrefixDeleteDialogOpen(true)}
            >
              Vymazať podľa prefixu
            </UnifiedButton>
          </div>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
          <span className="text-sm text-muted-foreground">Rýchle filtre:</span>
          <UnifiedButton
            size="small"
            variant="outlined"
            onClick={() => setSearch('BMW')}
            className="text-xs"
          >
            🚗 BMW
          </UnifiedButton>
          <UnifiedButton
            size="small"
            variant="outlined"
            onClick={() => setSearch('X5')}
            className="text-xs"
          >
            BMW X5
          </UnifiedButton>
          <UnifiedButton
            size="small"
            variant="outlined"
            onClick={() => setSearch('.pdf')}
            className="text-xs"
          >
            📄 PDF
          </UnifiedButton>
          <UnifiedButton
            size="small"
            variant="outlined"
            onClick={() => setSearch('.jpg')}
            className="text-xs"
          >
            🖼️ Obrázky
          </UnifiedButton>
          <UnifiedButton
            size="small"
            variant="outlined"
            onClick={() => {
              setPrefix('__all__');
              setSearch('');
            }}
            className="text-xs"
          >
            ✨ Vyčistiť
          </UnifiedButton>
        </div>
      </div>

      {/* Loading */}
      {loading && <Progress value={undefined} className="mb-4" />}

      {/* Files Table/Hierarchical View */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {viewMode === 'flat' ? (
          /* Flat Table View */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        paginatedFiles.length > 0 &&
                        selected.length === paginatedFiles.length
                      }
                      onCheckedChange={checked => {
                        if (checked) {
                          const newSelected = paginatedFiles.map(
                            file => file.key
                          );
                          setSelected(newSelected);
                        } else {
                          setSelected([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Názov súboru
                      {sortBy === 'name' && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead>Priečinok</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('size')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Veľkosť
                      {sortBy === 'size' && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Posledná úprava
                      {sortBy === 'date' && <ArrowUpDown className="h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFiles.map(file => {
                const isItemSelected = isSelected(file.key);
                return (
                  <TableRow
                    key={file.key}
                    className={
                      isItemSelected ? 'bg-muted/50' : 'cursor-pointer'
                    }
                    onClick={() => handleSelectOne(file.key)}
                  >
                    <TableCell>
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-xs">
                        {/* File type icon */}
                        {file.key.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        ) : file.key.match(/\.pdf$/i) ? (
                          <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="truncate" title={file.key}>
                          {getFilenameFromKey(file.key)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Folder className="h-4 w-4" />
                        {getFolderFromKey(file.key)}
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      {format(new Date(file.lastModified), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview button for images and PDFs */}
                        {(file.key.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) && (
                          <UnifiedButton
                            size="small"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              setPreviewFile(file);
                              setPreviewOpen(true);
                            }}
                            title="Náhľad"
                          >
                            <Eye className="h-4 w-4" />
                          </UnifiedButton>
                        )}
                        {/* Download button */}
                        <UnifiedButton
                          size="small"
                          variant="ghost"
                          onClick={e => {
                            e.stopPropagation();
                            window.open(file.url, '_blank');
                          }}
                          title="Stiahnuť"
                        >
                          <Download className="h-4 w-4" />
                        </UnifiedButton>
                        {/* Delete button */}
                        <UnifiedButton
                          size="small"
                          variant="ghost"
                          color="error"
                          onClick={e => {
                            e.stopPropagation();
                            setFileToDelete(file.key);
                            setDeleteDialogOpen(true);
                          }}
                          title="Vymazať"
                        >
                          <Trash2 className="h-4 w-4" />
                        </UnifiedButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        ) : (
          /* Hierarchical View */
          <div className="p-4 space-y-4">
            {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
              <details key={folder} className="border rounded-lg" open>
                <summary className="cursor-pointer bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-primary" />
                      <span className="font-medium">{folder}</span>
                      <span className="text-sm text-muted-foreground">
                        ({folderFiles.length} súborov, {formatFileSize(folderFiles.reduce((sum, f) => sum + f.size, 0))})
                      </span>
                    </div>
                  </div>
                </summary>
                <div className="p-2 space-y-1">
                  {folderFiles.map(file => {
                    const isItemSelected = isSelected(file.key);
                    return (
                      <div
                        key={file.key}
                        className={`flex items-center justify-between p-3 rounded hover:bg-muted/50 transition-colors ${
                          isItemSelected ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleSelectOne(file.key)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox checked={isItemSelected} />
                          {file.key.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <ImageIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          ) : file.key.match(/\.pdf$/i) ? (
                            <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="truncate flex-1" title={file.key}>
                            {getFilenameFromKey(file.key)}
                          </span>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatFileSize(file.size)}
                          </span>
                          <span className="text-sm text-muted-foreground whitespace-nowrap hidden md:block">
                            {format(new Date(file.lastModified), 'dd.MM.yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {(file.key.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)) && (
                            <UnifiedButton
                              size="small"
                              variant="ghost"
                              onClick={e => {
                                e.stopPropagation();
                                setPreviewFile(file);
                                setPreviewOpen(true);
                              }}
                              title="Náhľad"
                            >
                              <Eye className="h-4 w-4" />
                            </UnifiedButton>
                          )}
                          <UnifiedButton
                            size="small"
                            variant="ghost"
                            onClick={e => {
                              e.stopPropagation();
                              window.open(file.url, '_blank');
                            }}
                            title="Stiahnuť"
                          >
                            <Download className="h-4 w-4" />
                          </UnifiedButton>
                          <UnifiedButton
                            size="small"
                            variant="ghost"
                            color="error"
                            onClick={e => {
                              e.stopPropagation();
                              setFileToDelete(file.key);
                              setDeleteDialogOpen(true);
                            }}
                            title="Vymazať"
                          >
                            <Trash2 className="h-4 w-4" />
                          </UnifiedButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Pagination (only for flat view) */}
        {viewMode === 'flat' && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Zobrazených {page * rowsPerPage + 1}-
            {Math.min((page + 1) * rowsPerPage, files.length)} z {files.length}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Riadkov na stránku:</Label>
            <Select
              value={rowsPerPage.toString()}
              onValueChange={value => {
                setRowsPerPage(parseInt(value, 10));
                setPage(0);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <UnifiedButton
                size="small"
                variant="outlined"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Predchádzajúca
              </UnifiedButton>
              <UnifiedButton
                size="small"
                variant="outlined"
                disabled={(page + 1) * rowsPerPage >= files.length}
                onClick={() => setPage(page + 1)}
              >
                Nasledujúca
              </UnifiedButton>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Delete File Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vymazať súbor</DialogTitle>
            <DialogDescription>
              Naozaj chcete vymazať tento súbor?
              <br />
              <strong className="text-foreground">{fileToDelete}</strong>
              <br />
              <br />
              Táto akcia je nevratná!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <UnifiedButton
              variant="outlined"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Zrušiť
            </UnifiedButton>
            <UnifiedButton
              variant="contained"
              color="error"
              onClick={handleDeleteFile}
            >
              Vymazať
            </UnifiedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vymazať vybrané súbory</DialogTitle>
            <DialogDescription>
              Naozaj chcete vymazať <strong>{selected.length}</strong> vybraných
              súborov?
              <br />
              <br />
              Táto akcia je nevratná!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <UnifiedButton
              variant="outlined"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Zrušiť
            </UnifiedButton>
            <UnifiedButton
              variant="contained"
              color="error"
              onClick={handleBulkDelete}
            >
              Vymazať {selected.length} súborov
            </UnifiedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prefix Delete Dialog */}
      <Dialog
        open={prefixDeleteDialogOpen}
        onOpenChange={setPrefixDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vymazať podľa prefixu</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Vymaže <strong>všetky</strong> súbory začínajúce na zadaný
                prefix.
              </p>
              <p>
                Napríklad: <code className="text-foreground">2025/08/BMW</code>{' '}
                vymaže všetky BMW súbory z augusta 2025.
              </p>
              <p className="text-destructive font-semibold">
                ⚠️ POZOR: Táto akcia je nevratná!
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <UnifiedTextField
              label="Prefix (napr. 2025/08/BMW)"
              value={prefixToDelete}
              onChange={e => setPrefixToDelete(e.target.value)}
              placeholder="2025/08/BMW_X5"
            />
          </div>
          <DialogFooter>
            <UnifiedButton
              variant="outlined"
              onClick={() => setPrefixDeleteDialogOpen(false)}
            >
              Zrušiť
            </UnifiedButton>
            <UnifiedButton
              variant="contained"
              color="error"
              onClick={handlePrefixDelete}
              disabled={!prefixToDelete}
            >
              Vymazať všetko s "{prefixToDelete}"
            </UnifiedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate pr-4">
                {previewFile && getFilenameFromKey(previewFile.key)}
              </span>
              <UnifiedButton
                size="small"
                variant="ghost"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </UnifiedButton>
            </DialogTitle>
            <DialogDescription>
              {previewFile && (
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Veľkosť: {formatFileSize(previewFile.size)}
                  </span>
                  <span>
                    Upravené: {format(new Date(previewFile.lastModified), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {previewFile && (
              <>
                {/* Image Preview */}
                {previewFile.key.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                  <div className="flex items-center justify-center bg-muted/20 p-4 rounded-lg">
                    <img
                      src={previewFile.url}
                      alt={getFilenameFromKey(previewFile.key)}
                      className="max-w-full h-auto rounded shadow-lg"
                      style={{ maxHeight: 'calc(90vh - 250px)' }}
                    />
                  </div>
                )}
                
                {/* PDF Preview */}
                {previewFile.key.match(/\.pdf$/i) && (
                  <div className="w-full h-full bg-muted/20 rounded-lg overflow-hidden">
                    <iframe
                      src={previewFile.url}
                      className="w-full border-0 rounded"
                      style={{ height: 'calc(90vh - 250px)', minHeight: '500px' }}
                      title={getFilenameFromKey(previewFile.key)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <UnifiedButton
              variant="outlined"
              onClick={() => window.open(previewFile?.url, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Stiahnuť
            </UnifiedButton>
            <UnifiedButton
              variant="contained"
              onClick={() => setPreviewOpen(false)}
            >
              Zavrieť
            </UnifiedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
