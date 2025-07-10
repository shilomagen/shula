import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContextLogger } from 'nestjs-context-logger';

/**
 * WhatsApp event types
 */
export enum WhatsAppEventType {
  CONNECTION_FAILED = 'whatsapp.connection.failed',
  CONNECTION_RESTORED = 'whatsapp.connection.restored',
  STATUS_CHANGED = 'whatsapp.status.changed',
  QR_CODE_RECEIVED = 'whatsapp.qr.received',
}

/**
 * Base interface for WhatsApp events
 */
export interface WhatsAppEvent {
  timestamp: number;
  type: WhatsAppEventType;
}

/**
 * Connection failed event
 */
export interface ConnectionFailedEvent extends WhatsAppEvent {
  type: WhatsAppEventType.CONNECTION_FAILED;
  failureCount: number;
  lastState: string | null;
  errorMessage?: string;
}

/**
 * Connection restored event
 */
export interface ConnectionRestoredEvent extends WhatsAppEvent {
  type: WhatsAppEventType.CONNECTION_RESTORED;
  previousFailureCount: number;
}

/**
 * Status changed event
 */
export interface StatusChangedEvent extends WhatsAppEvent {
  type: WhatsAppEventType.STATUS_CHANGED;
  isHealthy: boolean;
  state: string | null;
  failureCount: number;
  lastCheckTimestamp: number;
}

/**
 * QR code received event
 */
export interface QrCodeReceivedEvent extends WhatsAppEvent {
  type: WhatsAppEventType.QR_CODE_RECEIVED;
  qrCode: string;
}

/**
 * Service for emitting WhatsApp-related events
 */
@Injectable()
export class WhatsAppEventsService {
  private readonly logger = new ContextLogger(WhatsAppEventsService.name);
  private lastStatus: StatusChangedEvent | null = null;

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emit a connection failed event
   * @param failureCount Number of consecutive failures
   * @param lastState Last known state of the WhatsApp client
   * @param errorMessage Optional error message
   */
  emitConnectionFailed(
    failureCount: number,
    lastState: string | null,
    errorMessage?: string
  ): void {
    const event: ConnectionFailedEvent = {
      type: WhatsAppEventType.CONNECTION_FAILED,
      timestamp: Date.now(),
      failureCount,
      lastState,
      errorMessage,
    };

    this.logger.warn(
      `Emitting WhatsApp connection failed event (failure count: ${failureCount})`
    );
    this.eventEmitter.emit(WhatsAppEventType.CONNECTION_FAILED, event);
  }

  /**
   * Emit a connection restored event
   * @param previousFailureCount Number of failures before connection was restored
   */
  emitConnectionRestored(previousFailureCount: number): void {
    const event: ConnectionRestoredEvent = {
      type: WhatsAppEventType.CONNECTION_RESTORED,
      timestamp: Date.now(),
      previousFailureCount,
    };

    this.logger.log(
      `Emitting WhatsApp connection restored event (previous failures: ${previousFailureCount})`
    );
    this.eventEmitter.emit(WhatsAppEventType.CONNECTION_RESTORED, event);
  }

  /**
   * Emit a status changed event, but only if the status has actually changed
   * @param isHealthy Whether the connection is healthy
   * @param state Current state of the WhatsApp client
   * @param failureCount Number of consecutive failures
   * @returns Whether the event was emitted (i.e., whether the status changed)
   */
  emitStatusChanged(
    isHealthy: boolean,
    state: string | null,
    failureCount: number
  ): boolean {
    const now = Date.now();
    const event: StatusChangedEvent = {
      type: WhatsAppEventType.STATUS_CHANGED,
      timestamp: now,
      isHealthy,
      state,
      failureCount,
      lastCheckTimestamp: now,
    };

    // Check if status has changed
    const hasChanged =
      !this.lastStatus ||
      this.lastStatus.isHealthy !== isHealthy ||
      this.lastStatus.state !== state ||
      this.lastStatus.failureCount !== failureCount;

    if (hasChanged) {
      this.logger.log(
        `Emitting WhatsApp status changed event (healthy: ${isHealthy}, state: ${state})`
      );
      this.eventEmitter.emit(WhatsAppEventType.STATUS_CHANGED, event);
      this.lastStatus = event;
      return true;
    }

    // Update the last check timestamp even if we don't emit an event
    if (this.lastStatus) {
      this.lastStatus.lastCheckTimestamp = now;
    }

    return false;
  }

  /**
   * Emit a QR code received event
   * @param qrCode The QR code string
   */
  emitQrCodeReceived(qrCode: string): void {
    const event: QrCodeReceivedEvent = {
      type: WhatsAppEventType.QR_CODE_RECEIVED,
      timestamp: Date.now(),
      qrCode,
    };

    this.logger.log('Emitting WhatsApp QR code received event');
    this.eventEmitter.emit(WhatsAppEventType.QR_CODE_RECEIVED, event);
  }
}
