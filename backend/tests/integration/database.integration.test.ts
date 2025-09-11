import { PrismaClient } from '@prisma/client';
import { prisma } from './setup';

describe('Database Integration Tests', () => {
  describe('Connection and Basic Operations', () => {
    test('should connect to database successfully', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as result`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle database transactions', async () => {
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: 'transaction-test@example.com',
            username: 'transactionuser',
            passwordHash: 'test-hash',
            isEmailVerified: true,
          },
        });

        // Create a strategy within the same transaction
        await tx.strategy.create({
          data: {
            name: 'Transaction Test Strategy',
            type: 'RSI_OVERSOLD',
            userId: newUser.id,
            isActive: false,
            parameters: JSON.stringify({ rsiPeriod: 14 }),
          },
        });

        return newUser;
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('transaction-test@example.com');

      // Verify both records were created
      const strategies = await prisma.strategy.findMany({
        where: { userId: user.id },
      });
      expect(strategies).toHaveLength(1);
    });

    test('should handle transaction rollback on error', async () => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: 'rollback-test@example.com',
              username: 'rollbackuser',
              passwordHash: 'test-hash',
              isEmailVerified: true,
            },
          });

          // This should cause the transaction to rollback
          throw new Error('Intentional error for rollback test');
        });
      } catch (error) {
        expect(error.message).toBe('Intentional error for rollback test');
      }

      // Verify no user was created
      const user = await prisma.user.findUnique({
        where: { email: 'rollback-test@example.com' },
      });
      expect(user).toBeNull();
    });
  });

  describe('User Model', () => {
    test('should create and retrieve user', async () => {
      const userData = {
        email: 'test-user@example.com',
        username: 'testuser123',
        passwordHash: 'hashed-password',
        isEmailVerified: true,
      };

      const user = await prisma.user.create({
        data: userData,
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.username).toBe(userData.username);
      expect(user.isEmailVerified).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    test('should enforce unique email constraint', async () => {
      const email = 'unique-test@example.com';
      
      // Create first user
      await prisma.user.create({
        data: {
          email,
          username: 'user1',
          passwordHash: 'hash1',
          isEmailVerified: true,
        },
      });

      // Try to create second user with same email
      await expect(
        prisma.user.create({
          data: {
            email,
            username: 'user2',
            passwordHash: 'hash2',
            isEmailVerified: true,
          },
        })
      ).rejects.toThrow();
    });

    test('should update user profile', async () => {
      const user = await global.testUtils.createTestUser();
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: 'updated-username',
          isEmailVerified: true,
        },
      });

      expect(updatedUser.username).toBe('updated-username');
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.updatedAt).not.toEqual(user.updatedAt);
    });

    test('should delete user and cascade to related records', async () => {
      const user = await global.testUtils.createTestUser();
      const strategy = await global.testUtils.createTestStrategy(user.id);

      // Create an order for the user
      await prisma.order.create({
        data: {
          userId: user.id,
          strategyId: strategy.id,
          symbol: 'BTC/USD',
          side: 'BUY',
          type: 'MARKET',
          amount: 0.001,
          price: 50000,
          status: 'PENDING',
        },
      });

      // Delete user (should cascade)
      await prisma.user.delete({
        where: { id: user.id },
      });

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();

      // Verify strategies are deleted (cascade)
      const strategies = await prisma.strategy.findMany({
        where: { userId: user.id },
      });
      expect(strategies).toHaveLength(0);
    });
  });

  describe('Strategy Model', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser();
    });

    test('should create strategy with valid parameters', async () => {
      const strategyData = {
        name: 'Test RSI Strategy',
        type: 'RSI_OVERSOLD',
        userId: testUser.id,
        isActive: true,
        parameters: JSON.stringify({
          rsiPeriod: 14,
          oversoldThreshold: 30,
          overboughtThreshold: 70,
        }),
      };

      const strategy = await prisma.strategy.create({
        data: strategyData,
      });

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe(strategyData.name);
      expect(strategy.type).toBe(strategyData.type);
      expect(strategy.userId).toBe(testUser.id);
      expect(strategy.isActive).toBe(true);
      expect(JSON.parse(strategy.parameters)).toEqual(
        JSON.parse(strategyData.parameters)
      );
    });

    test('should find strategies by user', async () => {
      // Create multiple strategies
      await Promise.all([
        global.testUtils.createTestStrategy(testUser.id),
        global.testUtils.createTestStrategy(testUser.id),
        global.testUtils.createTestStrategy(testUser.id),
      ]);

      const strategies = await prisma.strategy.findMany({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(strategies).toHaveLength(3);
      expect(strategies.every(s => s.userId === testUser.id)).toBe(true);
    });

    test('should find active strategies only', async () => {
      // Create active and inactive strategies
      await prisma.strategy.create({
        data: {
          name: 'Active Strategy',
          type: 'RSI_OVERSOLD',
          userId: testUser.id,
          isActive: true,
          parameters: JSON.stringify({ rsiPeriod: 14 }),
        },
      });

      await prisma.strategy.create({
        data: {
          name: 'Inactive Strategy',
          type: 'MACD_CROSSOVER',
          userId: testUser.id,
          isActive: false,
          parameters: JSON.stringify({ fastPeriod: 12 }),
        },
      });

      const activeStrategies = await prisma.strategy.findMany({
        where: { 
          userId: testUser.id,
          isActive: true,
        },
      });

      expect(activeStrategies).toHaveLength(1);
      expect(activeStrategies[0].name).toBe('Active Strategy');
      expect(activeStrategies[0].isActive).toBe(true);
    });
  });

  describe('Order Model', () => {
    let testUser: any;
    let testStrategy: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser();
      testStrategy = await global.testUtils.createTestStrategy(testUser.id);
    });

    test('should create order with required fields', async () => {
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
      expect(order.type).toBe('MARKET');
      expect(order.amount).toBe(0.001);
      expect(order.price).toBe(50000);
      expect(order.status).toBe('PENDING');
    });

    test('should find orders by strategy', async () => {
      // Create multiple orders for the strategy
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
          },
        }),
        prisma.order.create({
          data: {
            userId: testUser.id,
            strategyId: testStrategy.id,
            symbol: 'BTC/USD',
            side: 'SELL',
            type: 'LIMIT',
            amount: 0.001,
            price: 52000,
            status: 'PENDING',
          },
        }),
      ]);

      const strategyOrders = await prisma.order.findMany({
        where: { strategyId: testStrategy.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(strategyOrders).toHaveLength(2);
      expect(strategyOrders[0].side).toBe('BUY');
      expect(strategyOrders[1].side).toBe('SELL');
    });

    test('should calculate strategy performance from orders', async () => {
      // Create a profitable trade sequence
      const buyOrder = await prisma.order.create({
        data: {
          userId: testUser.id,
          strategyId: testStrategy.id,
          symbol: 'BTC/USD',
          side: 'BUY',
          type: 'MARKET',
          amount: 0.001,
          price: 50000,
          status: 'FILLED',
          filledAt: new Date(Date.now() - 60000), // 1 minute ago
        },
      });

      const sellOrder = await prisma.order.create({
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
      });

      // Calculate profit
      const profit = (sellOrder.price! - buyOrder.price!) * buyOrder.amount;
      const profitPercent = (profit / (buyOrder.price! * buyOrder.amount)) * 100;

      expect(profit).toBe(2); // 2000 * 0.001
      expect(profitPercent).toBe(4); // 4%
    });
  });

  describe('Complex Queries', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser();
    });

    test('should perform complex aggregations', async () => {
      const strategy = await global.testUtils.createTestStrategy(testUser.id);

      // Create multiple filled orders
      await Promise.all([
        prisma.order.create({
          data: {
            userId: testUser.id,
            strategyId: strategy.id,
            symbol: 'BTC/USD',
            side: 'BUY',
            type: 'MARKET',
            amount: 0.001,
            price: 50000,
            status: 'FILLED',
          },
        }),
        prisma.order.create({
          data: {
            userId: testUser.id,
            strategyId: strategy.id,
            symbol: 'BTC/USD',
            side: 'SELL',
            type: 'MARKET',
            amount: 0.001,
            price: 52000,
            status: 'FILLED',
          },
        }),
        prisma.order.create({
          data: {
            userId: testUser.id,
            strategyId: strategy.id,
            symbol: 'ETH/USD',
            side: 'BUY',
            type: 'MARKET',
            amount: 0.01,
            price: 3000,
            status: 'PENDING',
          },
        }),
      ]);

      // Aggregate orders by status
      const orderStats = await prisma.order.aggregate({
        where: { strategyId: strategy.id },
        _count: { status: true },
        _sum: { amount: true },
        _avg: { price: true },
      });

      expect(orderStats._count.status).toBe(3);
      expect(orderStats._sum.amount).toBeCloseTo(0.021); // 0.001 + 0.001 + 0.01
      expect(orderStats._avg.price).toBeGreaterThan(0);
    });

    test('should perform joins with relations', async () => {
      const strategy = await global.testUtils.createTestStrategy(testUser.id);
      
      await prisma.order.create({
        data: {
          userId: testUser.id,
          strategyId: strategy.id,
          symbol: 'BTC/USD',
          side: 'BUY',
          type: 'MARKET',
          amount: 0.001,
          price: 50000,
          status: 'FILLED',
        },
      });

      // Find orders with user and strategy relations
      const orders = await prisma.order.findMany({
        where: { strategyId: strategy.id },
        include: {
          user: true,
          strategy: true,
        },
      });

      expect(orders).toHaveLength(1);
      expect(orders[0].user).toBeDefined();
      expect(orders[0].user.email).toBe(testUser.email);
      expect(orders[0].strategy).toBeDefined();
      expect(orders[0].strategy.name).toBe(strategy.name);
    });
  });
});