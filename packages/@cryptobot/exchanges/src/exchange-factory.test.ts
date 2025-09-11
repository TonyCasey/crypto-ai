import { ExchangeFactory } from './exchange-factory';
import { ExchangeType, ExchangeCredentials } from '@cryptobot/types';

// Mock the exchange classes
jest.mock('./exchanges/coinbase-pro-exchange', () => ({
  CoinbaseProExchange: jest.fn().mockImplementation((credentials) => ({
    type: 'coinbase_pro',
    credentials,
  })),
}));

jest.mock('./exchanges/simulator-exchange', () => ({
  SimulatorExchange: jest.fn().mockImplementation((credentials) => ({
    type: 'simulator',
    credentials,
  })),
}));

describe('ExchangeFactory', () => {
  describe('getSupportedExchanges', () => {
    it('should return array of supported exchanges', () => {
      const supported = ExchangeFactory.getSupportedExchanges();
      expect(supported).toContain(ExchangeType.COINBASE_PRO);
      expect(supported).toContain(ExchangeType.SIMULATOR);
      expect(supported).toHaveLength(2);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported exchanges', () => {
      expect(ExchangeFactory.isSupported(ExchangeType.COINBASE_PRO)).toBe(true);
      expect(ExchangeFactory.isSupported(ExchangeType.SIMULATOR)).toBe(true);
    });

    it('should return false for unsupported exchanges', () => {
      expect(ExchangeFactory.isSupported(ExchangeType.BINANCE)).toBe(false);
      expect(ExchangeFactory.isSupported(ExchangeType.KRAKEN)).toBe(false);
      expect(ExchangeFactory.isSupported(ExchangeType.BITTREX)).toBe(false);
    });
  });

  describe('getRequiredCredentials', () => {
    it('should return correct credentials for Coinbase Pro', () => {
      const required = ExchangeFactory.getRequiredCredentials(ExchangeType.COINBASE_PRO);
      expect(required).toEqual(['apiKey', 'apiSecret', 'passphrase']);
    });

    it('should return empty array for simulator', () => {
      const required = ExchangeFactory.getRequiredCredentials(ExchangeType.SIMULATOR);
      expect(required).toEqual([]);
    });

    it('should return default credentials for unknown exchanges', () => {
      const required = ExchangeFactory.getRequiredCredentials(ExchangeType.BINANCE);
      expect(required).toEqual(['apiKey', 'apiSecret']);
    });
  });

  describe('validateCredentials', () => {
    it('should validate Coinbase Pro credentials correctly', () => {
      const validCredentials: ExchangeCredentials = {
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        passphrase: 'test-passphrase',
      };
      
      const invalidCredentials: ExchangeCredentials = {
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      };

      expect(ExchangeFactory.validateCredentials(ExchangeType.COINBASE_PRO, validCredentials)).toBe(true);
      expect(ExchangeFactory.validateCredentials(ExchangeType.COINBASE_PRO, invalidCredentials)).toBe(false);
    });

    it('should validate simulator credentials (no credentials required)', () => {
      const emptyCredentials: ExchangeCredentials = {};
      expect(ExchangeFactory.validateCredentials(ExchangeType.SIMULATOR, emptyCredentials)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create Coinbase Pro exchange instance', () => {
      const credentials: ExchangeCredentials = {
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        passphrase: 'test-passphrase',
      };

      const exchange = ExchangeFactory.create(ExchangeType.COINBASE_PRO, credentials);
      expect(exchange).toBeDefined();
      expect(exchange.type).toBe('coinbase_pro');
    });

    it('should create simulator exchange instance', () => {
      const credentials: ExchangeCredentials = {};
      const exchange = ExchangeFactory.create(ExchangeType.SIMULATOR, credentials);
      expect(exchange).toBeDefined();
      expect(exchange.type).toBe('simulator');
    });

    it('should throw error for unsupported exchanges', () => {
      const credentials: ExchangeCredentials = {};
      
      expect(() => {
        ExchangeFactory.create(ExchangeType.BINANCE, credentials);
      }).toThrow('Exchange binance not implemented yet');

      expect(() => {
        ExchangeFactory.create(ExchangeType.KRAKEN, credentials);
      }).toThrow('Exchange kraken not implemented yet');
    });
  });
});