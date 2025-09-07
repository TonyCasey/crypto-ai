import { ExchangeType } from '../common/enums';
import { Timestamp, Identifiable, ApiResponse } from '../common/base-types';
import { TradingPair, Ticker, OrderBook, Trade, CandleData } from './market-data';
import { Order, OrderRequest, OrderFill, Balance } from '../trading/orders';

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  sandbox?: boolean;
}

export interface ExchangeConfiguration extends Identifiable, Timestamp {
  name: string;
  type: ExchangeType;
  isActive: boolean;
  credentials: ExchangeCredentials;
  rateLimits: RateLimit[];
  supportedFeatures: ExchangeFeatures;
}

export interface RateLimit {
  endpoint: string;
  maxRequests: number;
  windowMs: number;
  weight?: number;
}

export interface ExchangeFeatures {
  trading: boolean;
  margin: boolean;
  futures: boolean;
  websocket: boolean;
  orderTypes: string[];
  timeFrames: string[];
}

export interface ExchangeStatus extends Timestamp {
  exchangeType: ExchangeType;
  isOnline: boolean;
  latency: number;
  lastPing: Date;
  errorCount: number;
  lastError?: string;
}

export interface ExchangeInfo extends Timestamp {
  exchangeType: ExchangeType;
  name: string;
  tradingPairs: TradingPair[];
  rateLimits: RateLimit[];
  serverTime: Date;
  timezone: string;
}

export interface IExchangeConnector {
  getExchangeInfo(): Promise<ApiResponse<ExchangeInfo>>;
  getTradingPairs(): Promise<ApiResponse<TradingPair[]>>;
  getTicker(symbol: string): Promise<ApiResponse<Ticker>>;
  getOrderBook(symbol: string, depth?: number): Promise<ApiResponse<OrderBook>>;
  getTrades(symbol: string, limit?: number): Promise<ApiResponse<Trade[]>>;
  getCandles(symbol: string, timeFrame: string, limit?: number): Promise<ApiResponse<CandleData>>;
  
  placeOrder(orderRequest: OrderRequest): Promise<ApiResponse<Order>>;
  cancelOrder(orderId: string): Promise<ApiResponse<void>>;
  getOrder(orderId: string): Promise<ApiResponse<Order>>;
  getOpenOrders(symbol?: string): Promise<ApiResponse<Order[]>>;
  getOrderHistory(symbol?: string, limit?: number): Promise<ApiResponse<Order[]>>;
  getOrderFills(orderId: string): Promise<ApiResponse<OrderFill[]>>;
  
  getBalances(): Promise<ApiResponse<Balance[]>>;
  getBalance(currency: string): Promise<ApiResponse<Balance>>;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface WebSocketMessage {
  type: string;
  channel: string;
  data: any;
  timestamp: Date;
}

export interface IWebSocketClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(channel: string, symbol?: string): Promise<void>;
  unsubscribe(channel: string, symbol?: string): Promise<void>;
  onMessage(callback: (message: WebSocketMessage) => void): void;
  onError(callback: (error: Error) => void): void;
  onConnect(callback: () => void): void;
  onDisconnect(callback: () => void): void;
}