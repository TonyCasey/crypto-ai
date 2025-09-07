import { EventEmitter } from 'events';
import { 
  TradingEngine, 
  TradingEngineConfig,
  EngineMetrics,
} from '@cryptobot/trading';
import { 
  ExchangeFactory,
  IExchangeConnector,
} from '@cryptobot/exchanges';
import { 
  ExchangeType, 
  ExchangeCredentials,
  TradingStrategy,
  OrderRequest,
  Order,
  TradingSignal,
  ApiResponse,
} from '@cryptobot/types';
import { prisma } from '@cryptobot/database';
import { IndicatorInput } from '@cryptobot/indicators';

export interface TradingServiceStatus {
  isRunning: boolean;
  activeStrategies: number;
  activeOrders: number;
  lastUpdate: Date;
  metrics: EngineMetrics;
}

export interface OrderFilters {
  userId: string;
  symbol?: string;
  status?: string;
}

export interface SignalFilters {
  userId: string;
  symbol?: string;
  strategyId?: string;
  limit: number;
}

export interface PerformanceFilters {
  userId: string;
  period: string;
  strategyId?: string;
}

export class TradingService extends EventEmitter {
  private tradingEngine: TradingEngine;
  private exchanges: Map<string, IExchangeConnector> = new Map();
  private isInitialized: boolean = false;
  private marketDataInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();

    const config: TradingEngineConfig = {
      maxConcurrentOrders: 10,
      maxDailyTrades: 50,
      emergencyStopLoss: 0.1, // 10%
      enablePaperTrading: process.env.PAPER_TRADING === 'true',
    };

    this.tradingEngine = new TradingEngine(config);
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load active strategies from database
      await this.loadStrategiesFromDatabase();
      
      // Initialize exchanges
      await this.initializeExchanges();
      
