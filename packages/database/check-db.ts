import { PrismaClient } from '@prisma/client';
import { logger } from '@unerp/shared/logger';

const prisma = new PrismaClient();

async function checkDb() {
  logger.info('--- DIAGNOSTIC START ---');
  try {
    const tenants = await prisma.tenant.findMany();
    logger.info('Tenants:', { tenants: tenants.map(t => ({ id: t.id, name: t.name })) });
    
    const firstTenant = tenants[0];
    if (!firstTenant) {
      logger.error('No tenants found!');
      return;
    }
    
    const tenantId = firstTenant.id;
    const orgs = await prisma.organization.findMany({ where: { tenantId } });
    logger.info('Organizations:', { orgs: orgs.map(o => ({ id: o.id, name: o.name })) });
    
    const firstOrg = orgs[0];
    if (!firstOrg) {
      logger.error('No organizations found!');
      return;
    }
    
    const orgId = firstOrg.id;
    const code = 'TEST-' + Math.floor(Math.random() * 10000);
    logger.info(`Attempting to create account ${code} for tenant ${tenantId} and org ${orgId}...`);
    
    const newAcc = await prisma.account.create({
      data: {
        tenantId,
        orgId,
        code,
        name: 'Test Account ' + code,
        type: 'ASSET',
        balance: 0,
      }
    });
    logger.info('Account created successfully:', { account: newAcc });
  } catch (err: unknown) {
    logger.error('DATABASE ERROR DETECTED:', err);
  } finally {
    await prisma.$disconnect();
    logger.info('--- DIAGNOSTIC END ---');
  }
}

checkDb();
