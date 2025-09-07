import {
  TradingSignal,
  TradingStrategy,
  OrderRequest,
  TradingStrategyType,
  TimeFrame,
  OrderSide,
  RiskParameters,
} from '@cryptobot/types';
import { BaseIndicator, IndicatorInput } from '@cryptobot/indicators';
import { EventEmitter } from 'events';

export interface StrategyContext {
  symbol: string;
  timeFrame: TimeFrame;
  marketData: IndicatorInput[];
  indicators: Map<string, BaseIndicator>;
  lastSignal?: TradingSignal;
}

export abstract class BaseStrategy extends EventEmitter {
  protected readonly strategy: TradingStrategy;
  protected context: StrategyContext;
  protected isRunning: boolean = false;

  constructor(strategy: TradingStrategy) {
    super();
    this.strategy = strategy;
    this.context = {
      symbol: '',
      timeFrame: strategy.timeFrame as TimeFrame,
      marketData: [],
      indicators: new Map(),
    };
  }

  abstract generateSignal(context: StrategyContext): Promise<TradingSignal | null>;
  abstract validateSignal(signal: TradingSignal): boolean;
  abstract createOrderRequest(signal: TradingSignal): OrderRequest;

  async initialize(symbol: string, marketData: IndicatorInput[]): Promise<void> {
    this.context.symbol = symbol;
    this.context.marketData = marketData;
    
    // Initialize indicators based on strategy parameters
    await this.initializeIndicators();
    
    this.emit('initialized', { strategy: this.strategy, symbol });
  }

  async run(): Promise<TradingSignal | null> {
    if (!this.strategy.isActive || !this.context.marketData.length) {
      return null;
    }

    try {
      const signal = await this.generateSignal(this.context);
      
      if (signal && this.validateSignal(signal)) {
        this.context.lastSignal = signal;
        this.emit('signalGenerated', signal);
        return signal;
      }

      return null;
    } catch (error) {
      this.emit('error', { error, strategy: this.strategy.id });
      throw error;
    }
  }

  updateMarketData(newData: IndicatorInput[]): void {
    this.context.marketData = newData;
    
    // Update all indicators with new data
    for (const indicator of this.context.indicators.values()) {
      indicator.calculate(newData);
    }

    this.emit('marketDataUpdated', { symbol: this.context.symbol, dataPoints: newData.length });
  }

  addMarketData(data: IndicatorInput): void {
    this.context.marketData.push(data);
    
    // Update all indicators
    for (const indicator of this.context.indicators.values()) {
      indicator.calculate(this.context.marketData);
    }

    this.emit('marketDataAdded', { symbol: this.context.symbol, timestamp: data.timestamp });
  }

  getStrategy(): TradingStrategy {
    return this.strategy;
  }

  getContext(): StrategyContext {
    return { ...this.context };
  }

  isActive(): boolean {
    return this.strategy.isActive;
  }

  setActive(active: boolean): void {
    this.strategy.isActive = active;
    this.emit('statusChanged', { strategyId: this.strategy.id, isActive: active });
  }

  protected abstract initializeIndicators(): Promise<void>;

  protected createSignal(
    side: OrderSide,
    strength: number,
    confidence: number,
    reason: string,
    indicatorValues: Record<string, number> = {},
    targetPrice?: number,
    stopLoss?: number,
    takeProfit?: number
  ): TradingSignal {
    return {
      symbol: this.context.symbol,
      side,
      strength: Math.max(0, Math.min(1, strength)),
      confidence: { value: Math.max(0, Math.min(100, confidence)) },
      reason,
      strategyId: this.strategy.id,
      indicatorValues,
      targetPrice: targetPrice ? { value: targetPrice.toString(), currency: this.context.symbol.split('-')[1] } : undefined,
      stopLoss: stopLoss ? { value: stopLoss.toString(), currency: this.context.symbol.split('-')[1] } : undefined,
      takeProfit: takeProfit ? { value: takeProfit.toString(), currency: this.context.symbol.split('-')[1] } : undefined,
      timestamp: new Date(),
      createdAt: new Date(),
    };
  }

  protected getCurrentPrice(): number | null {
    if (this.context.marketData.length === 0) return null;
    return this.context.marketData[this.context.marketData.length - 1].close;
  }

  protected checkRiskParameters(signal: TradingSignal): boolean {
    const riskParams = this.strategy.riskParameters as RiskParameters;
    const currentPrice = this.getCurrentPrice();
    
    if (!currentPrice) return false;

    // Check stop loss
    if (signal.stopLoss && riskParams.stopLossPercentage) {
      const stopLossPrice = parseFloat(signal.stopLoss.value);
      const stopLossPercent = Math.abs(currentPrice - stopLossPrice) / currentPrice;
      
      if (stopLossPercent > riskParams.stopLossPercentage.value / 100) {
        this.emit('riskViolation', {
          type: 'stopLoss',
          signal,
          violation: `Stop loss ${stopLossPercent * 100}% exceeds limit ${riskParams.stopLossPercentage.value}%`
        });
        return false;
      }
    }

    // Check take profit
    if (signal.takeProfit && riskParams.takeProfitPercentage) {
      const takeProfitPrice = parseFloat(signal.takeProfit.value);
      const takeProfitPercent = Math.abs(takeProfitPrice - currentPrice) / currentPrice;
      
      if (takeProfitPercent > riskParams.takeProfitPercentage.value / 100) {
        this.emit('riskViolation', {
          type: 'takeProfit',
          signal,
          violation: `Take profit ${takeProfitPercent * 100}% exceeds limit ${riskParams.takeProfitPercentage.value}%`
        });
        return false;
      }
    }

    return true;
  }

  protected calculatePositionSize(signal: TradingSignal, portfolioValue: number): number {
    const riskParams = this.strategy.riskParameters as RiskParameters;
    const currentPrice = this.getCurrentPrice();
    
    if (!currentPrice) return 0;

    // Calculate max position based on percentage of portfolio
    const maxPositionValue = portfolioValue * (riskParams.maxPositionSize.value / 100);
    let positionSize = maxPositionValue / currentPrice;

    // Adjust based on stop loss if available
    if (signal.stopLoss && riskParams.maxDailyLoss) {
      const stopLossPrice = parseFloat(signal.stopLoss.value);
      const riskPerShare = Math.abs(currentPrice - stopLossPrice);
      const maxShares = parseFloat(riskParams.maxDailyLoss.value) / riskPerShare;
      positionSize = Math.min(positionSize, maxShares);
    }

    return Math.max(0, positionSize);
  }

  protected shouldReversePosition(signal: TradingSignal): boolean {
    if (!this.context.lastSignal) return false;
    
    // Check if we're switching from buy to sell or vice versa
    return this.context.lastSignal.side !== signal.side;
  }

  protected getIndicatorValue(indicatorKey: string): number | null {
    const indicator = this.context.indicators.get(indicatorKey);
    if (!indicator) return null;
    
    const latestResult = indicator.getLatestResult();
    return latestResult ? latestResult.value : null;
  }

  protected getIndicatorValues(): Record<string, number> {
    const values: Record<string, number> = {};
    
    for (const [key, indicator] of this.context.indicators.entries()) {
      const latestResult = indicator.getLatestResult();
      if (latestResult) {
        values[key] = latestResult.value;
      }
    }
    
    return values;
  }
}