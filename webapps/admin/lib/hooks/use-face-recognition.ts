'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getGroups,
  extractFaces,
  recognizeFace,
  EnhancedRecognizedPerson,
} from '../actions/face-recognition';
import he from '@/locales/he';

// Query keys
export const faceRecognitionKeys = {
  all: ['faceRecognition'] as const,
  groups: () => [...faceRecognitionKeys.all, 'groups'] as const,
  detect: () => [...faceRecognitionKeys.all, 'detect'] as const,
  recognize: () => [...faceRecognitionKeys.all, 'recognize'] as const,
};

// Face recognition types
export interface DetectedFace {
  id: string;
  faceImageBase64: string;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  recognitionResult?: RecognitionResult;
  isRecognizing: boolean;
  error?: string;
}

export interface RecognitionResult {
  personId: string;
  personName?: string;
  confidence: number;
  participantId?: string;
  participantName?: string;
}

// Hook for fetching groups
export function useGroups() {
  const result = useQuery({
    queryKey: faceRecognitionKeys.groups(),
    queryFn: getGroups,
  });

  return {
    groups: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
  };
}

// Hook for face recognition debug screen
export function useFaceRecognition() {
  const translations = he.faceRecognitionDebug;
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [uploadedImage, setUploadedImage] = useState<string | undefined>();
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [selectedFaceId, setSelectedFaceId] = useState<string | undefined>();
  const [detectionError, setDetectionError] = useState<string | undefined>();

  // Face detection mutation
  const { mutate: detectFacesMutation, isPending: isDetecting } = useMutation({
    mutationFn: extractFaces,
    onSuccess: (extractedFaces) => {
      // Map the API response to our DetectedFace interface
      const detectedFaces: DetectedFace[] = extractedFaces.map(
        (face, index) => ({
          id: `face-${index + 1}`,
          faceImageBase64: face.imageBase64 || '',
          boundingBox: {
            top: face.boundingBox.y,
            left: face.boundingBox.x,
            width: face.boundingBox.width,
            height: face.boundingBox.height,
          },
          isRecognizing: false,
        })
      );

      setFaces(detectedFaces);
      setDetectionError(undefined);

      if (detectedFaces.length > 0) {
        setSelectedFaceId(detectedFaces[0].id);
      }
    },
    onError: (error) => {
      console.error('Error detecting faces:', error);
      setDetectionError(translations.errors.detectionFailed);
    },
  });

  // Face recognition mutation
  const { mutate: recognizeFaceMutation } = useMutation<
    EnhancedRecognizedPerson[], // Using the enhanced type with person and participant details
    Error,
    { faceImageBase64: string; groupId: string },
    { faceId: string | undefined }
  >({
    mutationFn: ({ faceImageBase64, groupId }) =>
      recognizeFace(faceImageBase64, groupId),
    onMutate: (variables) => {
      // Return context for use in onSuccess/onError callbacks
      return {
        faceId: faces.find(
          (face) => face.faceImageBase64 === variables.faceImageBase64
        )?.id,
      };
    },
    onSuccess: (recognizedPersons, variables, context) => {
      if (!context?.faceId) return;

      let recognitionResult: RecognitionResult | undefined;

      if (recognizedPersons.length > 0) {
        const topMatch = recognizedPersons[0];
        recognitionResult = {
          personId: topMatch.personId,
          personName: topMatch.personName,
          confidence: topMatch.confidence,
          participantId: topMatch.participantId,
          participantName: topMatch.participantName,
        };
      }

      // Update the specific face with recognition results
      setFaces((prevFaces) =>
        prevFaces.map((face) =>
          face.id === context.faceId
            ? {
                ...face,
                isRecognizing: false,
                recognitionResult,
                error: !recognitionResult
                  ? translations.errors.noMatch
                  : undefined,
              }
            : face
        )
      );
    },
    onError: (error, variables, context) => {
      console.error('Error recognizing face:', error);

      if (!context?.faceId) return;

      setFaces((prevFaces) =>
        prevFaces.map((face) =>
          face.id === context.faceId
            ? {
                ...face,
                isRecognizing: false,
                error: translations.errors.recognitionFailed,
              }
            : face
        )
      );
    },
  });

  // Handler functions
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setUploadedImage(undefined);
    setFaces([]);
    setDetectionError(undefined);
    setSelectedFaceId(undefined);
  };

  const handleImageUpload = (imageBase64: string) => {
    setUploadedImage(imageBase64);
    detectFacesMutation(imageBase64);
  };

  const handleFaceSelect = (faceId: string) => {
    setSelectedFaceId(faceId);
  };

  const handleFaceRecognize = (faceId: string, faceImageBase64: string) => {
    if (!selectedGroupId) return;

    // Update face's recognizing state
    setFaces((prevFaces) =>
      prevFaces.map((face) =>
        face.id === faceId
          ? { ...face, isRecognizing: true, error: undefined }
          : face
      )
    );

    recognizeFaceMutation({
      faceImageBase64,
      groupId: selectedGroupId,
    });
  };

  const handleReset = () => {
    setUploadedImage(undefined);
    setFaces([]);
    setDetectionError(undefined);
    setSelectedFaceId(undefined);
  };

  return {
    // State
    selectedGroupId,
    uploadedImage,
    faces,
    selectedFaceId,
    detectionError,
    isDetecting,

    // Handlers
    handleGroupSelect,
    handleImageUpload,
    handleFaceSelect,
    handleFaceRecognize,
    handleReset,
  };
}
