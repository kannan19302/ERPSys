import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-hashed password for 'admin123' using bcrypt (verified with bcryptjs@2.x)
// To regenerate: node -e "require('bcryptjs').hash('admin123',10).then(console.log)"
const DEFAULT_PASSWORD_HASH = '$2a$10$QNgJRZXhmjzcu16TQaaR4.EfRNWCFvCxE0Jvqvy/IKIgwq.BgSMJG';

const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full access to all features',
    permissions: ['*'],
    isSystem: true,
  },
  ADMIN: {
    name: 'Admin',
    description: 'Administrative access with user management',
    permissions: ['admin.*', 'finance.*', 'hr.*', 'crm.*', 'inventory.*'],
    isSystem: true,
  },
  FINANCE_MANAGER: {
    name: 'Finance Manager',
    description: 'Full access to finance module',
    permissions: ['finance.*', 'sales.sales-order.read'],
    isSystem: true,
  },
  HR_MANAGER: {
    name: 'HR Manager',
    description: 'Full access to HR module',
    permissions: ['hr.*'],
    isSystem: true,
  },
  SALES_REP: {
    name: 'Sales Representative',
    description: 'Access to CRM and sales features',
    permissions: [
      'crm.*',
      'sales.quotation.*',
      'sales.sales-order.create',
      'sales.sales-order.read',
      'inventory.product.read',
    ],
    isSystem: true,
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access to all modules',
    permissions: [
      'finance.invoice.read',
      'finance.report.read',
      'hr.employee.read',
      'crm.contact.read',
      'inventory.product.read',
    ],
    isSystem: true,
  },
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'system' },
    update: {},
    create: {
      name: 'System Tenant',
      slug: 'system',
      plan: 'enterprise',
      status: 'ACTIVE',
      settings: {},
    },
  });
  console.log(`Tenant created/verified: ${tenant.name} (${tenant.id})`);

  // 2. Create Default Roles
  const rolesMap: Record<string, string> = {};
  for (const [key, role] of Object.entries(DEFAULT_ROLES)) {
    const dbRole = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: role.name,
        },
      },
      update: {
        permissions: JSON.stringify(role.permissions),
      },
      create: {
        tenantId: tenant.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: JSON.stringify(role.permissions),
      },
    });
    rolesMap[key] = dbRole.id;
  }
  console.log('System roles upserted.');

  // 3. Create Super Admin User
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: 'admin@unerp.dev',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@unerp.dev',
      passwordHash: DEFAULT_PASSWORD_HASH,
      firstName: 'System',
      lastName: 'Administrator',
      status: 'ACTIVE',
    },
  });
  console.log(`User verified: ${adminUser.email}`);

  // Assign Super Admin Role to User
  const superAdminRoleId = rolesMap['SUPER_ADMIN'];
  if (superAdminRoleId) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRoleId,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRoleId,
      },
    });
  }

  // 4. Create Default Organization
  let org = await prisma.organization.findFirst({
    where: { tenantId: tenant.id, name: 'Acme Corp' },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        tenantId: tenant.id,
        name: 'Acme Corp',
        legalName: 'Acme Corporation Ltd.',
        currency: 'USD',
        timezone: 'UTC',
        settings: {},
      },
    });
    console.log(`Organization created: ${org.name}`);
  }

  // 5. Create Default Departments
  const departments = ['Finance', 'Human Resources', 'Sales & CRM', 'Warehouse & Inventory'];
  const departmentMap: Record<string, string> = {};
  for (const name of departments) {
    const code = name.toUpperCase().replace(/ & /g, '_').replace(/ /g, '_');
    let dept = await prisma.department.findFirst({
      where: { tenantId: tenant.id, code },
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          name,
          code,
        },
      });
    }
    departmentMap[code] = dept.id;
  }
  console.log('Departments created/verified.');

  // 6. Create Default Employees (HR Module)
  const hrDeptId = departmentMap['HUMAN_RESOURCES'];
  const financeDeptId = departmentMap['FINANCE'];
  if (hrDeptId && financeDeptId) {
    const employeeData = [
      { code: 'EMP-001', firstName: 'John', lastName: 'Miller', designation: 'HR Director', email: 'john.miller@company.com', deptId: hrDeptId },
      { code: 'EMP-002', firstName: 'Sarah', lastName: 'Connor', designation: 'Finance Controller', email: 'sarah.connor@company.com', deptId: financeDeptId },
    ];
    for (const emp of employeeData) {
      const existing = await prisma.employee.findFirst({
        where: { tenantId: tenant.id, employeeCode: emp.code },
      });
      if (!existing) {
        await prisma.employee.create({
          data: {
            tenantId: tenant.id,
            orgId: org.id,
            employeeCode: emp.code,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            designation: emp.designation,
            departmentId: emp.deptId,
            dateOfJoining: new Date(),
          },
        });
      }
    }
    console.log('HR module initial employees seeded.');
  }

  // 7. Create CRM Customers & Vendors
  const customers = [
    { name: 'Wayne Enterprises', email: 'billing@wayne.com', phone: '555-0199', type: 'COMPANY' },
    { name: 'Stark Industries', email: 'finance@stark.com', phone: '555-0188', type: 'COMPANY' },
  ];
  const customerMap: Record<string, string> = {};
  for (const cust of customers) {
    let existing = await prisma.customer.findFirst({
      where: { tenantId: tenant.id, name: cust.name },
    });
    if (!existing) {
      existing = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          name: cust.name,
          email: cust.email,
          phone: cust.phone,
          type: cust.type,
        },
      });
    }
    customerMap[cust.name] = existing.id;
  }

  const vendors = [
    { name: 'Oscorp Chemical Supply', email: 'sales@oscorp.com', phone: '555-0144' },
    { name: 'LexCorp Heavy Industries', email: 'logistics@lexcorp.com', phone: '555-0133' },
  ];
  for (const vend of vendors) {
    const existing = await prisma.vendor.findFirst({
      where: { tenantId: tenant.id, name: vend.name },
    });
    if (!existing) {
      await prisma.vendor.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          name: vend.name,
          email: vend.email,
          phone: vend.phone,
        },
      });
    }
  }
  console.log('CRM Customers & Vendors seeded.');

  // 8. Create Warehouses & Products
  let warehouse = await prisma.warehouse.findFirst({
    where: { tenantId: tenant.id, code: 'WH-MAIN' },
  });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        name: 'Main Central Warehouse',
        code: 'WH-MAIN',
      },
    });
  }
  console.log(`Warehouse verified: ${warehouse.code}`);

  const products = [
    { sku: 'SKU-LAP-001', name: 'UltraBook Laptop Pro', costPrice: 650.00, sellPrice: 1200.00, type: 'GOODS' },
    { sku: 'SKU-MON-002', name: '4K IPS Curved Monitor 32"', costPrice: 200.00, sellPrice: 450.00, type: 'GOODS' },
    { sku: 'SKU-SRV-003', name: 'Premium ERP Support (Monthly)', costPrice: 50.00, sellPrice: 250.00, type: 'SERVICE' },
  ];
  const productMap: Record<string, string> = {};
  for (const prod of products) {
    let existing = await prisma.product.findFirst({
      where: { tenantId: tenant.id, sku: prod.sku },
    });
    if (!existing) {
      existing = await prisma.product.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          sku: prod.sku,
          name: prod.name,
          costPrice: prod.costPrice,
          sellPrice: prod.sellPrice,
          type: prod.type,
        },
      });
    }
    productMap[prod.sku] = existing.id;

    // Seed stock inventory items if GOODS
    if (prod.type === 'GOODS') {
      const stock = await prisma.inventoryItem.findFirst({
        where: { tenantId: tenant.id, productId: existing.id, warehouseId: warehouse.id },
      });
      if (!stock) {
        await prisma.inventoryItem.create({
          data: {
            tenantId: tenant.id,
            productId: existing.id,
            warehouseId: warehouse.id,
            quantity: 100,
            reorderPoint: 20,
            reorderQty: 50,
          },
        });
      }
    }
  }
  console.log('Inventory products and stock items seeded.');

  // 9. Create Finance Invoices & Payments
  const wayneId = customerMap['Wayne Enterprises'];
  const laptopId = productMap['SKU-LAP-001'];
  if (wayneId && laptopId) {
    const existingInv = await prisma.invoice.findFirst({
      where: { tenantId: tenant.id, invoiceNumber: 'INV-2026-001' },
    });
    if (!existingInv) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          customerId: wayneId,
          invoiceNumber: 'INV-2026-001',
          status: 'PARTIALLY_PAID',
          dueDate,
          subtotal: 1200.00,
          taxAmount: 120.00,
          totalAmount: 1320.00,
          paidAmount: 500.00,
        },
      });

      await prisma.invoiceLineItem.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          productId: laptopId,
          description: 'UltraBook Laptop Pro - Standard Configuration',
          quantity: 1,
          unitPrice: 1200.00,
          taxRate: 10,
          taxAmount: 120.00,
          totalAmount: 1320.00,
        },
      });

      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
          amount: 500.00,
          method: 'BANK_TRANSFER',
          reference: 'TXN-998822',
        },
      });
    }
    console.log('Finance Invoices & Payments seeded.');
  }

  console.log('✅ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
