import { TradingStrategy, TradingStrategyType } from '@cryptobot/types';
import { BaseStrategy } from './base-strategy';
import { RSIStrategy } from './rsi-strategy';
import { MACDStrategy } from './macd-strategy';

export class StrategyFactory {
  static create(strategy: TradingStrategy): BaseStrategy {
    switch (strategy.type) {
      case TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT:
        return new RSIStrategy(strategy);
      
      case TradingStrategyType.MACD_CROSSOVER:
        return new MACDStrategy(strategy);
      
      // Add more strategies as they are implemented
      case TradingStrategyType.SIMPLE_MOVING_AVERAGE:
      case TradingStrategyType.BOLLINGER_BANDS_SQUEEZE:
      case TradingStrategyType.MEAN_REVERSION:
      case TradingStrategyType.MOMENTUM:
      case TradingStrategyType.CUSTOM:
        throw new Error(`Strategy type ${strategy.type} not implemented yet`);
      
      default:
        throw new Error(`Unknown strategy type: ${strategy.type}`);
    }
  }

  static getSupportedTypes(): TradingStrategyType[] {
    return [
      TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT,
      TradingStrategyType.MACD_CROSSOVER,
    ];
  }

  static isSupported(type: TradingStrategyType): boolean {
    return this.getSupportedTypes().includes(type);
  }

  static getDefaultParameters(type: TradingStrategyType): Record<string, any> {
    switch (type) {
      case TradingStrategyType.RSI_OVERSOLD_OVERBOUGHT:
        return {
          rsiPeriod: 14,
          oversold: 30,
          overbought: 70,
          minConfidence: 70,
        };
      
      case TradingStrategyType.MACD_CROSSOVER:
        return {
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          minHistogramThreshold: 0.001,
          minConfidence: 70,
        };
      
      default:
        return {};
    }
  }

  static validateParameters(type: TradingStrategyType, parameters: Record<string, any>): boolean {
    const defaults = this.getDefaultParameters(type);
    
    for (const key of Object.keys(defaults)) {
      if (parameters[key] === undefined || parameters[key] === null) {
        return false;
      }
    }
    
    return true;
  }
}