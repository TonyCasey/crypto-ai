# Integration Tests

This directory contains integration tests for the CryptoBot backend API and trading engine.

## Test Structure

### API Integration Tests (`api.integration.test.ts`)
- **Health Check**: Verifies API health endpoints
- **Authentication**: Tests user registration, login, and JWT authentication
- **Protected Routes**: Tests authenticated endpoints and authorization
- **Trading Strategies**: CRUD operations for trading strategies
- **Market Data**: Market data retrieval and validation
- **Error Handling**: Tests error responses and edge cases

### Trading Engine Integration Tests (`trading.integration.test.ts`)
- **Strategy Execution**: Tests strategy loading and execution
- **Exchange Integration**: Tests exchange connections and market data fetching
- **Strategy Factory**: Tests strategy creation and configuration
- **Signal Generation**: Tests trading signal generation from strategies
- **Order Management**: Tests order creation and database storage
- **Performance Metrics**: Tests profit/loss calculations
- **Error Handling**: Tests graceful error handling

### WebSocket Integration Tests (`websocket.integration.test.ts`)
- **Connection Management**: Tests client connections and authentication
- **Market Data Streaming**: Tests real-time market data subscriptions
- **Trading Updates**: Tests order and strategy update streaming
- **Room Management**: Tests WebSocket room join/leave functionality
- **Error Handling**: Tests connection errors and invalid requests

### Database Integration Tests (`database.integration.test.ts`)
- **Connection**: Tests database connectivity and transactions
- **User Model**: CRUD operations and constraints
- **Strategy Model**: Strategy management and relationships
- **Order Model**: Order creation and performance calculations
- **Complex Queries**: Aggregations and joins

## Test Setup

### Database
Tests use a separate test database created per test run:
- Unique database name generated with random suffix
- Migrations applied automatically
- Database cleaned before each test
- Database dropped after test suite

### Test Utilities
Global test utilities are available in all tests:
- `testUtils.prisma`: Prisma client instance
- `testUtils.cleanDatabase()`: Clean all test data
- `testUtils.createTestUser()`: Create test user with random data
- `testUtils.createTestStrategy(userId)`: Create test strategy

## Running Tests

### Prerequisites
1. PostgreSQL server running locally (default: localhost:5432)
2. Test database user with create/drop permissions
3. Environment variables configured (see `.env.test`)

### Commands

```bash
# Run all integration tests
npm run test:integration

# Run with watch mode
npm run test:integration:watch

# Run with coverage report
npm run test:integration:coverage

# Run specific test file
npx jest --config jest.integration.config.js api.integration.test.ts

# Run all tests (unit + integration)
npm run test:all
```

## Environment Configuration

Create a `.env.test` file in the backend directory:

```env
NODE_ENV=test
DATABASE_URL=postgresql://cryptobot:dev_password_123@localhost:5432/cryptobot_test
JWT_SECRET=test_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
```

## Test Database Setup

### Local PostgreSQL
```bash
# Create test database user
createuser -s cryptobot
psql -c "ALTER USER cryptobot PASSWORD 'dev_password_123';"

# Tests will automatically create/drop databases with unique names
```

### Docker PostgreSQL
```bash
docker run --name postgres-test -e POSTGRES_USER=cryptobot -e POSTGRES_PASSWORD=dev_password_123 -e POSTGRES_DB=cryptobot_test -p 5432:5432 -d postgres:15-alpine
```

## CI/CD Integration

Integration tests are included in the GitHub Actions CI pipeline:
- Run automatically on pull requests
- Require PostgreSQL service container
- Generate coverage reports
- Parallel execution with unit tests

## Debugging Tests

### Verbose Output
```bash
npm run test:integration -- --verbose
```

### Debug Individual Test
```bash
npm run test:integration -- --testNamePattern="should authenticate user"
```

### Database Debugging
- Set `LOG_LEVEL=debug` to see database queries
- Use `--detectOpenHandles` to find connection leaks
- Check database state between tests if needed

## Best Practices

1. **Test Isolation**: Each test cleans up its data
2. **Realistic Data**: Use factories for consistent test data
3. **Error Testing**: Test both success and failure cases
4. **Performance**: Tests should complete within 30 seconds
5. **Coverage**: Aim for >80% coverage of critical paths

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify PostgreSQL is running
- Check DATABASE_URL in environment
- Ensure test user has sufficient permissions

**Timeout Errors**
- Increase Jest timeout (current: 30s)
- Check for hanging database connections
- Verify test cleanup is working

**Test Flakiness**
- Ensure proper test isolation
- Check for race conditions in async operations
- Verify database cleanup between tests

**Memory Leaks**
- Use `--detectOpenHandles` to find leaks
- Ensure proper cleanup in afterEach/afterAll
- Close database connections properly