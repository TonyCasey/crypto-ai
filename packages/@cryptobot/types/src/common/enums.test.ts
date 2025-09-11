import {
  OrderSide,
  OrderType,
  OrderStatus,
  TimeFrame,
  TradingPairStatus,
  IndicatorType,
  TradingStrategyType,
  ExchangeType,
  SafetyCheckType,
} from './enums';

describe('Enums', () => {
  describe('OrderSide', () => {
    it('should have correct values', () => {
      expect(OrderSide.BUY).toBe('buy');
      expect(OrderSide.SELL).toBe('sell');
    });

    it('should have all expected values', () => {
      const values = Object.values(OrderSide);
      expect(values).toHaveLength(2);
      expect(values).toContain('buy');
      expect(values).toContain('sell');
    });
  });

  describe('OrderType', () => {
    it('should have correct values', () => {
      expect(OrderType.MARKET).toBe('market');
      expect(OrderType.LIMIT).toBe('limit');
      expect(OrderType.STOP).toBe('stop');
      expect(OrderType.STOP_LIMIT).toBe('stop_limit');
    });
  });

  describe('OrderStatus', () => {
    it('should have all expected statuses', () => {
      const values = Object.values(OrderStatus);
      expect(values).toContain('pending');
      expect(values).toContain('open');
      expect(values).toContain('filled');
      expect(values).toContain('cancelled');
      expect(values).toContain('rejected');
      expect(values).toContain('expired');
    });
  });

  describe('TimeFrame', () => {
    it('should have correct minute timeframes', () => {
      expect(TimeFrame.MINUTE_1).toBe('1m');
      expect(TimeFrame.MINUTE_5).toBe('5m');
      expect(TimeFrame.MINUTE_15).toBe('15m');
      expect(TimeFrame.MINUTE_30).toBe('30m');
    });

    it('should have correct hour timeframes', () => {
      expect(TimeFrame.HOUR_1).toBe('1h');
      expect(TimeFrame.HOUR_4).toBe('4h');
      expect(TimeFrame.HOUR_12).toBe('12h');
    });

    it('should have correct day/week/month timeframes', () => {
      expect(TimeFrame.DAY_1).toBe('1d');
      expect(TimeFrame.WEEK_1).toBe('1w');
      expect(TimeFrame.MONTH_1).toBe('1M');
    });
  });

  describe('ExchangeType', () => {
    it('should have all supported exchanges', () => {
      const values = Object.values(ExchangeType);
      expect(values).toContain('coinbase_pro');
      expect(values).toContain('bittrex');
      expect(values).toContain('binance');
      expect(values).toContain('kraken');
      expect(values).toContain('simulator');
    });
  });

  describe('IndicatorType', () => {
    it('should have all technical indicators', () => {
      const values = Object.values(IndicatorType);
      expect(values).toContain('SMA');
      expect(values).toContain('EMA');
      expect(values).toContain('RSI');
      expect(values).toContain('MACD');
      expect(values).toContain('BOLLINGER_BANDS');
    });
  });
});