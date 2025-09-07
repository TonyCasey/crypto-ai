import { IndicatorType, TimeFrame } from '@cryptobot/types';
import { BaseIndicator, IndicatorInput, IndicatorResult } from './base-indicator';
import { MathUtils } from '../utils/math-utils';

export interface SMAParameters {
  period: number;
}

export class SMAIndicator extends BaseIndicator {
  private readonly period: number;

  constructor(symbol: string, timeFrame: TimeFrame, parameters: SMAParameters) {
    super(IndicatorType.SMA, symbol, timeFrame, parameters);
    this.period = parameters.period;

    if (this.period <= 0) {
      throw new Error('SMA period must be greater than 0');
    }
  }

  calculate(inputs: IndicatorInput[]): IndicatorResult[] {
    this.validateInputs(inputs, this.period);

    const closePrices = inputs.map(input => input.close);
    const smaValues = MathUtils.calculateSMA(closePrices, this.period);

    this.results = [];
    for (let i = 0; i < smaValues.length; i++) {
      const inputIndex = i + this.period - 1;
      this.results.push(
        this.createResult(
          inputs[inputIndex].timestamp,
          MathUtils.roundToDecimalPlaces(smaValues[i], 8),
          {
            period: this.period,
            source: 'close',
          }
        )
      );
    }

    return this.getResults();
  }

  static create(symbol: string, timeFrame: TimeFrame, period: number): SMAIndicator {
    return new SMAIndicator(symbol, timeFrame, { period });
  }
}