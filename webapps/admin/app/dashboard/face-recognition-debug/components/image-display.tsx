'use client';

import { useMemo } from 'react';
import { ImageDisplayProps } from '../types';
import { DetectedFace } from '@/lib/hooks/use-face-recognition';
import classes from './styles.module.css';
import he from '@/locales/he';

const ImageDisplay = ({
  imageBase64,
  faces,
  onSelectFace,
  selectedFaceId,
}: ImageDisplayProps) => {
  const translations = he.faceRecognitionDebug;

  const handleFaceClick = (faceId: string) => {
    if (onSelectFace) {
      onSelectFace(faceId);
    }
  };

  // Create the bounding boxes for each face
  const boundingBoxes = useMemo(() => {
    return faces.map((face) => {
      const isSelected = selectedFaceId === face.id;
      const className = `${classes.boundingBox} ${
        isSelected ? classes.boundingBoxActive : ''
      }`;

      return (
        <div
          key={face.id}
          className={className}
          style={{
            top: `${face.boundingBox.top * 100}%`,
            left: `${face.boundingBox.left * 100}%`,
            width: `${face.boundingBox.width * 100}%`,
            height: `${face.boundingBox.height * 100}%`,
          }}
          onClick={() => handleFaceClick(face.id)}
        />
      );
    });
  }, [faces, handleFaceClick, selectedFaceId]);

  return (
    <div className={classes.imageContainer}>
      <img
        src={`data:image/jpeg;base64,${imageBase64}`}
        alt={translations.imageDisplay.uploadedImage}
        className={classes.image}
      />
      {boundingBoxes}
    </div>
  );
};

export default ImageDisplay;
