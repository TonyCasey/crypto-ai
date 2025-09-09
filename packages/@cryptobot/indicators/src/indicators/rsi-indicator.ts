import { IndicatorType, TimeFrame } from '@cryptobot/types';
import { BaseIndicator, IndicatorInput, IndicatorResult } from './base-indicator';
import { MathUtils } from '../utils/math-utils';

export interface RSIParameters {
  period: number;
  overbought: number;
  oversold: number;
}

export class RSIIndicator extends BaseIndicator {
  private readonly period: number;
  private readonly overbought: number;
  private readonly oversold: number;

  constructor(symbol: string, timeFrame: TimeFrame, parameters: RSIParameters) {
    super(IndicatorType.RSI, symbol, timeFrame, parameters);
    this.period = parameters.period;
    this.overbought = parameters.overbought || 70;
    this.oversold = parameters.oversold || 30;

    if (this.period <= 0) {
      throw new Error('RSI period must be greater than 0');
    }
  }

  calculate(inputs: IndicatorInput[]): IndicatorResult[] {
    this.validateInputs(inputs, this.period + 1);

    const closePrices = inputs.map(input => input.close);
    const rsiValues = this.calculateRSI(closePrices, this.period);

    this.results = [];
    for (let i = 0; i < rsiValues.length; i++) {
      const inputIndex = i + this.period;
      const rawRsiValue = rsiValues[i];
      const inputData = inputs[inputIndex];
      
      if (rawRsiValue !== undefined && inputData) {
        const rsiValue = MathUtils.roundToDecimalPlaces(rawRsiValue, 2);
        
        this.results.push(
          this.createResult(
            inputData.timestamp,
            rsiValue,
            {
              period: this.period,
              overbought: this.overbought,
              oversold: this.oversold,
              signal: this.getSignal(rsiValue),
            }
          )
        );
      }
    }

    return this.getResults();
  }

  private calculateRSI(prices: number[], period: number): number[] {
    if (prices.length < period + 1) return [];

    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i];
      const previousPrice = prices[i - 1];
      
      if (currentPrice !== undefined && previousPrice !== undefined) {
        const change = currentPrice - previousPrice;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }
    }

    // Calculate average gain and loss using EMA
    const avgGains = MathUtils.calculateEMA(gains, period);
    const avgLosses = MathUtils.calculateEMA(losses, period);

    const rsiValues: number[] = [];
    for (let i = 0; i < avgGains.length; i++) {
      const avgGain = avgGains[i];
      const avgLoss = avgLosses[i];
      
      if (avgGain !== undefined && avgLoss !== undefined) {
        if (avgLoss === 0) {
          rsiValues.push(100);
        } else {
          const rs = avgGain / avgLoss;
          const rsi = 100 - (100 / (1 + rs));
          rsiValues.push(MathUtils.clamp(rsi, 0, 100));
        }
      }
    }

    return rsiValues;
  }

  private getSignal(rsiValue: number): 'overbought' | 'oversold' | 'neutral' {
    if (rsiValue >= this.overbought) return 'overbought';
    if (rsiValue <= this.oversold) return 'oversold';
    return 'neutral';
  }

  static create(symbol: string, timeFrame: TimeFrame, period: number = 14, overbought: number = 70, oversold: number = 30): RSIIndicator {
    return new RSIIndicator(symbol, timeFrame, { period, overbought, oversold });
  }
}