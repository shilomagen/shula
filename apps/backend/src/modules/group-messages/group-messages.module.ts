import { Module } from '@nestjs/common';
import { GroupMessagesService } from './group-messages.service';
import { SystemMessagesModule } from '../system-messages/system-messages.module';
import { OutboundMessagesModule } from '../outbound-messages/outbound-messages.module';

@Module({
  imports: [SystemMessagesModule, OutboundMessagesModule],
  providers: [GroupMessagesService],
  exports: [GroupMessagesService],
})
export class GroupMessagesModule {}