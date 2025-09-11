# API Changelog

All notable changes to the CryptoBot Node.js Migration API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Additional trading strategy types (Bollinger Bands, Momentum)
- WebSocket authentication for user-specific data
- Real-time portfolio updates via WebSocket
- Advanced risk management parameters
- Strategy backtesting endpoints
- Order execution endpoints
- Enhanced market data with technical indicators

### Changed
- Improved error handling with more specific error codes
- Enhanced validation for strategy parameters
- Optimized database queries for better performance

### Security
- Additional rate limiting for sensitive endpoints
- Enhanced JWT token validation
- Input sanitization improvements

## [1.0.0] - 2024-01-15

### Added

#### Authentication & User Management
- `POST /api/auth/register` - User registration with email/username validation
- `POST /api/auth/login` - User authentication with JWT tokens
- `POST /api/auth/logout` - User logout with session cleanup
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/refresh` - JWT token refresh endpoint

#### Trading Strategy Management
- `GET /api/strategies` - Retrieve user's trading strategies with filtering
- `POST /api/strategies` - Create new trading strategies
- `PUT /api/strategies/:id` - Update existing strategies
- `DELETE /api/strategies/:id` - Delete strategies
- `GET /api/strategies/:id/performance` - Get strategy performance metrics

#### Portfolio Management
- `GET /api/portfolio` - Get user portfolio with balances
- `GET /api/portfolio/positions` - Get current trading positions
- `GET /api/portfolio/history` - Get portfolio value history

#### Market Data
- `GET /api/market-data/:symbol/ticker` - Real-time ticker data
- `GET /api/market-data/:symbol/candles` - Historical OHLCV data
- `GET /api/market-data/symbols` - List of supported trading symbols

#### System
- `GET /health` - API health check endpoint

#### WebSocket Support
- Real-time ticker data subscription
- Strategy signal notifications
- Portfolio update notifications

### Security Features
- JWT-based authentication with 7-day expiration
- Rate limiting (1000 requests per 15 minutes per IP)
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Secure password hashing with bcrypt
- httpOnly cookies for token storage

### Data Models

#### User
- Unique email and username validation
- Password strength requirements
- Account creation and update timestamps
- Active/inactive user status

#### Trading Strategy
- Multiple strategy types (RSI, MACD, SMA, etc.)
- Flexible parameter configuration
- Risk management settings
- Active/inactive status toggle
- Performance tracking

#### Portfolio
- Multi-currency balance tracking
- Position management
- Historical value tracking
- Automatic demo account creation ($10,000 USD)

#### Market Data
- Real-time price data
- Historical candle data
- Multiple timeframe support (1m to 1M)
- Exchange integration (Simulator mode)

### Validation Rules

#### User Registration
- Email: Valid email format, normalized
- Username: 3-30 characters, trimmed
- Password: Minimum 8 characters, must contain lowercase, uppercase, and digit

#### Strategy Creation
- Name: 1-100 characters, required
- Type: Must be valid TradingStrategyType enum
- Symbols: Array of valid trading pairs
- TimeFrame: Valid timeframe string
- Parameters: Object with strategy-specific settings
- Risk Parameters: Object with risk management settings

#### API Responses
- Consistent success/error response format
- Detailed validation error messages
- Appropriate HTTP status codes
- JSON content type

### Performance Optimizations
- Database query optimization
- Response compression (gzip)
- Request/response size limits (10MB)
- Connection pooling
- Efficient pagination for large datasets

### Error Handling
- Comprehensive error catching and logging
- User-friendly error messages
- Proper HTTP status codes
- Validation error details
- Graceful degradation

### Development Features
- Comprehensive API documentation
- OpenAPI (Swagger) specification
- Postman collection for testing
- Jest integration tests
- Playwright end-to-end tests
- TypeScript type safety
- ESLint and Prettier code formatting

### Infrastructure
- Express.js web framework
- PostgreSQL database with Prisma ORM
- Socket.IO for WebSocket connections
- Docker containerization
- Environment-based configuration
- Logging with Morgan
- Security headers with Helmet
- Session management

## Migration from Legacy .NET API

### Breaking Changes from v0.x (Legacy .NET)
- **Authentication**: Moved from ASP.NET Identity to JWT tokens
- **Database**: Migrated from SQL Server to PostgreSQL
- **Endpoints**: Complete URL structure redesign
- **Response Format**: Standardized JSON response format
- **WebSocket**: New Socket.IO implementation replacing SignalR

### Data Migration
- User accounts migrated with password reset requirement
- Trading strategies converted to new schema
- Portfolio data migrated with currency normalization
- Historical data preserved with new indexing

### New Features Not in Legacy
- Real-time WebSocket updates
- Enhanced strategy types
- Improved risk management
- Better error handling
- Comprehensive API testing
- Interactive documentation
- Rate limiting protection

### Deprecated Features
- Legacy authentication tokens (expired 2024-01-01)
- Old WebSocket protocol (replaced with Socket.IO)
- XML response format (JSON only)

## Version History Summary

| Version | Date | Major Features |
|---------|------|----------------|
| 1.0.0 | 2024-01-15 | Initial Node.js API release |
| 0.9.0 | 2023-12-01 | Legacy .NET API final version |
| 0.8.0 | 2023-11-01 | Enhanced strategy management |
| 0.7.0 | 2023-10-01 | WebSocket implementation |
| 0.6.0 | 2023-09-01 | Portfolio tracking |
| 0.5.0 | 2023-08-01 | Market data integration |

## Compatibility Notes

### Supported Clients
- Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Node.js 18+
- Python 3.8+ (with requests library)
- cURL 7.0+
- Postman 9.0+

### Deprecated Client Support
- Internet Explorer (all versions)
- Legacy HTTP/1.0 clients
- Clients without SSL/TLS support

## Migration Guide for Existing Integrations

### From Legacy .NET API

#### Authentication Changes
```javascript
// Old (.NET API)
POST /auth/login
{
  "Email": "user@example.com",
  "Password": "password"
}

// New (Node.js API)
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

#### Response Format Changes
```javascript
// Old (.NET API)
{
  "Success": true,
  "Data": {...},
  "Message": "Success"
}

// New (Node.js API)
{
  "success": true,
  "data": {...}
}
```

#### Strategy Management Changes
```javascript
// Old (.NET API)
POST /api/v1/strategies/create
{
  "StrategyName": "Test",
  "StrategyType": "RSI",
  "Parameters": {...}
}

// New (Node.js API)
POST /api/strategies
{
  "name": "Test",
  "type": "RSI_OVERSOLD_OVERBOUGHT",
  "parameters": {...},
  "riskParameters": {...}
}
```

### Required Code Updates

1. **Update base URLs** from legacy endpoints to new structure
2. **Modify authentication** to use JWT instead of session cookies
3. **Update WebSocket connections** to use Socket.IO protocol
4. **Adjust response parsing** for new JSON structure
5. **Implement new error handling** for standardized error format

## Support and Feedback

### Getting Help
- API Documentation: `/docs/api-reference.md`
- Testing Guide: `/docs/api-testing-guide.md`
- GitHub Issues: Create issues for bugs or feature requests
- Email Support: api-support@cryptobot.com

### Reporting Issues
When reporting API issues, please include:
- API version (found in `/health` endpoint)
- Request method and URL
- Request headers and body
- Expected vs actual response
- Server logs (if available)

### Feature Requests
- Submit feature requests as GitHub issues
- Include use case and business justification
- Provide examples of desired API usage
- Consider backward compatibility impact

---

*This changelog is updated with each API release. For the most current information, please check the repository or contact the development team.*