import {
  TradingSignal,
  TradingStrategy,
  OrderRequest,
  OrderSide,
  OrderType,
} from '@cryptobot/types';
import { MACDIndicator, MACDResult } from '@cryptobot/indicators';
import { BaseStrategy, StrategyContext } from './base-strategy';

export interface MACDStrategyParameters {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  minHistogramThreshold: number;
  minConfidence: number;
}

export class MACDStrategy extends BaseStrategy {
  private macdIndicator: MACDIndicator | null = null;
  private parameters: MACDStrategyParameters;

  constructor(strategy: TradingStrategy) {
    super(strategy);
    this.parameters = {
      fastPeriod: strategy.parameters.fastPeriod || 12,
      slowPeriod: strategy.parameters.slowPeriod || 26,
      signalPeriod: strategy.parameters.signalPeriod || 9,
      minHistogramThreshold: strategy.parameters.minHistogramThreshold || 0.001,
      minConfidence: strategy.parameters.minConfidence || 70,
    };
  }

  protected async initializeIndicators(): Promise<void> {
    this.macdIndicator = MACDIndicator.create(
      this.context.symbol,
      this.context.timeFrame,
      this.parameters.fastPeriod,
      this.parameters.slowPeriod,
      this.parameters.signalPeriod
    );

    this.context.indicators.set('macd', this.macdIndicator);
    
    if (this.context.marketData.length > 0) {
      this.macdIndicator.calculate(this.context.marketData);
    }
  }

  async generateSignal(context: StrategyContext): Promise<TradingSignal | null> {
    if (!this.macdIndicator) {
      throw new Error('MACD indicator not initialized');
    }

    const results = this.macdIndicator.getResults();
    if (results.length < 2) return null;

    const currentResult = results[results.length - 1] as MACDResult;
    const previousResult = results[results.length - 2] as MACDResult;
    const currentPrice = this.getCurrentPrice();

    if (!currentResult.metadata || !previousResult.metadata || !currentPrice) {
      return null;
    }

    const currentHistogram = currentResult.metadata.histogram;
    const previousHistogram = previousResult.metadata.histogram;
    const macdValue = currentResult.metadata.macd;
    const signalValue = currentResult.metadata.signal;
    const crossover = currentResult.metadata.crossover;

    let tradingSignal: TradingSignal | null = null;

    // Bullish crossover: MACD line crosses above signal line
    if (crossover === 'bullish' && Math.abs(currentHistogram) > this.parameters.minHistogramThreshold) {
      const strength = Math.min(1, Math.abs(currentHistogram) / (currentPrice * 0.01));
      const confidence = this.calculateConfidence('bullish', currentHistogram, macdValue, signalValue);

      if (confidence >= this.parameters.minConfidence) {
        tradingSignal = this.createSignal(
          OrderSide.BUY,
          strength,
          confidence,
          `MACD bullish crossover: MACD(${macdValue.toFixed(4)}) > Signal(${signalValue.toFixed(4)})`,
          {
            macd: macdValue,
            signal: signalValue,
            histogram: currentHistogram,
          },
          currentPrice * 1.03, // Target 3% profit
          currentPrice * 0.98, // Stop loss at 2%
          currentPrice * 1.06  // Take profit at 6%
        );
      }
    }
    // Bearish crossover: MACD line crosses below signal line
    else if (crossover === 'bearish' && Math.abs(currentHistogram) > this.parameters.minHistogramThreshold) {
      const strength = Math.min(1, Math.abs(currentHistogram) / (currentPrice * 0.01));
      const confidence = this.calculateConfidence('bearish', currentHistogram, macdValue, signalValue);

      if (confidence >= this.parameters.minConfidence) {
        tradingSignal = this.createSignal(
          OrderSide.SELL,
          strength,
          confidence,
          `MACD bearish crossover: MACD(${macdValue.toFixed(4)}) < Signal(${signalValue.toFixed(4)})`,
          {
            macd: macdValue,
            signal: signalValue,
            histogram: currentHistogram,
          },
          currentPrice * 0.97, // Target 3% profit (for short)
          currentPrice * 1.02, // Stop loss at 2%
          currentPrice * 0.94  // Take profit at 6%
        );
      }
    }

    return tradingSignal;
  }

