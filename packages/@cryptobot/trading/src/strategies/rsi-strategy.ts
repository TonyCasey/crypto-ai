import {
  TradingSignal,
  TradingStrategy,
  OrderRequest,
  OrderSide,
  OrderType,
  TimeFrame,
  IndicatorType,
} from '@cryptobot/types';
import { RSIIndicator, IndicatorFactory } from '@cryptobot/indicators';
import { BaseStrategy, StrategyContext } from './base-strategy';

export interface RSIStrategyParameters {
  rsiPeriod: number;
  oversold: number;
  overbought: number;
  minConfidence: number;
}

export class RSIStrategy extends BaseStrategy {
  private rsiIndicator: RSIIndicator | null = null;
  private parameters: RSIStrategyParameters;

  constructor(strategy: TradingStrategy) {
    super(strategy);
    this.parameters = {
      rsiPeriod: strategy.parameters.rsiPeriod || 14,
      oversold: strategy.parameters.oversold || 30,
      overbought: strategy.parameters.overbought || 70,
      minConfidence: strategy.parameters.minConfidence || 70,
    };
  }

  protected async initializeIndicators(): Promise<void> {
    this.rsiIndicator = RSIIndicator.create(
      this.context.symbol,
      this.context.timeFrame,
      this.parameters.rsiPeriod,
      this.parameters.overbought,
      this.parameters.oversold
    );

    this.context.indicators.set('rsi', this.rsiIndicator);
    
    // Calculate initial values if we have data
    if (this.context.marketData.length > 0) {
      this.rsiIndicator.calculate(this.context.marketData);
    }
  }

  async generateSignal(context: StrategyContext): Promise<TradingSignal | null> {
    if (!this.rsiIndicator) {
      throw new Error('RSI indicator not initialized');
    }

    const rsiResult = this.rsiIndicator.getLatestResult();
    if (!rsiResult || !rsiResult.metadata) {
      return null;
    }

    const rsiValue = rsiResult.value;
    const signal = rsiResult.metadata.signal as 'overbought' | 'oversold' | 'neutral';
    const currentPrice = this.getCurrentPrice();

    if (!currentPrice) return null;

    let tradingSignal: TradingSignal | null = null;

    if (signal === 'oversold' && rsiValue <= this.parameters.oversold) {
      // RSI indicates oversold condition - potential buy signal
      const strength = (this.parameters.oversold - rsiValue) / this.parameters.oversold;
      const confidence = Math.min(95, 60 + (this.parameters.oversold - rsiValue) * 2);

      if (confidence >= this.parameters.minConfidence) {
        tradingSignal = this.createSignal(
          OrderSide.BUY,
          strength,
          confidence,
          `RSI oversold at ${rsiValue.toFixed(2)}, below ${this.parameters.oversold}`,
          { rsi: rsiValue },
          currentPrice * 1.05, // Target 5% profit
          currentPrice * 0.95, // Stop loss at 5%
          currentPrice * 1.10  // Take profit at 10%
        );
      }
    } else if (signal === 'overbought' && rsiValue >= this.parameters.overbought) {
      // RSI indicates overbought condition - potential sell signal
      const strength = (rsiValue - this.parameters.overbought) / (100 - this.parameters.overbought);
      const confidence = Math.min(95, 60 + (rsiValue - this.parameters.overbought) * 2);

      if (confidence >= this.parameters.minConfidence) {
        tradingSignal = this.createSignal(
          OrderSide.SELL,
          strength,
          confidence,
          `RSI overbought at ${rsiValue.toFixed(2)}, above ${this.parameters.overbought}`,
          { rsi: rsiValue },
          currentPrice * 0.95, // Target 5% profit (for short)
          currentPrice * 1.05, // Stop loss at 5%
          currentPrice * 0.90  // Take profit at 10%
        );
      }
    }

    return tradingSignal;
  }

  validateSignal(signal: TradingSignal): boolean {
    // Basic validation
    if (!signal || signal.confidence.value < this.parameters.minConfidence) {
      return false;
    }

    // Check if we're not generating opposite signals too quickly
    if (this.context.lastSignal) {
      const timeDiff = signal.createdAt.getTime() - this.context.lastSignal.createdAt.getTime();
      const minCooldown = 30 * 60 * 1000; // 30 minutes cooldown

      if (timeDiff < minCooldown && this.context.lastSignal.side !== signal.side) {
        this.emit('signalRejected', {
          signal,
          reason: `Signal rejected due to cooldown. Last signal: ${this.context.lastSignal.side}, new: ${signal.side}`
        });
        return false;
      }
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

    // Calculate position size (this would typically come from portfolio management)
    const portfolioValue = 10000; // This should be passed from portfolio manager
    const positionSize = this.calculatePositionSize(signal, portfolioValue);

    return {
      symbol: signal.symbol,
      side: signal.side,
      type: OrderType.MARKET, // RSI strategy uses market orders for quick execution
      size: { 
        value: positionSize.toFixed(8), 
        currency: signal.symbol.split('-')[0] || 'BTC' 
      },
      clientOrderId: `rsi_${signal.strategyId}_${Date.now()}`,
      timeInForce: 'GTC',
    };
  }

  // Additional methods specific to RSI strategy
  isInTrend(): boolean {
    if (!this.rsiIndicator || this.context.marketData.length < 20) {
      return false;
    }

    const results = this.rsiIndicator.getResults();
    if (results.length < 10) return false;

    const recent = results.slice(-10);
    const avgRsi = recent.reduce((sum, r) => sum + r.value, 0) / recent.length;
    
    // Consider we're in trend if RSI is consistently above/below 50
    return avgRsi > 60 || avgRsi < 40;
  }

  getRSIDivergence(): 'bullish' | 'bearish' | null {
    if (!this.rsiIndicator || this.context.marketData.length < 20) {
      return null;
    }

    const rsiResults = this.rsiIndicator.getResults();
    const marketData = this.context.marketData;

    if (rsiResults.length < 20 || marketData.length < 20) return null;

    const recentRsi = rsiResults.slice(-10);
    const recentPrices = marketData.slice(-10);

    // Simple divergence detection
    const lastRsi = recentRsi[recentRsi.length - 1];
    const firstRsi = recentRsi[0];
    const lastPrice = recentPrices[recentPrices.length - 1];
    const firstPrice = recentPrices[0];
    
    if (!lastRsi || !firstRsi || !lastPrice || !firstPrice) {
      return null;
    }
    
    const rsiTrend = lastRsi.value - firstRsi.value;
    const priceTrend = lastPrice.close - firstPrice.close;

    // Bullish divergence: price going down, RSI going up
    if (priceTrend < 0 && rsiTrend > 0 && Math.abs(rsiTrend) > 5) {
      return 'bullish';
    }

    // Bearish divergence: price going up, RSI going down
    if (priceTrend > 0 && rsiTrend < 0 && Math.abs(rsiTrend) > 5) {
      return 'bearish';
    }

    return null;
  }
}