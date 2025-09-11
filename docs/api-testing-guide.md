# API Testing Guide

This guide provides comprehensive instructions for testing the CryptoBot Node.js Migration API using various tools and methods.

## Overview

The CryptoBot API provides endpoints for:
- User authentication and management
- Trading strategy creation and management
- Portfolio and position tracking
- Real-time and historical market data
- WebSocket connections for live updates

## Testing Tools

### 1. Postman Collection

We provide a complete Postman collection with pre-configured requests for all API endpoints.

#### Import the Collection
1. Open Postman
2. Click "Import" in the top left
3. Select the file: `docs/postman-collection.json`
4. The collection will be imported with all endpoints and test scripts

#### Environment Setup
The collection includes these variables:
- `baseUrl`: API server URL (default: `http://localhost:5000`)
- `authToken`: JWT token (automatically set after login)
- `strategyId`: Strategy ID (set after creating a strategy)

#### Running Tests
1. **Start the API server**: Ensure the backend is running on port 5000
2. **Run authentication tests**: Start with "Register User" or "Login User"
3. **Test other endpoints**: Use the authenticated token for protected routes
4. **Use test scripts**: Each request includes test scripts that verify responses

### 2. cURL Examples

#### Authentication
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Get current user (requires token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Trading Strategies
```bash
# Get all strategies
curl -X GET http://localhost:5000/api/strategies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a new strategy
curl -X POST http://localhost:5000/api/strategies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RSI Test Strategy",
    "type": "RSI_OVERSOLD_OVERBOUGHT",
    "description": "Test RSI strategy",
    "symbols": ["BTC-USD"],
    "timeFrame": "1h",
    "parameters": {
      "rsiPeriod": 14,
      "oversoldThreshold": 30,
      "overboughtThreshold": 70
    },
    "riskParameters": {
      "maxPositionSize": 0.1,
      "stopLossPercent": 5
    }
  }'

# Get strategy performance
curl -X GET http://localhost:5000/api/strategies/STRATEGY_ID/performance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Market Data
```bash
# Get ticker data
curl -X GET "http://localhost:5000/api/market-data/BTC-USD/ticker?exchange=simulator"

# Get candle data
curl -X GET "http://localhost:5000/api/market-data/BTC-USD/candles?timeFrame=1h&limit=50"

# Get supported symbols
curl -X GET http://localhost:5000/api/market-data/symbols
```

### 3. JavaScript/Node.js Testing

#### Setup
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
});

// Add auth token to requests
let authToken = null;
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});
```

#### Test Authentication
```javascript
async function testAuth() {
  try {
    // Register
    const registerResponse = await api.post('/api/auth/register', {
      email: 'test@example.com',
      username: 'testuser',
      password: 'TestPassword123!'
    });
    
    console.log('Registration:', registerResponse.data);
    authToken = registerResponse.data.data.token;
    
    // Get current user
    const userResponse = await api.get('/api/auth/me');
    console.log('Current user:', userResponse.data);
    
  } catch (error) {
    console.error('Auth test failed:', error.response?.data || error.message);
  }
}
```

#### Test Strategy Management
```javascript
async function testStrategies() {
  try {
    // Create strategy
    const createResponse = await api.post('/api/strategies', {
      name: 'Test MACD Strategy',
      type: 'MACD_CROSSOVER',
      description: 'Test strategy for API testing',
      symbols: ['BTC-USD'],
      timeFrame: '4h',
      parameters: {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9
      },
      riskParameters: {
        maxPositionSize: 0.05,
        stopLossPercent: 3
      }
    });
    
    const strategyId = createResponse.data.data.id;
    console.log('Created strategy:', strategyId);
    
    // Get all strategies
    const strategiesResponse = await api.get('/api/strategies');
    console.log('All strategies:', strategiesResponse.data);
    
    // Get performance
    const performanceResponse = await api.get(`/api/strategies/${strategyId}/performance`);
    console.log('Strategy performance:', performanceResponse.data);
    
    // Update strategy
    const updateResponse = await api.put(`/api/strategies/${strategyId}`, {
      isActive: true,
      parameters: {
        fastPeriod: 15,
        slowPeriod: 30,
        signalPeriod: 12
      }
    });
    console.log('Updated strategy:', updateResponse.data);
    
  } catch (error) {
    console.error('Strategy test failed:', error.response?.data || error.message);
  }
}
```

### 4. Python Testing

#### Setup
```python
import requests
import json

class APITester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
    
    def set_auth_token(self, token):
        self.auth_token = token
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_auth(self):
        # Register
        register_data = {
            "email": "python_test@example.com",
            "username": "pythonuser",
            "password": "TestPassword123!"
        }
        
        response = self.session.post(f"{self.base_url}/api/auth/register", json=register_data)
        
        if response.status_code == 201:
            data = response.json()
            self.set_auth_token(data["data"]["token"])
            print("Registration successful")
            return True
        else:
            print(f"Registration failed: {response.text}")
            return False
    
    def test_strategies(self):
        strategy_data = {
            "name": "Python Test Strategy",
            "type": "RSI_OVERSOLD_OVERBOUGHT",
            "description": "Strategy created via Python test",
            "symbols": ["ETH-USD"],
            "timeFrame": "1h",
            "parameters": {
                "rsiPeriod": 14,
                "oversoldThreshold": 30,
                "overboughtThreshold": 70
            },
            "riskParameters": {
                "maxPositionSize": 0.1,
                "stopLossPercent": 5
            }
        }
        
        # Create strategy
        response = self.session.post(f"{self.base_url}/api/strategies", json=strategy_data)
        
        if response.status_code == 201:
            strategy = response.json()["data"]
            print(f"Created strategy: {strategy['id']}")
            
            # Get strategies
            response = self.session.get(f"{self.base_url}/api/strategies")
            if response.status_code == 200:
                strategies = response.json()["data"]
                print(f"Total strategies: {len(strategies)}")
            
            return strategy["id"]
        else:
            print(f"Strategy creation failed: {response.text}")
            return None

# Usage
tester = APITester()
if tester.test_auth():
    tester.test_strategies()
```

## WebSocket Testing

### JavaScript WebSocket Client
```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  withCredentials: true
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Subscribe to ticker updates
  socket.emit('subscribe', {
    type: 'ticker',
    symbol: 'BTC-USD'
  });
});

socket.on('ticker_update', (data) => {
  console.log('Ticker update:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

### Browser WebSocket Testing
```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test</title>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <div id="output"></div>
    <script>
        const socket = io();
        const output = document.getElementById('output');
        
        socket.on('connect', () => {
            output.innerHTML += '<p>Connected to server</p>';
            
            // Subscribe to ticker updates
            socket.emit('subscribe', {
                type: 'ticker',
                symbol: 'BTC-USD'
            });
        });
        
        socket.on('ticker_update', (data) => {
            output.innerHTML += `<p>Ticker: ${JSON.stringify(data)}</p>`;
        });
    </script>
</body>
</html>
```

## Automated Testing with Jest

### Setup Test Environment
```javascript
// tests/api/setup.js
const axios = require('axios');

global.api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
});

