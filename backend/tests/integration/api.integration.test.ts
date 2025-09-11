import request from 'supertest';
import { Express } from 'express';
import { createServer } from '../../src/server';
import { prisma } from './setup';

describe('API Integration Tests', () => {
  let app: Express;
  let server: any;
  
  beforeAll(async () => {
    // Create test server
    const serverInstance = await createServer();
    app = serverInstance.app;
    server = serverInstance.server;
  });
  
  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
        
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/status should return system status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);
        
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('Authentication', () => {
    test('POST /api/auth/register should create new user', async () => {
      const userData = {
        email: 'integration-test@example.com',
        username: 'integrationuser',
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
    });

    test('POST /api/auth/login should authenticate user', async () => {
      // First create a user
      const user = await global.testUtils.createTestUser();
      
      const loginData = {
        email: user.email,
        password: 'TestPassword123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(user.id);
    });

    test('POST /api/auth/login with invalid credentials should return 401', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected Routes', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      // Create test user and get auth token
      testUser = await global.testUtils.createTestUser();
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        });
        
      authToken = loginResponse.body.token;
    });

    test('GET /api/user/profile should return user profile', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('username', testUser.username);
    });

    test('GET /api/user/profile without token should return 401', async () => {
      await request(app)
        .get('/api/user/profile')
        .expect(401);
    });

    test('PUT /api/user/profile should update user profile', async () => {
      const updateData = {
        username: 'updatedusername',
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.username).toBe(updateData.username);
    });
  });

  describe('Trading Strategies', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser();
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        });
        
      authToken = loginResponse.body.token;
    });

    test('GET /api/strategies should return user strategies', async () => {
      // Create test strategy
      await global.testUtils.createTestStrategy(testUser.id);

      const response = await request(app)
        .get('/api/strategies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('POST /api/strategies should create new strategy', async () => {
      const strategyData = {
        name: 'Test RSI Strategy',
        type: 'RSI_OVERSOLD',
        symbol: 'BTC/USD',
        parameters: {
          rsiPeriod: 14,
          oversoldThreshold: 30,
          overboughtThreshold: 70,
        },
      };

      const response = await request(app)
        .post('/api/strategies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(strategyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(strategyData.name);
      expect(response.body.type).toBe(strategyData.type);
      expect(response.body.userId).toBe(testUser.id);
    });

    test('DELETE /api/strategies/:id should delete strategy', async () => {
      // Create test strategy
      const strategy = await global.testUtils.createTestStrategy(testUser.id);

      await request(app)
        .delete(`/api/strategies/${strategy.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify strategy is deleted
      const deletedStrategy = await prisma.strategy.findUnique({
        where: { id: strategy.id },
      });
      expect(deletedStrategy).toBeNull();
    });
  });

  describe('Market Data', () => {
    let authToken: string;
    let testUser: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser();
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPassword123!',
        });
        
      authToken = loginResponse.body.token;
    });

    test('GET /api/market/symbols should return available symbols', async () => {
      const response = await request(app)
        .get('/api/market/symbols')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/market/price/:symbol should return current price', async () => {
      const symbol = 'BTC/USD';
      
      const response = await request(app)
        .get(`/api/market/price/${encodeURIComponent(symbol)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('symbol', symbol);
      expect(response.body).toHaveProperty('price');
      expect(typeof response.body.price).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('Malformed JSON should return 400', async () => {
      await request(app)
        .post('/api/auth/login')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });
});