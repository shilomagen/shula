import { Module } from '@nestjs/common';
import { GroupParticipantsService } from './group-participants.service';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GroupParticipantsService],
  exports: [GroupParticipantsService],
})
export class GroupParticipantsModule {}
