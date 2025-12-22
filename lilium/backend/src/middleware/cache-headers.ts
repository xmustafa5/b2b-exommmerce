import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Cache control headers configuration
 */
export interface CacheHeadersOptions {
  maxAge?: number; // Cache-Control max-age in seconds
  staleWhileRevalidate?: number; // stale-while-revalidate in seconds
  staleIfError?: number; // stale-if-error in seconds
  private?: boolean; // private or public cache
  noStore?: boolean; // no-store directive
  mustRevalidate?: boolean; // must-revalidate directive
  etag?: boolean; // Generate ETag header
}

const defaultOptions: CacheHeadersOptions = {
  maxAge: 60,
  staleWhileRevalidate: 30,
  private: false,
  noStore: false,
  mustRevalidate: false,
  etag: true,
};

/**
 * Build Cache-Control header value
 */
function buildCacheControl(options: CacheHeadersOptions): string {
  if (options.noStore) {
    return 'no-store, no-cache, must-revalidate';
  }

  const directives: string[] = [];

  directives.push(options.private ? 'private' : 'public');

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }

  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }

  return directives.join(', ');
}

/**
 * Generate simple ETag from content
 */
function generateETag(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
}

/**
 * Hook to add cache headers to response
 */
export function cacheHeaders(options: CacheHeadersOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  return async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('Cache-Control', buildCacheControl(opts));

    if (opts.maxAge && opts.maxAge > 0) {
      const expires = new Date(Date.now() + opts.maxAge * 1000);
      reply.header('Expires', expires.toUTCString());
    }

    // Add Vary header for proper caching with different Accept headers
    reply.header('Vary', 'Accept, Accept-Encoding, Authorization');
  };
}

/**
 * Preset cache configurations
 */
export const CachePresets = {
  // No caching for sensitive/dynamic data
  noCache: (): CacheHeadersOptions => ({
    noStore: true,
  }),

  // Short cache for frequently changing data (1 minute)
  short: (): CacheHeadersOptions => ({
    maxAge: 60,
    staleWhileRevalidate: 30,
    private: false,
  }),

  // Medium cache for semi-static data (5 minutes)
  medium: (): CacheHeadersOptions => ({
    maxAge: 300,
    staleWhileRevalidate: 60,
    private: false,
  }),

  // Long cache for static data (1 hour)
  long: (): CacheHeadersOptions => ({
    maxAge: 3600,
    staleWhileRevalidate: 300,
    staleIfError: 86400,
    private: false,
  }),

  // Immutable cache for versioned assets (1 year)
  immutable: (): CacheHeadersOptions => ({
    maxAge: 31536000,
    private: false,
  }),

  // Private cache for user-specific data (1 minute)
  privateShort: (): CacheHeadersOptions => ({
    maxAge: 60,
    private: true,
  }),

  // Private cache for user-specific data (5 minutes)
  privateMedium: (): CacheHeadersOptions => ({
    maxAge: 300,
    private: true,
    mustRevalidate: true,
  }),
};

/**
 * Decorator to add cache headers to route
 */
export function withCacheHeaders(
  options: CacheHeadersOptions | (() => CacheHeadersOptions) = {}
) {
  return {
    onRequest: async (request: FastifyRequest, reply: FastifyReply) => {
      const opts = typeof options === 'function' ? options() : options;
      const merged = { ...defaultOptions, ...opts };

      reply.header('Cache-Control', buildCacheControl(merged));

      if (merged.maxAge && merged.maxAge > 0) {
        const expires = new Date(Date.now() + merged.maxAge * 1000);
        reply.header('Expires', expires.toUTCString());
      }

      reply.header('Vary', 'Accept, Accept-Encoding, Authorization');
    },
  };
}
