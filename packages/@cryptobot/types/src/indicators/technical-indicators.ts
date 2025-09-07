import { IndicatorType, TimeFrame } from '../common/enums';
import { Price, Timestamp } from '../common/base-types';

export interface IndicatorValue extends Timestamp {
  timestamp: Date;
  value: number;
  indicatorType: IndicatorType;
  symbol: string;
  timeFrame: TimeFrame;
}

export interface MovingAverageValue extends IndicatorValue {
  period: number;
}

export interface RSIValue extends IndicatorValue {
  period: number;
  overbought: number;
  oversold: number;
}

export interface MACDValue extends IndicatorValue {
  macd: number;
  signal: number;
  histogram: number;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

export interface BollingerBandsValue extends IndicatorValue {
  upperBand: number;
  middleBand: number;
  lowerBand: number;
  period: number;
  standardDeviation: number;
}

export interface StochasticValue extends IndicatorValue {
  k: number;
  d: number;
  kPeriod: number;
  dPeriod: number;
}

export interface ATRValue extends IndicatorValue {
  period: number;
}

export interface WilliamsRValue extends IndicatorValue {
  period: number;
}

export interface VolumeIndicatorValue extends IndicatorValue {
  volume: number;
  averageVolume: number;
  volumeRatio: number;
}

export interface IndicatorConfiguration {
  type: IndicatorType;
  symbol: string;
  timeFrame: TimeFrame;
  parameters: Record<string, any>;
  isEnabled: boolean;
}

export interface TechnicalAnalysis extends Timestamp {
  symbol: string;
  timeFrame: TimeFrame;
  currentPrice: Price;
  indicators: IndicatorValue[];
  trend: 'bullish' | 'bearish' | 'neutral';
  momentum: 'strong' | 'weak' | 'neutral';
  volatility: 'high' | 'medium' | 'low';
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number; // 0-1
}