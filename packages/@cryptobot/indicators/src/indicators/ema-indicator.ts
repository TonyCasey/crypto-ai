import { IndicatorType, TimeFrame } from '@cryptobot/types';
import { BaseIndicator, IndicatorInput, IndicatorResult } from './base-indicator';
import { MathUtils } from '../utils/math-utils';

export interface EMAParameters {
  period: number;
}

export class EMAIndicator extends BaseIndicator {
  private readonly period: number;

  constructor(symbol: string, timeFrame: TimeFrame, parameters: EMAParameters) {
    super(IndicatorType.EMA, symbol, timeFrame, parameters);
    this.period = parameters.period;

    if (this.period <= 0) {
      throw new Error('EMA period must be greater than 0');
    }
  }

  calculate(inputs: IndicatorInput[]): IndicatorResult[] {
    this.validateInputs(inputs, this.period);

    const closePrices = inputs.map(input => input.close);
    const emaValues = MathUtils.calculateEMA(closePrices, this.period);

    this.results = [];
    for (let i = 0; i < emaValues.length; i++) {
      const inputIndex = i + this.period - 1;
      this.results.push(
        this.createResult(
          inputs[inputIndex].timestamp,
          MathUtils.roundToDecimalPlaces(emaValues[i], 8),
          {
            period: this.period,
            source: 'close',
            multiplier: 2 / (this.period + 1),
          }
        )
      );
    }

    return this.getResults();
  }

  static create(symbol: string, timeFrame: TimeFrame, period: number): EMAIndicator {
    return new EMAIndicator(symbol, timeFrame, { period });
  }
}