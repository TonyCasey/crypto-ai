import { TimeFrame } from '../common/enums';
import { Decimal, Price, Volume, Timestamp, Identifiable, Percentage } from '../common/base-types';

export interface TradingPair extends Identifiable, Timestamp {
  baseCurrency: string;
  quoteCurrency: string;
  symbol: string;
  minOrderSize: Decimal;
  maxOrderSize: Decimal;
  priceIncrement: Decimal;
  sizeIncrement: Decimal;
  isActive: boolean;
}

export interface Ticker extends Timestamp {
  symbol: string;
  price: Price;
  bidPrice: Price;
  askPrice: Price;
  volume24h: Volume;
  change24h: Percentage;
  high24h: Price;
  low24h: Price;
}

export interface OrderBookEntry {
  price: Price;
  size: Volume;
  orderCount?: number;
}

export interface OrderBook extends Timestamp {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  sequence: number;
}

export interface Trade extends Identifiable, Timestamp {
  symbol: string;
  price: Price;
  size: Volume;
  side: 'buy' | 'sell';
  timestamp: Date;
  tradeId: string;
}

export interface Candle {
  timestamp: Date;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Volume;
  timeFrame: TimeFrame;
}

export interface CandleData extends Timestamp {
  symbol: string;
  timeFrame: TimeFrame;
  candles: Candle[];
}

export interface MarketDepth extends Timestamp {
  symbol: string;
  totalBidVolume: Volume;
  totalAskVolume: Volume;
  bidAskSpread: Price;
  midPrice: Price;
}