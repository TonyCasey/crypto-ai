import {
  TradingStrategy,
  TradingSignal,
  OrderRequest,
  Order,
  StrategyExecution,
  IExchangeConnector,
  ApiResponse,
} from '@cryptobot/types';
import { IndicatorInput } from '@cryptobot/indicators';
import { BaseStrategy } from '../strategies/base-strategy';
import { StrategyFactory } from '../strategies/strategy-factory';
import { SafetyEngine } from '../safety/safety-engine';
import { EventEmitter } from 'events';

export interface TradingEngineConfig {
  maxConcurrentOrders: number;
  maxDailyTrades: number;
  emergencyStopLoss: number;
  enablePaperTrading: boolean;
}

export interface EngineMetrics {
  totalSignals: number;
  executedTrades: number;
  rejectedSignals: number;
  activeStrategies: number;
  totalPnL: number;
  successRate: number;
}

export class TradingEngine extends EventEmitter {
  private strategies: Map<string, BaseStrategy> = new Map();
  private exchanges: Map<string, IExchangeConnector> = new Map();
  private safetyEngine: SafetyEngine;
  private config: TradingEngineConfig;
  private metrics: EngineMetrics;
  private isRunning: boolean = false;
  private activeOrders: Map<string, Order> = new Map();

  constructor(config: TradingEngineConfig) {
    super();
    this.config = config;
    this.safetyEngine = new SafetyEngine();
    this.metrics = {
      totalSignals: 0,
      executedTrades: 0,
      rejectedSignals: 0,
      activeStrategies: 0,
      totalPnL: 0,
      successRate: 0,
    };

    this.setupEventListeners();
  }

  async addStrategy(strategy: TradingStrategy, exchange: IExchangeConnector): Promise<void> {
    try {
      const strategyInstance = StrategyFactory.create(strategy);
      
      // Initialize strategy with empty market data initially
      const firstSymbol = strategy.symbols[0];
      if (firstSymbol) {
        await strategyInstance.initialize(firstSymbol, []);
      }
      
      this.strategies.set(strategy.id, strategyInstance);
      this.exchanges.set(strategy.id, exchange);
      this.metrics.activeStrategies = this.strategies.size;

      this.emit('strategyAdded', { strategyId: strategy.id, type: strategy.type });
    } catch (error) {
      this.emit('error', { error, strategyId: strategy.id });
      throw error;
    }
  }

  async removeStrategy(strategyId: string): Promise<void> {
    const strategy = this.strategies.get(strategyId);
    if (strategy) {
      strategy.setActive(false);
      this.strategies.delete(strategyId);
      this.exchanges.delete(strategyId);
      this.metrics.activeStrategies = this.strategies.size;
      
      this.emit('strategyRemoved', { strategyId });
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Trading engine is already running');
    }

    this.isRunning = true;
    this.emit('engineStarted');

    // Start monitoring active orders
    this.startOrderMonitoring();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    // Cancel all pending orders
    await this.cancelAllOrders();
    
    this.emit('engineStopped');
  }

  async processMarketData(symbol: string, data: IndicatorInput[]): Promise<void> {
    if (!this.isRunning) return;

    const relevantStrategies = Array.from(this.strategies.values())
      .filter(strategy => strategy.getStrategy().symbols.includes(symbol) && strategy.isActive());

    for (const strategy of relevantStrategies) {
      try {
        strategy.updateMarketData(data);
        
        // Generate signal
        const signal = await strategy.run();
        
        if (signal) {
          await this.processSignal(signal, strategy);
        }
      } catch (error) {
        this.emit('strategyError', { 
          strategyId: strategy.getStrategy().id, 
          error,
          symbol 
        });
      }
    }
  }

  async addMarketData(symbol: string, data: IndicatorInput): Promise<void> {
    if (!this.isRunning) return;

    const relevantStrategies = Array.from(this.strategies.values())
      .filter(strategy => strategy.getStrategy().symbols.includes(symbol) && strategy.isActive());

    for (const strategy of relevantStrategies) {
      try {
        strategy.addMarketData(data);
        
        const signal = await strategy.run();
        if (signal) {
          await this.processSignal(signal, strategy);
        }
      } catch (error) {
        this.emit('strategyError', { 
          strategyId: strategy.getStrategy().id, 
          error,
          symbol 
        });
      }
    }
  }

  private async processSignal(signal: TradingSignal, strategy: BaseStrategy): Promise<void> {
    this.metrics.totalSignals++;
    
    try {
      // Safety checks
      const safetyResult = await this.safetyEngine.validateSignal(signal, {
        activeOrders: Array.from(this.activeOrders.values()),
        dailyTrades: this.metrics.executedTrades,
        maxDailyTrades: this.config.maxDailyTrades,
      });

      if (!safetyResult.isValid) {
        this.metrics.rejectedSignals++;
        this.emit('signalRejected', { signal, reasons: safetyResult.reasons });
        return;
      }

      // Create order request
      const orderRequest = strategy.createOrderRequest(signal);
      
      // Execute order
      if (this.config.enablePaperTrading) {
        await this.executePaperTrade(signal, orderRequest, strategy);
      } else {
        await this.executeRealTrade(signal, orderRequest, strategy);
      }

    } catch (error) {
      this.emit('signalProcessingError', { signal, error });
    }
  }

