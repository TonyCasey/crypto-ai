import { TradingStrategyType, OrderSide, TimeFrame } from '../common/enums';
import { Price, Volume, Percentage, Timestamp, Identifiable } from '../common/base-types';
import { OrderRequest } from './orders';

export interface TradingSignal extends Timestamp {
  symbol: string;
  side: OrderSide;
  strength: number; // 0-1
  confidence: Percentage;
  reason: string;
  strategyId: string;
  indicatorValues: Record<string, number>;
  targetPrice?: Price;
  stopLoss?: Price;
  takeProfit?: Price;
}

export interface TradingStrategy extends Identifiable, Timestamp {
  name: string;
  type: TradingStrategyType;
  description: string;
  isActive: boolean;
  symbols: string[];
  timeFrame: TimeFrame;
  parameters: Record<string, any>;
  riskParameters: RiskParameters;
  performance: StrategyPerformance;
}

export interface RiskParameters {
  maxPositionSize: Percentage;
  stopLossPercentage: Percentage;
  takeProfitPercentage: Percentage;
  maxDailyLoss: Price;
  maxDrawdown: Percentage;
  correlationLimit: Percentage;
  volatilityLimit: Percentage;
}

export interface StrategyPerformance extends Timestamp {
  strategyId: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: Percentage;
  totalReturn: Price;
  sharpeRatio: number;
  maxDrawdown: Percentage;
  averageWin: Price;
  averageLoss: Price;
  profitFactor: number;
  expectancy: Price;
}

export interface BacktestResult extends Timestamp {
  strategyId: string;
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: Price;
  finalCapital: Price;
  totalReturn: Percentage;
  annualizedReturn: Percentage;
  sharpeRatio: number;
  maxDrawdown: Percentage;
  trades: BacktestTrade[];
  performance: StrategyPerformance;
}

export interface BacktestTrade extends Timestamp {
  signal: TradingSignal;
  entryOrder: OrderRequest;
  exitOrder: OrderRequest;
  entryPrice: Price;
  exitPrice: Price;
  quantity: Volume;
  pnl: Price;
  duration: number; // minutes
  fees: Price;
}

export interface StrategyExecution extends Identifiable, Timestamp {
  strategyId: string;
  signal: TradingSignal;
  order: OrderRequest;
  executionTime: Date;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  error?: string;
}