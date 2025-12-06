import express from 'express';
import { PrismaClient } from '@prisma/client';
import { syncTenantData } from '../services/shopify';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Shopify webhook handler
router.post('/shopify', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    // In production, verify webhook signature
    const topic = req.headers['x-shopify-topic'] as string;
    const shop = req.headers['x-shopify-shop-domain'] as string;

    if (!shop || !topic) {
      throw new CustomError('Invalid webhook headers', 400);
    }

    // Find tenant by store URL
    const tenant = await prisma.tenant.findUnique({
      where: { storeUrl: shop.replace('.myshopify.com', '') },
    });

    if (!tenant) {
      console.warn(`Webhook received for unknown tenant: ${shop}`);
      return res.status(200).json({ received: true });
    }

    // Handle different webhook topics
    switch (topic) {
      case 'customers/create':
      case 'customers/update':
      case 'orders/create':
      case 'orders/updated':
      case 'products/create':
      case 'products/update':
        // Trigger sync for the affected resource
        console.log(`Webhook received: ${topic} for tenant ${tenant.id}`);
        syncTenantData(tenant.id).catch((error) => {
          console.error(`Webhook sync failed for tenant ${tenant.id}:`, error);
        });
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
});

// Custom event webhook (for cart abandoned, checkout started, etc.)
router.post('/events', async (req, res, next) => {
  try {
    const { tenantId, eventType, customerEmail, productId, orderId, metadata } = req.body;

    if (!tenantId || !eventType) {
      throw new CustomError('tenantId and eventType are required', 400);
    }

    const event = await prisma.event.create({
      data: {
        tenantId,
        eventType,
        customerEmail,
        productId,
        orderId,
        metadata: metadata || {},
      },
    });

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

