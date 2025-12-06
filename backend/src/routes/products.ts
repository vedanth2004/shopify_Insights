import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenantAuth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get products for a tenant
router.get('/tenant/:tenantId', requireTenant, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId },
        skip,
        take: limitNum,
        orderBy: { totalRevenue: 'desc' },
      }),
      prisma.product.count({ where: { tenantId } }),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

