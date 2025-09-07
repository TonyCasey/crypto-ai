# CryptoBot - AI Cryptocurrency Trading Platform

A comprehensive Node.js monorepo application for automated cryptocurrency trading powered by technical analysis and AI-driven strategies.

## 🚀 Features

- **Multi-Exchange Support**: Coinbase Pro, Bittrex, Binance (future), with simulator mode
- **Advanced Technical Indicators**: RSI, MACD, SMA, EMA, Bollinger Bands, ATR
- **Automated Trading Strategies**: RSI Oversold/Overbought, MACD Crossover, and more
- **Real-time Market Data**: WebSocket connections for live price feeds
- **Risk Management**: Comprehensive safety engine with position sizing and stop losses
- **Paper Trading**: Test strategies without real money
- **Modern Web Interface**: React dashboard with real-time updates
- **Database Integration**: Prisma ORM with Neon PostgreSQL
- **Deployment Ready**: Configured for Vercel (frontend) and Heroku (backend)

## 🏗️ Architecture

This is a TypeScript monorepo with the following structure:

```
crypto-ai/
├── frontend/          # React application (Vercel deployment)
├── backend/           # Express.js API server (Heroku deployment)
└── packages/
    ├── @cryptobot/types        # Shared TypeScript types
    ├── @cryptobot/database     # Prisma database layer
    ├── @cryptobot/indicators   # Technical analysis indicators
    ├── @cryptobot/exchanges    # Exchange connectors
    └── @cryptobot/trading      # Trading engine and strategies
```

## 🛠️ Technology Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **Socket.io** for real-time communication
- **Prisma** ORM with **PostgreSQL** (Neon)
- **JWT** authentication
- **Axios** for HTTP requests

### Frontend
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Socket.io Client** for real-time updates

### Trading Engine
- **Modular Strategy System**
- **Technical Indicator Library**
- **Multi-Exchange Architecture**
- **Risk Management Engine**
- **Backtesting Framework**

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (or Neon account)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TonyCasey/crypto-ai.git
cd crypto-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

4. Set up the database:
```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

5. Build packages:
```bash
npm run build:packages
```

### Development

Start all services in development mode:
```bash
npm run dev
```

Or start services individually:
```bash
# Backend (port 5000)
npm run dev:backend

# Frontend (port 3000)
npm run dev:frontend
```

## 📦 Package Details

### @cryptobot/types
Shared TypeScript interfaces and types used across all packages.

### @cryptobot/database
Prisma-based database layer with models for users, strategies, orders, and market data.

### @cryptobot/indicators
Technical analysis indicators implemented in TypeScript:
- Simple Moving Average (SMA)
- Exponential Moving Average (EMA)
- Relative Strength Index (RSI)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Average True Range (ATR)

### @cryptobot/exchanges
Exchange connector implementations:
- **Coinbase Pro**: Full trading support
- **Simulator**: Paper trading mode
- **Extensible architecture** for additional exchanges

### @cryptobot/trading
Core trading engine with:
- Strategy framework
- Signal generation
- Order execution
- Risk management
- Performance tracking

## 🚀 Deployment

### Backend (Heroku)
```bash
# Create Heroku app
heroku create your-cryptobot-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:essential-0

# Deploy
git push heroku main
```

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build:frontend`
3. Set output directory: `frontend/dist`

### Automated Deployment
GitHub Actions workflow is configured for CI/CD.

## ⚠️ Disclaimer

This software is for educational purposes only. Cryptocurrency trading involves significant risk of loss.

## 📄 License

MIT License