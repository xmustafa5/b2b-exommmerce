import { CacheService, CACHE_KEYS, CACHE_TTL } from '../../services/cache.service';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    flushdb: jest.fn(),
    quit: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockFastify: any;

  beforeEach(() => {
    // Reset environment
    delete process.env.REDIS_URL;

    mockFastify = {
      log: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
    };
  });

  describe('initialization', () => {
    it('should log warning when REDIS_URL is not set', () => {
      cacheService = new CacheService(mockFastify);
      expect(mockFastify.log.warn).toHaveBeenCalledWith(
        'REDIS_URL not set. Caching is disabled.'
      );
    });

    it('should not be enabled when REDIS_URL is not set', () => {
      cacheService = new CacheService(mockFastify);
      expect(cacheService.isEnabled()).toBe(false);
    });
  });

  describe('when disabled', () => {
    beforeEach(() => {
      cacheService = new CacheService(mockFastify);
    });

    it('get should return null', async () => {
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('set should return false', async () => {
      const result = await cacheService.set('test-key', { data: 'test' });
      expect(result).toBe(false);
    });

    it('del should return false', async () => {
      const result = await cacheService.del('test-key');
      expect(result).toBe(false);
    });

    it('delPattern should return 0', async () => {
      const result = await cacheService.delPattern('test:*');
      expect(result).toBe(0);
    });

    it('flush should return false', async () => {
      const result = await cacheService.flush();
      expect(result).toBe(false);
    });
  });

  describe('CACHE_KEYS', () => {
    it('should have correct cache key prefixes', () => {
      expect(CACHE_KEYS.PRODUCTS).toBe('products');
      expect(CACHE_KEYS.PRODUCT).toBe('product');
      expect(CACHE_KEYS.CATEGORIES).toBe('categories');
      expect(CACHE_KEYS.CATEGORY).toBe('category');
      expect(CACHE_KEYS.ANALYTICS).toBe('analytics');
      expect(CACHE_KEYS.PROMOTIONS).toBe('promotions');
    });
  });

  describe('CACHE_TTL', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.PRODUCTS_LIST).toBe(60);
      expect(CACHE_TTL.PRODUCT_DETAIL).toBe(120);
      expect(CACHE_TTL.CATEGORIES).toBe(300);
      expect(CACHE_TTL.ANALYTICS).toBe(60);
      expect(CACHE_TTL.PROMOTIONS).toBe(120);
    });
  });
});
