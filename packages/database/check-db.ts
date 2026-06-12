import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
  console.log('--- DIAGNOSTIC START ---');
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', tenants.map(t => ({ id: t.id, name: t.name })));
    
    if (tenants.length === 0) {
      console.error('No tenants found!');
      return;
    }
    
    const tenantId = tenants[0].id;
    const orgs = await prisma.organization.findMany({ where: { tenantId } });
    console.log('Organizations:', orgs.map(o => ({ id: o.id, name: o.name })));
    
    if (orgs.length === 0) {
      console.error('No organizations found!');
      return;
    }
    
    const orgId = orgs[0].id;
    const code = 'TEST-' + Math.floor(Math.random() * 10000);
    console.log(`Attempting to create account ${code} for tenant ${tenantId} and org ${orgId}...`);
    
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
    console.log('Account created successfully:', newAcc);
  } catch (err: any) {
    console.error('DATABASE ERROR DETECTED:', err);
  } finally {
    await prisma.$disconnect();
    console.log('--- DIAGNOSTIC END ---');
  }
}

checkDb();
