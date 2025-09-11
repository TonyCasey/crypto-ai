import { TimeFrame } from '@cryptobot/types';
import { SMAIndicator } from './sma-indicator';
import { IndicatorInput } from './base-indicator';

describe('SMAIndicator', () => {
  const symbol = 'BTC/USD';
  const timeFrame = TimeFrame.H1;

  describe('constructor', () => {
    it('should create an SMA indicator with valid parameters', () => {
      const indicator = new SMAIndicator(symbol, timeFrame, { period: 10 });
      expect(indicator).toBeInstanceOf(SMAIndicator);
    });

    it('should throw error for invalid period', () => {
      expect(() => new SMAIndicator(symbol, timeFrame, { period: 0 })).toThrow(
        'SMA period must be greater than 0'
      );
      expect(() => new SMAIndicator(symbol, timeFrame, { period: -1 })).toThrow(
        'SMA period must be greater than 0'
      );
    });
  });

  describe('calculate', () => {
    it('should calculate SMA correctly for simple data', () => {
      const indicator = new SMAIndicator(symbol, timeFrame, { period: 3 });
      
      const inputs: IndicatorInput[] = [
        { timestamp: new Date('2024-01-01'), open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { timestamp: new Date('2024-01-02'), open: 100, high: 105, low: 95, close: 110, volume: 1000 },
        { timestamp: new Date('2024-01-03'), open: 100, high: 105, low: 95, close: 120, volume: 1000 },
        { timestamp: new Date('2024-01-04'), open: 100, high: 105, low: 95, close: 115, volume: 1000 },
        { timestamp: new Date('2024-01-05'), open: 100, high: 105, low: 95, close: 125, volume: 1000 },
      ];

      const results = indicator.calculate(inputs);
      
      expect(results).toHaveLength(3);
      expect(results[0].value).toBeCloseTo(110, 5); // (100 + 110 + 120) / 3
      expect(results[1].value).toBeCloseTo(115, 5); // (110 + 120 + 115) / 3
      expect(results[2].value).toBeCloseTo(120, 5); // (120 + 115 + 125) / 3
    });

    it('should handle insufficient data', () => {
      const indicator = new SMAIndicator(symbol, timeFrame, { period: 5 });
      
      const inputs: IndicatorInput[] = [
        { timestamp: new Date('2024-01-01'), open: 100, high: 105, low: 95, close: 100, volume: 1000 },
        { timestamp: new Date('2024-01-02'), open: 100, high: 105, low: 95, close: 110, volume: 1000 },
      ];

      expect(() => indicator.calculate(inputs)).toThrow();
    });

    it('should calculate SMA with exact period data', () => {
      const indicator = new SMAIndicator(symbol, timeFrame, { period: 5 });
      
      const inputs: IndicatorInput[] = [
        { timestamp: new Date('2024-01-01'), open: 100, high: 105, low: 95, close: 10, volume: 1000 },
        { timestamp: new Date('2024-01-02'), open: 100, high: 105, low: 95, close: 20, volume: 1000 },
        { timestamp: new Date('2024-01-03'), open: 100, high: 105, low: 95, close: 30, volume: 1000 },
        { timestamp: new Date('2024-01-04'), open: 100, high: 105, low: 95, close: 40, volume: 1000 },
        { timestamp: new Date('2024-01-05'), open: 100, high: 105, low: 95, close: 50, volume: 1000 },
      ];

      const results = indicator.calculate(inputs);
      
      expect(results).toHaveLength(1);
      expect(results[0].value).toBeCloseTo(30, 5); // (10 + 20 + 30 + 40 + 50) / 5
    });
  });

  describe('static create', () => {
    it('should create an SMA indicator using factory method', () => {
      const indicator = SMAIndicator.create(symbol, timeFrame, 20);
      expect(indicator).toBeInstanceOf(SMAIndicator);
    });
  });
});