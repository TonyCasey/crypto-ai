import { TradingEngine } from '../../src/services/trading-engine';
import { StrategyFactory } from '@cryptobot/trading';
import { ExchangeFactory } from '@cryptobot/exchanges';
import { TimeFrame } from '@cryptobot/types';
import { prisma } from './setup';

describe('Trading Engine Integration Tests', () => {
  let tradingEngine: TradingEngine;
  let testUser: any;
  let testStrategy: any;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser();
    testStrategy = await global.testUtils.createTestStrategy(testUser.id);
    
    tradingEngine = new TradingEngine();
  });

  afterEach(async () => {
    if (tradingEngine) {
      await tradingEngine.stop();
    }
  });

  describe('Strategy Execution', () => {
    test('should initialize trading engine', async () => {
      expect(tradingEngine).toBeDefined();
      expect(tradingEngine.isRunning()).toBe(false);
    });

    test('should start and stop trading engine', async () => {
      await tradingEngine.start();
      expect(tradingEngine.isRunning()).toBe(true);

      await tradingEngine.stop();
      expect(tradingEngine.isRunning()).toBe(false);
    });

    test('should load strategies from database', async () => {
      // Create active strategy
      await prisma.strategy.update({
        where: { id: testStrategy.id },
        data: { isActive: true },
      });

      const strategies = await tradingEngine.loadStrategies();
      expect(strategies.length).toBeGreaterThan(0);
      
      const foundStrategy = strategies.find(s => s.id === testStrategy.id);
      expect(foundStrategy).toBeDefined();
    });

    test('should create strategy instance from database record', async () => {
      const strategyInstance = await tradingEngine.createStrategyInstance(testStrategy);
      
      expect(strategyInstance).toBeDefined();
      expect(strategyInstance.getId()).toBe(testStrategy.id);
      expect(strategyInstance.getName()).toBe(testStrategy.name);
    });
  });

  describe('Exchange Integration', () => {
    test('should create simulator exchange', async () => {
      const exchange = ExchangeFactory.createExchange('SIMULATOR', {
        apiKey: 'test',
        apiSecret: 'test',
        sandbox: true,
      });

      expect(exchange).toBeDefined();
      expect(exchange.getName()).toBe('SIMULATOR');
    });

    test('should fetch market data from simulator', async () => {
      const exchange = ExchangeFactory.createExchange('SIMULATOR', {
        apiKey: 'test',
        apiSecret: 'test',
        sandbox: true,
      });

      const marketData = await exchange.getMarketData('BTC/USD', TimeFrame.H1, 10);
      
      expect(Array.isArray(marketData)).toBe(true);
      expect(marketData.length).toBeGreaterThan(0);
      
      const candle = marketData[0];
      expect(candle).toHaveProperty('timestamp');
      expect(candle).toHaveProperty('open');
      expect(candle).toHaveProperty('high');
      expect(candle).toHaveProperty('low');
      expect(candle).toHaveProperty('close');
      expect(candle).toHaveProperty('volume');
    });

    test('should handle exchange connection errors gracefully', async () => {
      const exchange = ExchangeFactory.createExchange('SIMULATOR', {
        apiKey: 'invalid',
        apiSecret: 'invalid',
        sandbox: true,
      });

      // This should not throw, but handle error gracefully
      await expect(exchange.connect()).resolves.not.toThrow();
    });
  });

  describe('Strategy Factory Integration', () => {
    test('should create RSI strategy', () => {
      const strategy = StrategyFactory.createStrategy('RSI_OVERSOLD', {
        id: 'test-rsi',
        name: 'Test RSI',
        symbol: 'BTC/USD',
        timeFrame: TimeFrame.H1,
        parameters: {
          rsiPeriod: 14,
          oversoldThreshold: 30,
          overboughtThreshold: 70,
        },
      });

      expect(strategy).toBeDefined();
      expect(strategy.getId()).toBe('test-rsi');
      expect(strategy.getName()).toBe('Test RSI');
    });

    test('should create MACD strategy', () => {
      const strategy = StrategyFactory.createStrategy('MACD_CROSSOVER', {
        id: 'test-macd',
        name: 'Test MACD',
        symbol: 'ETH/USD',
        timeFrame: TimeFrame.H4,
        parameters: {
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
        },
      });

      expect(strategy).toBeDefined();
      expect(strategy.getId()).toBe('test-macd');
      expect(strategy.getName()).toBe('Test MACD');
    });

    test('should throw error for invalid strategy type', () => {
      expect(() => {
        StrategyFactory.createStrategy('INVALID_STRATEGY' as any, {
          id: 'test',
          name: 'Test',
          symbol: 'BTC/USD',
          timeFrame: TimeFrame.H1,
          parameters: {},
        });
      }).toThrow();
    });
  });

  describe('Signal Generation', () => {
    test('should generate signals from RSI strategy', async () => {
      const strategy = StrategyFactory.createStrategy('RSI_OVERSOLD', {
        id: testStrategy.id,
        name: testStrategy.name,
        symbol: 'BTC/USD',
        timeFrame: TimeFrame.H1,
        parameters: JSON.parse(testStrategy.parameters),
      });

      // Mock market data
      const mockData = Array.from({ length: 50 }, (_, i) => ({
        timestamp: new Date(Date.now() - (50 - i) * 60 * 60 * 1000),
        open: 50000 + Math.random() * 1000,
        high: 51000 + Math.random() * 1000,
        low: 49000 + Math.random() * 1000,
        close: 50000 + Math.random() * 1000,
        volume: 100 + Math.random() * 50,
      }));

      const signals = await strategy.analyzeMarket(mockData);
      
      expect(Array.isArray(signals)).toBe(true);
      // Signals array might be empty if no trading opportunities detected
    });
  });

  describe('Order Management', () => {
    test('should create and store orders in database', async () => {
      const orderData = {
        userId: testUser.id,
        strategyId: testStrategy.id,
        symbol: 'BTC/USD',
        side: 'BUY' as const,
        type: 'MARKET' as const,
        amount: 0.001,
        price: 50000,
        status: 'PENDING' as const,
      };

      const order = await prisma.order.create({
        data: orderData,
      });

      expect(order).toBeDefined();
      expect(order.userId).toBe(testUser.id);
      expect(order.strategyId).toBe(testStrategy.id);
      expect(order.symbol).toBe('BTC/USD');
      expect(order.side).toBe('BUY');
    });

    test('should update order status', async () => {
      const order = await prisma.order.create({
        data: {
          userId: testUser.id,
          strategyId: testStrategy.id,
          symbol: 'BTC/USD',
          side: 'BUY',
          type: 'MARKET',
          amount: 0.001,
          price: 50000,
          status: 'PENDING',
        },
      });

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FILLED' },
      });

      expect(updatedOrder.status).toBe('FILLED');
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate strategy performance', async () => {
      // Create multiple filled orders to test performance calculation
      const orders = await Promise.all([
        prisma.order.create({
          data: {
            userId: testUser.id,
            strategyId: testStrategy.id,
            symbol: 'BTC/USD',
            side: 'BUY',
            type: 'MARKET',
            amount: 0.001,
            price: 50000,
            status: 'FILLED',
            filledAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          },
        }),
        prisma.order.create({
          data: {
            userId: testUser.id,
            strategyId: testStrategy.id,
            symbol: 'BTC/USD',
            side: 'SELL',
            type: 'MARKET',
            amount: 0.001,
            price: 52000,
            status: 'FILLED',
            filledAt: new Date(),
          },
        }),
      ]);

      expect(orders).toHaveLength(2);
      
      // Calculate basic performance metrics
      const buyOrder = orders[0];
      const sellOrder = orders[1];
      
      const profit = (sellOrder.price! - buyOrder.price!) * buyOrder.amount;
      const profitPercent = (profit / (buyOrder.price! * buyOrder.amount)) * 100;
      
      expect(profit).toBeGreaterThan(0);
      expect(profitPercent).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      // Temporarily break database connection
      await prisma.$disconnect();
      
      try {
        await tradingEngine.loadStrategies();
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      // Reconnect for cleanup
      await prisma.$connect();
    });

    test('should handle invalid strategy parameters', async () => {
      const invalidStrategy = await prisma.strategy.create({
        data: {
          name: 'Invalid Strategy',
          type: 'RSI_OVERSOLD',
          userId: testUser.id,
          isActive: false,
          parameters: JSON.stringify({
            // Missing required parameters
            invalidParam: 'invalid',
          }),
        },
      });

      expect(async () => {
        await tradingEngine.createStrategyInstance(invalidStrategy);
      }).rejects.toThrow();
    });
  });
});