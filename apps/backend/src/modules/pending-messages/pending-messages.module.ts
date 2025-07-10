import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { GroupMessagesModule } from '../group-messages/group-messages.module';
import { PendingMessagesService } from './pending-messages.service';

@Module({
  imports: [PrismaModule, GroupMessagesModule],
  providers: [PendingMessagesService],
  exports: [PendingMessagesService],
})
export class PendingMessagesModule {}
