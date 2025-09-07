import { Server as SocketServer, Socket } from 'socket.io';

export class WebSocketService {
  private io: SocketServer;
  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  constructor(io: SocketServer) {
    this.io = io;
    this.startMarketDataBroadcast();
  }

  handleConnection(socket: Socket): void {
    console.log(`WebSocket client connected: ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', (data) => {
      this.handleAuthentication(socket, data);
    });

    // Handle market data subscriptions
    socket.on('subscribe', (data) => {
      this.handleSubscription(socket, data);
    });

    socket.on('unsubscribe', (data) => {
      this.handleUnsubscription(socket, data);
    });

    // Handle trading events
    socket.on('trading:start', () => {
      this.handleTradingStart(socket);
    });

    socket.on('trading:stop', () => {
      this.handleTradingStop(socket);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private handleAuthentication(socket: Socket, data: { userId: string; token: string }): void {
    try {
      // In a real implementation, you'd verify the JWT token here
      const { userId } = data;
      
      this.connectedUsers.set(socket.id, userId);
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      socket.join(`user:${userId}`);
      
      socket.emit('authenticated', {
        success: true,
        userId,
      });

      console.log(`User ${userId} authenticated on socket ${socket.id}`);
    } catch (error) {
      socket.emit('authentication_error', {
        success: false,
        error: 'Authentication failed',
      });
    }
  }

  private handleSubscription(socket: Socket, data: { channel: string; symbol?: string }): void {
    const { channel, symbol } = data;
    
    if (channel === 'market_data' && symbol) {
      socket.join(`market:${symbol}`);
      socket.emit('subscribed', {
        channel,
        symbol,
        success: true,
      });
      console.log(`Socket ${socket.id} subscribed to market data for ${symbol}`);
    } else if (channel === 'trading') {
      const userId = this.connectedUsers.get(socket.id);
      if (userId) {
        socket.join(`trading:${userId}`);
        socket.emit('subscribed', {
          channel,
          success: true,
        });
        console.log(`Socket ${socket.id} subscribed to trading updates`);
      }
    }
  }

  private handleUnsubscription(socket: Socket, data: { channel: string; symbol?: string }): void {
    const { channel, symbol } = data;
    
    if (channel === 'market_data' && symbol) {
      socket.leave(`market:${symbol}`);
      socket.emit('unsubscribed', {
        channel,
        symbol,
        success: true,
      });
    } else if (channel === 'trading') {
      const userId = this.connectedUsers.get(socket.id);
      if (userId) {
        socket.leave(`trading:${userId}`);
        socket.emit('unsubscribed', {
          channel,
          success: true,
        });
      }
    }
  }

  private handleTradingStart(socket: Socket): void {
    const userId = this.connectedUsers.get(socket.id);
    if (userId) {
      // Emit to all user's sockets
      this.io.to(`user:${userId}`).emit('trading:status', {
        status: 'starting',
        timestamp: new Date(),
      });
    }
  }

  private handleTradingStop(socket: Socket): void {
    const userId = this.connectedUsers.get(socket.id);
    if (userId) {
      this.io.to(`user:${userId}`).emit('trading:status', {
        status: 'stopping',
        timestamp: new Date(),
      });
    }
  }

  private handleDisconnection(socket: Socket): void {
    const userId = this.connectedUsers.get(socket.id);
    
    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.connectedUsers.delete(socket.id);
      console.log(`User ${userId} disconnected from socket ${socket.id}`);
    } else {
      console.log(`Unknown socket disconnected: ${socket.id}`);
    }
  }

  // Public methods to broadcast data
  public broadcastMarketData(symbol: string, data: any): void {
    this.io.to(`market:${symbol}`).emit('market_data', {
      symbol,
      data,
      timestamp: new Date(),
    });
  }

  public broadcastTradingSignal(userId: string, signal: any): void {
    this.io.to(`user:${userId}`).emit('trading:signal', {
      signal,
      timestamp: new Date(),
    });
  }

  public broadcastOrderUpdate(userId: string, order: any): void {
    this.io.to(`user:${userId}`).emit('trading:order_update', {
      order,
      timestamp: new Date(),
    });
  }

  public broadcastTradeExecution(userId: string, trade: any): void {
    this.io.to(`user:${userId}`).emit('trading:trade_executed', {
      trade,
      timestamp: new Date(),
    });
  }

  public broadcastPortfolioUpdate(userId: string, portfolio: any): void {
    this.io.to(`user:${userId}`).emit('portfolio:update', {
      portfolio,
      timestamp: new Date(),
    });
  }

  public broadcastSystemAlert(alert: any): void {
    this.io.emit('system:alert', {
      alert,
      timestamp: new Date(),
    });
  }

  private startMarketDataBroadcast(): void {
    // Simulate real-time market data
    setInterval(() => {
      const symbols = ['BTC-USD', 'ETH-USD', 'ADA-USD'];
      
      symbols.forEach(symbol => {
        const mockData = {
          price: (Math.random() * 50000 + 40000).toFixed(2),
          volume: (Math.random() * 1000).toFixed(2),
          change24h: ((Math.random() - 0.5) * 10).toFixed(2),
        };

        this.broadcastMarketData(symbol, mockData);
      });
    }, 5000); // Broadcast every 5 seconds
  }

  // Get connection statistics
  public getStats(): any {
    return {
      totalConnections: this.connectedUsers.size,
      uniqueUsers: this.userSockets.size,
      rooms: this.io.sockets.adapter.rooms,
    };
  }
}