import { ExchangeType, ExchangeCredentials, IExchangeConnector } from '@cryptobot/types';
import { CoinbaseProExchange } from './exchanges/coinbase-pro-exchange';
import { SimulatorExchange } from './exchanges/simulator-exchange';

export class ExchangeFactory {
  static create(type: ExchangeType, credentials: ExchangeCredentials): IExchangeConnector {
    switch (type) {
      case ExchangeType.COINBASE_PRO:
        return new CoinbaseProExchange(credentials);
      
      case ExchangeType.SIMULATOR:
        return new SimulatorExchange(credentials);
      
      // Future exchanges can be added here
      case ExchangeType.BITTREX:
      case ExchangeType.BINANCE:
      case ExchangeType.KRAKEN:
        throw new Error(`Exchange ${type} not implemented yet`);
      
      default:
        throw new Error(`Unsupported exchange type: ${type}`);
    }
  }

  static getSupportedExchanges(): ExchangeType[] {
    return [
      ExchangeType.COINBASE_PRO,
      ExchangeType.SIMULATOR,
    ];
  }

  static isSupported(type: ExchangeType): boolean {
    return this.getSupportedExchanges().includes(type);
  }

  static getRequiredCredentials(type: ExchangeType): string[] {
    switch (type) {
      case ExchangeType.COINBASE_PRO:
        return ['apiKey', 'apiSecret', 'passphrase'];
      
      case ExchangeType.SIMULATOR:
        return []; // No credentials required for simulator
      
      default:
        return ['apiKey', 'apiSecret'];
    }
  }

  static validateCredentials(type: ExchangeType, credentials: ExchangeCredentials): boolean {
    const required = this.getRequiredCredentials(type);
    
    for (const field of required) {
      if (!credentials[field as keyof ExchangeCredentials]) {
        return false;
      }
    }
    
    return true;
  }
}