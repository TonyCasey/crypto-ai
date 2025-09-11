# CryptoBot Node.js Migration - API Reference

## Overview

The CryptoBot Node.js Migration API provides a comprehensive set of endpoints for cryptocurrency trading automation, portfolio management, and market data access. This RESTful API follows standard HTTP conventions and returns JSON responses.

### Base URL
```
http://localhost:5000
```

### Authentication
Most endpoints require authentication using JWT (JSON Web Tokens). Include the token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    // Additional error details (for validation errors)
  ]
}
```

### Rate Limiting
- **Limit**: 1000 requests per 15 minutes per IP address
- **Response Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Authentication Endpoints

### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!"
}
```

**Validation Rules:**
- `email`: Valid email address, normalized
- `username`: 3-30 characters, trimmed
- `password`: Minimum 8 characters, must contain lowercase, uppercase, and digit

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_uuid",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
- `409 Conflict`: User with email or username already exists

---

### POST /api/auth/login
Authenticate and log in a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_uuid",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid credentials

---

### POST /api/auth/logout
Log out the current user (clears session cookie).

**Headers Required:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
Get current authenticated user information.

**Headers Required:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_uuid",
    "email": "user@example.com",
    "username": "username",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

### POST /api/auth/refresh
Refresh the authentication token.

**Headers Required:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new_jwt_token_here"
  }
}
```

---

## Trading Strategy Endpoints

### GET /api/strategies
Get all trading strategies for the authenticated user.

**Headers Required:** `Authorization: Bearer <token>`

**Query Parameters:**
- `active` (optional): Boolean - Filter by active/inactive status

**Example Request:**
```http
GET /api/strategies?active=true
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "strategy_uuid",
      "name": "RSI Oversold Strategy",
      "type": "RSI_OVERSOLD_OVERBOUGHT",
      "description": "Buy when RSI < 30, sell when RSI > 70",
      "symbols": ["BTC-USD", "ETH-USD"],
      "timeFrame": "1h",
      "isActive": true,
      "parameters": {
        "rsiPeriod": 14,
        "oversoldThreshold": 30,
        "overboughtThreshold": 70
      },
      "riskParameters": {
        "maxPositionSize": 0.1,
        "stopLossPercent": 5
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### POST /api/strategies
Create a new trading strategy.

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "MACD Crossover Strategy",
  "type": "MACD_CROSSOVER",
  "description": "Buy on MACD bullish crossover, sell on bearish crossover",
  "symbols": ["BTC-USD"],
  "timeFrame": "4h",
  "parameters": {
    "fastPeriod": 12,
    "slowPeriod": 26,
    "signalPeriod": 9
  },
  "riskParameters": {
    "maxPositionSize": 0.05,
    "stopLossPercent": 3
  }
}
```

**Validation Rules:**
- `name`: 1-100 characters
- `type`: Must be valid `TradingStrategyType` enum value
- `description`: Optional, max 500 characters
- `symbols`: Array of strings (trading pairs)
- `timeFrame`: Must be valid timeframe ('1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d', '1w', '1M')
- `parameters`: Object with strategy-specific parameters
- `riskParameters`: Object with risk management settings

**Strategy Types:**
- `SIMPLE_MOVING_AVERAGE`
- `RSI_OVERSOLD_OVERBOUGHT`
- `MACD_CROSSOVER`
- `BOLLINGER_BANDS_SQUEEZE`
- `MEAN_REVERSION`
- `MOMENTUM`
- `CUSTOM`

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "new_strategy_uuid",
    "name": "MACD Crossover Strategy",
    "type": "MACD_CROSSOVER",
    "description": "Buy on MACD bullish crossover, sell on bearish crossover",
    "symbols": ["BTC-USD"],
    "timeFrame": "4h",
    "isActive": false,
    "parameters": {
      "fastPeriod": 12,
      "slowPeriod": 26,
      "signalPeriod": 9
    },
    "riskParameters": {
      "maxPositionSize": 0.05,
      "stopLossPercent": 3
    },
    "userId": "user_uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid or missing token

---

### PUT /api/strategies/:id
Update an existing trading strategy.

**Headers Required:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Strategy UUID

**Request Body (partial update allowed):**
```json
{
  "name": "Updated Strategy Name",
  "description": "Updated description",
  "isActive": true,
  "parameters": {
    "rsiPeriod": 21,
    "oversoldThreshold": 25,
    "overboughtThreshold": 75
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    // Updated strategy object
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Strategy not found or not owned by user

---

### DELETE /api/strategies/:id
Delete a trading strategy.

**Headers Required:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Strategy UUID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Strategy deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Strategy not found or not owned by user

---

### GET /api/strategies/:id/performance
Get performance metrics for a specific strategy.

**Headers Required:** `Authorization: Bearer <token>`

**URL Parameters:**
- `id`: Strategy UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalSignals": 45,
    "executedSignals": 38,
    "successRate": 84.44,
    "recentSignals": [
      {
        "id": "signal_uuid",
        "type": "BUY",
        "symbol": "BTC-USD",
        "price": 45000.00,
        "confidence": 0.85,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "recentExecutions": [
      {
        "id": "execution_uuid",
        "signalId": "signal_uuid",
        "status": "EXECUTED",
        "executedAt": "2024-01-15T10:35:00Z",
        "executedPrice": 45050.00
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Strategy not found or not owned by user

---

## Portfolio Management Endpoints

### GET /api/portfolio
Get the user's portfolio information.

**Headers Required:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "portfolio_uuid",
    "userId": "user_uuid",
    "totalValue": 12500.00,
    "availableBalance": 10000.00,
    "lockedBalance": 2500.00,
    "balances": [
      {
        "id": "balance_uuid",
        "currency": "USD",
        "total": 10000.00,
        "available": 8500.00,
        "locked": 1500.00
      },
      {
        "id": "balance_uuid_2",
        "currency": "BTC",
        "total": 0.05,
        "available": 0.03,
        "locked": 0.02
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T11:30:00Z"
  }
}
```

**Note:** If no portfolio exists, one is automatically created with a demo balance of $10,000 USD.

---

### GET /api/portfolio/positions
Get current trading positions.

**Headers Required:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "position_uuid",
      "symbol": "BTC-USD",
      "side": "LONG",
      "size": 0.1,
      "entryPrice": 44000.00,
      "currentPrice": 45000.00,
      "unrealizedPnL": 100.00,
      "realizedPnL": 0.00,
      "exchangeConfig": {
        "name": "Simulator Exchange",
        "type": "simulator"
      },
      "tradingPair": {
        "baseCurrency": "BTC",
        "quoteCurrency": "USD"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### GET /api/portfolio/history
Get portfolio value history.

**Headers Required:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "totalValue": 10100.00,
      "change": 100.00,
      "order": {
        "symbol": "BTC-USD",
        "side": "BUY",
        "size": "0.002",
        "price": "45000.00"
      }
    }
  ]
}
```

---

## Market Data Endpoints

### GET /api/market-data/:symbol/ticker
Get current ticker data for a trading symbol.

**URL Parameters:**
- `symbol`: Trading symbol (e.g., "BTC-USD")

**Query Parameters:**
- `exchange` (optional): Exchange name ("coinbase_pro" or "simulator", defaults to "simulator")

**Example Request:**
```http
GET /api/market-data/BTC-USD/ticker?exchange=simulator
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC-USD",
    "price": { "value": "45250.00", "currency": "USD" },
    "bidPrice": { "value": "45200.00", "currency": "USD" },
    "askPrice": { "value": "45300.00", "currency": "USD" },
    "volume24h": { "value": "1250.50", "currency": "BTC" },
    "change24h": { "value": 2.5 },
    "high24h": { "value": "46000.00", "currency": "USD" },
    "low24h": { "value": "44000.00", "currency": "USD" },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid exchange parameter

---

### GET /api/market-data/:symbol/candles
Get historical candle (OHLCV) data for a trading symbol.

**URL Parameters:**
- `symbol`: Trading symbol (e.g., "BTC-USD")

**Query Parameters:**
- `timeFrame` (optional): Candle timeframe ("1m", "5m", "15m", "1h", "4h", "1d", defaults to "1h")
- `limit` (optional): Number of candles to return (1-200, defaults to 100)

**Example Request:**
```http
GET /api/market-data/BTC-USD/candles?timeFrame=1h&limit=50
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC-USD",
    "timeFrame": "1h",
    "candles": [
      {
        "timestamp": "2024-01-15T09:00:00Z",
        "open": { "value": "44800.00", "currency": "USD" },
        "high": { "value": "45200.00", "currency": "USD" },
        "low": { "value": "44600.00", "currency": "USD" },
        "close": { "value": "45000.00", "currency": "USD" },
        "volume": { "value": "12.50", "currency": "BTC" },
        "timeFrame": "1h"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid timeFrame or limit parameter

---

### GET /api/market-data/symbols
Get list of supported trading symbols.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTC-USD",
      "baseCurrency": "BTC",
      "quoteCurrency": "USD",
      "isActive": true
    },
    {
      "symbol": "ETH-USD",
      "baseCurrency": "ETH",
      "quoteCurrency": "USD",
      "isActive": true
    },
    {
      "symbol": "ADA-USD",
      "baseCurrency": "ADA",
      "quoteCurrency": "USD",
      "isActive": true
    }
  ]
}
```

---

## Health Check Endpoint

### GET /health
Check the API server health status.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## WebSocket API

The API also provides real-time data through WebSocket connections.

### Connection
```javascript
const socket = io('http://localhost:5000', {
  withCredentials: true
});
```

### Events

#### Market Data Subscription
```javascript
// Subscribe to ticker updates
socket.emit('subscribe', {
  type: 'ticker',
  symbol: 'BTC-USD'
});

// Listen for ticker updates
socket.on('ticker_update', (data) => {
  console.log('Ticker update:', data);
});
```

#### Strategy Updates
```javascript
// Subscribe to strategy signals (requires authentication)
socket.emit('subscribe', {
  type: 'strategy_signals',
  strategyId: 'strategy_uuid'
});

// Listen for new signals
socket.on('strategy_signal', (signal) => {
  console.log('New signal:', signal);
});
```

---

## Error Codes

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Access denied (e.g., trying to access another user's data)
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Messages
- "Validation failed": Request data doesn't meet validation requirements
- "Invalid credentials": Login failed due to incorrect email/password
- "User with this email or username already exists": Registration failed due to duplicate user
- "Strategy not found": Strategy doesn't exist or user doesn't have access
- "Token expired": JWT token has expired, refresh required
- "Too many requests": Rate limit exceeded

---

## Data Types and Enums

### Order Side
```typescript
enum OrderSide {
  BUY = 'buy',
  SELL = 'sell'
}
```

### Order Types
```typescript
enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit'
}
```

### Order Status
```typescript
enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}
```

### Trading Strategy Types
```typescript
enum TradingStrategyType {
  SIMPLE_MOVING_AVERAGE = 'SIMPLE_MOVING_AVERAGE',
  RSI_OVERSOLD_OVERBOUGHT = 'RSI_OVERSOLD_OVERBOUGHT',
  MACD_CROSSOVER = 'MACD_CROSSOVER',
  BOLLINGER_BANDS_SQUEEZE = 'BOLLINGER_BANDS_SQUEEZE',
  MEAN_REVERSION = 'MEAN_REVERSION',
  MOMENTUM = 'MOMENTUM',
  CUSTOM = 'CUSTOM'
}
```

### Time Frames
```typescript
enum TimeFrame {
  MINUTE_1 = '1m',
  MINUTE_5 = '5m',
  MINUTE_15 = '15m',
  MINUTE_30 = '30m',
  HOUR_1 = '1h',
  HOUR_4 = '4h',
  HOUR_12 = '12h',
  DAY_1 = '1d',
  WEEK_1 = '1w',
  MONTH_1 = '1M'
}
```

---

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class CryptoBotAPI {
  constructor(baseURL = 'http://localhost:5000', token = null) {
    this.baseURL = baseURL;
    this.token = token;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
  }

  async login(email, password) {
    const response = await this.client.post('/api/auth/login', {
      email,
      password
    });
    this.token = response.data.data.token;
    this.client.defaults.headers['Authorization'] = `Bearer ${this.token}`;
    return response.data;
  }

  async getStrategies(activeOnly = null) {
    const params = activeOnly !== null ? { active: activeOnly } : {};
    const response = await this.client.get('/api/strategies', { params });
    return response.data.data;
  }

  async createStrategy(strategyData) {
    const response = await this.client.post('/api/strategies', strategyData);
    return response.data.data;
  }

  async getTicker(symbol, exchange = 'simulator') {
    const response = await this.client.get(`/api/market-data/${symbol}/ticker`, {
      params: { exchange }
    });
    return response.data.data;
  }
}

// Usage example
const api = new CryptoBotAPI();
await api.login('user@example.com', 'password');
const strategies = await api.getStrategies(true);
console.log('Active strategies:', strategies);
```

### Python
```python
import requests
import json

class CryptoBotAPI:
    def __init__(self, base_url="http://localhost:5000", token=None):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        if token:
            self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def login(self, email, password):
        response = self.session.post(f"{self.base_url}/api/auth/login", json={
            "email": email,
            "password": password
        })
        response.raise_for_status()
        data = response.json()
        self.token = data["data"]["token"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        return data
    
    def get_strategies(self, active_only=None):
        params = {"active": active_only} if active_only is not None else {}
        response = self.session.get(f"{self.base_url}/api/strategies", params=params)
        response.raise_for_status()
        return response.json()["data"]
    
    def create_strategy(self, strategy_data):
        response = self.session.post(f"{self.base_url}/api/strategies", json=strategy_data)
        response.raise_for_status()
        return response.json()["data"]
    
    def get_ticker(self, symbol, exchange="simulator"):
        response = self.session.get(
            f"{self.base_url}/api/market-data/{symbol}/ticker",
            params={"exchange": exchange}
        )
        response.raise_for_status()
        return response.json()["data"]

# Usage example
api = CryptoBotAPI()
api.login("user@example.com", "password")
strategies = api.get_strategies(active_only=True)
print("Active strategies:", strategies)
```

---

## Security Considerations

1. **Authentication**: Always use HTTPS in production
2. **Token Storage**: Store JWT tokens securely (httpOnly cookies recommended)
3. **Rate Limiting**: Respect rate limits to avoid being blocked
4. **Input Validation**: All input is validated server-side
5. **CORS**: Configure CORS properly for your frontend domain
6. **Environment Variables**: Never expose sensitive configuration in client-side code

---

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Authentication and user management
- Trading strategy CRUD operations
- Portfolio management
- Market data access
- WebSocket real-time updates
- Comprehensive error handling and validation

---

This API documentation is automatically updated with each release. For the latest information, please refer to the online documentation or contact the development team.