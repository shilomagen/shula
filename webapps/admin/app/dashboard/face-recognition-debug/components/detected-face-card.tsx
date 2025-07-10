'use client';

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DetectedFaceCardProps } from '../types';
import classes from './styles.module.css';
import he from '@/locales/he';
import Link from 'next/link';

const DetectedFaceCard = ({
  face,
  onRecognize,
  isSelected,
  groupId,
}: DetectedFaceCardProps) => {
  const translations = he.faceRecognitionDebug;
  const cardClass = `${classes.faceCard} ${
    isSelected ? classes.faceCardActive : ''
  }`;

  const handleRecognizeClick = () => {
    onRecognize(face.id, face.faceImageBase64);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'secondary';
    if (confidence >= 70) return 'outline';
    return 'destructive';
  };

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {translations.faceCard.faceTitle.replace('{id}', face.id)}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <img
          src={`${face.faceImageBase64}`}
          alt={translations.faceCard.faceImage}
          className={classes.faceImage}
        />

        {face.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{translations.faceCard.error}</AlertTitle>
            <AlertDescription>{face.error}</AlertDescription>
          </Alert>
        ) : face.recognitionResult ? (
          <div className="space-y-2 mt-3">
            <h4 className="font-medium text-sm">
              {translations.faceCard.recognitionResults}
            </h4>

            <div className={classes.resultItem}>
              <p className="text-sm">
                <span className="font-medium">
                  {translations.faceCard.person}:
                </span>{' '}
                {face.recognitionResult.personName ||
                  face.recognitionResult.personId}
              </p>
            </div>

            <div className={classes.resultItem}>
              <div className="flex items-center gap-1">
                <p className="text-sm">
                  <span className="font-medium">
                    {translations.faceCard.confidence}:
                  </span>
                </p>
                <Badge
                  variant={getConfidenceColor(
                    face.recognitionResult.confidence
                  )}
                >
                  {face.recognitionResult.confidence.toFixed(2)}%
                </Badge>
              </div>
            </div>

            {face.recognitionResult.participantId && (
              <div className={classes.resultItem}>
                <p className="text-sm">
                  <span className="font-medium">
                    {translations.faceCard.participant}:
                  </span>{' '}
                  {face.recognitionResult.participantName ? (
                    <Link
                      href={`/dashboard/participants/${face.recognitionResult.participantId}`}
                      className="text-primary hover:underline"
                    >
                      {face.recognitionResult.participantName}
                    </Link>
                  ) : (
                    face.recognitionResult.participantId
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={handleRecognizeClick}
            className="w-full mt-3"
            disabled={face.isRecognizing || !groupId}
            size="sm"
          >
            {face.isRecognizing
              ? translations.faceCard.recognizing
              : translations.faceCard.recognizeFace}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DetectedFaceCard;
