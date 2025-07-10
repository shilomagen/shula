import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';

export const S3_CLIENT = 'S3_CLIENT';

export const S3ClientProvider: Provider = {
  provide: S3_CLIENT,
  useFactory: (configService: ConfigService) => {
    const bucketName = configService.get<string>('WHATSAPP_MEDIA_BUCKET_NAME');
    const region = configService.get<string>('WHATSAPP_MEDIA_BUCKET_REGION');
    const accessKey = configService.get<string>(
      'WHATSAPP_MEDIA_BUCKET_ACCESS_KEY'
    );
    const secretKey = configService.get<string>(
      'WHATSAPP_MEDIA_BUCKET_SECRET_KEY'
    );

    if (!bucketName || !region || !accessKey || !secretKey) {
      throw new Error('Missing required S3 configuration');
    }

    return new S3Client({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  },
  inject: [ConfigService],
};
