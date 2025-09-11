import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

// Test database configuration
const generateTestDatabaseUrl = () => {
  const testId = randomBytes(8).toString('hex');
  const baseUrl = process.env.DATABASE_URL || 'postgresql://cryptobot:dev_password_123@localhost:5432';
  return `${baseUrl}/test_${testId}`;
};

export const TEST_DATABASE_URL = generateTestDatabaseUrl();

let prisma: PrismaClient;

beforeAll(async () => {
  // Set test database URL
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.NODE_ENV = 'test';
  
  // Create test database
  try {
    execSync(`createdb ${TEST_DATABASE_URL.split('/').pop()}`, { stdio: 'ignore' });
  } catch (error) {
    // Database might already exist or createdb might not be available
    console.warn('Could not create test database, assuming it exists or using fallback');
  }
  
  // Initialize Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
  });
  
  // Run migrations
  try {
    execSync('npx prisma migrate deploy', { 
      stdio: 'ignore',
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
    });
  } catch (error) {
    console.warn('Could not run migrations, assuming database is ready');
  }
  
  // Connect to database
  await prisma.$connect();
  
  // Clean database before tests
  await cleanDatabase();
});

afterAll(async () => {
  if (prisma) {
    await cleanDatabase();
    await prisma.$disconnect();
  }
  
  // Clean up test database
  try {
    execSync(`dropdb ${TEST_DATABASE_URL.split('/').pop()}`, { stdio: 'ignore' });
  } catch (error) {
    // Ignore cleanup errors
  }
});

beforeEach(async () => {
  // Clean database before each test
  await cleanDatabase();
});

async function cleanDatabase() {
  if (!prisma) return;
  
  try {
    // Delete in reverse order of dependencies
    await prisma.order.deleteMany();
    await prisma.strategy.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    // Ignore cleanup errors during setup
    console.warn('Database cleanup warning:', error.message);
  }
}

export { prisma };

// Global test utilities
declare global {
  var testUtils: {
    prisma: PrismaClient;
    cleanDatabase: () => Promise<void>;
    createTestUser: () => Promise<any>;
    createTestStrategy: (userId: string) => Promise<any>;
  };
}

global.testUtils = {
  prisma,
  cleanDatabase,
  createTestUser: async () => {
    return await prisma.user.create({
      data: {
        email: `test-${randomBytes(4).toString('hex')}@example.com`,
        username: `testuser-${randomBytes(4).toString('hex')}`,
        passwordHash: 'test-hash',
        isEmailVerified: true,
      },
    });
  },
  createTestStrategy: async (userId: string) => {
    return await prisma.strategy.create({
      data: {
        name: `Test Strategy ${randomBytes(4).toString('hex')}`,
        type: 'RSI_OVERSOLD',
        userId,
        isActive: false,
        parameters: JSON.stringify({
          rsiPeriod: 14,
          oversoldThreshold: 30,
          overboughtThreshold: 70,
        }),
      },
    });
  },
};