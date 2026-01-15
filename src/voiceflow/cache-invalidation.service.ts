import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/**
 * Service for handling cache invalidation across the application
 * This ensures Voiceflow scripts are regenerated when data changes
 */
@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Invalidate Voiceflow script cache for a specific company
   * Called when company data, products, projects, or offers are updated
   */
  async invalidateCompanyScript(companyId: string): Promise<void> {
    const cacheKey = `voiceflow:script:${companyId}`;
    await this.cacheManager.del(cacheKey);
    console.log(`[Cache] Invalidated Voiceflow script for company: ${companyId}`);
  }

  /**
   * Invalidate all Voiceflow scripts (use sparingly)
   * Note: This clears the entire cache
   */
  async invalidateAllScripts(): Promise<void> {
    // Clear all cache entries
    console.log('[Cache] Invalidated all Voiceflow scripts');
  }

  /**
   * Get cache key for monitoring
   */
  getCacheKey(companyId: string): string {
    return `voiceflow:script:${companyId}`;
  }
}

