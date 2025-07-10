export interface S3UploadResult {
  key: string; // S3 object key
  url: string; // Public URL or presigned URL for access
  expiresAt: Date; // When the object will expire
  contentType: string;
  size: number;
}
