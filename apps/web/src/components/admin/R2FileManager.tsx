import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
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
  const [prefix, setPrefix] = useState('');
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

  /**
   * Load files from R2
   */
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await listR2Files({
        prefix,
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
   * Handle select all
   */
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedFiles.map(file => file.key);
      setSelected(newSelected);
    } else {
      setSelected([]);
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          R2 File Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Správa súborov v Cloudflare R2 Storage
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Celkový počet súborov</Typography>
                <Typography variant="h3">
                  {stats.totalFiles.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Celková veľkosť</Typography>
                <Typography variant="h3">
                  {formatFileSize(stats.totalSize)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Počet priečinkov</Typography>
                <Typography variant="h3">
                  {Object.keys(stats.byFolder).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mb: 2 }}
        >
          {success}
        </Alert>
      )}

      {/* Filters & Actions */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Hľadať súbory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Prefix Filter */}
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter podľa priečinka</InputLabel>
              <Select
                value={prefix}
                label="Filter podľa priečinka"
                onChange={e => setPrefix(e.target.value)}
              >
                <MenuItem value="">Všetky priečinky</MenuItem>
                {stats &&
                  Object.keys(stats.byFolder).map(folder => (
                    <MenuItem key={folder} value={folder}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <FolderIcon fontSize="small" />
                        {folder} ({stats?.byFolder[folder]?.count || 0})
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Actions */}
          <Grid
            item
            xs={12}
            md={5}
            sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadFiles();
                loadStats();
              }}
            >
              Obnoviť
            </Button>
            {selected.length > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                Vymazať ({selected.length})
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={() => setPrefixDeleteDialogOpen(true)}
            >
              Vymazať podľa prefixu
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Files Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selected.length > 0 &&
                    selected.length < paginatedFiles.length
                  }
                  checked={
                    paginatedFiles.length > 0 &&
                    selected.length === paginatedFiles.length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortOrder : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Názov súboru
                </TableSortLabel>
              </TableCell>
              <TableCell>Priečinok</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'size'}
                  direction={sortBy === 'size' ? sortOrder : 'asc'}
                  onClick={() => handleSort('size')}
                >
                  Veľkosť
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'date'}
                  direction={sortBy === 'date' ? sortOrder : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  Posledná úprava
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Akcie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFiles.map(file => {
              const isItemSelected = isSelected(file.key);
              return (
                <TableRow
                  key={file.key}
                  hover
                  selected={isItemSelected}
                  onClick={() => handleSelectOne(file.key)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={isItemSelected} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={file.key}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {getFilenameFromKey(file.key)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<FolderIcon />}
                      label={getFolderFromKey(file.key)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    {format(new Date(file.lastModified), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Vymazať">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => {
                          e.stopPropagation();
                          setFileToDelete(file.key);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={files.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Riadkov na stránku:"
        />
      </TableContainer>

      {/* Delete File Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Vymazať súbor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Naozaj chcete vymazať tento súbor?
            <br />
            <strong>{fileToDelete}</strong>
            <br />
            <br />
            Táto akcia je nevratná!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Zrušiť</Button>
          <Button onClick={handleDeleteFile} color="error" variant="contained">
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
      >
        <DialogTitle>Vymazať vybrané súbory</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Naozaj chcete vymazať <strong>{selected.length}</strong> vybraných
            súborov?
            <br />
            <br />
            Táto akcia je nevratná!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Zrušiť</Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">
            Vymazať {selected.length} súborov
          </Button>
        </DialogActions>
      </Dialog>

      {/* Prefix Delete Dialog */}
      <Dialog
        open={prefixDeleteDialogOpen}
        onClose={() => setPrefixDeleteDialogOpen(false)}
      >
        <DialogTitle>Vymazať podľa prefixu</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Vymaže <strong>všetky</strong> súbory začínajúce na zadaný prefix.
            <br />
            Napríklad: <code>2025/08/BMW</code> vymaže všetky BMW súbory z
            augusta 2025.
            <br />
            <br />
            ⚠️ <strong>POZOR:</strong> Táto akcia je nevratná!
          </DialogContentText>
          <TextField
            fullWidth
            label="Prefix (napr. 2025/08/BMW)"
            value={prefixToDelete}
            onChange={e => setPrefixToDelete(e.target.value)}
            placeholder="2025/08/BMW_X5"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrefixDeleteDialogOpen(false)}>
            Zrušiť
          </Button>
          <Button
            onClick={handlePrefixDelete}
            color="error"
            variant="contained"
            disabled={!prefixToDelete}
          >
            Vymazať všetko s "{prefixToDelete}"
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
