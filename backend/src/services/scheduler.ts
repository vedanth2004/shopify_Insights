import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { syncTenantData } from './shopify';

const prisma = new PrismaClient();

/**
 * Setup scheduled sync jobs
 * Runs daily at 2 AM UTC to sync all active tenants
 */
export const setupScheduler = () => {
  // Daily sync at 2 AM UTC
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled sync for all tenants...');
    
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          isActive: true,
          accessToken: { not: null },
        },
      });

      for (const tenant of tenants) {
        try {
          await syncTenantData(tenant.id);
        } catch (error) {
          console.error(`Failed to sync tenant ${tenant.id}:`, error);
        }
      }

      console.log(`Scheduled sync completed for ${tenants.length} tenants`);
    } catch (error) {
      console.error('Scheduled sync error:', error);
    }
  });

  console.log('✅ Scheduler initialized - Daily sync at 2 AM UTC');
};

/**
 * Manual trigger for testing
 */
export const triggerSync = async (tenantId?: string) => {
  if (tenantId) {
    await syncTenantData(tenantId);
  } else {
    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        accessToken: { not: null },
      },
    });

    for (const tenant of tenants) {
      await syncTenantData(tenant.id);
    }
  }
};

