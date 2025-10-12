/**
 * Anti-Crash Upload Example Component
 *
 * Demoštruje bezpečný hromadný upload pre iOS Safari
 */

import { useState } from 'react';
import { useStreamUpload } from '../../hooks/useStreamUpload';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle, Upload, Loader2 } from 'lucide-react';

export function AntiCrashUploadExample() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    tasks,
    uploadFiles,
    cancel,
    isUploading,
    completed,
    total,
    progress,
  } = useStreamUpload({
    protocolId: 'demo-protocol-123',
    mediaType: 'vehicle',
    enableWakeLock: true,
    onProgress: (completed, total) => {
      console.log(`✅ Upload progress: ${completed}/${total}`);
    },
    onComplete: urls => {
      console.log('✅ All uploads complete!', urls);
    },
    onError: error => {
      console.error('❌ Upload error:', error);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    await uploadFiles(selectedFiles);
  };

  const handleCancel = () => {
    cancel();
    setSelectedFiles([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>iOS Anti-Crash Upload</CardTitle>
        <CardDescription>
          Safe batch upload with concurrency control (max 2 parallel)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selector */}
        <div className="space-y-2">
          <label htmlFor="file-input" className="text-sm font-medium">
            Select Photos
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {selectedFiles.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedFiles.length} file(s) selected
            </p>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {selectedFiles.length} file(s)
              </>
            )}
          </Button>
          {isUploading && (
            <Button variant="destructive" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>

        {/* Progress */}
        {tasks.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">
                  {completed}/{total} ({Math.round(progress)}%)
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Task List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  {/* Status Icon */}
                  {task.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  {task.status === 'failed' && (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  {task.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                  )}
                  {task.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(task.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {task.error && (
                      <p className="text-xs text-red-500 mt-1">{task.error}</p>
                    )}
                  </div>

                  {/* Progress Bar (for active uploads) */}
                  {task.status === 'uploading' && (
                    <div className="w-24">
                      <Progress value={task.progress} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            iOS Safari Anti-Crash Features:
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>✅ Max 2 parallel uploads (prevents memory spikes)</li>
            <li>✅ No base64 conversion (33% less RAM)</li>
            <li>✅ Auto-retry on failure (max 3 attempts)</li>
            <li>✅ Wake lock (prevents screen sleep during upload)</li>
            <li>✅ objectURL cleanup (no memory leaks)</li>
            <li>✅ Multipart for large files (&gt;5MB)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
