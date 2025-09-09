import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Create sample trading pairs
  const btcusd = await prisma.tradingPair.upsert({
    where: { symbol: 'BTC-USD' },
    update: {},
    create: {
      symbol: 'BTC-USD',
      baseCurrency: 'BTC',
      quoteCurrency: 'USD',
      minOrderSize: new Decimal('0.001'),
      maxOrderSize: new Decimal('1000'),
      priceIncrement: new Decimal('0.01'),
      sizeIncrement: new Decimal('0.00000001'),
      isActive: true,
    },
  });

  const ethusd = await prisma.tradingPair.upsert({
    where: { symbol: 'ETH-USD' },
    update: {},
    create: {
      symbol: 'ETH-USD',
      baseCurrency: 'ETH',
      quoteCurrency: 'USD',
      minOrderSize: new Decimal('0.01'),
      maxOrderSize: new Decimal('1000'),
      priceIncrement: new Decimal('0.01'),
      sizeIncrement: new Decimal('0.00000001'),
      isActive: true,
    },
  });

  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@cryptobot.com' },
    update: {},
    create: {
      email: 'demo@cryptobot.com',
      username: 'demo',
      password: 'hashed_password_here', // In real app, this would be properly hashed
      isActive: true,
    },
  });

  // Create sample exchange config
  const exchangeConfig = await prisma.exchangeConfig.create({
    data: {
      name: 'Coinbase Pro Demo',
      type: 'COINBASE_PRO',
      isActive: true,
      apiKey: 'demo_api_key',
      apiSecret: 'demo_api_secret',
      passphrase: 'demo_passphrase',
      sandbox: true,
      userId: user.id,
    },
  });

  // Create sample trading strategy
  const strategy = await prisma.tradingStrategy.create({
    data: {
      name: 'RSI Oversold/Overbought Strategy',
      type: 'RSI_OVERSOLD_OVERBOUGHT',
      description: 'Buy when RSI is oversold (<30), sell when overbought (>70)',
      isActive: true,
      symbols: ['BTC-USD', 'ETH-USD'],
      timeFrame: '1h',
      parameters: {
        rsiPeriod: 14,
        oversold: 30,
        overbought: 70,
      },
      riskParameters: {
        maxPositionSize: 0.1,
        stopLossPercentage: 0.05,
        takeProfitPercentage: 0.1,
        maxDailyLoss: 1000,
      },
      userId: user.id,
    },
  });

  // Create sample portfolio
  const portfolio = await prisma.portfolio.create({
    data: {
      userId: user.id,
      totalValue: new Decimal('10000'),
      availableBalance: new Decimal('8000'),
      lockedBalance: new Decimal('2000'),
      unrealizedPnL: new Decimal('500'),
      realizedPnL: new Decimal('250'),
      dailyPnL: new Decimal('100'),
      totalReturn: new Decimal('750'),
      balances: {
        create: [
          {
            currency: 'USD',
            total: new Decimal('8000'),
            available: new Decimal('6000'),
            locked: new Decimal('2000'),
          },
          {
            currency: 'BTC',
            total: new Decimal('0.5'),
            available: new Decimal('0.3'),
            locked: new Decimal('0.2'),
          },
          {
            currency: 'ETH',
            total: new Decimal('10'),
            available: new Decimal('8'),
            locked: new Decimal('2'),
          },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
  console.log({ user, exchangeConfig, strategy, portfolio, btcusd, ethusd });
}

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });