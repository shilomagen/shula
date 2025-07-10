import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { CacheService } from '../../../common/cache/cache.service';

/**
 * Service to throttle group participant sync operations
 */
@Injectable()
export class GroupSyncThrottlerService {
  private readonly logger = new ContextLogger(GroupSyncThrottlerService.name);

  // Prefix for cache keys
  private readonly KEY_PREFIX = 'sync-participants';

  // Default TTL in seconds (60 minutes)
  private readonly DEFAULT_TTL_SECONDS = 60 * 60;

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Generate the cache key for a group
   * @param groupId - The WhatsApp group ID
   * @returns The cache key for the group
   */
  private getCacheKey(groupId: string): string {
    return `${this.KEY_PREFIX}:${groupId}`;
  }

  /**
   * Check if a group sync is allowed (i.e., no recent sync has been performed)
   * @param groupId - The WhatsApp group ID
   * @returns Promise<boolean> - True if sync is allowed, false if throttled
   */
  async canSyncGroup(groupId: string): Promise<boolean> {
    const key = this.getCacheKey(groupId);
    const exists = await this.cacheService.exists(key);

    // If the key doesn't exist, sync is allowed
    return !exists;
  }

  /**
   * Mark a group as recently synced to prevent frequent syncs
   * @param groupId - The WhatsApp group ID
   * @param ttlSeconds - Optional custom TTL in seconds (defaults to 60 minutes)
   * @returns Promise<boolean> - True if successfully marked
   */
  async markGroupAsSynced(
    groupId: string,
    ttlSeconds: number = this.DEFAULT_TTL_SECONDS
  ): Promise<boolean> {
    const key = this.getCacheKey(groupId);
    const timestamp = Date.now().toString();

    const result = await this.cacheService.set(key, timestamp, ttlSeconds);
    if (result) {
      this.logger.debug(
        `Group ${groupId} marked as synced, throttled for ${ttlSeconds} seconds`
      );
    }

    return result;
  }

  /**
   * Atomically check if sync is allowed and mark as synced if it is
   * This ensures there are no race conditions between checking and setting
   *
   * @param groupId - The WhatsApp group ID
   * @param ttlSeconds - Optional custom TTL in seconds (defaults to 60 minutes)
   * @returns Promise<boolean> - True if sync should proceed, false if throttled
   */
  async shouldSyncGroup(
    groupId: string,
    ttlSeconds: number = this.DEFAULT_TTL_SECONDS
  ): Promise<boolean> {
    const key = this.getCacheKey(groupId);
    const timestamp = Date.now().toString();

    // Try to set the key only if it doesn't exist
    const result = await this.cacheService.setNX(key, timestamp, ttlSeconds);

    if (result) {
      this.logger.debug(`Group ${groupId} sync allowed and marked as synced`);
    } else {
      this.logger.debug(
        `Group ${groupId} sync throttled (recent sync detected)`
      );
    }

    return result;
  }

  /**
   * Force reset the throttling for a group (for debugging/admin purposes)
   * @param groupId - The WhatsApp group ID
   * @returns Promise<boolean> - True if successfully reset
   */
  async resetGroupSyncThrottle(groupId: string): Promise<boolean> {
    const key = this.getCacheKey(groupId);
    return await this.cacheService.delete(key);
  }
}