global.authToken = null;

global.setAuthToken = (token) => {
  global.authToken = token;
  global.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

beforeAll(async () => {
  // Wait for server to be ready
  let retries = 5;
  while (retries > 0) {
    try {
      await global.api.get('/health');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
});
```

### Authentication Tests
```javascript
// tests/api/auth.test.js
describe('Authentication API', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'TestPassword123!'
  };

  test('should register a new user', async () => {
    const response = await api.post('/api/auth/register', testUser);
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.token).toBeDefined();
    expect(response.data.data.user.email).toBe(testUser.email);
    
    setAuthToken(response.data.data.token);
  });

  test('should login with valid credentials', async () => {
    const response = await api.post('/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.token).toBeDefined();
  });

  test('should get current user info', async () => {
    const response = await api.get('/api/auth/me');
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.email).toBe(testUser.email);
  });

  test('should fail with invalid credentials', async () => {
    try {
      await api.post('/api/auth/login', {
        email: testUser.email,
        password: 'wrongpassword'
      });
    } catch (error) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.success).toBe(false);
    }
  });
});
```

### Strategy Tests
```javascript
// tests/api/strategies.test.js
describe('Strategies API', () => {
  let strategyId;

  test('should create a new strategy', async () => {
    const strategyData = {
      name: 'Test RSI Strategy',
      type: 'RSI_OVERSOLD_OVERBOUGHT',
      description: 'Test strategy for API testing',
      symbols: ['BTC-USD'],
      timeFrame: '1h',
      parameters: {
        rsiPeriod: 14,
        oversoldThreshold: 30,
        overboughtThreshold: 70
      },
      riskParameters: {
        maxPositionSize: 0.1,
        stopLossPercent: 5
      }
    };

    const response = await api.post('/api/strategies', strategyData);
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(strategyData.name);
    expect(response.data.data.type).toBe(strategyData.type);
    
    strategyId = response.data.data.id;
  });

  test('should get all strategies', async () => {
    const response = await api.get('/api/strategies');
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
  });

  test('should update strategy', async () => {
    const updateData = {
      name: 'Updated Test Strategy',
      isActive: true
    };

    const response = await api.put(`/api/strategies/${strategyId}`, updateData);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
    expect(response.data.data.isActive).toBe(true);
  });

  test('should get strategy performance', async () => {
    const response = await api.get(`/api/strategies/${strategyId}/performance`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.totalSignals).toBeDefined();
    expect(response.data.data.executedSignals).toBeDefined();
    expect(response.data.data.successRate).toBeDefined();
  });

  test('should delete strategy', async () => {
    const response = await api.delete(`/api/strategies/${strategyId}`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify deletion
    try {
      await api.get(`/api/strategies/${strategyId}/performance`);
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });
});
```

## Performance Testing

### Load Testing with Artillery
Create `artillery-config.yml`:
```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Load test
  payload:
    path: 'test-data.csv'
    fields:
      - email
      - password

scenarios:
  - name: 'Authentication flow'
    weight: 50
    flow:
      - post:
          url: '/api/auth/register'
          json:
            email: '{{ email }}'
            username: 'user{{ $randomInt(1, 10000) }}'
            password: '{{ password }}'
          capture:
            json: '$.data.token'
            as: 'token'
      - get:
          url: '/api/auth/me'
          headers:
            Authorization: 'Bearer {{ token }}'
  
  - name: 'Market data access'
    weight: 30
    flow:
      - get:
          url: '/api/market-data/BTC-USD/ticker'
      - get:
          url: '/api/market-data/BTC-USD/candles'
          qs:
            timeFrame: '1h'
            limit: '50'

  - name: 'Strategy management'
    weight: 20
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ email }}'
            password: '{{ password }}'
          capture:
            json: '$.data.token'
            as: 'token'
      - get:
          url: '/api/strategies'
          headers:
            Authorization: 'Bearer {{ token }}'
