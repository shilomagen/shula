import { Injectable, NotFoundException } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { PersonsService } from '../../../../persons/persons.service';
import { ActionType, BaseAction } from '../actions/actions';
import { RemovePersonAction } from '../actions/remove-person';
import { ActionHandler, ActionResult } from './action-handler.interface';

@Injectable()
export class RemovePersonActionHandler
  implements ActionHandler<RemovePersonAction>
{
  private readonly logger = new ContextLogger(RemovePersonActionHandler.name);

  constructor(private readonly personsService: PersonsService) {}

  canHandle(action: BaseAction): boolean {
    return (action as any).action === ActionType.REMOVE_PERSON;
  }

  async execute(
    action: RemovePersonAction,
    participantId: string
  ): Promise<ActionResult> {
    try {
      const { personId, groupId } = action.content;

      // Find the person by all three identifiers (personId, participantId, groupId)
      const existingPerson = await this.personsService.find({
        personId,
        participantId,
        groupId,
      });

      if (!existingPerson) {
        throw new NotFoundException(
          'Person not found with the provided identifiers'
        );
      }

      // Remove the person
      await this.personsService.remove(personId, participantId);

      return {
        success: true,
        message: action.successMessage || `Person removed successfully.`,
        data: {
          personId,
          groupId,
        },
      };
    } catch (error: any) {
      this.logger.error('Error in RemovePersonActionHandler:', { error });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: action.errorMessage || `Failed to remove person`,
        data: {
          error: errorMessage,
        },
      };
    }
  }
}
