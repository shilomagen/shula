'use client';

import { RefreshCcw, AlertCircle } from 'lucide-react';
import { useFaceRecognition } from '@/lib/hooks/use-face-recognition';
import he from '@/locales/he';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import GroupSelector from './components/group-selector';
import ImageUploader from './components/image-uploader';
import ImageDisplay from './components/image-display';
import DetectedFaceCard from './components/detected-face-card';

export default function FaceRecognitionDebugPage() {
  const translations = he.faceRecognitionDebug;
  const {
    selectedGroupId,
    uploadedImage,
    faces,
    selectedFaceId,
    detectionError,
    isDetecting,
    handleGroupSelect,
    handleImageUpload,
    handleFaceSelect,
    handleFaceRecognize,
    handleReset,
  } = useFaceRecognition();

  return (
    <div className="container max-w-7xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {translations.title}
        </h1>
        <p className="text-muted-foreground">{translations.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{translations.leftColumn.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GroupSelector
              onGroupSelect={handleGroupSelect}
              disabled={isDetecting}
            />

            {uploadedImage ? (
              <div className="space-y-4">
                <ImageDisplay
                  imageBase64={uploadedImage}
                  faces={faces}
                  onSelectFace={handleFaceSelect}
                  selectedFaceId={selectedFaceId}
                />
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                  size="sm"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {translations.actions.reset}
                </Button>
              </div>
            ) : (
              <ImageUploader
                onImageUpload={handleImageUpload}
                isDisabled={!selectedGroupId}
                isLoading={isDetecting}
              />
            )}

            {detectionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {translations.errors.detectionErrorTitle}
                </AlertTitle>
                <AlertDescription>{detectionError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>{translations.rightColumn.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {isDetecting ? (
              <div className="space-y-3">
                <Skeleton className="h-[150px] w-full rounded-lg" />
                <Skeleton className="h-[150px] w-full rounded-lg" />
              </div>
            ) : faces.length === 0 ? (
              <p className="text-muted-foreground">
                {uploadedImage
                  ? translations.rightColumn.noFacesDetected
                  : translations.rightColumn.placeholder}
              </p>
            ) : (
              <div className="space-y-4">
                {faces.map((face) => (
                  <DetectedFaceCard
                    key={face.id}
                    face={face}
                    onRecognize={handleFaceRecognize}
                    isSelected={face.id === selectedFaceId}
                    groupId={selectedGroupId || ''}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
