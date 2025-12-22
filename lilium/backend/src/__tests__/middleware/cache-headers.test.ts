import { CachePresets, cacheHeaders, withCacheHeaders } from '../../middleware/cache-headers';

describe('Cache Headers Middleware', () => {
  describe('CachePresets', () => {
    it('noCache should return no-store configuration', () => {
      const config = CachePresets.noCache();
      expect(config.noStore).toBe(true);
    });

    it('short should return 1 minute cache', () => {
      const config = CachePresets.short();
      expect(config.maxAge).toBe(60);
      expect(config.staleWhileRevalidate).toBe(30);
      expect(config.private).toBe(false);
    });

    it('medium should return 5 minute cache', () => {
      const config = CachePresets.medium();
      expect(config.maxAge).toBe(300);
      expect(config.staleWhileRevalidate).toBe(60);
      expect(config.private).toBe(false);
    });

    it('long should return 1 hour cache', () => {
      const config = CachePresets.long();
      expect(config.maxAge).toBe(3600);
      expect(config.staleWhileRevalidate).toBe(300);
      expect(config.staleIfError).toBe(86400);
      expect(config.private).toBe(false);
    });

    it('immutable should return 1 year cache', () => {
      const config = CachePresets.immutable();
      expect(config.maxAge).toBe(31536000);
      expect(config.private).toBe(false);
    });

    it('privateShort should return private 1 minute cache', () => {
      const config = CachePresets.privateShort();
      expect(config.maxAge).toBe(60);
      expect(config.private).toBe(true);
    });

    it('privateMedium should return private 5 minute cache with must-revalidate', () => {
      const config = CachePresets.privateMedium();
      expect(config.maxAge).toBe(300);
      expect(config.private).toBe(true);
      expect(config.mustRevalidate).toBe(true);
    });
  });

  describe('cacheHeaders', () => {
    it('should return a function', () => {
      const middleware = cacheHeaders();
      expect(typeof middleware).toBe('function');
    });

    it('should set headers when called', async () => {
      const middleware = cacheHeaders({ maxAge: 120 });

      const mockRequest = {} as any;
      const headers: Record<string, string> = {};
      const mockReply = {
        header: jest.fn((key: string, value: string) => {
          headers[key] = value;
          return mockReply;
        }),
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith('Cache-Control', expect.any(String));
      expect(mockReply.header).toHaveBeenCalledWith('Expires', expect.any(String));
      expect(mockReply.header).toHaveBeenCalledWith('Vary', 'Accept, Accept-Encoding, Authorization');
    });

    it('should use no-store when configured', async () => {
      const middleware = cacheHeaders({ noStore: true });

      const mockRequest = {} as any;
      const mockReply = {
        header: jest.fn().mockReturnThis(),
      } as any;

      await middleware(mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith(
        'Cache-Control',
        'no-store, no-cache, must-revalidate'
      );
    });
  });

  describe('withCacheHeaders', () => {
    it('should return an object with onRequest hook', () => {
      const decorator = withCacheHeaders();
      expect(decorator).toHaveProperty('onRequest');
      expect(typeof decorator.onRequest).toBe('function');
    });

    it('should accept function as options', () => {
      const decorator = withCacheHeaders(() => ({ maxAge: 300 }));
      expect(decorator).toHaveProperty('onRequest');
    });

    it('should set headers in onRequest hook', async () => {
      const decorator = withCacheHeaders({ maxAge: 60 });

      const mockRequest = {} as any;
      const mockReply = {
        header: jest.fn().mockReturnThis(),
      } as any;

      await decorator.onRequest(mockRequest, mockReply);

      expect(mockReply.header).toHaveBeenCalledWith('Cache-Control', expect.any(String));
    });
  });
});
