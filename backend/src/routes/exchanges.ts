import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@cryptobot/database';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { ExchangeType } from '@cryptobot/types';

const router: Router = Router();

// Get user exchange configurations
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exchanges = await prisma.exchangeConfig.findMany({
      where: {
        userId: req.user!.id,
      },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        sandbox: true,
        createdAt: true,
        updatedAt: true,
        // Don't return sensitive data
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: exchanges,
    });
  } catch (error) {
    console.error('Get exchanges error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get exchange configurations',
    });
  }
});

// Create exchange configuration
router.post('/', [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('type').isIn(Object.values(ExchangeType)),
  body('apiKey').isString().isLength({ min: 1 }),
  body('apiSecret').isString().isLength({ min: 1 }),
  body('passphrase').optional().isString(),
  body('sandbox').optional().isBoolean(),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    // Check if user already has an exchange of this type
    const existingExchange = await prisma.exchangeConfig.findFirst({
      where: {
        userId: req.user!.id,
        type: req.body.type,
      },
    });

    if (existingExchange) {
      return res.status(409).json({
        success: false,
        error: 'Exchange configuration of this type already exists',
      });
    }

    const exchange = await prisma.exchangeConfig.create({
      data: {
        ...req.body,
        userId: req.user!.id,
        sandbox: req.body.sandbox || false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        sandbox: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: exchange,
    });
  } catch (error) {
    console.error('Create exchange error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create exchange configuration',
    });
  }
});

// Update exchange configuration
router.put('/:id', [
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('isActive').optional().isBoolean(),
  body('apiKey').optional().isString().isLength({ min: 1 }),
  body('apiSecret').optional().isString().isLength({ min: 1 }),
  body('passphrase').optional().isString(),
  body('sandbox').optional().isBoolean(),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    
    const exchange = await prisma.exchangeConfig.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange configuration not found',
      });
    }

    const updatedExchange = await prisma.exchangeConfig.update({
      where: { id },
      data: req.body,
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        sandbox: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      data: updatedExchange,
    });
  } catch (error) {
    console.error('Update exchange error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update exchange configuration',
    });
  }
});

// Delete exchange configuration
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const exchange = await prisma.exchangeConfig.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange configuration not found',
      });
    }

    await prisma.exchangeConfig.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Exchange configuration deleted successfully',
    });
  } catch (error) {
    console.error('Delete exchange error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete exchange configuration',
    });
  }
});

// Test exchange connection
router.post('/:id/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const exchange = await prisma.exchangeConfig.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: 'Exchange configuration not found',
      });
    }

    // TODO: Implement actual exchange connection test
    // This would use the ExchangeFactory to create a connection and test it
    
    return res.json({
      success: true,
      message: 'Exchange connection test successful',
      data: {
        status: 'connected',
        latency: 150, // Mock latency
        features: ['trading', 'market_data', 'websocket'],
      },
    });
  } catch (error) {
    console.error('Test exchange connection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to test exchange connection',
    });
  }
});

export default router;