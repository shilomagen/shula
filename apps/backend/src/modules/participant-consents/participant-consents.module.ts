import { Module } from '@nestjs/common';
import { ParticipantConsentsService } from './participant-consents.service';
import { PrismaService } from '../../database/prisma.service';
import { ParticipantConsentsController } from './participant-consents.controller';

@Module({
  controllers: [ParticipantConsentsController],
  providers: [ParticipantConsentsService, PrismaService],
  exports: [ParticipantConsentsService],
})
export class ParticipantConsentsModule {}
