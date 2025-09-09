import { IndicatorType, TimeFrame } from '@cryptobot/types';
import { BaseIndicator, IndicatorInput, IndicatorResult } from './base-indicator';
import { MathUtils } from '../utils/math-utils';

export interface MACDParameters {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

export interface MACDResult extends IndicatorResult {
  metadata: {
    macd: number;
    signal: number;
    histogram: number;
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    crossover?: 'bullish' | 'bearish' | null;
  };
}

export class MACDIndicator extends BaseIndicator {
  private readonly fastPeriod: number;
  private readonly slowPeriod: number;
  private readonly signalPeriod: number;

  constructor(symbol: string, timeFrame: TimeFrame, parameters: MACDParameters) {
    super(IndicatorType.MACD, symbol, timeFrame, parameters);
    this.fastPeriod = parameters.fastPeriod;
    this.slowPeriod = parameters.slowPeriod;
    this.signalPeriod = parameters.signalPeriod;

    if (this.fastPeriod <= 0 || this.slowPeriod <= 0 || this.signalPeriod <= 0) {
      throw new Error('MACD periods must be greater than 0');
    }
    if (this.fastPeriod >= this.slowPeriod) {
      throw new Error('Fast period must be less than slow period');
    }
  }

  calculate(inputs: IndicatorInput[]): IndicatorResult[] {
    const minLength = this.slowPeriod + this.signalPeriod - 1;
    this.validateInputs(inputs, minLength);

    const closePrices = inputs.map(input => input.close);
    
    // Calculate EMAs
    const fastEMA = MathUtils.calculateEMA(closePrices, this.fastPeriod);
    const slowEMA = MathUtils.calculateEMA(closePrices, this.slowPeriod);

    // Calculate MACD line (fast EMA - slow EMA)
    const macdLine: number[] = [];
    const startIndex = this.slowPeriod - this.fastPeriod;
    
    for (let i = 0; i < slowEMA.length; i++) {
      const fastIndex = i + startIndex;
      const fastValue = fastEMA[fastIndex];
      const slowValue = slowEMA[i];
      
      if (fastIndex < fastEMA.length && fastValue !== undefined && slowValue !== undefined) {
        macdLine.push(fastValue - slowValue);
      }
    }

    // Calculate Signal line (EMA of MACD line)
    const signalLine = MathUtils.calculateEMA(macdLine, this.signalPeriod);

    // Calculate Histogram (MACD - Signal)
    const histogram: number[] = [];
    const macdStartIndex = macdLine.length - signalLine.length;
    
    for (let i = 0; i < signalLine.length; i++) {
      const macdIndex = i + macdStartIndex;
      const macdValue = macdLine[macdIndex];
      const signalValue = signalLine[i];
      
      if (macdValue !== undefined && signalValue !== undefined) {
        histogram.push(macdValue - signalValue);
      }
    }

    // Build results
    this.results = [];
    const resultStartIndex = inputs.length - histogram.length;
    
    for (let i = 0; i < histogram.length; i++) {
      const inputIndex = resultStartIndex + i;
      const macdIndex = macdStartIndex + i;
      const rawMacdValue = macdLine[macdIndex];
      const rawSignalValue = signalLine[i];
      const rawHistogramValue = histogram[i];
      const inputData = inputs[inputIndex];
      
      if (rawMacdValue !== undefined && rawSignalValue !== undefined && rawHistogramValue !== undefined && inputData) {
        const macdValue = MathUtils.roundToDecimalPlaces(rawMacdValue, 8);
        const signalValue = MathUtils.roundToDecimalPlaces(rawSignalValue, 8);
        const histogramValue = MathUtils.roundToDecimalPlaces(rawHistogramValue, 8);

        // Determine crossover signal
        let crossover: 'bullish' | 'bearish' | null = null;
        if (i > 0) {
          const prevHistogram = histogram[i - 1];
          if (prevHistogram !== undefined) {
            if (prevHistogram <= 0 && histogramValue > 0) {
              crossover = 'bullish';
            } else if (prevHistogram >= 0 && histogramValue < 0) {
              crossover = 'bearish';
            }
          }
        }

        this.results.push(
          this.createResult(
            inputData.timestamp,
            histogramValue, // Use histogram as main value
            {
              macd: macdValue,
              signal: signalValue,
              histogram: histogramValue,
              fastPeriod: this.fastPeriod,
              slowPeriod: this.slowPeriod,
              signalPeriod: this.signalPeriod,
              crossover,
            }
          ) as MACDResult
        );
      }
    }

    return this.getResults();
  }

  static create(symbol: string, timeFrame: TimeFrame, fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): MACDIndicator {
    return new MACDIndicator(symbol, timeFrame, { fastPeriod, slowPeriod, signalPeriod });
  }
}