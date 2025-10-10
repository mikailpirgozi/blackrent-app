import { Download as DownloadIcon } from '@mui/icons-material';
import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import { Box, Typography } from '@mui/material';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import React from 'react';

import { SecondaryButton } from '../ui';

interface BulkDownloadProps {
  files: Array<{
    url: string;
    filename: string;
    id?: string;
  }>;
  zipFilename?: string;
  label?: string;
  disabled?: boolean;
}

export default function BulkDownload({
  files,
  zipFilename = 'documents.zip',
  label = 'Stiahnuť všetky súbory',
  disabled = false,
}: BulkDownloadProps) {
  const handleBulkDownload = async () => {
    if (files.length === 0) {
      alert('Žiadne súbory na stiahnutie');
      return;
    }

    try {
      console.log('📦 Starting bulk download of', files.length, 'files');

      const zip = new JSZip();

      // Stiahni všetky súbory a pridaj do ZIP
      const downloadPromises = files.map(async (file, index) => {
        try {
          console.log(
            `📥 Downloading file ${index + 1}/${files.length}:`,
            file.filename
          );

          const response = await fetch(file.url);
          if (!response.ok) {
            throw new Error(
              `Failed to download ${file.filename}: ${response.status}`
            );
          }

          const blob = await response.blob();

          // Zabráň duplicitným názvom súborov
          let filename = file.filename;
          let counter = 1;
          while (zip.file(filename)) {
            const ext = filename.split('.').pop();
            const nameWithoutExt = filename.replace(`.${ext}`, '');
            filename = `${nameWithoutExt}_${counter}.${ext}`;
            counter++;
          }

          zip.file(filename, blob);
          console.log(`✅ Added to ZIP: ${filename}`);
        } catch (error) {
          console.error(`❌ Failed to download ${file.filename}:`, error);
          // Pridaj error súbor do ZIP
          zip.file(
            `ERROR_${file.filename}.txt`,
            `Failed to download: ${error}`
          );
        }
      });

      await Promise.all(downloadPromises);

      console.log('📦 Generating ZIP file...');

      // Generuj ZIP súbor
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Stiahni ZIP súbor
      saveAs(zipBlob, zipFilename);

      console.log('✅ Bulk download completed:', zipFilename);
    } catch (error) {
      console.error('❌ Bulk download failed:', error);
      alert('Chyba pri sťahovaní súborov');
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <SecondaryButton
        startIcon={<UnifiedIcon name="download" />}
        onClick={handleBulkDownload}
        disabled={disabled}
        size="small"
      >
        {label} ({files.length})
      </SecondaryButton>

      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        Stiahne sa ako ZIP súbor
      </Typography>
    </Box>
  );
}
