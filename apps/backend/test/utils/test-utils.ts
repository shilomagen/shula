import { Queue } from 'bullmq';
import request from 'supertest';

/**
 * Utility to check a condition with polling until it passes or times out
 * @param checkFn Function that returns a promise resolving to boolean
 * @param timeout Maximum time to wait in ms
 * @param interval Polling interval in ms
 * @returns Promise that resolves to the check result
 */
export async function waitForCondition(
  checkFn: () => Promise<boolean>,
  timeout = 3000,
  interval = 100
): Promise<boolean> {
  const startTime = Date.now();

  // Keep checking until we timeout
  while (Date.now() - startTime < timeout) {
    // Check the condition
    const result = await checkFn();

    // If the condition is met, we're done
    if (result) {
      return true;
    }

    // Wait for the next interval
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  // One final check before giving up
  return await checkFn();
}

/**
 * Helper to verify a group was created with the expected properties
 */
export async function verifyGroupCreated(
  httpServer: any,
  groupId: string,
  name: string
): Promise<boolean> {
  try {
    const response = await request(httpServer)
      .get('/api/v1/groups')
      .expect(200);

    return (
      response.body.items.length > 0 &&
      response.body.items.some(
        (group: any) => group.whatsappGroupId === groupId && group.name === name
      )
    );
  } catch (error) {
    return false;
  }
}

/**
 * Helper to verify a participant was added to a group
 */
export async function verifyParticipantAdded(
  httpServer: any,
  groupId: string
): Promise<boolean> {
  try {
    const response = await request(httpServer)
      .get(`/api/v1/participants?groupId=${groupId}`)
      .expect(200);

    return response.body.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Reset queues by clearing all jobs
 * @param queues Array of queues to reset
 */
export async function resetQueues(queues: Queue[]): Promise<void> {
  for (const queue of queues) {
    try {
      await queue.obliterate({ force: true });
    } catch (error) {
      console.error(`Error resetting queue ${queue.name}:`, error);
    }
  }
}

/**
 * Check if a job exists in the queue
 * @param queue Queue to check
 * @param jobName Optional job name to filter by
 * @returns Promise that resolves to boolean
 */
export async function hasJobsInQueue(
  queue: Queue,
  jobName?: string
): Promise<boolean> {
  try {
    const jobs = await queue.getJobs();
    if (jobName) {
      return jobs.some((job) => job.name === jobName);
    }
    return jobs.length > 0;
  } catch (error) {
    console.error(`Error checking jobs in queue ${queue.name}:`, error);
    return false;
  }
}
