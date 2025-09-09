import { IndicatorType, TimeFrame } from '@cryptobot/types';
import { BaseIndicator, IndicatorInput, IndicatorResult } from './base-indicator';
import { MathUtils } from '../utils/math-utils';

export interface ATRParameters {
  period: number;
}

export class ATRIndicator extends BaseIndicator {
  private readonly period: number;

  constructor(symbol: string, timeFrame: TimeFrame, parameters: ATRParameters) {
    super(IndicatorType.ATR, symbol, timeFrame, parameters);
    this.period = parameters.period;

    if (this.period <= 0) {
      throw new Error('ATR period must be greater than 0');
    }
  }

  calculate(inputs: IndicatorInput[]): IndicatorResult[] {
    this.validateInputs(inputs, this.period + 1);

    const highPrices = inputs.map(input => input.high);
    const lowPrices = inputs.map(input => input.low);
    const closePrices = inputs.map(input => input.close);

    // Calculate True Range
    const trueRanges = MathUtils.calculateTrueRange(highPrices, lowPrices, closePrices);
    
    // Calculate ATR using EMA of True Range
    const atrValues = MathUtils.calculateEMA(trueRanges, this.period);

    this.results = [];
    for (let i = 0; i < atrValues.length; i++) {
      const inputIndex = i + this.period;
      const rawAtrValue = atrValues[i];
      const currentPrice = closePrices[inputIndex];
      const inputData = inputs[inputIndex];
      
      if (rawAtrValue !== undefined && currentPrice !== undefined && inputData) {
        const atrValue = MathUtils.roundToDecimalPlaces(rawAtrValue, 8);
        const atrPercentage = (atrValue / currentPrice) * 100;

        this.results.push(
          this.createResult(
            inputData.timestamp,
            atrValue,
            {
              period: this.period,
              atrPercentage: MathUtils.roundToDecimalPlaces(atrPercentage, 2),
              volatility: this.getVolatilityLevel(atrPercentage),
            }
          )
        );
      }
    }

    return this.getResults();
  }

  private getVolatilityLevel(atrPercentage: number): 'low' | 'medium' | 'high' {
    if (atrPercentage < 1) return 'low';
    if (atrPercentage < 3) return 'medium';
    return 'high';
  }

  static create(symbol: string, timeFrame: TimeFrame, period: number = 14): ATRIndicator {
    return new ATRIndicator(symbol, timeFrame, { period });
  }
}