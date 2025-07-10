import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { GroupParticipantsModule } from '../group-participants/group-participants.module';
import { OutboundMessagesModule } from '../outbound-messages/outbound-messages.module';
import { ParticipantsModule } from '../participants/participants.module';
import { PersonsModule } from '../persons/persons.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsMapper } from './conversations.mapper';
import { ConversationsService } from './conversations.service';
import { ConversationEngineService } from './engines/conversation-engine.service';
import { GraphAgent } from './engines/graph/graph-agent';
import { ActionsModule } from './engines/graph/handlers/actions.module';
import { LangfuseHelper } from './engines/graph/langfuse-helper';
import { LangfuseProvider, OpenAIProvider } from './engines/graph/providers';
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ParticipantsModule,
    PersonsModule,
    GroupParticipantsModule,
    OutboundMessagesModule,
    ActionsModule,
  ],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsMapper,
    ConversationEngineService,
    LangfuseHelper,
    GraphAgent,
    LangfuseProvider,
    OpenAIProvider,
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
