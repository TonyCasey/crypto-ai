import { OrderSide, OrderType, OrderStatus } from '../common/enums';
import { Price, Volume, Timestamp, Identifiable } from '../common/base-types';

export interface Order extends Identifiable, Timestamp {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  size: Volume;
  price?: Price;
  stopPrice?: Price;
  status: OrderStatus;
  filledSize: Volume;
  averageFillPrice?: Price;
  fees: Price;
  clientOrderId?: string;
  exchangeOrderId: string;
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'GTT';
  expiryTime?: Date;
}

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  size: Volume;
  price?: Price;
  stopPrice?: Price;
  clientOrderId?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTT';
  expiryTime?: Date;
}

export interface OrderFill extends Identifiable, Timestamp {
  orderId: string;
  tradeId: string;
  symbol: string;
  side: OrderSide;
  price: Price;
  size: Volume;
  fees: Price;
  liquidity: 'maker' | 'taker';
}

export interface Position extends Identifiable, Timestamp {
  symbol: string;
  side: 'long' | 'short';
  size: Volume;
  averageEntryPrice: Price;
  currentPrice: Price;
  unrealizedPnL: Price;
  realizedPnL: Price;
  totalPnL: Price;
  marginUsed: Price;
  liquidationPrice?: Price;
}

export interface Portfolio extends Identifiable, Timestamp {
  totalValue: Price;
  availableBalance: Price;
  lockedBalance: Price;
  unrealizedPnL: Price;
  realizedPnL: Price;
  positions: Position[];
  dailyPnL: Price;
  totalReturn: Price;
}

export interface Balance extends Timestamp {
  currency: string;
  total: Volume;
  available: Volume;
  locked: Volume;
}