      // Start market data feeds
      this.startMarketDataFeeds();

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Trading service initialization error:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.tradingEngine.start();
    this.emit('started');
  }

  async stop(): Promise<void> {
    await this.tradingEngine.stop();
    
    if (this.marketDataInterval) {
      clearInterval(this.marketDataInterval);
      this.marketDataInterval = null;
    }

    this.emit('stopped');
  }

  async getStatus(): Promise<TradingServiceStatus> {
    return {
      isRunning: this.tradingEngine.isEngineRunning(),
      activeStrategies: this.tradingEngine.getActiveStrategies().length,
      activeOrders: this.tradingEngine.getActiveOrders().length,
      lastUpdate: new Date(),
      metrics: this.tradingEngine.getMetrics(),
    };
  }

  async placeManualOrder(orderData: any): Promise<ApiResponse<Order>> {
    try {
      // Validate user has access to exchange
      const exchangeConfig = await prisma.exchangeConfig.findFirst({
        where: {
          userId: orderData.userId,
          type: orderData.exchangeType,
          isActive: true,
        },
      });

      if (!exchangeConfig) {
        return {
          success: false,
          error: 'Exchange configuration not found or inactive',
          timestamp: new Date(),
        };
      }

      const exchange = this.exchanges.get(exchangeConfig.id);
      if (!exchange) {
        return {
          success: false,
          error: 'Exchange not connected',
          timestamp: new Date(),
        };
      }

      const orderRequest: OrderRequest = {
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        size: { value: orderData.size.toString(), currency: orderData.symbol.split('-')[0] },
        price: orderData.price ? { value: orderData.price.toString(), currency: orderData.symbol.split('-')[1] } : undefined,
        clientOrderId: `manual_${Date.now()}`,
      };

      const result = await exchange.placeOrder(orderRequest);

      if (result.success && result.data) {
        // Save order to database
        await this.saveOrderToDatabase(result.data, exchangeConfig.id);
      }

      return result;
    } catch (error) {
      console.error('Place manual order error:', error);
      return {
        success: false,
        error: 'Failed to place order',
        timestamp: new Date(),
      };
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      // Find order in database
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          exchangeConfig: {
            userId,
          },
        },
        include: {
          exchangeConfig: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: 'Order not found',
          timestamp: new Date(),
        };
      }

      const exchange = this.exchanges.get(order.exchangeConfig.id);
      if (!exchange) {
        return {
          success: false,
          error: 'Exchange not connected',
          timestamp: new Date(),
        };
      }

      const result = await exchange.cancelOrder(order.exchangeOrderId);

      if (result.success) {
        // Update order status in database
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });
      }

      return result;
    } catch (error) {
      console.error('Cancel order error:', error);
      return {
        success: false,
        error: 'Failed to cancel order',
        timestamp: new Date(),
      };
    }
  }

  async getOrders(filters: OrderFilters): Promise<Order[]> {
    try {
      const orders = await prisma.order.findMany({
        where: {
          exchangeConfig: {
            userId: filters.userId,
          },
          ...(filters.symbol && { symbol: filters.symbol }),
          ...(filters.status && { status: filters.status as any }),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          exchangeConfig: {
            select: {
              type: true,
              name: true,
            },
          },
        },
      });

      return orders.map(order => ({
        id: order.id,
        symbol: order.symbol,
        side: order.side as any,
        type: order.type as any,
        size: { value: order.size.toString(), currency: order.symbol.split('-')[0] },
        price: order.price ? { value: order.price.toString(), currency: order.symbol.split('-')[1] } : undefined,
        status: order.status as any,
        filledSize: { value: order.filledSize.toString(), currency: order.symbol.split('-')[0] },
        averageFillPrice: order.averageFillPrice ? { value: order.averageFillPrice.toString(), currency: order.symbol.split('-')[1] } : undefined,
        fees: { value: order.fees.toString(), currency: order.symbol.split('-')[1] },
        clientOrderId: order.clientOrderId || undefined,
        exchangeOrderId: order.exchangeOrderId,
        timeInForce: order.timeInForce as any,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      }));
    } catch (error) {
      console.error('Get orders error:', error);
      return [];
    }
  }

  async getSignals(filters: SignalFilters): Promise<TradingSignal[]> {
    try {
      const signals = await prisma.tradingSignal.findMany({
        where: {
          strategy: {
            userId: filters.userId,
          },
          ...(filters.symbol && { symbol: filters.symbol }),
          ...(filters.strategyId && { strategyId: filters.strategyId }),
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        include: {
          strategy: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      });

      return signals.map(signal => ({
        symbol: signal.symbol,
        side: signal.side as any,
        strength: signal.strength,
        confidence: { value: signal.confidence },
        reason: signal.reason,
        strategyId: signal.strategyId,
        indicatorValues: signal.indicatorValues as Record<string, number>,
        targetPrice: signal.targetPrice ? { value: signal.targetPrice.toString(), currency: signal.symbol.split('-')[1] } : undefined,
        stopLoss: signal.stopLoss ? { value: signal.stopLoss.toString(), currency: signal.symbol.split('-')[1] } : undefined,
        takeProfit: signal.takeProfit ? { value: signal.takeProfit.toString(), currency: signal.symbol.split('-')[1] } : undefined,
        timestamp: signal.timestamp,
        createdAt: signal.createdAt,
      }));
    } catch (error) {
      console.error('Get signals error:', error);
      return [];
    }
  }

  async getPerformance(filters: PerformanceFilters): Promise<any> {
    // This is a simplified implementation
    // In a real application, you'd calculate detailed performance metrics
    try {
      const periodMap: Record<string, number> = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
        'all': 9999,
      };

      const days = periodMap[filters.period] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orders = await prisma.order.findMany({
        where: {
          exchangeConfig: {
            userId: filters.userId,
          },
          status: 'FILLED',
          createdAt: {
            gte: days === 9999 ? undefined : startDate,
          },
        },
      });

      // Calculate basic metrics
      const totalTrades = orders.length;
      const totalVolume = orders.reduce((sum, order) => sum + parseFloat(order.size.toString()), 0);
      const totalFees = orders.reduce((sum, order) => sum + parseFloat(order.fees.toString()), 0);

      return {
        totalTrades,
        totalVolume,
        totalFees,
        period: filters.period,
        // Add more sophisticated calculations here
      };
    } catch (error) {
      console.error('Get performance error:', error);
      return {
        totalTrades: 0,
        totalVolume: 0,
        totalFees: 0,
        period: filters.period,
      };
    }
  }

  async getMetrics(userId: string): Promise<any> {
    try {
      const engineMetrics = this.tradingEngine.getMetrics();
      
      // Add user-specific metrics
      const userStrategies = await prisma.tradingStrategy.count({
        where: { userId, isActive: true },
      });

      const userOrders = await prisma.order.count({
        where: {
          exchangeConfig: { userId },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      return {
        ...engineMetrics,
        userStrategies,
        userOrdersToday: userOrders,
      };
    } catch (error) {
      console.error('Get metrics error:', error);
      return this.tradingEngine.getMetrics();
    }
  }

  private async loadStrategiesFromDatabase(): Promise<void> {
    try {
      const strategies = await prisma.tradingStrategy.findMany({
        where: { isActive: true },
        include: {
          user: {
            include: {
              exchangeConfigs: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      for (const strategy of strategies) {
        if (strategy.user.exchangeConfigs.length > 0) {
          const exchangeConfig = strategy.user.exchangeConfigs[0]; // Use first active exchange
          const exchange = await this.getOrCreateExchange(exchangeConfig);
          
          const tradingStrategy: TradingStrategy = {
            id: strategy.id,
            name: strategy.name,
            type: strategy.type as any,
            description: strategy.description,
            isActive: strategy.isActive,
            symbols: strategy.symbols,
            timeFrame: strategy.timeFrame as any,
            parameters: strategy.parameters as Record<string, any>,
            riskParameters: strategy.riskParameters as any,
            performance: {
              strategyId: strategy.id,
              totalTrades: 0,
              winningTrades: 0,
              losingTrades: 0,
              winRate: { value: 0 },
              totalReturn: { value: '0', currency: 'USD' },
              sharpeRatio: 0,
              maxDrawdown: { value: 0 },
              averageWin: { value: '0', currency: 'USD' },
              averageLoss: { value: '0', currency: 'USD' },
              profitFactor: 0,
              expectancy: { value: '0', currency: 'USD' },
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            createdAt: strategy.createdAt,
            updatedAt: strategy.updatedAt,
          };

          await this.tradingEngine.addStrategy(tradingStrategy, exchange);
        }
      }
    } catch (error) {
      console.error('Load strategies error:', error);
    }
  }

  private async initializeExchanges(): Promise<void> {
    try {
      const exchangeConfigs = await prisma.exchangeConfig.findMany({
        where: { isActive: true },
      });

      for (const config of exchangeConfigs) {
        await this.getOrCreateExchange(config);
      }
    } catch (error) {
      console.error('Initialize exchanges error:', error);
    }
  }

  private async getOrCreateExchange(config: any): Promise<IExchangeConnector> {
    const existingExchange = this.exchanges.get(config.id);
    if (existingExchange) {
      return existingExchange;
    }

    const credentials: ExchangeCredentials = {
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      passphrase: config.passphrase,
      sandbox: config.sandbox,
    };

    const exchange = ExchangeFactory.create(config.type, credentials);
    await exchange.connect();

    this.exchanges.set(config.id, exchange);
    return exchange;
  }

  private startMarketDataFeeds(): void {
    // Simplified market data feed - in production, this would be more sophisticated
    this.marketDataInterval = setInterval(async () => {
      try {
        // Generate sample market data for active symbols
        const activeSymbols = ['BTC-USD', 'ETH-USD']; // This should come from active strategies
        
        for (const symbol of activeSymbols) {
          const mockData: IndicatorInput = {
            timestamp: new Date(),
            open: Math.random() * 50000 + 40000,
            high: Math.random() * 50000 + 40000,
            low: Math.random() * 50000 + 40000,
            close: Math.random() * 50000 + 40000,
            volume: Math.random() * 1000,
          };

          await this.tradingEngine.addMarketData(symbol, mockData);
        }
      } catch (error) {
        console.error('Market data feed error:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  private async saveOrderToDatabase(order: Order, exchangeConfigId: string): Promise<void> {
    try {
      await prisma.order.create({
        data: {
          exchangeOrderId: order.exchangeOrderId,
          clientOrderId: order.clientOrderId || null,
          exchangeConfigId,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          size: order.size.value,
          price: order.price ? order.price.value : null,
          status: order.status,
          filledSize: order.filledSize.value,
          averageFillPrice: order.averageFillPrice ? order.averageFillPrice.value : null,
          fees: order.fees.value,
          timeInForce: order.timeInForce,
        },
      });
    } catch (error) {
      console.error('Save order to database error:', error);
    }
  }

  private setupEventListeners(): void {
    this.tradingEngine.on('tradeExecuted', (data) => {
      this.emit('tradeExecuted', data);
    });

    this.tradingEngine.on('signalGenerated', (signal) => {
      this.emit('signalGenerated', signal);
    });

    this.tradingEngine.on('error', (error) => {
      this.emit('error', error);
    });
  }
}