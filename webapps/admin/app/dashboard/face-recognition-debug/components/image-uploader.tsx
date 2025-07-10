'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import he from '@/locales/he';
import { ImageUploaderProps } from '../types';
import classes from './styles.module.css';

const ImageUploader = ({
  onImageUpload,
  isDisabled,
  isLoading = false,
}: ImageUploaderProps) => {
  const translations = he.faceRecognitionDebug;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.onload = () => {
        // The result is the base64 string
        // It includes the data URL prefix (e.g., data:image/jpeg;base64,)
        // We need to strip this prefix
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        onImageUpload(base64Data);
      };

      reader.readAsDataURL(file);
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        'image/jpeg': [],
        'image/png': [],
      },
      maxSize: 5 * 1024 * 1024, // 5MB
      disabled: isDisabled || isLoading,
      multiple: false,
    });

  const getIconColor = () => {
    if (isDragReject) return 'text-destructive';
    if (isDragActive) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div
      {...getRootProps()}
      className={`${classes.dropzone} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{
        pointerEvents: isDisabled ? 'none' : 'auto',
      }}
    >
      <input {...getInputProps()} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[120px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">
            {translations.imageUploader.loading}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[120px] pointer-events-none">
          {isDragReject ? (
            <X className="h-10 w-10 text-destructive" />
          ) : (
            <Image className={`h-10 w-10 ${getIconColor()}`} />
          )}

          <p className="mt-2 text-base">
            {isDragActive
              ? translations.imageUploader.dropHere
              : isDisabled
              ? translations.imageUploader.selectGroupFirst
              : translations.imageUploader.dragDrop}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {translations.imageUploader.fileSizeLimit}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
