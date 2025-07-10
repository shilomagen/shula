import { ExtractedFaceDto } from '@/generated/http-clients/backend';
import { DetectedFace } from '@/lib/hooks/use-face-recognition';

// Extended version of the API's bounding box for easier handling
export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Type for groups returned from the API
export interface Group {
  id: string;
  name: string;
  // Add other properties as needed
}

// Face Recognition Debug Screen component props
export interface FaceRecognitionDebugProps {
  title?: string; // Optional title prop
}

// Group Selection component props
export interface GroupSelectorProps {
  onGroupSelect: (groupId: string) => void;
  disabled?: boolean;
}

// Image Uploader component props
export interface ImageUploaderProps {
  onImageUpload: (imageBase64: string) => void;
  isDisabled: boolean;
  isLoading?: boolean;
}

// Image Display component props
export interface ImageDisplayProps {
  imageBase64: string;
  faces: DetectedFace[];
  onSelectFace?: (faceId: string) => void;
  selectedFaceId?: string;
}

// Detected Face Card component props
export interface DetectedFaceCardProps {
  face: DetectedFace;
  onRecognize: (faceId: string, faceImageBase64: string) => void;
  isSelected?: boolean;
  groupId: string;
}

// State interface for the main page component
export interface FaceRecognitionDebugState {
  selectedGroupId?: string;
  uploadedImage?: string;
  faces: DetectedFace[];
  isDetecting: boolean;
  detectionError?: string;
  selectedFaceId?: string;
}
