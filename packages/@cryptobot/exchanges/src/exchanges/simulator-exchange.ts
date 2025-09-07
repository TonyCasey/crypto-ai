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
  OrderStatus,
  TimeFrame,
} from '@cryptobot/types';
import { BaseExchange } from '../base/base-exchange';

interface SimulatorState {
  balances: Map<string, number>;
  orders: Map<string, Order>;
  fills: Map<string, OrderFill[]>;
  positions: Map<string, number>;
  nextOrderId: number;
}

export class SimulatorExchange extends BaseExchange {
  private state: SimulatorState;
  private marketData: Map<string, { price: number; volume: number }> = new Map();

  constructor(credentials: ExchangeCredentials, initialBalance: number = 10000) {
    super(ExchangeType.SIMULATOR, credentials, 'http://localhost:3000/api/simulator');
    
    this.state = {
      balances: new Map([['USD', initialBalance]]),
      orders: new Map(),
      fills: new Map(),
      positions: new Map(),
      nextOrderId: 1,
    };

    this.initializeMarketData();
    this.startPriceSimulation();
  }

  protected generateSignature(): string {
    return 'simulator_signature';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': 'Simulator',
      'X-Simulator': 'true',
    };
  }

  async getExchangeInfo(): Promise<ApiResponse<ExchangeInfo>> {
    return this.createSuccessResponse({
      exchangeType: ExchangeType.SIMULATOR,
      name: 'Simulator Exchange',
      tradingPairs: [],
      rateLimits: [],
      serverTime: new Date(),
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getTradingPairs(): Promise<ApiResponse<TradingPair[]>> {
    const pairs: TradingPair[] = [
      {
        id: 'BTC-USD',
        symbol: 'BTC-USD',
        baseCurrency: 'BTC',
        quoteCurrency: 'USD',
        minOrderSize: { value: '0.001', precision: 8 },
        maxOrderSize: { value: '1000', precision: 8 },
        priceIncrement: { value: '0.01', precision: 2 },
        sizeIncrement: { value: '0.00000001', precision: 8 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'ETH-USD',
        symbol: 'ETH-USD',
        baseCurrency: 'ETH',
        quoteCurrency: 'USD',
        minOrderSize: { value: '0.01', precision: 8 },
        maxOrderSize: { value: '1000', precision: 8 },
        priceIncrement: { value: '0.01', precision: 2 },
        sizeIncrement: { value: '0.00000001', precision: 8 },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return this.createSuccessResponse(pairs);
  }

  async getTicker(symbol: string): Promise<ApiResponse<Ticker>> {
    const data = this.marketData.get(symbol);
    if (!data) {
      return this.createErrorResponse(`Symbol ${symbol} not found`);
    }

    const price = data.price;
    const spread = price * 0.001; // 0.1% spread

    const ticker: Ticker = {
      symbol,
      price: { value: price.toFixed(2), currency: symbol.split('-')[1] },
      bidPrice: { value: (price - spread/2).toFixed(2), currency: symbol.split('-')[1] },
      askPrice: { value: (price + spread/2).toFixed(2), currency: symbol.split('-')[1] },
      volume24h: { value: data.volume.toFixed(2), currency: symbol.split('-')[0] },
      change24h: { value: (Math.random() - 0.5) * 10 }, // Random change for simulation
      high24h: { value: (price * 1.05).toFixed(2), currency: symbol.split('-')[1] },
      low24h: { value: (price * 0.95).toFixed(2), currency: symbol.split('-')[1] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.createSuccessResponse(ticker);
  }

  async getOrderBook(symbol: string, depth: number = 20): Promise<ApiResponse<OrderBook>> {
    const data = this.marketData.get(symbol);
    if (!data) {
      return this.createErrorResponse(`Symbol ${symbol} not found`);
    }

    const price = data.price;
    const spread = price * 0.001;
    const quoteCurrency = symbol.split('-')[1];
    const baseCurrency = symbol.split('-')[0];

    const bids = Array.from({ length: depth }, (_, i) => ({
      price: { value: (price - spread/2 - i * 0.01).toFixed(2), currency: quoteCurrency },
      size: { value: (Math.random() * 10 + 1).toFixed(8), currency: baseCurrency },
      orderCount: Math.floor(Math.random() * 10) + 1,
    }));

    const asks = Array.from({ length: depth }, (_, i) => ({
      price: { value: (price + spread/2 + i * 0.01).toFixed(2), currency: quoteCurrency },
      size: { value: (Math.random() * 10 + 1).toFixed(8), currency: baseCurrency },
      orderCount: Math.floor(Math.random() * 10) + 1,
    }));

    const orderBook: OrderBook = {
      symbol,
      bids,
      asks,
      sequence: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.createSuccessResponse(orderBook);
  }

  async getTrades(symbol: string, limit: number = 100): Promise<ApiResponse<Trade[]>> {
    const data = this.marketData.get(symbol);
    if (!data) {
      return this.createErrorResponse(`Symbol ${symbol} not found`);
    }

    const price = data.price;
    const trades: Trade[] = Array.from({ length: Math.min(limit, 100) }, (_, i) => ({
      id: `trade_${Date.now()}_${i}`,
      symbol,
      price: { value: (price + (Math.random() - 0.5) * price * 0.01).toFixed(2), currency: symbol.split('-')[1] },
      size: { value: (Math.random() * 5 + 0.1).toFixed(8), currency: symbol.split('-')[0] },
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: new Date(Date.now() - i * 1000),
      tradeId: `trade_${Date.now()}_${i}`,
      createdAt: new Date(Date.now() - i * 1000),
      updatedAt: new Date(Date.now() - i * 1000),
    }));

    return this.createSuccessResponse(trades);
  }

  async getCandles(symbol: string, timeFrame: string, limit: number = 100): Promise<ApiResponse<CandleData>> {
    const data = this.marketData.get(symbol);
    if (!data) {
      return this.createErrorResponse(`Symbol ${symbol} not found`);
    }

    const basePrice = data.price;
    const quoteCurrency = symbol.split('-')[1];
    const baseCurrency = symbol.split('-')[0];
    
    const candles = Array.from({ length: Math.min(limit, 200) }, (_, i) => {
      const timestamp = new Date(Date.now() - (limit - i) * 60000); // 1 minute intervals
      const open = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
      const high = open + Math.random() * open * 0.01;
      const low = open - Math.random() * open * 0.01;
      const close = low + Math.random() * (high - low);

      return {
        timestamp,
        open: { value: open.toFixed(2), currency: quoteCurrency },
        high: { value: high.toFixed(2), currency: quoteCurrency },
        low: { value: low.toFixed(2), currency: quoteCurrency },
        close: { value: close.toFixed(2), currency: quoteCurrency },
        volume: { value: (Math.random() * 100 + 10).toFixed(8), currency: baseCurrency },
        timeFrame: timeFrame as TimeFrame,
      };
    });

    const candleData: CandleData = {
      symbol,
      timeFrame: timeFrame as TimeFrame,
      candles,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.createSuccessResponse(candleData);
  }

  async placeOrder(orderRequest: OrderRequest): Promise<ApiResponse<Order>> {
    const orderId = `sim_order_${this.state.nextOrderId++}`;
    const data = this.marketData.get(orderRequest.symbol);
    
    if (!data) {
      return this.createErrorResponse(`Symbol ${orderRequest.symbol} not found`);
    }

    // Simulate order placement with immediate fill for market orders
    const currentPrice = data.price;
    const isMarketOrder = orderRequest.type === OrderType.MARKET;
    
    const order: Order = {
      id: orderId,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      type: orderRequest.type,
      size: orderRequest.size,
      price: orderRequest.price || { value: currentPrice.toFixed(2), currency: orderRequest.symbol.split('-')[1] },
      status: isMarketOrder ? OrderStatus.FILLED : OrderStatus.OPEN,
      filledSize: isMarketOrder ? orderRequest.size : { value: '0', currency: orderRequest.size.currency },
      averageFillPrice: isMarketOrder ? { value: currentPrice.toFixed(2), currency: orderRequest.symbol.split('-')[1] } : undefined,
      fees: { value: '0', currency: orderRequest.symbol.split('-')[1] },
      clientOrderId: orderRequest.clientOrderId,
      exchangeOrderId: orderId,
      timeInForce: orderRequest.timeInForce || 'GTC',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.orders.set(orderId, order);

    // Simulate trade execution for market orders
    if (isMarketOrder) {
      await this.simulateOrderFill(order, currentPrice);
    }

    return this.createSuccessResponse(order);
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<void>> {
    const order = this.state.orders.get(orderId);
    if (!order) {
      return this.createErrorResponse(`Order ${orderId} not found`);
    }

    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();

    return this.createSuccessResponse(undefined);
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    const order = this.state.orders.get(orderId);
    if (!order) {
      return this.createErrorResponse(`Order ${orderId} not found`);
    }

    return this.createSuccessResponse(order);
  }

  async getOpenOrders(symbol?: string): Promise<ApiResponse<Order[]>> {
    const orders = Array.from(this.state.orders.values()).filter(order => {
      const isOpen = order.status === OrderStatus.OPEN || order.status === OrderStatus.PENDING;
      const matchesSymbol = !symbol || order.symbol === symbol;
      return isOpen && matchesSymbol;
    });

    return this.createSuccessResponse(orders);
  }

  async getOrderHistory(symbol?: string, limit: number = 100): Promise<ApiResponse<Order[]>> {
    const orders = Array.from(this.state.orders.values())
      .filter(order => {
        const isDone = order.status === OrderStatus.FILLED || order.status === OrderStatus.CANCELLED;
        const matchesSymbol = !symbol || order.symbol === symbol;
        return isDone && matchesSymbol;
      })
      .slice(0, limit);

    return this.createSuccessResponse(orders);
  }

  async getOrderFills(orderId: string): Promise<ApiResponse<OrderFill[]>> {
    const fills = this.state.fills.get(orderId) || [];
    return this.createSuccessResponse(fills);
  }

  async getBalances(): Promise<ApiResponse<Balance[]>> {
    const balances: Balance[] = Array.from(this.state.balances.entries()).map(([currency, total]) => ({
      currency,
      total: { value: total.toString(), currency },
      available: { value: total.toString(), currency },
      locked: { value: '0', currency },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return this.createSuccessResponse(balances);
  }

  async getBalance(currency: string): Promise<ApiResponse<Balance>> {
    const total = this.state.balances.get(currency) || 0;
    
    const balance: Balance = {
      currency,
      total: { value: total.toString(), currency },
      available: { value: total.toString(), currency },
      locked: { value: '0', currency },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.createSuccessResponse(balance);
  }

  private initializeMarketData(): void {
    this.marketData.set('BTC-USD', { price: 45000, volume: 1000 });
    this.marketData.set('ETH-USD', { price: 3000, volume: 5000 });
  }

  private startPriceSimulation(): void {
    setInterval(() => {
      for (const [symbol, data] of this.marketData.entries()) {
        // Simulate price movement with random walk
        const change = (Math.random() - 0.5) * 0.02; // ±1% change
        data.price = Math.max(data.price * (1 + change), 0.01);
        data.volume = Math.max(data.volume * (1 + (Math.random() - 0.5) * 0.1), 1);
      }
    }, 5000); // Update every 5 seconds
  }

  private async simulateOrderFill(order: Order, fillPrice: number): Promise<void> {
    const fillId = `fill_${Date.now()}`;
    const fill: OrderFill = {
      id: fillId,
      orderId: order.id,
      tradeId: fillId,
      symbol: order.symbol,
      side: order.side,
      price: { value: fillPrice.toFixed(2), currency: order.symbol.split('-')[1] },
      size: order.size,
      fees: { value: '0', currency: order.symbol.split('-')[1] },
      liquidity: 'taker',
      timestamp: new Date(),
      createdAt: new Date(),
    };

    if (!this.state.fills.has(order.id)) {
      this.state.fills.set(order.id, []);
    }
    this.state.fills.get(order.id)!.push(fill);

    // Update balances
    const [baseCurrency, quoteCurrency] = order.symbol.split('-');
    const orderValue = parseFloat(order.size.value) * fillPrice;

    if (order.side === OrderSide.BUY) {
      // Deduct quote currency, add base currency
      this.state.balances.set(quoteCurrency, 
        (this.state.balances.get(quoteCurrency) || 0) - orderValue);
      this.state.balances.set(baseCurrency, 
        (this.state.balances.get(baseCurrency) || 0) + parseFloat(order.size.value));
    } else {
      // Deduct base currency, add quote currency
      this.state.balances.set(baseCurrency, 
        (this.state.balances.get(baseCurrency) || 0) - parseFloat(order.size.value));
      this.state.balances.set(quoteCurrency, 
        (this.state.balances.get(quoteCurrency) || 0) + orderValue);
    }

    this.emit('orderFilled', { order, fill });
  }
}