import { Decimal } from 'decimal.js';

export class MathUtils {
  static calculateSMA(values: number[], period: number): number[] {
    if (values.length < period) return [];
    
    const results: number[] = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      results.push(sum / period);
    }
    
    return results;
  }

  static calculateEMA(values: number[], period: number): number[] {
    if (values.length < period) return [];
    
    const results: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first EMA value
    const firstSMA = values.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
    results.push(firstSMA);
    
    for (let i = period; i < values.length; i++) {
      const currentValue = values[i];
      const lastResult = results[results.length - 1];
      if (currentValue !== undefined && lastResult !== undefined) {
        const ema = (currentValue - lastResult) * multiplier + lastResult;
        results.push(ema);
      }
    }
    
    return results;
  }

  static calculateStandardDeviation(values: number[], period: number): number[] {
    if (values.length < period) return [];
    
    const results: number[] = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      const mean = slice.reduce((acc, val) => acc + val, 0) / period;
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      results.push(Math.sqrt(variance));
    }
    
    return results;
  }

  static calculateTrueRange(high: number[], low: number[], close: number[]): number[] {
    if (high.length !== low.length || low.length !== close.length || high.length < 2) {
      return [];
    }

    const results: number[] = [];
    
    for (let i = 1; i < high.length; i++) {
      const highValue = high[i];
      const lowValue = low[i];
      const prevClose = close[i - 1];
      
      if (highValue !== undefined && lowValue !== undefined && prevClose !== undefined) {
        const tr1 = highValue - lowValue;
        const tr2 = Math.abs(highValue - prevClose);
        const tr3 = Math.abs(lowValue - prevClose);
        results.push(Math.max(tr1, tr2, tr3));
      }
    }
    
    return results;
  }

  static highest(values: number[], period: number): number[] {
    if (values.length < period) return [];
    
    const results: number[] = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      results.push(Math.max(...slice));
    }
    
    return results;
  }

  static lowest(values: number[], period: number): number[] {
    if (values.length < period) return [];
    
    const results: number[] = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      results.push(Math.min(...slice));
    }
    
    return results;
  }

  static roundToDecimalPlaces(value: number, decimalPlaces: number): number {
    const decimal = new Decimal(value);
    return decimal.toDecimalPlaces(decimalPlaces).toNumber();
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}