import { Injectable } from '@nestjs/common';
import { GroupAdminChangedEvent } from '@shula/shared-queues';
import { ContextLogger } from 'nestjs-context-logger';

@Injectable()
export class GroupAdminEventHandler {
  private readonly logger = new ContextLogger(GroupAdminEventHandler.name);

  async handle(event: GroupAdminChangedEvent): Promise<void> {
    this.logger.log(
      `Processing admin change event for group ${event.groupId}, participant: ${event.participantId}`
    );
  }
}
