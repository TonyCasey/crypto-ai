import {
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
  ApiResponse,
  OrderSide,
  OrderType,
  OrderStatus,
  TimeFrame,
} from '@cryptobot/types';
import { BaseExchange } from '../base/base-exchange';
import { CryptoUtils } from '../utils/crypto-utils';

export class CoinbaseProExchange extends BaseExchange {
  private readonly baseURL = 'https://api.exchange.coinbase.com';
  private readonly sandboxURL = 'https://api-public.sandbox.exchange.coinbase.com';

  constructor(credentials: ExchangeCredentials) {
    const baseURL = credentials.sandbox ? 'https://api-public.sandbox.exchange.coinbase.com' : 'https://api.exchange.coinbase.com';
    super(ExchangeType.COINBASE_PRO, credentials, baseURL);
  }

  protected generateSignature(timestamp: string, method: string, path: string, body?: string): string {
    const message = timestamp + method + path + (body || '');
    const decodedSecret = Buffer.from(this.credentials.apiSecret, 'base64');
    return CryptoUtils.createHmacSha256Base64(decodedSecret.toString(), message);
  }

  protected getAuthHeaders(timestamp: string, method: string, path: string, body?: string): Record<string, string> {
    const signature = this.generateSignature(timestamp, method, path, body);
    
    return {
      'CB-ACCESS-KEY': this.credentials.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': this.credentials.passphrase || '',
    };
  }

