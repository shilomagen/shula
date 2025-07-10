import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { GroupParticipantsModule } from '../group-participants/group-participants.module';
import { GroupsModule } from '../groups/groups.module';
import { ParticipantsModule } from '../participants/participants.module';
import { PersonsModule } from '../persons/persons.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsMapper } from './conversations.mapper';
import { ConversationsService } from './conversations.service';
import { GraphAgent } from './engines/graph/graph-agent';
import { LangfuseHelper } from './engines/graph/langfuse-helper';
import { LangfuseProvider, OpenAIProvider } from './engines/graph/providers';

/**
 * Module for conversations with graph-based conversation engine
 */
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    GroupsModule,
    ParticipantsModule,
    PersonsModule,
    GroupParticipantsModule,
  ],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsMapper,
    LangfuseProvider,
    LangfuseHelper,
    GraphAgent,
    OpenAIProvider,
  ],
  exports: [ConversationsService],
})
export class GraphConversationsModule {}
