import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import { syncTenantData } from '../services/shopify';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticate);

// Get all tenants for current user
router.get('/', async (req, res, next) => {
  try {
    // In a real app, filter by userId
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        storeName: true,
        storeUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            orders: true,
            products: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    next(error);
  }
});

// Get single tenant
router.get('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        storeName: true,
        storeUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            customers: true,
            orders: true,
            products: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new CustomError('Tenant not found', 404);
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
});

// Create tenant (onboard store)
router.post(
  '/',
  [
    body('storeName').trim().notEmpty(),
    body('storeUrl').trim().notEmpty(),
    body('apiKey').trim().notEmpty(),
    body('apiSecret').trim().notEmpty(),
    body('accessToken').optional().trim(),
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new CustomError('Validation failed', 400);
      }

      const { storeName, storeUrl, apiKey, apiSecret, accessToken } = req.body;

      // Normalize store URL using the same function from shopify service
      // Import the function (we'll need to export it or duplicate the logic)
      let normalizedUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Convert admin.shopify.com/store/xxx to xxx.myshopify.com
      if (normalizedUrl.includes('admin.shopify.com/store/')) {
        const match = normalizedUrl.match(/admin\.shopify\.com\/store\/([^\/]+)/);
        if (match) {
          normalizedUrl = `${match[1]}.myshopify.com`;
        }
      }
      
      // Ensure .myshopify.com suffix
      if (!normalizedUrl.endsWith('.myshopify.com')) {
        if (!normalizedUrl.includes('.')) {
          normalizedUrl = `${normalizedUrl}.myshopify.com`;
        } else {
          throw new CustomError('Invalid store URL format. Expected: store-name.myshopify.com', 400);
        }
      }

      // Check if tenant exists
      const existing = await prisma.tenant.findUnique({
        where: { storeUrl: normalizedUrl },
      });

      if (existing) {
        throw new CustomError('Store already registered', 409);
      }

      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          storeName,
          storeUrl: normalizedUrl,
          apiKey,
          apiSecret,
          accessToken: accessToken || null,
        },
        select: {
          id: true,
          storeName: true,
          storeUrl: true,
          isActive: true,
          createdAt: true,
        },
      });

      // Trigger initial sync if access token is provided
      if (accessToken) {
        try {
          await syncTenantData(tenant.id);
        } catch (syncError) {
          console.error('Initial sync failed:', syncError);
          // Don't fail the request if sync fails
        }
      }

      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update tenant
router.put(
  '/:tenantId',
  [
    body('storeName').optional().trim().notEmpty(),
    body('isActive').optional().isBoolean(),
    body('accessToken').optional().trim(),
  ],
  async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new CustomError('Validation failed', 400);
      }

      const { tenantId } = req.params;
      const updates = req.body;

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: updates,
        select: {
          id: true,
          storeName: true,
          storeUrl: true,
          isActive: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Trigger manual sync
router.post('/:tenantId/sync', async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new CustomError('Tenant not found', 404);
    }

    if (!tenant.accessToken) {
      throw new CustomError('Tenant not authenticated with Shopify', 400);
    }

    // Trigger sync (async)
    syncTenantData(tenantId).catch((error) => {
      console.error(`Sync failed for tenant ${tenantId}:`, error);
    });

    res.json({
      success: true,
      message: 'Sync initiated',
    });
  } catch (error) {
    next(error);
  }
});

// Delete tenant
router.delete('/:tenantId', async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new CustomError('Tenant not found', 404);
    }

    // Delete tenant (cascade delete will remove all related data)
    await prisma.tenant.delete({
      where: { id: tenantId },
    });

    res.json({
      success: true,
      message: 'Store deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

