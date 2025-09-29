import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/Button';

interface FileUploadProps {
  onFilesSelected: (files: { name: string; path: string }[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  multiple?: boolean;
  className?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const ACCEPTED_FILE_TYPES = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE_MB = 50;

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  acceptedTypes = ACCEPTED_FILE_TYPES,
  maxFileSize = MAX_FILE_SIZE_MB,
  multiple = true,
  className = '',
}) => {
  const { animationsEnabled } = useTheme();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (
    fileName: string
  ): { valid: boolean; error?: string } => {
    // Check file type
    const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type ${fileExtension} not supported. Accepted types: ${acceptedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  };

  const simulateUploadProgress = (fileName: string): Promise<void> => {
    return new Promise(resolve => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random progress between 5-20%

        if (progress >= 100) {
          progress = 100;
          setUploadProgress(prev =>
            prev.map(item =>
              item.fileName === fileName
                ? { ...item, progress: 100, status: 'completed' }
                : item
            )
          );
          clearInterval(interval);
          resolve();
        } else {
          setUploadProgress(prev =>
            prev.map(item =>
              item.fileName === fileName
                ? { ...item, progress: Math.round(progress) }
                : item
            )
          );
        }
      }, 100);
    });
  };

  const processFiles = useCallback(
    async (filePaths: string[]) => {
      const validFiles: { name: string; path: string }[] = [];
      const newProgress: UploadProgress[] = [];

      // Validate all files first
      for (const filePath of filePaths) {
        const fileName = filePath.split('/').pop() || filePath;
        const validation = validateFile(fileName);
        if (validation.valid) {
          validFiles.push({ name: fileName, path: filePath });
          newProgress.push({
            fileName,
            progress: 0,
            status: 'uploading',
          });
        } else {
          newProgress.push({
            fileName,
            progress: 0,
            status: 'error',
            error: validation.error,
          });
        }
      }

      setUploadProgress(newProgress);
      setIsUploading(true);

      // Simulate upload progress for valid files
      const uploadPromises = validFiles.map(file =>
        simulateUploadProgress(file.name)
      );

      try {
        await Promise.all(uploadPromises);

        // Call the callback with valid files
        if (validFiles.length > 0) {
          onFilesSelected(validFiles);
        }
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);

        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress([]);
        }, 2000);
      }
    },
    [onFilesSelected, acceptedTypes]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const filePaths = Array.from(files).map(file => file.path || file.name);
        processFiles(filePaths);
      }
    },
    [processFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const filePaths = Array.from(files).map(file => file.path || file.name);
        processFiles(filePaths);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  const handleBrowseClick = async () => {
    try {
      const result = await window.electronAPI.file.openDialog();
      if (!result.canceled && result.filePaths.length > 0) {
        processFiles(result.filePaths);
      }
    } catch (error) {
      console.error('Error opening file dialog:', error);
    }
  };

  const dropZoneVariants = {
    idle: {
      scale: 1,
      borderColor: 'rgb(71, 85, 105)', // slate-600
      backgroundColor: 'rgb(30, 41, 59)', // slate-800
    },
    dragOver: {
      scale: 1.02,
      borderColor: 'rgb(59, 130, 246)', // blue-500
      backgroundColor: 'rgb(37, 99, 235, 0.1)', // blue-600 with opacity
    },
  };

  const progressBarVariants = {
    initial: { width: 0 },
    animate: (progress: number) => ({
      width: `${progress}%`,
      transition: { duration: 0.3, ease: 'easeOut' },
    }),
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${
            isDragOver
              ? 'border-primary-500 bg-primary-500/10'
              : 'border-slate-600 bg-slate-800 hover:border-slate-500 hover:bg-slate-700'
          }
        `}
        variants={animationsEnabled ? dropZoneVariants : {}}
        initial="idle"
        animate={isDragOver ? 'dragOver' : 'idle'}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        whileHover={animationsEnabled ? { scale: 1.01 } : {}}
        whileTap={animationsEnabled ? { scale: 0.99 } : {}}
      >
        <div className="flex flex-col items-center space-y-4">
          {/* Upload Icon */}
          <motion.div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDragOver ? 'bg-primary-600' : 'bg-slate-700'
            }`}
            animate={
              animationsEnabled && isDragOver
                ? {
                    rotate: [0, 5, -5, 0],
                    transition: { duration: 0.5, repeat: Infinity },
                  }
                : {}
            }
          >
            <span className="text-2xl">{isDragOver ? '📥' : '📄'}</span>
          </motion.div>

          {/* Upload Text */}
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              {isDragOver ? 'Drop files here' : 'Upload Script Files'}
            </h3>
            <p className="text-slate-400 mb-4">
              Drag and drop your script files here, or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supported formats: {acceptedTypes.join(', ')} • Max size:{' '}
              {maxFileSize}MB
            </p>
          </div>

          {/* Browse Button */}
          {!isDragOver && (
            <Button
              variant="primary"
              size="md"
              onClick={e => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              Browse Files
            </Button>
          )}
        </div>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadProgress.length > 0 && (
          <motion.div
            className="mt-6 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-sm font-medium text-slate-300">
              {isUploading ? 'Processing Files...' : 'Upload Complete'}
            </h4>

            {uploadProgress.map((item, index) => (
              <motion.div
                key={item.fileName}
                className="bg-slate-800 rounded-xl p-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    {item.fileName}
                  </span>
                  <div className="flex items-center space-x-2">
                    {item.status === 'completed' && (
                      <span className="text-green-400 text-sm">✓</span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-red-400 text-sm">✗</span>
                    )}
                    <span className="text-xs text-slate-400">
                      {item.progress}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      item.status === 'error'
                        ? 'bg-red-500'
                        : item.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-primary-500'
                    }`}
                    variants={progressBarVariants}
                    initial="initial"
                    animate="animate"
                    custom={item.progress}
                  />
                </div>

                {/* Error Message */}
                {item.error && (
                  <p className="text-xs text-red-400 mt-2">{item.error}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
