/**
 * useScraperCache Hook
 * ====================
 * Wraps scraper API calls with client-side IndexedDB caching.
 *
 * Flow:
 * 1. Check IndexedDB cache first
 * 2. If cache hit → return cached data (instant)
 * 3. If cache miss → call API → cache result → return
 *
 * Benefits:
 * - Instant cache hits (~5ms vs ~100ms+ API)
 * - Zero server cost for repeated requests
 * - Works offline for cached content
 * - Reduces Redis usage on backend
 */

import { useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import {
  initCache,
  cacheGet,
  cacheSet,
  cleanupClientCache,
  extractContentId
} from '@/lib/storage';
import { platformDetect } from '@/lib/utils/format';
import type { PlatformId, MediaData, MediaFormat } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════
// RESPONSE TRANSFORMATION
// ═══════════════════════════════════════════════════════════════

/**
 * Transform backend response to frontend format
 * Backend returns: { media: [{ variants: [...] }], content: {...}, engagement: {...} }
 * Frontend expects: { formats: [...], title, author, views, etc. }
 */
function transformBackendResponse(data: any): Partial<MediaData> {
  if (!data) return {};

  // If already has formats, just return it
  if (data.formats && Array.isArray(data.formats)) {
    return data;
  }

  // Transform media + variants to formats
  const formats: MediaFormat[] = [];
  if (data.media && Array.isArray(data.media)) {
    for (const mediaItem of data.media) {
      if (mediaItem.variants && Array.isArray(mediaItem.variants)) {
        for (const variant of mediaItem.variants) {
          formats.push({
            quality: variant.quality || 'unknown',
            type: mediaItem.type === 'audio' ? 'audio' : (mediaItem.type === 'image' ? 'image' : 'video'),
            url: variant.url,
            filesize: variant.filesize,
            format: variant.format || variant.mime?.split('/')[1],
            mimeType: variant.mime,
            filename: variant.filename,
            itemId: String(mediaItem.index || 0),
            thumbnail: mediaItem.thumbnail,
            needsMerge: variant.requiresMerge,
          } as MediaFormat);
        }
      }
    }
  }

  // Extract and flatten fields from nested objects
  let title = data.content?.text || data.title || '';
  let description = data.content?.description || data.description || '';
  let authorStr: string | undefined;

  if (data.author) {
    if (typeof data.author === 'string') {
      authorStr = data.author;
    } else if (typeof data.author === 'object' && data.author.name) {
      authorStr = data.author.name;
    }
  }

  // Convert engagement numbers to strings for display
  const views = data.engagement?.views
    ? String(data.engagement.views)
    : (data.views ? String(data.views) : undefined);

  return {
    title,
    description,
    author: authorStr,
    views,
    url: data.url,
    thumbnail: data.media?.[0]?.thumbnail || data.thumbnail,
    engagement: data.engagement,
    formats: formats.length > 0 ? formats : data.formats || [],
  };
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ScraperResponse {
  success: boolean;
  data?: MediaData;
  error?: string;
  errorCode?: string;
  platform?: string;
}

interface UseScraperCacheOptions {
  /** Skip cache and always fetch fresh (default: false) */
  skipCache?: boolean;
}

interface ScraperResult {
  success: boolean;
  data?: MediaData;
  error?: string;
  errorCode?: string;
  fromCache?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export function useScraperCache(options: UseScraperCacheOptions = {}) {
  const initialized = useRef(false);

  // Initialize cache on mount
  useEffect(() => {
    if (!initialized.current && typeof window !== 'undefined') {
      initialized.current = true;
      initCache().then(() => {
        // Cleanup old entries periodically
        cleanupClientCache();
      });
    }
  }, []);

  /**
   * Fetch media with caching
   */
  const fetchWithCache = useCallback(async (
    url: string,
    cookie?: string,
    forceSkipCache = false
  ): Promise<ScraperResult> => {
    const platform = platformDetect(url) as PlatformId | null;
    const skipCache = options.skipCache || forceSkipCache;

    // Try cache first (if not skipping)
    if (!skipCache && platform) {
      const contentId = extractContentId(platform, url);
      
      if (contentId) {
        try {
          const cached = await cacheGet<MediaData>(platform, url);
          if (cached) {
            return {
              success: true,
              data: cached,
              fromCache: true,
            };
          }
        } catch {
          // Cache error - continue to API
        }
      }
    }

    // Fetch from API
    try {
      const result = await api.post<ScraperResponse>('/api/v1/extract', {
        url,
        cookie,
      });

      // Transform backend response to match frontend types
      const transformedData = transformBackendResponse(result.data);

      // Cache successful result
      if (result.success && transformedData && platform) {
        const isStory = url.includes('/stories/');
        cacheSet(platform, url, transformedData as MediaData, isStory).catch(() => {
          // Silently fail - caching is optional
        });
      }

      return {
        success: result.success,
        data: transformedData as MediaData,
        error: result.error,
        errorCode: result.errorCode,
        fromCache: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        fromCache: false,
      };
    }
  }, [options.skipCache]);

  return { fetchWithCache };
}

// ═══════════════════════════════════════════════════════════════
// STANDALONE FUNCTION (for non-hook usage)
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch media with caching (standalone function)
 * Use this when you can't use hooks (e.g., in event handlers)
 */
export async function fetchMediaWithCache(
  url: string,
  cookie?: string,
  skipCache = false
): Promise<ScraperResult> {
  const platform = platformDetect(url) as PlatformId | null;

  // Try cache first
  if (!skipCache && platform) {
    try {
      const cached = await cacheGet<MediaData>(platform, url);
      if (cached) {
        return {
          success: true,
          data: cached,
          fromCache: true,
        };
      }
    } catch {
      // Cache error - continue to API
    }
  }

  // Fetch from API
  try {
    const result = await api.post<ScraperResponse>('/api/v1/extract', {
      url,
      cookie,
    });

    // Transform backend response to match frontend types
    const transformedData = transformBackendResponse(result.data);

    // Cache successful result
    if (result.success && transformedData && platform) {
      const isStory = url.includes('/stories/');
      cacheSet(platform, url, transformedData as MediaData, isStory).catch(() => {});
    }

    return {
      success: result.success,
      data: transformedData as MediaData,
      error: result.error,
      errorCode: result.errorCode,
      fromCache: false,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
      fromCache: false,
    };
  }
}
