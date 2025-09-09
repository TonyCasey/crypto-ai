import { 
  IExchangeConnector, 
  ExchangeType, 
  ExchangeCredentials,
  ExchangeInfo,
  TradingPair,
  Ticker,
  OrderBook,
  Trade,
  CandleData,
  Order,
  OrderRequest,
  OrderFill,
  Balance,
  ApiResponse
} from '@cryptobot/types';
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

export abstract class BaseExchange extends EventEmitter implements IExchangeConnector {
  protected readonly exchangeType: ExchangeType;
  protected readonly credentials: ExchangeCredentials;
  protected readonly httpClient: AxiosInstance;
  protected isConnectedFlag: boolean = false;

  constructor(exchangeType: ExchangeType, credentials: ExchangeCredentials, baseURL: string) {
    super();
    this.exchangeType = exchangeType;
    this.credentials = credentials;
    
    this.httpClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'CryptoBot/1.0',
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // Abstract methods that must be implemented by specific exchanges
  abstract getExchangeInfo(): Promise<ApiResponse<ExchangeInfo>>;
  abstract getTradingPairs(): Promise<ApiResponse<TradingPair[]>>;
  abstract getTicker(symbol: string): Promise<ApiResponse<Ticker>>;
  abstract getOrderBook(symbol: string, depth?: number): Promise<ApiResponse<OrderBook>>;
  abstract getTrades(symbol: string, limit?: number): Promise<ApiResponse<Trade[]>>;
  abstract getCandles(symbol: string, timeFrame: string, limit?: number): Promise<ApiResponse<CandleData>>;
  
  abstract placeOrder(orderRequest: OrderRequest): Promise<ApiResponse<Order>>;
  abstract cancelOrder(orderId: string): Promise<ApiResponse<void>>;
  abstract getOrder(orderId: string): Promise<ApiResponse<Order>>;
  abstract getOpenOrders(symbol?: string): Promise<ApiResponse<Order[]>>;
  abstract getOrderHistory(symbol?: string, limit?: number): Promise<ApiResponse<Order[]>>;
  abstract getOrderFills(orderId: string): Promise<ApiResponse<OrderFill[]>>;
  
  abstract getBalances(): Promise<ApiResponse<Balance[]>>;
  abstract getBalance(currency: string): Promise<ApiResponse<Balance>>;

  // Authentication methods to be implemented by specific exchanges
  protected abstract generateSignature(
    timestamp: string,
    method: string,
    path: string,
    body?: string
  ): string;

  protected abstract getAuthHeaders(
    timestamp: string,
    method: string,
    path: string,
    body?: string
  ): Record<string, string>;

  // Common connection methods
  async connect(): Promise<void> {
    try {
      // Test connection with a simple API call
      await this.getExchangeInfo();
      this.isConnectedFlag = true;
      this.emit('connected');
    } catch (error) {
      this.isConnectedFlag = false;
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    this.emit('disconnected');
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  // Common utility methods
  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }

  protected createErrorResponse(error: string, statusCode?: number): ApiResponse<never> {
    return {
      success: false,
      error,
      message: error,
      timestamp: new Date(),
    };
  }

  protected setupInterceptors(): void {
    // Request interceptor for authentication
    this.httpClient.interceptors.request.use(
      (config) => {
        const timestamp = Date.now().toString();
        const method = config.method?.toUpperCase() || 'GET';
        const path = config.url || '';
        const body = config.data ? JSON.stringify(config.data) : '';

        // Add authentication headers
        const authHeaders = this.getAuthHeaders(timestamp, method, path, body);
        config.headers = Object.assign(config.headers || {}, authHeaders);

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        this.handleHttpError(error);
        return Promise.reject(error);
      }
    );
  }

  protected handleHttpError(error: any): void {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    this.emit('error', {
      exchange: this.exchangeType,
      status,
      message,
      timestamp: new Date(),
    });

    // Handle rate limiting
    if (status === 429) {
      this.emit('rateLimited', {
        exchange: this.exchangeType,
        retryAfter: error.response?.headers['retry-after'],
      });
    }
  }

  protected normalizeSymbol(symbol: string): string {
    // Default implementation - override in specific exchanges if needed
    return symbol.toUpperCase();
  }

  protected denormalizeSymbol(symbol: string): string {
    // Default implementation - override in specific exchanges if needed
    return symbol.toUpperCase();
  }

  // Helper method for paginated requests
  protected async getAllPages<T>(
    requestFn: (cursor?: string) => Promise<{ data: T[]; hasMore: boolean; nextCursor?: string }>,
    limit?: number
  ): Promise<T[]> {
    const results: T[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore && (!limit || results.length < limit)) {
      const response = await requestFn(cursor);
      results.push(...response.data);
      hasMore = response.hasMore;
      cursor = response.nextCursor;
    }

    return limit ? results.slice(0, limit) : results;
  }
}