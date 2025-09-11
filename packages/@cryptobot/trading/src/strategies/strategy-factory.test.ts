import { StrategyFactory } from './strategy-factory';
import { TradingStrategyType, TradingStrategy } from '@cryptobot/types';

// Mock the strategy classes
jest.mock('./rsi-strategy', () => ({
  RSIStrategy: jest.fn().mockImplementation((strategy) => ({
    type: strategy.type,
    parameters: strategy.parameters,
  })),
}));

jest.mock('./macd-strategy', () => ({
  MACDStrategy: jest.fn().mockImplementation((strategy) => ({
    type: strategy.type,
    parameters: strategy.parameters,
  })),
}));

describe('StrategyFactory', () => {
  describe('getSupportedTypes', () => {
    it('should return array of supported strategy types', () => {
      const supported = StrategyFactory.getSupportedTypes();
      expect(supported).toContain(TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT);
      expect(supported).toContain(TradingStrategyType.MACD_CROSSOVER);
      expect(supported).toHaveLength(2);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported strategies', () => {
      expect(StrategyFactory.isSupported(TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT)).toBe(true);
      expect(StrategyFactory.isSupported(TradingStrategyType.MACD_CROSSOVER)).toBe(true);
    });

    it('should return false for unsupported strategies', () => {
      expect(StrategyFactory.isSupported(TradingStrategyType.SIMPLE_MOVING_AVERAGE)).toBe(false);
      expect(StrategyFactory.isSupported(TradingStrategyType.BOLLINGER_BANDS_SQUEEZE)).toBe(false);
      expect(StrategyFactory.isSupported(TradingStrategyType.MOMENTUM)).toBe(false);
    });
  });

  describe('getDefaultParameters', () => {
    it('should return correct default parameters for RSI strategy', () => {
      const defaults = StrategyFactory.getDefaultParameters(TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT);
      expect(defaults).toEqual({
        rsiPeriod: 14,
        oversold: 30,
        overbought: 70,
        minConfidence: 70,
      });
    });

    it('should return correct default parameters for MACD strategy', () => {
      const defaults = StrategyFactory.getDefaultParameters(TradingStrategyType.MACD_CROSSOVER);
      expect(defaults).toEqual({
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        minHistogramThreshold: 0.001,
        minConfidence: 70,
      });
    });

    it('should return empty object for unknown strategy', () => {
      const defaults = StrategyFactory.getDefaultParameters(TradingStrategyType.SIMPLE_MOVING_AVERAGE);
      expect(defaults).toEqual({});
    });
  });

  describe('validateParameters', () => {
    it('should validate RSI strategy parameters correctly', () => {
      const validParams = {
        rsiPeriod: 14,
        oversold: 30,
        overbought: 70,
        minConfidence: 70,
      };
      
      const invalidParams = {
        rsiPeriod: 14,
        oversold: 30,
        // missing overbought and minConfidence
      };

      expect(StrategyFactory.validateParameters(TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT, validParams)).toBe(true);
      expect(StrategyFactory.validateParameters(TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT, invalidParams)).toBe(false);
    });

    it('should validate MACD strategy parameters correctly', () => {
      const validParams = {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        minHistogramThreshold: 0.001,
        minConfidence: 70,
      };
      
      const invalidParams = {
        fastPeriod: 12,
        slowPeriod: 26,
        // missing signalPeriod, minHistogramThreshold, and minConfidence
      };

      expect(StrategyFactory.validateParameters(TradingStrategyType.MACD_CROSSOVER, validParams)).toBe(true);
      expect(StrategyFactory.validateParameters(TradingStrategyType.MACD_CROSSOVER, invalidParams)).toBe(false);
    });
  });

  describe('create', () => {
    it('should create RSI strategy instance', () => {
      const strategy: TradingStrategy = {
        id: 'test-rsi',
        name: 'Test RSI',
        type: TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT,
        parameters: {
          rsiPeriod: 14,
          oversold: 30,
          overbought: 70,
          minConfidence: 70,
        },
        isActive: true,
      };

      const instance = StrategyFactory.create(strategy);
      expect(instance).toBeDefined();
      expect(instance.type).toBe(strategy.type);
    });

    it('should create MACD strategy instance', () => {
      const strategy: TradingStrategy = {
        id: 'test-macd',
        name: 'Test MACD',
        type: TradingStrategyType.MACD_CROSSOVER,
        parameters: {
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          minHistogramThreshold: 0.001,
          minConfidence: 70,
        },
        isActive: true,
      };

      const instance = StrategyFactory.create(strategy);
      expect(instance).toBeDefined();
      expect(instance.type).toBe(strategy.type);
    });

    it('should throw error for unsupported strategies', () => {
      const strategy: TradingStrategy = {
        id: 'test-unsupported',
        name: 'Test Unsupported',
        type: TradingStrategyType.SIMPLE_MOVING_AVERAGE,
        parameters: {},
        isActive: true,
      };

      expect(() => {
        StrategyFactory.create(strategy);
      }).toThrow('Strategy type SIMPLE_MOVING_AVERAGE not implemented yet');
    });
  });
});