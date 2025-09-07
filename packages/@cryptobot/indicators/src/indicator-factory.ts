import { IndicatorType, TimeFrame } from '@cryptobot/types';
import { BaseIndicator } from './indicators/base-indicator';
import { SMAIndicator } from './indicators/sma-indicator';
import { EMAIndicator } from './indicators/ema-indicator';
import { RSIIndicator } from './indicators/rsi-indicator';
import { MACDIndicator } from './indicators/macd-indicator';
import { BollingerBandsIndicator } from './indicators/bollinger-bands-indicator';
import { ATRIndicator } from './indicators/atr-indicator';

export class IndicatorFactory {
  static create(
    type: IndicatorType,
    symbol: string,
    timeFrame: TimeFrame,
    parameters: Record<string, any> = {}
  ): BaseIndicator {
    switch (type) {
      case IndicatorType.SMA:
        return new SMAIndicator(symbol, timeFrame, {
          period: parameters.period || 20,
        });

      case IndicatorType.EMA:
        return new EMAIndicator(symbol, timeFrame, {
          period: parameters.period || 20,
        });

      case IndicatorType.RSI:
        return new RSIIndicator(symbol, timeFrame, {
          period: parameters.period || 14,
          overbought: parameters.overbought || 70,
          oversold: parameters.oversold || 30,
        });

      case IndicatorType.MACD:
        return new MACDIndicator(symbol, timeFrame, {
          fastPeriod: parameters.fastPeriod || 12,
          slowPeriod: parameters.slowPeriod || 26,
          signalPeriod: parameters.signalPeriod || 9,
        });

      case IndicatorType.BOLLINGER_BANDS:
        return new BollingerBandsIndicator(symbol, timeFrame, {
          period: parameters.period || 20,
          standardDeviation: parameters.standardDeviation || 2,
        });

      case IndicatorType.ATR:
        return new ATRIndicator(symbol, timeFrame, {
          period: parameters.period || 14,
        });

      default:
        throw new Error(`Unsupported indicator type: ${type}`);
    }
  }

  static getSupportedTypes(): IndicatorType[] {
    return [
      IndicatorType.SMA,
      IndicatorType.EMA,
      IndicatorType.RSI,
      IndicatorType.MACD,
      IndicatorType.BOLLINGER_BANDS,
      IndicatorType.ATR,
    ];
  }

  static getDefaultParameters(type: IndicatorType): Record<string, any> {
    switch (type) {
      case IndicatorType.SMA:
      case IndicatorType.EMA:
        return { period: 20 };
      
      case IndicatorType.RSI:
        return { period: 14, overbought: 70, oversold: 30 };
      
      case IndicatorType.MACD:
        return { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 };
      
      case IndicatorType.BOLLINGER_BANDS:
        return { period: 20, standardDeviation: 2 };
      
      case IndicatorType.ATR:
        return { period: 14 };
      
      default:
        return {};
    }
  }
}