  validateSignal(signal: TradingSignal): boolean {
    if (!signal || signal.confidence.value < this.parameters.minConfidence) {
      return false;
    }

    // Check for trend confirmation
    if (!this.isTrendConfirmed(signal.side)) {
      this.emit('signalRejected', {
        signal,
        reason: 'MACD signal not confirmed by overall trend'
      });
      return false;
    }

    // Avoid signals when MACD is near zero line (low conviction)
    const macdValue = signal.indicatorValues.macd;
    if (macdValue !== undefined && Math.abs(macdValue) < this.parameters.minHistogramThreshold * 0.5) {
      this.emit('signalRejected', {
        signal,
        reason: 'MACD too close to zero line'
      });
      return false;
    }

    // Check risk parameters
    if (!this.checkRiskParameters(signal)) {
      return false;
    }

    return true;
  }

  createOrderRequest(signal: TradingSignal): OrderRequest {
    const currentPrice = this.getCurrentPrice();
    if (!currentPrice) {
      throw new Error('Cannot create order request without current price');
    }

    const portfolioValue = 10000; // Should be passed from portfolio manager
    const positionSize = this.calculatePositionSize(signal, portfolioValue);

    return {
      symbol: signal.symbol,
      side: signal.side,
      type: OrderType.LIMIT, // MACD strategy uses limit orders for better fills
      size: { 
        value: positionSize.toFixed(8), 
        currency: signal.symbol.split('-')[0] || 'BTC' 
      },
      price: signal.side === OrderSide.BUY 
        ? { value: (currentPrice * 0.999).toFixed(2), currency: signal.symbol.split('-')[1] || 'USD' }  // Slightly below market
        : { value: (currentPrice * 1.001).toFixed(2), currency: signal.symbol.split('-')[1] || 'USD' }, // Slightly above market
      clientOrderId: `macd_${signal.strategyId}_${Date.now()}`,
      timeInForce: 'GTC',
    };
  }

  private calculateConfidence(
    direction: 'bullish' | 'bearish',
    histogram: number,
    macd: number,
    signal: number
  ): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on histogram strength
    const histogramStrength = Math.abs(histogram);
    confidence += Math.min(25, histogramStrength * 10000);

    // Increase confidence if MACD and signal are diverging
    const divergence = Math.abs(macd - signal);
    confidence += Math.min(15, divergence * 5000);

    // Increase confidence based on direction and MACD position
    if (direction === 'bullish') {
      if (macd < 0 && macd > signal) confidence += 10; // Bullish in oversold area
    } else {
      if (macd > 0 && macd < signal) confidence += 10; // Bearish in overbought area
    }

    return Math.min(95, confidence);
  }

  private isTrendConfirmed(side: OrderSide): boolean {
    if (!this.macdIndicator) return false;

    const results = this.macdIndicator.getResults();
    if (results.length < 5) return false;

    const recentResults = results.slice(-5) as MACDResult[];
    
    // Check if MACD trend aligns with signal direction
    const lastResult = recentResults[recentResults.length - 1];
    const firstResult = recentResults[0];
    
    if (!lastResult || !firstResult) return false;
    
    const macdTrend = lastResult.metadata.macd - firstResult.metadata.macd;
    
    if (side === OrderSide.BUY && macdTrend > 0) return true;
    if (side === OrderSide.SELL && macdTrend < 0) return true;
    
    return false;
  }

  // Additional MACD-specific methods
  getMACD(): { macd: number; signal: number; histogram: number } | null {
    if (!this.macdIndicator) return null;

    const latestResult = this.macdIndicator.getLatestResult() as MACDResult;
    if (!latestResult?.metadata) return null;

    return {
      macd: latestResult.metadata.macd,
      signal: latestResult.metadata.signal,
      histogram: latestResult.metadata.histogram,
    };
  }

  isMACDAboveZero(): boolean {
    const macdData = this.getMACD();
    return macdData ? macdData.macd > 0 : false;
  }

  getHistogramTrend(periods: number = 5): 'rising' | 'falling' | 'flat' {
    if (!this.macdIndicator) return 'flat';

    const results = this.macdIndicator.getResults();
    if (results.length < periods) return 'flat';

    const recentResults = results.slice(-periods) as MACDResult[];
    const firstResult = recentResults[0];
    const lastResult = recentResults[recentResults.length - 1];
    
    if (!firstResult || !lastResult) return 'flat';
    
    const first = firstResult.metadata.histogram;
    const last = lastResult.metadata.histogram;
    
    const change = last - first;
    const threshold = Math.abs(first * 0.1); // 10% threshold
    
    if (change > threshold) return 'rising';
    if (change < -threshold) return 'falling';
    return 'flat';
  }
}