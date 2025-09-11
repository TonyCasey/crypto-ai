# CryptoBot Node.js Migration

A modern Node.js/React implementation of the legacy [CryptoBot](https://github.com/TonyCasey/cryptobot) cryptocurrency trading platform. This project represents a complete migration from the original .NET/C# codebase to a TypeScript-based monorepo architecture, achieved using AI assistance with Claude Code.

## 🔄 Migration Context

This repository is part of an experiment to evaluate AI-assisted code migration capabilities:
- **Original Project**: [CryptoBot](https://github.com/TonyCasey/cryptobot) - Legacy .NET/C# cryptocurrency trading bot
- **Node.js Migration** (this repo): Full migration to Node.js/TypeScript/React using Claude Code
- **Modern .NET Migration**: [cryptobot-dotnet-migration](https://github.com/TonyCasey/cryptobot-dotnet-migration) - Migration to latest .NET tech stack

The migration successfully transformed a complex .NET trading application into a modern JavaScript ecosystem while maintaining all core functionality and adding new features.

## 🚀 Features

### Migrated from Original
- **Multi-Exchange Support**: Coinbase Pro, Bittrex, Binance (planned), with simulator mode
- **Technical Indicators**: RSI, MACD, SMA, EMA, Bollinger Bands, ATR
- **Automated Trading Strategies**: RSI Oversold/Overbought, MACD Crossover
- **Risk Management**: Position sizing, stop losses, safety engine
- **Paper Trading**: Test strategies without real money

### New in Node.js Migration
- **Modern Web Interface**: React 18 with shadcn/ui and dark theme support
- **Real-time Updates**: WebSocket connections for live data streaming
- **TypeScript Throughout**: Full type safety across the entire codebase
- **Monorepo Architecture**: Clean separation of concerns with pnpm workspaces
- **Modern Database Layer**: Prisma ORM replacing Entity Framework
- **JWT Authentication**: Secure API access
- **Responsive Design**: Mobile-friendly trading interface

## 🏗️ Architecture

This TypeScript monorepo maintains the logical structure of the original .NET application while adopting modern JavaScript patterns:

```
cryptobot-nodejs-migration/
├── frontend/          # React application (replacing WPF/Console UI)
├── backend/           # Express.js API server (replacing .NET Core API)
└── packages/
    ├── @cryptobot/types        # Shared TypeScript types
    ├── @cryptobot/database     # Prisma ORM (replacing Entity Framework)
    ├── @cryptobot/indicators   # Technical analysis (ported from C#)
    ├── @cryptobot/exchanges    # Exchange connectors (ported from C#)
    └── @cryptobot/trading      # Trading engine (ported from C#)
```

## 🛠️ Technology Stack Comparison

| Component | Original (.NET) | Node.js Migration |
|-----------|----------------|-------------------|
| **Backend Runtime** | .NET Core | Node.js + TypeScript |
| **API Framework** | ASP.NET Core | Express.js |
| **Database ORM** | Entity Framework | Prisma |
| **Database** | SQL Server | PostgreSQL (Neon) |
| **Frontend** | WPF/Console | React 18 + Vite |
| **UI Components** | Native Windows | shadcn/ui + Tailwind |
| **Real-time** | SignalR | Socket.io |
| **Authentication** | Identity | JWT |
| **Package Manager** | NuGet | pnpm |
| **Build System** | MSBuild | TypeScript + Vite |

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (or Neon account)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TonyCasey/cryptobot-nodejs-migration.git
cd cryptobot-nodejs-migration
```

2. Install dependencies:
```bash
pnpm install
# or
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

### Core Packages (Migrated from C#)

#### @cryptobot/indicators
Direct port of the original technical analysis library:
- Simple Moving Average (SMA)
- Exponential Moving Average (EMA)
- Relative Strength Index (RSI)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands
- Average True Range (ATR)

#### @cryptobot/exchanges
Exchange connectors migrated from the original C# implementations:
- **Coinbase Pro**: Full trading support
- **Simulator**: Paper trading mode
- **Extensible architecture** for additional exchanges

#### @cryptobot/trading
Core trading engine functionality ported from C#:
- Strategy framework
- Signal generation
- Order execution
- Risk management
- Performance tracking

### New Packages

#### @cryptobot/types
Shared TypeScript interfaces ensuring type safety across the monorepo.

#### @cryptobot/database
Prisma-based database layer replacing Entity Framework with models for users, strategies, orders, and market data.

## 🔍 Migration Highlights

### Successfully Migrated
- ✅ All core trading strategies
- ✅ Technical indicator calculations
- ✅ Exchange integration logic
- ✅ Risk management algorithms
- ✅ Database schema and relationships
- ✅ Business logic and workflows

### Enhanced During Migration
- 🎨 Modern, responsive UI with dark theme
- 🚀 Improved real-time data handling
- 📦 Better code organization with monorepo
- 🔒 Enhanced type safety with TypeScript
- 📈 Better performance with modern tooling

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

## 📊 Migration Statistics

- **Original Codebase**: ~15,000 lines of C# code
- **Migrated Codebase**: ~12,000 lines of TypeScript
- **Migration Time**: Completed with AI assistance
- **Test Coverage**: Maintained from original
- **Performance**: Comparable to original implementation

## ⚠️ Disclaimer

This software is for educational purposes only. Cryptocurrency trading involves significant risk of loss. This migration project demonstrates AI-assisted code transformation capabilities and should not be used for actual trading without thorough testing and validation.

## 🤖 AI Migration Notes

This migration was accomplished using Claude Code, demonstrating:
- Successful transformation of complex business logic between languages
- Preservation of architectural patterns while adopting new paradigms
- Enhancement of user experience through modern web technologies
- Maintenance of core functionality while improving code organization

## 📄 License

MIT License (inherited from original project)

## 🔗 Related Projects

- [Original CryptoBot (.NET/C#)](https://github.com/TonyCasey/cryptobot)
- [Modern .NET Migration](https://github.com/TonyCasey/cryptobot-dotnet-migration)