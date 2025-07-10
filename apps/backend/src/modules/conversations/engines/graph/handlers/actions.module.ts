import { Module } from '@nestjs/common';
import { S3Module } from '../../../../../common/services/s3/s3.module';
import { OutboundMessagesModule } from '../../../../outbound-messages/outbound-messages.module';
import { PersonsModule } from '../../../../persons/persons.module';
import { ActionType } from '../actions/actions';
import { ActionRegistryService } from './action-registry.service';
import { ConnectPersonActionHandler } from './connect-person.handler';
import { EscalationActionHandler } from './escalation.handler';
import { RemovePersonActionHandler } from './remove-person.handler';

// Provider to initialize action handlers
const actionHandlersProvider = {
  provide: 'ACTION_HANDLERS',
  useFactory: (
    registry: ActionRegistryService,
    createPersonHandler: ConnectPersonActionHandler,
    removePersonHandler: RemovePersonActionHandler,
    escalationHandler: EscalationActionHandler
  ) => {
    registry.registerHandler(ActionType.CONNECT_PERSON, createPersonHandler);
    registry.registerHandler(ActionType.REMOVE_PERSON, removePersonHandler);
    registry.registerHandler(ActionType.ESCALATION, escalationHandler);
    return registry;
  },
  inject: [
    ActionRegistryService,
    ConnectPersonActionHandler,
    RemovePersonActionHandler,
    EscalationActionHandler,
  ],
};

@Module({
  imports: [PersonsModule, S3Module, OutboundMessagesModule],
  providers: [
    ActionRegistryService,
    ConnectPersonActionHandler,
    RemovePersonActionHandler,
    EscalationActionHandler,
    actionHandlersProvider,
  ],
  exports: [ActionRegistryService],
})
export class ActionsModule {}
