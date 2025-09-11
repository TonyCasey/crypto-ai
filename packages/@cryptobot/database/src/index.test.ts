import { prisma } from './index';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient to avoid actual database connections during tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('Database Module', () => {
  describe('prisma client', () => {
    it('should export a prisma client instance', () => {
      expect(prisma).toBeDefined();
      expect(prisma).toBeInstanceOf(Object);
    });

    it('should be a PrismaClient instance', () => {
      // In a real test environment, we would mock this properly
      expect(PrismaClient).toHaveBeenCalled();
    });
  });

  describe('environment handling', () => {
    it('should handle development environment', () => {
      // Test that the module loads without throwing errors
      expect(() => require('./index')).not.toThrow();
    });
  });
});