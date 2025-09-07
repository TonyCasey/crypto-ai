import { IndicatorType, TimeFrame } from '@cryptobot/types';
import { BaseIndicator, IndicatorInput, IndicatorResult } from './base-indicator';
import { MathUtils } from '../utils/math-utils';

export interface BollingerBandsParameters {
  period: number;
  standardDeviation: number;
}

export interface BollingerBandsResult extends IndicatorResult {
  metadata: {
    upperBand: number;
    middleBand: number;
    lowerBand: number;
    period: number;
    standardDeviation: number;
    squeeze?: boolean;
    position?: 'above_upper' | 'below_lower' | 'inside';
    bandwidth: number;
  };
}

export class BollingerBandsIndicator extends BaseIndicator {
  private readonly period: number;
  private readonly standardDeviation: number;

  constructor(symbol: string, timeFrame: TimeFrame, parameters: BollingerBandsParameters) {
    super(IndicatorType.BOLLINGER_BANDS, symbol, timeFrame, parameters);
    this.period = parameters.period;
    this.standardDeviation = parameters.standardDeviation;

    if (this.period <= 0) {
      throw new Error('Bollinger Bands period must be greater than 0');
    }
    if (this.standardDeviation <= 0) {
      throw new Error('Standard deviation must be greater than 0');
    }
  }

  calculate(inputs: IndicatorInput[]): IndicatorResult[] {
    this.validateInputs(inputs, this.period);

    const closePrices = inputs.map(input => input.close);
    const smaValues = MathUtils.calculateSMA(closePrices, this.period);
    const stdDevValues = MathUtils.calculateStandardDeviation(closePrices, this.period);

    this.results = [];
    for (let i = 0; i < smaValues.length; i++) {
      const inputIndex = i + this.period - 1;
      const currentPrice = closePrices[inputIndex];
      
      const middleBand = smaValues[i];
      const upperBand = middleBand + (stdDevValues[i] * this.standardDeviation);
      const lowerBand = middleBand - (stdDevValues[i] * this.standardDeviation);
      
      const bandwidth = ((upperBand - lowerBand) / middleBand) * 100;
      const squeeze = bandwidth < 10; // Squeeze when bandwidth is less than 10%
      
      let position: 'above_upper' | 'below_lower' | 'inside';
      if (currentPrice > upperBand) {
        position = 'above_upper';
      } else if (currentPrice < lowerBand) {
        position = 'below_lower';
      } else {
        position = 'inside';
      }

      this.results.push(
        this.createResult(
          inputs[inputIndex].timestamp,
          MathUtils.roundToDecimalPlaces(middleBand, 8), // Use middle band as main value
          {
            upperBand: MathUtils.roundToDecimalPlaces(upperBand, 8),
            middleBand: MathUtils.roundToDecimalPlaces(middleBand, 8),
            lowerBand: MathUtils.roundToDecimalPlaces(lowerBand, 8),
            period: this.period,
            standardDeviation: this.standardDeviation,
            squeeze,
            position,
            bandwidth: MathUtils.roundToDecimalPlaces(bandwidth, 2),
          }
        ) as BollingerBandsResult
      );
    }

    return this.getResults();
  }

  static create(symbol: string, timeFrame: TimeFrame, period: number = 20, standardDeviation: number = 2): BollingerBandsIndicator {
    return new BollingerBandsIndicator(symbol, timeFrame, { period, standardDeviation });
  }
}