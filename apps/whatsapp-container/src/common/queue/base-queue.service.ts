import { InjectQueue } from '@smangam/bullmq';
import { JobsOptions, Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';

export abstract class BaseQueueService<T = unknown> {
  protected readonly logger: ContextLogger;

  constructor(
    @InjectQueue() protected readonly queue: Queue,
    serviceName: string
  ) {
    this.logger = new ContextLogger(serviceName);
  }

  /**
   * Add a job to the queue
   * @param name The name of the job processor
   * @param data The data to be processed
   * @param opts Optional job options
   * @returns The job ID
   */
  async addJob(name: string, data: T, opts?: JobsOptions): Promise<string> {
    try {
      const job = await this.queue.add(name, data, opts);
      this.logger.debug(`Added job ${job.id} to queue ${this.queue.name}`);
      return job.id ?? '';
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to add job to queue ${this.queue.name}: ${error.message}`,
          { error }
        );
      } else {
        this.logger.error(
          `Failed to add job to queue ${this.queue.name}: Unknown error`
        );
      }
      throw error;
    }
  }

  /**
   * Get the count of jobs in the queue
   * @returns The count of jobs
   */
  async getJobCount(): Promise<number> {
    try {
      return await this.queue.count();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to get job count for queue ${this.queue.name}: ${error.message}`,
          { error }
        );
      } else {
        this.logger.error(
          `Failed to get job count for queue ${this.queue.name}: Unknown error`
        );
      }
      throw error;
    }
  }

  /**
   * Clear all jobs from the queue
   */
  async clearQueue(): Promise<void> {
    try {
      await this.queue.obliterate({ force: true });
      this.logger.debug(`Cleared all jobs from queue ${this.queue.name}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to clear queue ${this.queue.name}: ${error.message}`,
          { error }
        );
      } else {
        this.logger.error(
          `Failed to clear queue ${this.queue.name}: Unknown error`
        );
      }
      throw error;
    }
  }
}
