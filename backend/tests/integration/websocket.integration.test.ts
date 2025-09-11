import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import Client from 'socket.io-client';
import { WebSocketManager } from '../../src/websocket/websocket-manager';
import { prisma } from './setup';

describe('WebSocket Integration Tests', () => {
  let server: any;
  let io: Server;
  let wsManager: WebSocketManager;
  let port: number;
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    // Create HTTP server
    server = createServer();
    
    // Create Socket.IO server
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // Create WebSocket manager
    wsManager = new WebSocketManager(io);
    
    // Start server on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
    
    // Create test user
    testUser = await global.testUtils.createTestUser();
    
    // Mock JWT token for testing
    authToken = 'test-jwt-token';
  });

  afterEach(async () => {
    if (wsManager) {
      wsManager.close();
    }
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Connection Management', () => {
    test('should accept client connections', (done) => {
      const client = Client(`http://localhost:${port}`);
      
      client.on('connect', () => {
        expect(client.connected).toBe(true);
        client.disconnect();
        done();
      });
      
      client.on('connect_error', (error) => {
        done(error);
      });
    });

    test('should handle client disconnections', (done) => {
      const client = Client(`http://localhost:${port}`);
      
      client.on('connect', () => {
        client.disconnect();
      });
      
      client.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        done();
      });
    });

    test('should authenticate users with valid tokens', (done) => {
      const client = Client(`http://localhost:${port}`, {
        auth: {
          token: authToken
        }
      });
      
      client.on('connect', () => {
        client.emit('authenticate', { token: authToken });
      });
      
      client.on('authenticated', (data) => {
        expect(data.success).toBe(true);
        client.disconnect();
        done();
      });
      
      client.on('authentication_error', (error) => {
        done(error);
      });
    });

    test('should reject invalid authentication', (done) => {
      const client = Client(`http://localhost:${port}`);
      
      client.on('connect', () => {
        client.emit('authenticate', { token: 'invalid-token' });
      });
      
      client.on('authentication_error', (error) => {
        expect(error).toBeDefined();
        expect(error.message).toContain('Invalid');
        client.disconnect();
        done();
      });
      
      client.on('authenticated', () => {
        done(new Error('Should not authenticate with invalid token'));
      });
    });
  });

  describe('Market Data Streaming', () => {
    test('should stream market data updates', (done) => {
      const client = Client(`http://localhost:${port}`);
      let updateReceived = false;
      
      client.on('connect', () => {
        client.emit('subscribe_market_data', { symbol: 'BTC/USD' });
        
        // Simulate market data update
        setTimeout(() => {
          wsManager.broadcastMarketData('BTC/USD', {
            symbol: 'BTC/USD',
            price: 50000,
            timestamp: new Date(),
            volume: 1000,
          });
        }, 100);
      });
      
      client.on('market_data_update', (data) => {
        expect(data.symbol).toBe('BTC/USD');
        expect(data.price).toBe(50000);
        expect(data.timestamp).toBeDefined();
        updateReceived = true;
        client.disconnect();
      });
      
      client.on('disconnect', () => {
        if (updateReceived) {
          done();
        } else {
          done(new Error('Market data update not received'));
        }
      });
      
      setTimeout(() => {
        if (!updateReceived) {
          client.disconnect();
          done(new Error('Timeout waiting for market data'));
        }
      }, 2000);
    });

    test('should unsubscribe from market data', (done) => {
      const client = Client(`http://localhost:${port}`);
      let subscribed = false;
      let unsubscribed = false;
      
      client.on('connect', () => {
        client.emit('subscribe_market_data', { symbol: 'ETH/USD' });
      });
      
      client.on('market_data_subscribed', (data) => {
        expect(data.symbol).toBe('ETH/USD');
        subscribed = true;
        
        // Now unsubscribe
        client.emit('unsubscribe_market_data', { symbol: 'ETH/USD' });
      });
      
      client.on('market_data_unsubscribed', (data) => {
        expect(data.symbol).toBe('ETH/USD');
        unsubscribed = true;
        client.disconnect();
      });
      
      client.on('disconnect', () => {
        if (subscribed && unsubscribed) {
          done();
        } else {
          done(new Error('Subscription/unsubscription flow failed'));
        }
      });
    });
  });

  describe('Trading Updates', () => {
    test('should stream order updates', (done) => {
      const client = Client(`http://localhost:${port}`);
      
      client.on('connect', () => {
        // Subscribe to trading updates
        client.emit('subscribe_trading_updates', { userId: testUser.id });
        
        // Simulate order update
        setTimeout(() => {
          wsManager.sendTradingUpdate(testUser.id, {
            type: 'order_update',
            orderId: 'test-order-123',
            status: 'FILLED',
            symbol: 'BTC/USD',
            side: 'BUY',
            amount: 0.001,
            price: 50000,
          });
        }, 100);
      });
      
      client.on('trading_update', (data) => {
        expect(data.type).toBe('order_update');
        expect(data.orderId).toBe('test-order-123');
        expect(data.status).toBe('FILLED');
        client.disconnect();
        done();
      });
    });

    test('should stream strategy performance updates', (done) => {
      const client = Client(`http://localhost:${port}`);
      
      client.on('connect', () => {
        client.emit('subscribe_strategy_updates', { 
          userId: testUser.id,
          strategyId: 'test-strategy-123'
        });
        
        // Simulate performance update
        setTimeout(() => {
          wsManager.sendStrategyUpdate(testUser.id, 'test-strategy-123', {
            type: 'performance_update',
            profit: 150.50,
            profitPercent: 3.01,
            totalTrades: 25,
            winRate: 68.0,
          });
        }, 100);
      });
      
      client.on('strategy_update', (data) => {
        expect(data.type).toBe('performance_update');
        expect(data.profit).toBe(150.50);
        expect(data.profitPercent).toBe(3.01);
        expect(data.totalTrades).toBe(25);
        client.disconnect();
        done();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid subscription requests', (done) => {
      const client = Client(`http://localhost:${port}`);
      
      client.on('connect', () => {
        client.emit('subscribe_market_data', { symbol: '' }); // Invalid symbol
      });
      
      client.on('subscription_error', (error) => {
        expect(error).toBeDefined();
        expect(error.message).toContain('Invalid');
        client.disconnect();
        done();
      });
      
      setTimeout(() => {
        client.disconnect();
        done(new Error('Should have received subscription error'));
      }, 1000);
    });

    test('should handle connection errors gracefully', (done) => {
      const client = Client(`http://localhost:${port + 1}`); // Wrong port
      
      client.on('connect_error', (error) => {
        expect(error).toBeDefined();
        done();
      });
      
      client.on('connect', () => {
        done(new Error('Should not connect to wrong port'));
      });
    });
  });

  describe('Room Management', () => {
    test('should join and leave rooms correctly', (done) => {
      const client = Client(`http://localhost:${port}`);
      
      client.on('connect', () => {
        client.emit('join_room', { room: 'market_BTC_USD' });
      });
      
      client.on('room_joined', (data) => {
        expect(data.room).toBe('market_BTC_USD');
        
        // Leave the room
        client.emit('leave_room', { room: 'market_BTC_USD' });
      });
      
      client.on('room_left', (data) => {
        expect(data.room).toBe('market_BTC_USD');
        client.disconnect();
        done();
      });
    });

    test('should broadcast to specific rooms', (done) => {
      const client1 = Client(`http://localhost:${port}`);
      const client2 = Client(`http://localhost:${port}`);
      
      let client1Ready = false;
      let client2Ready = false;
      let messagesReceived = 0;
      
      const checkReady = () => {
        if (client1Ready && client2Ready) {
          // Broadcast message to room
          wsManager.broadcastToRoom('test_room', 'room_message', {
            message: 'Hello room!'
          });
        }
      };
      
      client1.on('connect', () => {
        client1.emit('join_room', { room: 'test_room' });
      });
      
      client2.on('connect', () => {
        client2.emit('join_room', { room: 'test_room' });
      });
      
      client1.on('room_joined', () => {
        client1Ready = true;
        checkReady();
      });
      
      client2.on('room_joined', () => {
        client2Ready = true;
        checkReady();
      });
      
      client1.on('room_message', (data) => {
        expect(data.message).toBe('Hello room!');
        messagesReceived++;
        if (messagesReceived === 2) {
          client1.disconnect();
          client2.disconnect();
          done();
        }
      });
      
      client2.on('room_message', (data) => {
        expect(data.message).toBe('Hello room!');
        messagesReceived++;
        if (messagesReceived === 2) {
          client1.disconnect();
          client2.disconnect();
          done();
        }
      });
    });
  });
});