  private async executeRealTrade(
    signal: TradingSignal,
    orderRequest: OrderRequest,
    strategy: BaseStrategy
  ): Promise<void> {
    const exchange = this.exchanges.get(strategy.getStrategy().id);
    if (!exchange) {
      throw new Error(`No exchange configured for strategy ${strategy.getStrategy().id}`);
    }

    try {
      const response = await exchange.placeOrder(orderRequest);
      
      if (response.success && response.data) {
        const order = response.data;
        this.activeOrders.set(order.id, order);
        this.metrics.executedTrades++;

        const execution: StrategyExecution = {
          id: `exec_${Date.now()}`,
          strategyId: strategy.getStrategy().id,
          signal: signal,
          order: orderRequest,
          executionTime: new Date(),
          status: 'executed',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.emit('tradeExecuted', { signal, order, execution });
      } else {
        this.metrics.rejectedSignals++;
        this.emit('tradeRejected', { signal, error: response.error });
      }
    } catch (error) {
      this.emit('tradeExecutionError', { signal, orderRequest, error });
      throw error;
    }
  }

  private async executePaperTrade(
    signal: TradingSignal,
    orderRequest: OrderRequest,
    strategy: BaseStrategy
  ): Promise<void> {
    // Simulate order execution
    const simulatedOrder: Order = {
      id: `paper_${Date.now()}`,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      size: orderRequest.size,
      price: orderRequest.price,
      status: 'filled' as any,
      filledSize: orderRequest.size,
      averageFillPrice: orderRequest.price,
      fees: { value: '0', currency: orderRequest.symbol.split('-')[1] || 'USD' },
      clientOrderId: orderRequest.clientOrderId,
      exchangeOrderId: `paper_${Date.now()}`,
      timeInForce: orderRequest.timeInForce || 'GTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.metrics.executedTrades++;

    const execution: StrategyExecution = {
      id: `paper_exec_${Date.now()}`,
      strategyId: strategy.getStrategy().id,
      signal: signal,
      order: orderRequest,
      executionTime: new Date(),
      status: 'executed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.emit('paperTradeExecuted', { signal, order: simulatedOrder, execution });
  }

  private async cancelAllOrders(): Promise<void> {
    const cancelPromises: Promise<void>[] = [];

    for (const [strategyId, order] of this.activeOrders.entries()) {
      const exchange = this.exchanges.get(strategyId);
      if (exchange) {
        cancelPromises.push(
          exchange.cancelOrder(order.id)
            .then(() => {
              this.activeOrders.delete(order.id);
            })
            .catch(error => {
              this.emit('orderCancelError', { orderId: order.id, error });
            })
        );
      }
    }

    await Promise.allSettled(cancelPromises);
  }

  private startOrderMonitoring(): void {
    const monitorInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitorInterval);
        return;
      }

      await this.updateActiveOrders();
    }, 10000); // Check every 10 seconds
  }

  private async updateActiveOrders(): Promise<void> {
    const updatePromises: Promise<void>[] = [];

    for (const [strategyId, order] of this.activeOrders.entries()) {
      const exchange = this.exchanges.get(strategyId);
      if (exchange) {
        updatePromises.push(
          exchange.getOrder(order.exchangeOrderId)
            .then(response => {
              if (response.success && response.data) {
                const updatedOrder = response.data;
                this.activeOrders.set(order.id, updatedOrder);

                // Remove filled or cancelled orders
                if (updatedOrder.status === 'filled' || updatedOrder.status === 'cancelled') {
                  this.activeOrders.delete(order.id);
                  this.emit('orderCompleted', updatedOrder);
                }
              }
            })
            .catch(error => {
              this.emit('orderUpdateError', { orderId: order.id, error });
            })
        );
      }
    }

    await Promise.allSettled(updatePromises);
  }

  private setupEventListeners(): void {
    this.on('tradeExecuted', ({ order }) => {
      this.updateMetrics();
    });

    this.on('orderCompleted', (order: Order) => {
      if (order.status === 'filled') {
        // Update PnL calculation here
        this.updatePnL(order);
      }
    });
  }

  private updateMetrics(): void {
    if (this.metrics.totalSignals > 0) {
      this.metrics.successRate = (this.metrics.executedTrades / this.metrics.totalSignals) * 100;
    }
  }

  private updatePnL(order: Order): void {
    // Simplified PnL calculation - in real implementation, this would be more sophisticated
    // This is just a placeholder for the concept
    this.emit('pnlUpdated', { orderId: order.id, pnl: 0 });
  }

  // Public getters
  getMetrics(): EngineMetrics {
    return { ...this.metrics };
  }

  getActiveStrategies(): BaseStrategy[] {
    return Array.from(this.strategies.values());
  }

  getActiveOrders(): Order[] {
    return Array.from(this.activeOrders.values());
  }

  isEngineRunning(): boolean {
    return this.isRunning;
  }
}