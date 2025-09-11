import { describe, test, expect, beforeAll, afterAll } from 'vitest';

// Mock API client for integration tests
class ApiClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers as HeadersInit),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

describe('Frontend API Integration Tests', () => {
  let apiClient: ApiClient;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Initialize API client
    apiClient = new ApiClient(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    // Create test user for integration tests
    const timestamp = Date.now();
    testUser = {
      email: `integration-test-${timestamp}@example.com`,
      username: `integrationuser${timestamp}`,
      password: 'TestPassword123!',
    };

    try {
      // Register test user
      const registerResponse = await apiClient.post('/api/auth/register', testUser);
      authToken = registerResponse.token;
      apiClient.setToken(authToken);
    } catch (error) {
      console.warn('Test user creation failed, tests may fail:', error.message);
    }
  });

  afterAll(async () => {
    // Cleanup test user if possible
    try {
      if (authToken) {
        await apiClient.delete('/api/user/profile');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Authentication Flow', () => {
    test('should handle user registration and login flow', async () => {
      const timestamp = Date.now();
      const newUser = {
        email: `flow-test-${timestamp}@example.com`,
        username: `flowuser${timestamp}`,
        password: 'TestPassword123!',
      };

      // Register new user
      const registerResponse = await apiClient.post('/api/auth/register', newUser);
      
      expect(registerResponse).toHaveProperty('token');
      expect(registerResponse).toHaveProperty('user');
      expect(registerResponse.user.email).toBe(newUser.email);

      // Login with new user
      const loginResponse = await apiClient.post('/api/auth/login', {
        email: newUser.email,
        password: newUser.password,
      });

      expect(loginResponse).toHaveProperty('token');
      expect(loginResponse.token).toBeTruthy();
    });

    test('should reject invalid login credentials', async () => {
      await expect(
        apiClient.post('/api/auth/login', {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('API Error: 401');
    });
  });

  describe('Protected API Endpoints', () => {
    test('should access user profile with valid token', async () => {
      const profile = await apiClient.get('/api/user/profile');
      
      expect(profile).toHaveProperty('id');
      expect(profile).toHaveProperty('email', testUser.email);
      expect(profile).toHaveProperty('username', testUser.username);
    });

    test('should update user profile', async () => {
      const updateData = {
        username: `updated-${Date.now()}`,
      };

      const updatedProfile = await apiClient.put('/api/user/profile', updateData);
      
      expect(updatedProfile.username).toBe(updateData.username);
    });

    test('should reject requests without token', async () => {
      const unauthorizedClient = new ApiClient();
      
      await expect(
        unauthorizedClient.get('/api/user/profile')
      ).rejects.toThrow('API Error: 401');
    });
  });

  describe('Trading Strategies API', () => {
    test('should create and retrieve trading strategy', async () => {
      const strategyData = {
        name: `Integration Test Strategy ${Date.now()}`,
        type: 'RSI_OVERSOLD',
        symbol: 'BTC/USD',
        parameters: {
          rsiPeriod: 14,
          oversoldThreshold: 30,
          overboughtThreshold: 70,
        },
      };

      // Create strategy
      const createdStrategy = await apiClient.post('/api/strategies', strategyData);
      
      expect(createdStrategy).toHaveProperty('id');
      expect(createdStrategy.name).toBe(strategyData.name);
      expect(createdStrategy.type).toBe(strategyData.type);

      // Retrieve strategies
      const strategies = await apiClient.get('/api/strategies');
      
      expect(Array.isArray(strategies)).toBe(true);
      const foundStrategy = strategies.find(s => s.id === createdStrategy.id);
      expect(foundStrategy).toBeDefined();

      // Delete strategy
      await apiClient.delete(`/api/strategies/${createdStrategy.id}`);
    });

    test('should validate strategy parameters', async () => {
      const invalidStrategy = {
        name: '', // Invalid empty name
        type: 'INVALID_TYPE',
        symbol: 'BTC/USD',
        parameters: {},
      };

      await expect(
        apiClient.post('/api/strategies', invalidStrategy)
      ).rejects.toThrow('API Error: 400');
    });
  });

  describe('Market Data API', () => {
    test('should fetch available trading symbols', async () => {
      const symbols = await apiClient.get('/api/market/symbols');
      
      expect(Array.isArray(symbols)).toBe(true);
      expect(symbols.length).toBeGreaterThan(0);
      
      // Should include common symbols
      const symbolNames = symbols.map(s => s.symbol || s);
      expect(symbolNames).toContain('BTC/USD');
    });

    test('should fetch current price for symbol', async () => {
      const priceData = await apiClient.get('/api/market/price/BTC%2FUSD');
      
      expect(priceData).toHaveProperty('symbol', 'BTC/USD');
      expect(priceData).toHaveProperty('price');
      expect(typeof priceData.price).toBe('number');
      expect(priceData.price).toBeGreaterThan(0);
    });

    test('should handle invalid symbol gracefully', async () => {
      await expect(
        apiClient.get('/api/market/price/INVALID%2FSYMBOL')
      ).rejects.toThrow('API Error:');
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const offlineClient = new ApiClient('http://localhost:9999'); // Non-existent server
      
      await expect(
        offlineClient.get('/api/status')
      ).rejects.toThrow();
    });

    test('should handle malformed requests', async () => {
      // Test with invalid JSON
      const response = await fetch(`${apiClient['baseUrl']}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"invalid": json}', // Malformed JSON
      });

      expect(response.status).toBe(400);
    });

    test('should handle server errors', async () => {
      // This endpoint might not exist, causing a 404
      await expect(
        apiClient.get('/api/nonexistent-endpoint')
      ).rejects.toThrow('API Error: 404');
    });
  });

  describe('API Response Validation', () => {
    test('should validate health check response format', async () => {
      const health = await apiClient.get('/health');
      
      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('timestamp');
      expect(new Date(health.timestamp)).toBeInstanceOf(Date);
    });

    test('should validate system status response format', async () => {
      const status = await apiClient.get('/api/status');
      
      expect(status).toHaveProperty('database');
      expect(status).toHaveProperty('services');
      expect(typeof status.database).toBe('string');
    });

    test('should validate authentication response format', async () => {
      const loginResponse = await apiClient.post('/api/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResponse).toHaveProperty('token');
      expect(loginResponse).toHaveProperty('user');
      expect(loginResponse.user).toHaveProperty('id');
      expect(loginResponse.user).toHaveProperty('email');
      expect(loginResponse.user).toHaveProperty('username');
      expect(loginResponse.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('Frontend-Backend Data Flow', () => {
    test('should maintain data consistency across API calls', async () => {
      // Create strategy
      const strategyData = {
        name: `Consistency Test ${Date.now()}`,
        type: 'MACD_CROSSOVER',
        symbol: 'ETH/USD',
        parameters: {
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      };

      const createdStrategy = await apiClient.post('/api/strategies', strategyData);
      
      // Retrieve it back
      const retrievedStrategy = await apiClient.get(`/api/strategies/${createdStrategy.id}`);
      
      expect(retrievedStrategy.id).toBe(createdStrategy.id);
      expect(retrievedStrategy.name).toBe(strategyData.name);
      expect(retrievedStrategy.parameters).toEqual(strategyData.parameters);

      // Update it
      const updateData = { name: `Updated ${strategyData.name}` };
      const updatedStrategy = await apiClient.put(`/api/strategies/${createdStrategy.id}`, updateData);
      
      expect(updatedStrategy.name).toBe(updateData.name);
      expect(updatedStrategy.id).toBe(createdStrategy.id);

      // Cleanup
      await apiClient.delete(`/api/strategies/${createdStrategy.id}`);
    });
  });
});