import { Processor, WorkerHost } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import { ConsentResponseType } from '@prisma/client';
import {
  MessageReactionAddedEvent,
  MessageReactionEvent,
  MessageReactionEventType,
  MessageReactionRemovedEvent,
  QUEUE_NAMES,
  WithContext,
} from '@shula/shared-queues';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { match } from 'ts-pattern';
import { formatPhoneNumber } from '../../../common/utils';
import { PrismaService } from '../../../database/prisma.service';
import { ParticipantConsentsService } from '../../participant-consents/participant-consents.service';
import { ParticipantsService } from '../../participants/participants.service';

@Injectable()
@Processor(QUEUE_NAMES.MESSAGE_REACTIONS, { concurrency: 50 })
export class ReactionProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(ReactionProcessor.name);

  constructor(
    private readonly participantsService: ParticipantsService,
    private readonly participantConsentsService: ParticipantConsentsService,
    private readonly prisma: PrismaService
  ) {
    super();
  }

  @WithContext()
  async process(job: Job<MessageReactionEvent>): Promise<void> {
    try {
      const event = job.data;

      await match(event)
        .with(
          { eventType: MessageReactionEventType.MESSAGE_REACTION_ADDED },
          (addedEvent) =>
            this.handleReactionAdded(addedEvent as MessageReactionAddedEvent)
        )
        .with(
          { eventType: MessageReactionEventType.MESSAGE_REACTION_REMOVED },
          (removedEvent) =>
            this.handleReactionRemoved(
              removedEvent as MessageReactionRemovedEvent
            )
        )
        .otherwise(() => {
          this.logger.warn(`Unknown reaction event type`);
        });
    } catch (error) {
      this.logger.error(
        `Error processing message reaction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error; // Re-throw to let Bull handle the retry
    }
  }

  /**
   * Handle when a reaction is added to a message
   * 👍 reaction means consent is given
   * 👎 reaction means consent is revoked
   */
  private async handleReactionAdded(
    event: MessageReactionAddedEvent
  ): Promise<void> {
    try {
      const consentResponse = this.getConsentResponseFromReaction(
        event.reaction
      );
      if (consentResponse === null) {
        return;
      }

      await this.processReactionEvent(event, consentResponse);
    } catch (error) {
      this.logger.error(
        `Error handling reaction added: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Handle when a reaction is removed from a message
   * When a reaction is removed, set the consent status back to pending
   */
  private async handleReactionRemoved(
    event: MessageReactionRemovedEvent
  ): Promise<void> {
    try {
      await this.processReactionEvent(event, ConsentResponseType.pending);
    } catch (error) {
      this.logger.error(
        `Error handling reaction removed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Process a reaction event by updating the participant's consent status
   * @param event The reaction event
   * @param consentResponse The consent response type to set
   */
  private async processReactionEvent(
    event: MessageReactionAddedEvent | MessageReactionRemovedEvent,
    consentResponse: ConsentResponseType
  ): Promise<void> {
    const { remote: groupId, senderId, msgId } = event;
    const messageId = msgId._serialized;
    const formattedPhoneNumber = formatPhoneNumber(senderId);

    const group = await this.prisma.group.findUnique({
      where: {
        whatsappGroupId: groupId,
        consentMessageId: messageId,
      },
      select: { id: true, consentMessageId: true },
    });

    if (!group) {
      return;
    }

    const participant = await this.participantsService.findByPhoneNumber(
      formattedPhoneNumber
    );

    if (!participant) {
      return;
    }

    await this.participantConsentsService.update(group.id, participant.id, {
      consentStatus: consentResponse,
    });

    this.logger.log(
      `Updated consent for participant ${participant.id} to ${consentResponse}`
    );
  }

  /**
   * Get the consent response type based on the reaction emoji
   * @param reaction The reaction emoji
   * @returns The consent response type or null if the reaction should be ignored
   */
  private getConsentResponseFromReaction(
    reaction: string
  ): ConsentResponseType | null {
    const yes = ['👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿'];
    const no = ['👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿'];

    return match(reaction)
      .when(
        (r) => yes.includes(r),
        () => ConsentResponseType.accepted
      )
      .when(
        (r) => no.includes(r),
        () => ConsentResponseType.rejected
      )
      .otherwise(() => null);
  }
}