  async getExchangeInfo(): Promise<ApiResponse<ExchangeInfo>> {
    try {
      const response = await this.httpClient.get('/time');
      const serverTime = new Date(response.data.iso);
      
      return this.createSuccessResponse({
        exchangeType: ExchangeType.COINBASE_PRO,
        name: 'Coinbase Pro',
        tradingPairs: [], // Will be populated by getTradingPairs
        rateLimits: [
          { endpoint: 'public', maxRequests: 10, windowMs: 1000 },
          { endpoint: 'private', maxRequests: 5, windowMs: 1000 },
        ],
        serverTime,
        timezone: 'UTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      return this.createErrorResponse(`Failed to get exchange info: ${error}`);
    }
  }

  async getTradingPairs(): Promise<ApiResponse<TradingPair[]>> {
    try {
      const response = await this.httpClient.get('/products');
      
      const tradingPairs: TradingPair[] = response.data.map((product: any) => ({
        id: product.id,
        symbol: product.id,
        baseCurrency: product.base_currency,
        quoteCurrency: product.quote_currency,
        minOrderSize: { value: product.base_min_size, precision: 8 },
        maxOrderSize: { value: product.max_market_funds || '1000000', precision: 8 },
        priceIncrement: { value: product.quote_increment, precision: 8 },
        sizeIncrement: { value: product.base_increment, precision: 8 },
        isActive: product.status === 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return this.createSuccessResponse(tradingPairs);
    } catch (error) {
      return this.createErrorResponse(`Failed to get trading pairs: ${error}`);
    }
  }

  async getTicker(symbol: string): Promise<ApiResponse<Ticker>> {
    try {
      const [tickerResponse, statsResponse] = await Promise.all([
        this.httpClient.get(`/products/${symbol}/ticker`),
        this.httpClient.get(`/products/${symbol}/stats`)
      ]);

      const ticker: Ticker = {
        symbol,
        price: { value: tickerResponse.data.price, currency: symbol.split('-')[1] || 'USD' },
        bidPrice: { value: tickerResponse.data.bid, currency: symbol.split('-')[1] || 'USD' },
        askPrice: { value: tickerResponse.data.ask, currency: symbol.split('-')[1] || 'USD' },
        volume24h: { value: statsResponse.data.volume, currency: symbol.split('-')[0] || 'BTC' },
        change24h: { value: parseFloat(statsResponse.data.volume) > 0 ? 
          ((parseFloat(tickerResponse.data.price) - parseFloat(statsResponse.data.open)) / parseFloat(statsResponse.data.open)) * 100 : 0 },
        high24h: { value: statsResponse.data.high, currency: symbol.split('-')[1] || 'USD' },
        low24h: { value: statsResponse.data.low, currency: symbol.split('-')[1] || 'USD' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return this.createSuccessResponse(ticker);
    } catch (error) {
      return this.createErrorResponse(`Failed to get ticker for ${symbol}: ${error}`);
    }
  }

  async getOrderBook(symbol: string, depth: number = 50): Promise<ApiResponse<OrderBook>> {
    try {
      const response = await this.httpClient.get(`/products/${symbol}/book`, {
        params: { level: depth > 50 ? 3 : 2 }
      });

      const orderBook: OrderBook = {
        symbol,
        bids: response.data.bids.map((bid: [string, string, number]) => ({
          price: { value: bid[0], currency: symbol.split('-')[1] || 'USD' },
          size: { value: bid[1], currency: symbol.split('-')[0] || 'BTC' },
          orderCount: bid[2],
        })),
        asks: response.data.asks.map((ask: [string, string, number]) => ({
          price: { value: ask[0], currency: symbol.split('-')[1] || 'USD' },
          size: { value: ask[1], currency: symbol.split('-')[0] || 'BTC' },
          orderCount: ask[2],
        })),
        sequence: response.data.sequence,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return this.createSuccessResponse(orderBook);
    } catch (error) {
      return this.createErrorResponse(`Failed to get order book for ${symbol}: ${error}`);
    }
  }

  async getTrades(symbol: string, limit: number = 100): Promise<ApiResponse<Trade[]>> {
    try {
      const response = await this.httpClient.get(`/products/${symbol}/trades`, {
        params: { limit: Math.min(limit, 1000) }
      });

      const trades: Trade[] = response.data.map((trade: any) => ({
        id: trade.trade_id.toString(),
        symbol,
        price: { value: trade.price, currency: symbol.split('-')[1] || 'USD' },
        size: { value: trade.size, currency: symbol.split('-')[0] || 'BTC' },
        side: trade.side,
        timestamp: new Date(trade.time),
        tradeId: trade.trade_id.toString(),
        createdAt: new Date(trade.time),
        updatedAt: new Date(trade.time),
      }));

      return this.createSuccessResponse(trades);
    } catch (error) {
      return this.createErrorResponse(`Failed to get trades for ${symbol}: ${error}`);
    }
  }

  async getCandles(symbol: string, timeFrame: string, limit: number = 100): Promise<ApiResponse<CandleData>> {
    try {
      // Convert our timeframe to Coinbase Pro granularity
      const granularityMap: Record<string, number> = {
        '1m': 60,
        '5m': 300,
        '15m': 900,
        '1h': 3600,
        '6h': 21600,
        '1d': 86400,
      };

      const granularity = granularityMap[timeFrame] || 3600;
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (limit * granularity * 1000));

      const response = await this.httpClient.get(`/products/${symbol}/candles`, {
        params: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          granularity,
        }
      });

      const candles = response.data.reverse().map((candle: number[]) => ({
        timestamp: new Date(candle[0] * 1000),
        open: { value: candle[3].toString(), currency: symbol.split('-')[1] || 'USD' },
        high: { value: candle[2].toString(), currency: symbol.split('-')[1] || 'USD' },
        low: { value: candle[1].toString(), currency: symbol.split('-')[1] || 'USD' },
        close: { value: candle[4].toString(), currency: symbol.split('-')[1] || 'USD' },
        volume: { value: candle[5].toString(), currency: symbol.split('-')[0] || 'BTC' },
        timeFrame: timeFrame as TimeFrame,
      }));

      const candleData: CandleData = {
        symbol,
        timeFrame: timeFrame as TimeFrame,
        candles,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return this.createSuccessResponse(candleData);
    } catch (error) {
      return this.createErrorResponse(`Failed to get candles for ${symbol}: ${error}`);
    }
  }

  async placeOrder(orderRequest: OrderRequest): Promise<ApiResponse<Order>> {
    try {
      const body = {
        product_id: orderRequest.symbol,
        side: orderRequest.side,
        type: orderRequest.type,
        size: orderRequest.size.value,
        price: orderRequest.price?.value,
        time_in_force: orderRequest.timeInForce || 'GTC',
        client_oid: orderRequest.clientOrderId,
      };

      const response = await this.httpClient.post('/orders', body);

      const order: Order = {
        id: response.data.id,
        symbol: orderRequest.symbol,
        side: orderRequest.side,
        type: orderRequest.type,
        size: orderRequest.size,
        price: orderRequest.price,
        status: OrderStatus.PENDING,
        filledSize: { value: '0', currency: orderRequest.symbol.split('-')[0] || 'BTC' },
        fees: { value: '0', currency: orderRequest.symbol.split('-')[1] || 'USD' },
        clientOrderId: orderRequest.clientOrderId,
        exchangeOrderId: response.data.id,
        timeInForce: orderRequest.timeInForce || 'GTC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return this.createSuccessResponse(order);
    } catch (error) {
      return this.createErrorResponse(`Failed to place order: ${error}`);
    }
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<void>> {
    try {
      await this.httpClient.delete(`/orders/${orderId}`);
      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(`Failed to cancel order ${orderId}: ${error}`);
    }
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.httpClient.get(`/orders/${orderId}`);
      const orderData = response.data;

      const order: Order = {
        id: orderData.id,
        symbol: orderData.product_id,
        side: orderData.side,
        type: orderData.type,
        size: { value: orderData.size, currency: orderData.product_id.split('-')[0] },
        price: orderData.price ? { value: orderData.price, currency: orderData.product_id.split('-')[1] } : undefined,
        status: this.mapOrderStatus(orderData.status),
        filledSize: { value: orderData.filled_size, currency: orderData.product_id.split('-')[0] },
        averageFillPrice: orderData.executed_value && orderData.filled_size > 0 ? 
          { value: (parseFloat(orderData.executed_value) / parseFloat(orderData.filled_size)).toString(), currency: orderData.product_id.split('-')[1] } : undefined,
        fees: { value: orderData.fill_fees, currency: orderData.product_id.split('-')[1] },
        clientOrderId: orderData.client_oid,
        exchangeOrderId: orderData.id,
        timeInForce: orderData.time_in_force,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.created_at),
      };

      return this.createSuccessResponse(order);
    } catch (error) {
      return this.createErrorResponse(`Failed to get order ${orderId}: ${error}`);
    }
  }

  async getOpenOrders(symbol?: string): Promise<ApiResponse<Order[]>> {
    try {
      const params = symbol ? { product_id: symbol } : {};
      const response = await this.httpClient.get('/orders', { params });

      const orders: Order[] = response.data.map((orderData: any) => ({
        id: orderData.id,
        symbol: orderData.product_id,
        side: orderData.side,
        type: orderData.type,
        size: { value: orderData.size, currency: orderData.product_id.split('-')[0] },
        price: orderData.price ? { value: orderData.price, currency: orderData.product_id.split('-')[1] } : undefined,
        status: this.mapOrderStatus(orderData.status),
        filledSize: { value: orderData.filled_size, currency: orderData.product_id.split('-')[0] },
        fees: { value: orderData.fill_fees, currency: orderData.product_id.split('-')[1] },
        clientOrderId: orderData.client_oid,
        exchangeOrderId: orderData.id,
        timeInForce: orderData.time_in_force,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.created_at),
      }));

      return this.createSuccessResponse(orders);
    } catch (error) {
      return this.createErrorResponse(`Failed to get open orders: ${error}`);
    }
  }

  async getOrderHistory(symbol?: string, limit: number = 100): Promise<ApiResponse<Order[]>> {
    try {
      const params: any = { status: ['done', 'rejected'], limit: Math.min(limit, 1000) };
      if (symbol) params.product_id = symbol;

      const response = await this.httpClient.get('/orders', { params });

      const orders: Order[] = response.data.map((orderData: any) => ({
        id: orderData.id,
        symbol: orderData.product_id,
        side: orderData.side,
        type: orderData.type,
        size: { value: orderData.size, currency: orderData.product_id.split('-')[0] },
        price: orderData.price ? { value: orderData.price, currency: orderData.product_id.split('-')[1] } : undefined,
        status: this.mapOrderStatus(orderData.status),
        filledSize: { value: orderData.filled_size, currency: orderData.product_id.split('-')[0] },
        fees: { value: orderData.fill_fees, currency: orderData.product_id.split('-')[1] },
        clientOrderId: orderData.client_oid,
        exchangeOrderId: orderData.id,
        timeInForce: orderData.time_in_force,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.created_at),
      }));

      return this.createSuccessResponse(orders);
    } catch (error) {
      return this.createErrorResponse(`Failed to get order history: ${error}`);
    }
  }

  async getOrderFills(orderId: string): Promise<ApiResponse<OrderFill[]>> {
    try {
      const response = await this.httpClient.get('/fills', {
        params: { order_id: orderId }
      });

      const fills: OrderFill[] = response.data.map((fill: any) => ({
        id: fill.trade_id.toString(),
        orderId: fill.order_id,
        tradeId: fill.trade_id.toString(),
        symbol: fill.product_id,
        side: fill.side,
        price: { value: fill.price, currency: fill.product_id.split('-')[1] },
        size: { value: fill.size, currency: fill.product_id.split('-')[0] },
        fees: { value: fill.fee, currency: fill.product_id.split('-')[1] },
        liquidity: fill.liquidity,
        timestamp: new Date(fill.created_at),
        createdAt: new Date(fill.created_at),
      }));

      return this.createSuccessResponse(fills);
    } catch (error) {
      return this.createErrorResponse(`Failed to get order fills for ${orderId}: ${error}`);
    }
  }

  async getBalances(): Promise<ApiResponse<Balance[]>> {
    try {
      const response = await this.httpClient.get('/accounts');

      const balances: Balance[] = response.data.map((account: any) => ({
        currency: account.currency,
        total: { value: account.balance, currency: account.currency },
        available: { value: account.available, currency: account.currency },
        locked: { value: account.hold, currency: account.currency },
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return this.createSuccessResponse(balances);
    } catch (error) {
      return this.createErrorResponse(`Failed to get balances: ${error}`);
    }
  }

  async getBalance(currency: string): Promise<ApiResponse<Balance>> {
    try {
      const response = await this.httpClient.get('/accounts');
      const account = response.data.find((acc: any) => acc.currency === currency);

      if (!account) {
        return this.createErrorResponse(`Currency ${currency} not found`);
      }

      const balance: Balance = {
        currency: account.currency,
        total: { value: account.balance, currency: account.currency },
        available: { value: account.available, currency: account.currency },
        locked: { value: account.hold, currency: account.currency },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return this.createSuccessResponse(balance);
    } catch (error) {
      return this.createErrorResponse(`Failed to get balance for ${currency}: ${error}`);
    }
  }

  private mapOrderStatus(status: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'pending': OrderStatus.PENDING,
      'open': OrderStatus.OPEN,
      'active': OrderStatus.OPEN,
      'done': OrderStatus.FILLED,
      'cancelled': OrderStatus.CANCELLED,
      'rejected': OrderStatus.REJECTED,
    };

    return statusMap[status] || OrderStatus.PENDING;
  }
}