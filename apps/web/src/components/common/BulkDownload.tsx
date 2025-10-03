import { Download as DownloadIcon } from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { SecondaryButton } from '../ui';
import { logger } from '@/utils/smartLogger';

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
      logger.debug('📦 Starting bulk download of', { fileCount: files.length });

      const zip = new JSZip();

      // Stiahni všetky súbory a pridaj do ZIP
      const downloadPromises = files.map(async (file, index) => {
        try {
          logger.debug(
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
          logger.debug(`✅ Added to ZIP: ${filename}`);
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

      logger.debug('📦 Generating ZIP file...');

      // Generuj ZIP súbor
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Stiahni ZIP súbor
      saveAs(zipBlob, zipFilename);

      logger.debug('✅ Bulk download completed:', zipFilename);
    } catch (error) {
      console.error('❌ Bulk download failed:', error);
      alert('Chyba pri sťahovaní súborov');
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <SecondaryButton
        startIcon={<DownloadIcon className="w-4 h-4" />}
        onClick={handleBulkDownload}
        disabled={disabled}
        className="h-8 px-3 text-sm"
      >
        {label} ({files.length})
      </SecondaryButton>

      <span className="text-xs text-muted-foreground ml-2">
        Stiahne sa ako ZIP súbor
      </span>
    </div>
  );
}
