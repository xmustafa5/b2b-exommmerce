/**
 * k6 Load Testing Script for Lilium B2B Platform
 *
 * Installation: https://k6.io/docs/getting-started/installation/
 *
 * Run commands:
 *   # Basic load test
 *   k6 run k6-load-test.js
 *
 *   # With custom VUs and duration
 *   k6 run --vus 50 --duration 30s k6-load-test.js
 *
 *   # Output to JSON
 *   k6 run --out json=results.json k6-load-test.js
 *
 *   # With cloud integration
 *   k6 cloud k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestCounter = new Counter('requests');
const productListTrend = new Trend('product_list_duration');
const authTrend = new Trend('auth_duration');
const orderTrend = new Trend('order_duration');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';
const TEST_USER_EMAIL = __ENV.TEST_EMAIL || 'shop@lilium.iq';
const TEST_USER_PASSWORD = __ENV.TEST_PASSWORD || 'shop123';

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test - basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      startTime: '0s',
      tags: { scenario: 'smoke' },
    },

    // Load test - average load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },  // Ramp up to 20 users
        { duration: '3m', target: 20 },  // Stay at 20 users
        { duration: '1m', target: 0 },   // Ramp down to 0
      ],
      startTime: '30s',
      tags: { scenario: 'load' },
    },

    // Stress test - high load
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '3m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down to 0
      ],
      startTime: '5m30s',
      tags: { scenario: 'stress' },
    },

    // Spike test - sudden traffic spike
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 }, // Spike to 100 users
        { duration: '1m', target: 100 },  // Stay at 100 users
        { duration: '10s', target: 0 },   // Drop to 0
      ],
      startTime: '17m30s',
      tags: { scenario: 'spike' },
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                  // Error rate < 1%
    errors: ['rate<0.1'],                            // Custom error rate < 10%
    product_list_duration: ['p(95)<300'],            // Product list < 300ms
    auth_duration: ['p(95)<500'],                    // Auth < 500ms
  },
};

// Helper function to get auth token
function getAuthToken() {
  const loginRes = http.post(`${BASE_URL}/auth/mobile/login`, JSON.stringify({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  authTrend.add(loginRes.timings.duration);

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return body.tokens?.accessToken || body.token;
  }
  return null;
}

// Main test function
export default function () {
  let token = null;

  // Health check
  group('Health Endpoints', () => {
    const healthRes = http.get(`${BASE_URL}/health`);
    check(healthRes, {
      'health check status 200': (r) => r.status === 200,
      'health check returns healthy': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy';
        } catch {
          return false;
        }
      },
    });
    requestCounter.add(1);
    errorRate.add(healthRes.status !== 200);
  });

  sleep(0.5);

  // Public endpoints (no auth required)
  group('Public Endpoints', () => {
    // Get products
    const productsRes = http.get(`${BASE_URL}/products?limit=20`);
    productListTrend.add(productsRes.timings.duration);
    check(productsRes, {
      'products status 200': (r) => r.status === 200,
      'products has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data) || Array.isArray(body);
        } catch {
          return false;
        }
      },
    });
    requestCounter.add(1);
    errorRate.add(productsRes.status !== 200);

    sleep(0.3);

    // Get categories
    const categoriesRes = http.get(`${BASE_URL}/categories`);
    check(categoriesRes, {
      'categories status 200': (r) => r.status === 200,
    });
    requestCounter.add(1);
    errorRate.add(categoriesRes.status !== 200);

    sleep(0.3);

    // Get featured products
    const featuredRes = http.get(`${BASE_URL}/products?isFeatured=true&limit=10`);
    check(featuredRes, {
      'featured products status 200': (r) => r.status === 200,
    });
    requestCounter.add(1);
    errorRate.add(featuredRes.status !== 200);
  });

  sleep(1);

  // Authentication
  group('Authentication', () => {
    token = getAuthToken();
    check(token, {
      'login successful': (t) => t !== null,
    });
    errorRate.add(token === null);
    requestCounter.add(1);
  });

  if (!token) {
    console.log('Authentication failed, skipping authenticated tests');
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  sleep(0.5);

  // Authenticated endpoints
  group('Authenticated Endpoints', () => {
    // Get user profile
    const profileRes = http.get(`${BASE_URL}/auth/me`, { headers: authHeaders });
    check(profileRes, {
      'profile status 200': (r) => r.status === 200,
    });
    requestCounter.add(1);
    errorRate.add(profileRes.status !== 200);

    sleep(0.3);

    // Get user addresses
    const addressesRes = http.get(`${BASE_URL}/addresses`, { headers: authHeaders });
    check(addressesRes, {
      'addresses status 200': (r) => r.status === 200 || r.status === 404,
    });
    requestCounter.add(1);
    errorRate.add(addressesRes.status >= 500);

    sleep(0.3);

    // Get user orders
    const ordersRes = http.get(`${BASE_URL}/orders`, { headers: authHeaders });
    check(ordersRes, {
      'orders status 200': (r) => r.status === 200 || r.status === 404,
    });
    requestCounter.add(1);
    errorRate.add(ordersRes.status >= 500);
  });

  sleep(0.5);

  // Cart operations
  group('Cart Operations', () => {
    // Validate cart
    const cartValidateRes = http.post(`${BASE_URL}/cart/validate`, JSON.stringify({
      items: [
        { productId: 'test-product-1', quantity: 2 },
        { productId: 'test-product-2', quantity: 1 },
      ],
    }), { headers: authHeaders });

    // Cart validation may fail if products don't exist, that's ok
    check(cartValidateRes, {
      'cart validate no server error': (r) => r.status < 500,
    });
    requestCounter.add(1);
    errorRate.add(cartValidateRes.status >= 500);

    sleep(0.3);

    // Quick stock check
    const stockCheckRes = http.post(`${BASE_URL}/cart/quick-stock-check`, JSON.stringify({
      items: [
        { productId: 'test-product-1', quantity: 1 },
      ],
    }), { headers: { 'Content-Type': 'application/json' } });

    check(stockCheckRes, {
      'stock check no server error': (r) => r.status < 500,
    });
    requestCounter.add(1);
    errorRate.add(stockCheckRes.status >= 500);
  });

  sleep(0.5);

  // Search operations
  group('Search Operations', () => {
    const searches = ['phone', 'laptop', 'tablet', 'accessories'];
    const searchTerm = searches[Math.floor(Math.random() * searches.length)];

    const searchRes = http.get(`${BASE_URL}/products?search=${searchTerm}&limit=10`);
    check(searchRes, {
      'search status 200': (r) => r.status === 200,
    });
    requestCounter.add(1);
    errorRate.add(searchRes.status !== 200);
  });

  sleep(1);
}

// Setup function - runs once at the start
export function setup() {
  console.log(`Load test starting against ${BASE_URL}`);

  // Verify server is running
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Server not healthy: ${healthRes.status}`);
  }

  return { startTime: new Date().toISOString() };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`);
}
