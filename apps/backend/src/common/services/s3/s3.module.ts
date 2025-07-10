import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3ClientProvider } from './s3.provider';

@Module({
  imports: [ConfigModule],
  providers: [S3ClientProvider, S3Service],
  exports: [S3Service],
})
export class S3Module {}
