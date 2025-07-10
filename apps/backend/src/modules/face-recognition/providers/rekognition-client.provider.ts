import { Provider } from '@nestjs/common';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

export const REKOGNITION_CLIENT = 'REKOGNITION_CLIENT';

export const RekognitionClientProvider: Provider = {
  provide: REKOGNITION_CLIENT,
  useFactory: () => {
    return new RekognitionClient({
      region: process.env.AWS_REKOGNITION_REGION,
      credentials: {
        accessKeyId: process.env.AWS_REKOGNITION_ACCESS_KEY || '',
        secretAccessKey: process.env.AWS_REKOGNITION_SECRET_KEY || '',
      },
    });
  },
};
