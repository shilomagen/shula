import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  sessionsBucketName: process.env.BUCKET_STATE_NAME,
  region: process.env.AWS_REGION,
  sessionsAccessKeyId: process.env.BUCKET_STATE_ACCESS_KEY,
  sessionsSecretAccessKey: process.env.BUCKET_STATE_SECRET_KEY,
  sessionId: process.env.WHATSAPP_SESSION_ID,
  backupSyncIntervalMs: parseInt(
    process.env.WHATSAPP_BACKUP_SYNC_INTERVAL_MS || '300000',
    10
  ),
}));
