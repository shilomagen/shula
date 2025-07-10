import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';

export abstract class BaseQueueProcessor<T = any, R = any> {
  protected readonly logger: ContextLogger;

  constructor(processorName: string) {
    this.logger = new ContextLogger(processorName);
  }

  /**
   * Process a job from the queue
   * @param job The job to process
   */
  abstract process(job: Job<T>): Promise<R>;

  /**
   * Handle job completion
   * @param job The completed job
   * @param result The result of the job
   */
  onCompleted(job: Job<T>, result: R): void {
    this.logger.debug(
      `Job ${job.id} completed with result: ${JSON.stringify(result)}`
    );
  }

  /**
   * Handle job failure
   * @param job The failed job
   * @param error The error that caused the failure
   */
  onFailed(job: Job<T>, error: Error): void {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`, {
      error,
    });
  }
}