```

Run the load test:
```bash
npm install -g artillery
artillery run artillery-config.yml
```

## Testing Checklist

### Basic Functionality
- [ ] Health check endpoint responds
- [ ] User registration works
- [ ] User login works
- [ ] JWT token authentication works
- [ ] Token refresh works
- [ ] User logout works

### Strategy Management
- [ ] Create strategy with valid data
- [ ] Get user strategies
- [ ] Update strategy
- [ ] Delete strategy
- [ ] Get strategy performance
- [ ] Filter strategies by active status

### Portfolio Management
- [ ] Get portfolio information
- [ ] Get trading positions
- [ ] Get portfolio history

### Market Data
- [ ] Get ticker data
- [ ] Get candle data with different timeframes
- [ ] Get supported symbols
- [ ] Query parameters work correctly

### Error Handling
- [ ] Invalid credentials return 401
- [ ] Missing auth token returns 401
- [ ] Validation errors return 400
- [ ] Non-existent resources return 404
- [ ] Rate limiting works (429)

### WebSocket
- [ ] Connection establishes successfully
- [ ] Subscription to ticker updates works
- [ ] Real-time data is received
- [ ] Disconnection is handled gracefully

### Performance
- [ ] Response times are acceptable (< 500ms for most endpoints)
- [ ] API can handle concurrent requests
- [ ] Memory usage is stable under load
- [ ] Rate limiting prevents abuse

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the API server is running on the correct port
   - Check if the URL in your tests matches the server configuration

2. **Authentication Failures**
   - Verify JWT token is being sent in the Authorization header
   - Check token expiration (default 7 days)
   - Ensure user exists and is active

3. **CORS Issues**
   - Configure CORS settings in the server for your test environment
   - Use the correct origin in requests

4. **Rate Limiting**
   - If hitting rate limits, wait or use different IP addresses
   - Adjust rate limit settings for testing environment

5. **Database Issues**
   - Ensure database is running and accessible
   - Check database connection configuration
   - Verify test data cleanup between test runs

### Debug Tips

1. **Enable Debug Logging**
   ```bash
   DEBUG=* npm start
   ```

2. **Check Server Logs**
   - Monitor server console output during tests
   - Look for error messages and stack traces

3. **Use Network Inspector**
   - In browser dev tools, check Network tab
   - Verify request/response headers and payloads

4. **Test with Minimal Requests**
   - Start with simple GET requests
   - Gradually add complexity (auth, POST data, etc.)

## Continuous Integration

### GitHub Actions Example
```yaml
name: API Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Setup database
      run: npm run db:migrate
      
    - name: Start API server
      run: npm start &
      
    - name: Wait for server
      run: sleep 10
      
    - name: Run API tests
      run: npm run test:api
      
    - name: Upload test results
      uses: actions/upload-artifact@v2
      if: always()
      with:
        name: api-test-results
        path: test-results/
```

This comprehensive testing guide covers all aspects of API testing for the CryptoBot Node.js Migration project. Use it to ensure your API is functioning correctly across all scenarios.