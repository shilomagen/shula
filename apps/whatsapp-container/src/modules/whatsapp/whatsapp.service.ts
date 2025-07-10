import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContextLogger } from 'nestjs-context-logger';
import qrcode from 'qrcode-terminal';
import { match } from 'ts-pattern';
import { Client, Events, LocalAuth, RemoteAuth } from 'whatsapp-web.js';
import { AwsS3Store } from 'wwebjs-aws-s3';
import { WithExecutionContext } from '../../decorators/with-execution-context.decorator';
import { WhatsAppEvent } from '../../decorators/whatsapp-event.enum';
import { GroupHandlersService } from './handlers/group-handlers.service';
import { MessageHandlersService } from './handlers/message-handlers.service';
import { MessageReactionsQueueService } from './queues/message-reactions.queue';
import { WhatsAppStatusQueueService } from './queues/whatsapp-status.queue';

@Injectable()
export class WhatsAppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new ContextLogger(WhatsAppService.name);
  private client!: Client;
  private isClientReady = false;
  private connectionFailureCount = 0;
  private lastReconnectAttempt = 0;
  private readonly reconnectThrottleMs = 60000; // 1 minute
  private readonly maxBackoffMs = 300000; // 5 minutes
  private readonly maxFailuresBeforeEscalation = 10;
  private currentQrCode: string | null = null;
  private lastState: string | null = null;
  private lastHealthCheckTime = 0;
  private isHealthCheckRunning = false;

  constructor(
    private readonly statusQueueService: WhatsAppStatusQueueService,
    private readonly groupHandlersService: GroupHandlersService,
    private readonly messageHandlersService: MessageHandlersService,
    private readonly messageReactionsQueueService: MessageReactionsQueueService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('WhatsApp service initializing...');
      await this.createNewClientAndInitialize();
      this.lastHealthCheckTime = Date.now();
      this.logger.log(
        'WhatsApp service initialized with scheduled health checks'
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to initialize WhatsApp client: ${errorMessage}`,
        {
          error,
        }
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.client) {
        this.logger.log('Destroying WhatsApp client...');
        await this.client.destroy();
      }
    } catch (error) {
      this.logger.error(
        `Error during WhatsApp client destruction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Cron job that runs every 30 seconds to check the health of the WhatsApp client
   * Only runs if the client is initialized and if it's been at least 30 seconds since the last check
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async healthCheckCron() {
    const now = Date.now();

    // Skip if another health check is already running
    if (this.isHealthCheckRunning) {
      this.logger.debug(
        'Skipping health check - another check is already running'
      );
      return;
    }

    // Only run health check if client is initialized
    if (!this.client) {
      this.logger.debug('Skipping health check - client not initialized');
      return;
    }

    try {
      this.isHealthCheckRunning = true;
      this.lastHealthCheckTime = now;

      // Log the current status
      const status = this.getStatus();
      this.logger.debug('Running health check. Current status', { status });

      // Log event listener counts to check for potential memory leaks
      const messageReceivedListeners = this.client.listenerCount(
        Events.MESSAGE_RECEIVED
      );
      const messageAckListeners = this.client.listenerCount(Events.MESSAGE_ACK);
      const readyListeners = this.client.listenerCount(Events.READY);
      const disconnectedListeners = this.client.listenerCount(
        Events.DISCONNECTED
      );

      this.logger.debug('Event listener counts', {
        MESSAGE_RECEIVED: messageReceivedListeners,
        MESSAGE_ACK: messageAckListeners,
        READY: readyListeners,
        DISCONNECTED: disconnectedListeners,
      });

      if (!status.isHealthy) {
        this.logger.warn('WhatsApp Status unhealthy', { status });
      }

      // Check connection health (but don't emit events)
      await this.checkConnectionHealth();
    } catch (error) {
      this.logger.error('Error in scheduled health check', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Log detailed error information
      if (error instanceof Error && error.stack) {
        this.logger.error('Health check error stack', { stack: error.stack });
      }
    } finally {
      this.isHealthCheckRunning = false;
    }
  }

  // Event handler methods with trace contexts
  @WithExecutionContext(WhatsAppEvent.QR_CODE)
  async onQrCode(qr: string): Promise<void> {
    this.logger.log(`QR Code received, scan to authenticate: ${qr}`);
    // Store the QR code for later retrieval
    this.currentQrCode = qr;

    // Add QR code job to the queue
    this.statusQueueService
      .addQrCodeJob({
        qrCode: qr,
        timestamp: Date.now(),
      })
      .catch((error) => {
        this.logger.error(
          `Failed to add QR code job to queue: ${error.message}`
        );
      });

    // Display QR code in terminal for debugging
    qrcode.generate(qr);
  }

  @WithExecutionContext(WhatsAppEvent.MESSAGE_REACTION)
  async onMessageReaction(messageReaction: any): Promise<void> {
    try {
      this.logger.log('Received message reaction event', { messageReaction });
      await match(messageReaction)
        .with({ reaction: '' } as any, async (data) => {
          this.logger.log('Processing reaction removed event');
          await this.messageReactionsQueueService.publishReactionRemovedEvent(
            data
          );
        })
        .otherwise(async (data: any) => {
          this.logger.log('Processing reaction added event', {
            reaction: data.reaction,
          });
          await this.messageReactionsQueueService.publishReactionAddedEvent(
            data
          );
        });
    } catch (error) {
      this.logger.error(
        `Error handling message reaction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  @WithExecutionContext(WhatsAppEvent.READY)
  async onReady(): Promise<void> {
    this.isClientReady = true;
    this.currentQrCode = null; // Clear QR code when authenticated
    this.lastState = 'CONNECTED';
    this.logger.log('WhatsApp client is ready and authenticated!');

    // Add status update job to the queue
    this.statusQueueService
      .addStatusUpdateJob({
        isHealthy: true,
        state: this.lastState,
        failureCount: 0,
        timestamp: Date.now(),
      })
      .catch((error) => {
        this.logger.error(
          `Failed to add status update job to queue: ${error.message}`
        );
      });

    // Log that health checks will now be active
    this.logger.log(
      'WhatsApp client is ready - scheduled health checks are now active'
    );
  }

  @WithExecutionContext(WhatsAppEvent.AUTHENTICATION_FAILURE)
  async onAuthenticationFailure(msg: string): Promise<void> {
    this.isClientReady = false;
    this.lastState = 'AUTHENTICATION_FAILURE';
    this.logger.error(`Authentication failure: ${msg}`);

    // Add status update job to the queue
    this.statusQueueService
      .addStatusUpdateJob({
        isHealthy: false,
        state: this.lastState,
        failureCount: this.connectionFailureCount,
        timestamp: Date.now(),
      })
      .catch((error) => {
        this.logger.error(
          `Failed to add status update job to queue: ${error.message}`
        );
      });
  }

  @WithExecutionContext(WhatsAppEvent.DISCONNECTED)
  async onDisconnected(reason: string): Promise<void> {
    this.logger.error(`WhatsApp client browser disconnected: ${reason}`);
    this.isClientReady = false;

    // Set specific state for logout events
    if (reason === 'LOGOUT') {
      this.lastState = 'LOGOUT';
    } else {
      this.lastState = 'BROWSER_DISCONNECTED';
    }

    // Add status update job to the queue
    this.statusQueueService
      .addStatusUpdateJob({
        isHealthy: false,
        state: this.lastState,
        failureCount: this.connectionFailureCount,
        timestamp: Date.now(),
      })
      .catch((error) => {
        this.logger.error(
          `Failed to add status update job to queue: ${error.message}`
        );
      });
  }

  @WithExecutionContext(WhatsAppEvent.GROUP_JOIN)
  async onGroupJoin(notification: any): Promise<void> {
    this.logger.log('Received GROUP_JOIN event', { notification });
    this.groupHandlersService.handleGroupJoin(notification);
  }

  @WithExecutionContext(WhatsAppEvent.GROUP_LEAVE)
  async onGroupLeave(notification: any): Promise<void> {
    this.logger.log('Received GROUP_LEAVE event', { notification });
    this.groupHandlersService.handleGroupLeave(notification);
  }

  @WithExecutionContext(WhatsAppEvent.GROUP_ADMIN_CHANGED)
  async onGroupAdminChanged(notification: any): Promise<void> {
    this.logger.log('Received GROUP_ADMIN_CHANGED event', { notification });
    this.groupHandlersService.handleGroupAdminChanged(notification);
  }

  @WithExecutionContext(WhatsAppEvent.MESSAGE_RECEIVED)
  async onMessageReceived(message: any): Promise<void> {
    this.logger.log('Received MESSAGE_RECEIVED event', { message });
    this.messageHandlersService.handleMessageReceived(message);
  }

  @WithExecutionContext(WhatsAppEvent.MESSAGE_ACK)
  async onMessageAck(message: any, ack: any): Promise<void> {
    this.logger.log('Received MESSAGE_ACK event', {
      messageId: message.id,
      ack,
    });
    this.messageHandlersService.handleMessageAck(message, ack);
  }

  @WithExecutionContext(WhatsAppEvent.CHANGE_STATE)
  async onChangeState(state: string): Promise<void> {
    this.logger.log('WhatsApp client state changed', { state });
  }

  @WithExecutionContext(WhatsAppEvent.LOADING_SCREEN)
  async onLoadingScreen(percent: number, message: string): Promise<void> {
    this.logger.log('WhatsApp loading screen', { percent, message });
  }

  @WithExecutionContext(WhatsAppEvent.MESSAGE_CREATE)
  async onMessageCreate(message: any): Promise<void> {
    this.logger.log('Message created', { messageId: message.id });
  }

  @WithExecutionContext(WhatsAppEvent.MESSAGE_REVOKE)
  async onMessageRevokeEveryone(message: any): Promise<void> {
    this.logger.log('Message revoked', { messageId: message.id });
  }

  @WithExecutionContext(WhatsAppEvent.MEDIA_UPLOADED)
  async onMediaUploaded(message: any): Promise<void> {
    this.logger.log('Media uploaded for message', { messageId: message.id });
  }

  private initializeS3Client() {
    try {
      const accessKeyId = this.configService.get('s3.sessionsAccessKeyId');
      const secretAccessKey = this.configService.get(
        's3.sessionsSecretAccessKey'
      );
      const region = this.configService.get('s3.region');
      const bucketName = this.configService.get('s3.sessionsBucketName');

      // Log S3 configuration (without exposing sensitive data)
      if (!accessKeyId || !secretAccessKey) {
        throw new Error('S3 credentials are required');
      }

      // Create S3 client
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('S3 client created successfully');

      // Test S3 connectivity
      this.logger.log(`Testing S3 connectivity to bucket: ${bucketName}`);

      // Create the AWS S3 store
      return new AwsS3Store({
        bucketName,
        remoteDataPath: 'whatsapp-sessions/',
        s3Client: s3Client,
        putObjectCommand: PutObjectCommand,
        headObjectCommand: HeadObjectCommand,
        getObjectCommand: GetObjectCommand,
        deleteObjectCommand: DeleteObjectCommand,
      });
    } catch (error) {
      this.logger.error(
        `Failed to initialize AWS S3 store: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );

      // Log detailed error information
      if (error instanceof Error && error.stack) {
        this.logger.error(`S3 initialization error stack: ${error.stack}`);
      }
    }
  }

  private initializeWhatsAppClient(): void {
    try {
      this.logger.log('Creating WhatsApp client...');
      const store = this.initializeS3Client();

      // Add detailed logging for puppeteer configuration
      this.logger.log(
        'Configuring puppeteer with browser args: --no-sandbox, --disable-setuid-sandbox'
      );

      this.client = new Client({
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        authStrategy:
          process.env.NODE_ENV === 'production'
            ? new RemoteAuth({
                store,
                clientId: this.configService.get('s3.sessionId'),
                backupSyncIntervalMs: 300000,
              })
            : new LocalAuth({}),
      });

      // Add client instance tracking
      this.logger.log(
        `WhatsApp client instance created: ${
          this.client ? 'success' : 'failed'
        }`
      );

      this.setupEventListeners();
      this.logger.log('WhatsApp client created successfully');
    } catch (error) {
      this.logger.error(
        `Failed to create WhatsApp client: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Add logging to track event registration
    this.logger.log('Setting up WhatsApp client event listeners');

    // Track existing listeners to avoid duplicates
    const existingEvents = this.client.listenerCount(Events.MESSAGE_RECEIVED);
    if (existingEvents > 0) {
      this.logger.warn(
        `Found ${existingEvents} existing MESSAGE_RECEIVED listeners - potential duplicate`
      );
      // Remove existing listeners before adding new ones
      this.removeAllEventListeners();
    }

    // Register event handlers using class methods with trace contexts
    this.client.on('qr', this.onQrCode.bind(this));
    this.client.on('message_reaction', this.onMessageReaction.bind(this));
    this.client.on(Events.READY, this.onReady.bind(this));
    this.client.on(
      Events.AUTHENTICATION_FAILURE,
      this.onAuthenticationFailure.bind(this)
    );
    this.client.on(Events.DISCONNECTED, this.onDisconnected.bind(this));
    this.client.on(Events.GROUP_JOIN, this.onGroupJoin.bind(this));
    this.client.on(Events.GROUP_LEAVE, this.onGroupLeave.bind(this));
    this.client.on(
      Events.GROUP_ADMIN_CHANGED,
      this.onGroupAdminChanged.bind(this)
    );
    this.client.on(Events.MESSAGE_RECEIVED, this.onMessageReceived.bind(this));
    this.client.on(Events.MESSAGE_ACK, this.onMessageAck.bind(this));
    this.client.on('change_state', this.onChangeState.bind(this));
    this.client.on('loading_screen', this.onLoadingScreen.bind(this));
    this.client.on('message_create', this.onMessageCreate.bind(this));
    this.client.on(
      'message_revoke_everyone',
      this.onMessageRevokeEveryone.bind(this)
    );
    this.client.on('media_uploaded', this.onMediaUploaded.bind(this));

    this.logger.log(
      'All WhatsApp client event listeners registered successfully'
    );
  }

  /**
   * Remove all event listeners from the client
   * This prevents duplicate event handling when the client is recreated
   */
  private removeAllEventListeners(): void {
    if (!this.client) {
      return;
    }

    this.logger.log('Removing all existing event listeners');

    // List of all events to remove
    const events = [
      'qr',
      'message_reaction',
      Events.READY,
      Events.AUTHENTICATION_FAILURE,
      Events.DISCONNECTED,
      Events.GROUP_JOIN,
      Events.GROUP_LEAVE,
      Events.GROUP_ADMIN_CHANGED,
      Events.MESSAGE_RECEIVED,
      Events.MESSAGE_ACK,
      'change_state',
      'loading_screen',
      'message_create',
      'message_revoke_everyone',
      'media_uploaded',
    ];

    // Remove all listeners for each event
    events.forEach((event) => {
      this.client.removeAllListeners(event);
    });

    this.logger.log('All event listeners removed successfully');
  }

  async resetConnection(): Promise<void> {
    try {
      this.logger.log('Resetting WhatsApp connection...');
      await this.createNewClientAndInitialize();
      this.logger.log('WhatsApp connection reset completed');
    } catch (error) {
      this.logger.error(
        `Failed to reset WhatsApp connection: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  async checkConnectionHealth(): Promise<boolean> {
    try {
      this.logger.debug('Checking WhatsApp connection state...');

      // First check the state of the client
      const state = (await this.client.getState()) || 'UNKNOWN';
      this.logger.debug('Retrieved WhatsApp state', { state });

      if (state !== 'CONNECTED') {
        this.connectionFailureCount++;

        // if (this.connectionFailureCount > this.maxFailuresBeforeEscalation) {
        //   this.logger.error('Connection failure threshold exceeded', {
        //     failureCount: this.connectionFailureCount,
        //     maxFailures: this.maxFailuresBeforeEscalation,
        //   });
        //   // this.triggerEscalation();
        // }

        return false;
      }

      // Next, verify the connection by making a simple API call
      this.logger.debug(
        'Attempting to get WWeb version to verify connection...'
      );

      try {
        const state = await this.client.getState();
        if (state !== 'CONNECTED') {
          this.connectionFailureCount++;
          return false;
        }

        // Reset failure count on successful connection
        this.connectionFailureCount = 0;
        return true;
      } catch (error) {
        this.connectionFailureCount++;
        this.logger.error('Failed to get WWeb version', {
          error: error instanceof Error ? error.message : 'Unknown error',
          failureCount: this.connectionFailureCount,
        });

        if (this.connectionFailureCount > this.maxFailuresBeforeEscalation) {
          this.logger.error('Connection failure threshold exceeded', {
            failureCount: this.connectionFailureCount,
            maxFailures: this.maxFailuresBeforeEscalation,
          });
          this.triggerEscalation();
        }

        return false;
      }
    } catch (error) {
      this.connectionFailureCount++;
      this.logger.error('Error checking connection health', {
        error: error instanceof Error ? error.message : 'Unknown error',
        failureCount: this.connectionFailureCount,
      });

      if (this.connectionFailureCount > this.maxFailuresBeforeEscalation) {
        this.logger.error('Connection failure threshold exceeded', {
          failureCount: this.connectionFailureCount,
          maxFailures: this.maxFailuresBeforeEscalation,
        });
        this.triggerEscalation();
      }

      return false;
    }
  }

  /**
   * Attempt to reconnect to WhatsApp with progressive strategy
   */
  private async _attemptReconnect(): Promise<void> {
    const now = Date.now();

    // Calculate dynamic backoff based on failure count (exponential backoff)
    const backoffMs = Math.min(
      this.reconnectThrottleMs *
        Math.pow(1.5, Math.min(this.connectionFailureCount - 1, 5)),
      this.maxBackoffMs // Max 5 minutes
    );

    // Check if we should throttle reconnection attempts
    if (now - this.lastReconnectAttempt < backoffMs) {
      this.logger.warn(
        `Reconnection attempt throttled. Next attempt in ${
          (backoffMs - (now - this.lastReconnectAttempt)) / 1000
        } seconds.`
      );
      return;
    }

    this.logger.log(
      `Attempting to reconnect to WhatsApp (failure count: ${this.connectionFailureCount})`
    );

    // Update last reconnect attempt timestamp
    this.lastReconnectAttempt = now;

    try {
      // Add detailed logging for reconnection strategy
      this.logger.log(
        `Using reconnection strategy for failure count: ${this.connectionFailureCount}, last state: ${this.lastState}`
      );

      // Check if the last state was LOGOUT or BROWSER_DISCONNECTED
      if (
        this.lastState === 'BROWSER_DISCONNECTED' ||
        this.lastState === 'LOGOUT'
      ) {
        // For logout or browser disconnection, always create a new client
        this.logger.log(
          'Strategy: Complete client recreation due to logout or browser disconnection'
        );
        await this.createNewClientAndInitialize();
      } else if (this.connectionFailureCount <= 3) {
        // For first few failures, just try to reinitialize
        this.logger.log('Strategy: Simple reinitialization');
        await this.client.initialize();
        this.logger.log('Client reinitialization completed');
      } else if (this.connectionFailureCount <= 6) {
        // For more failures, try resetState
        this.logger.log('Strategy: Reset state and reinitialize');
        if (this.client) {
          this.isClientReady = false;
          await this.client.resetState();
          this.logger.log('Client state reset completed');
          await this.client.initialize();
          this.logger.log('Client reinitialization after reset completed');
        } else {
          this.logger.log('Client not available, creating new client');
          await this.createNewClientAndInitialize();
        }
      } else {
        // For persistent failures, recreate the client
        this.logger.log('Strategy: Complete client recreation');
        await this.createNewClientAndInitialize();
      }

      this.logger.log('Reconnection attempt completed successfully');
    } catch (error) {
      this.logger.error(
        `Reconnection attempt failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );

      // Add detailed error logging
      if (error instanceof Error && error.stack) {
        this.logger.error(`Reconnection error stack: ${error.stack}`);
      }

      // Check if we need to escalate
      if (this.connectionFailureCount >= this.maxFailuresBeforeEscalation) {
        this.triggerEscalation();
      }
    }
  }

  /**
   * Create a new client and initialize it
   */
  private async createNewClientAndInitialize(): Promise<void> {
    try {
      this.logger.log('Creating new WhatsApp client and initializing...');
      // Destroy the current client if it exists
      if (this.client) {
        this.isClientReady = false;
        this.logger.log('Existing client found, attempting to destroy it...');

        // Remove all event listeners first
        this.removeAllEventListeners();
        this.logger.log('All event listeners removed from existing client');

        // Add client state logging before destruction
        try {
          const state = await this.client
            .getState()
            .catch((e) => 'ERROR_GETTING_STATE');
          this.logger.log(`Client state before destruction: ${state}`);
        } catch (stateError: unknown) {
          const errorMessage =
            stateError instanceof Error ? stateError.message : 'Unknown error';
          this.logger.warn(`Unable to get client state: ${errorMessage}`);
        }

        try {
          await this.client.destroy();
          this.logger.log('Existing WhatsApp client destroyed successfully');
        } catch (destroyError) {
          this.logger.error(
            `Error destroying existing client: ${
              destroyError instanceof Error
                ? destroyError.message
                : 'Unknown error'
            }`
          );
          if (destroyError instanceof Error && destroyError.stack) {
            this.logger.error(
              `Client destruction error stack: ${destroyError.stack}`
            );
          }
        }
      } else {
        this.logger.log(
          'No existing client found, proceeding with initialization'
        );
      }

      // Create a new client
      this.logger.log('Initializing new WhatsApp client...');
      this.initializeWhatsAppClient();

      // Add pre-initialization memory logging
      const memoryBeforeInit = process.memoryUsage();
      this.logger.log(
        `Memory usage before client initialization: ${JSON.stringify({
          rss: `${Math.round(memoryBeforeInit.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(
            memoryBeforeInit.heapTotal / 1024 / 1024
          )} MB`,
          heapUsed: `${Math.round(memoryBeforeInit.heapUsed / 1024 / 1024)} MB`,
        })}`
      );

      await this.client.initialize();
      this.logger.log('Client initialization completed successfully');

      // Log system resources after client initialization
      const memoryAfterInit = process.memoryUsage();
      this.logger.log(
        `Memory usage after client initialization: ${JSON.stringify({
          rss: `${Math.round(memoryAfterInit.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(
            memoryAfterInit.heapTotal / 1024 / 1024
          )} MB`,
          heapUsed: `${Math.round(memoryAfterInit.heapUsed / 1024 / 1024)} MB`,
        })}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to create and initialize new client: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );

      // Log detailed error information
      if (error instanceof Error && error.stack) {
        this.logger.error(
          `Client creation/initialization error stack: ${error.stack}`
        );
      }

      throw error;
    }
  }

  /**
   * Trigger escalation for persistent connection failures
   */
  private triggerEscalation(): void {
    this.logger.error(
      `Critical connection failure: ${this.connectionFailureCount} consecutive failures. Manual intervention may be required.`
    );

    // Add status update job to the queue
    this.statusQueueService
      .addStatusUpdateJob({
        isHealthy: false,
        state: 'CRITICAL_FAILURE',
        failureCount: this.connectionFailureCount,
        timestamp: Date.now(),
      })
      .catch((error) => {
        this.logger.error(
          `Failed to add status update job to queue: ${error.message}`
        );
      });
  }

  /**
   * Public methods to interact with the WhatsApp client
   */

  isReady(): boolean {
    return this.isClientReady;
  }

  getClient(): Client {
    return this.client;
  }

  getConnectionFailureCount(): number {
    return this.connectionFailureCount;
  }

  /**
   * Get the current QR code if available
   * @returns The current QR code or null if not available
   */
  getCurrentQrCode(): string | null {
    return this.currentQrCode;
  }

  /**
   * Get the current WhatsApp connection status
   * @returns An object containing the current status
   */
  getStatus(): {
    isHealthy: boolean;
    state: string | null;
    failureCount: number;
    hasQrCode: boolean;
    lastHealthCheck: number;
    uptime: number;
  } {
    const now = Date.now();
    const startTime =
      this.lastHealthCheckTime > 0 ? this.lastHealthCheckTime : now;

    return {
      isHealthy: this.isClientReady,
      state: this.lastState,
      failureCount: this.connectionFailureCount,
      hasQrCode: !!this.currentQrCode,
      lastHealthCheck: now - this.lastHealthCheckTime,
      uptime: now - startTime,
    };
  }
}
