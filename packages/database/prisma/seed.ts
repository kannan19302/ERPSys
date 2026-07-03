import { PrismaClient } from '@prisma/client';
import { seedWebTemplates } from './seed-web-templates';

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

  // 9.5. Create Sourcing RFQs & Supplier Quotations
  const oscorp = await prisma.vendor.findFirst({ where: { tenantId: tenant.id, name: 'Oscorp Chemical Supply' } });
  const lexcorp = await prisma.vendor.findFirst({ where: { tenantId: tenant.id, name: 'LexCorp Heavy Industries' } });
  const monitorId = productMap['SKU-MON-002'];

  if (oscorp && lexcorp && monitorId) {
    const existingRfq = await prisma.rFQ.findFirst({
      where: { tenantId: tenant.id, rfqNumber: 'RFQ-2026-001' },
    });
    if (!existingRfq) {
      const rfq = await prisma.rFQ.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          rfqNumber: 'RFQ-2026-001',
          status: 'SENT',
          expectedDate: new Date(),
          notes: 'Quotation request for office monitor upgrade',
        },
      });

      await prisma.rFQItem.create({
        data: {
          tenantId: tenant.id,
          rfqId: rfq.id,
          productId: monitorId,
          description: '4K IPS Curved Monitor 32"',
          quantity: 10,
        },
      });

      // Seed Supplier Quotations
      const quote1 = await prisma.supplierQuotation.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          rfqId: rfq.id,
          vendorId: oscorp.id,
          quotationNumber: 'SQ-OSC-001',
          status: 'APPROVED',
          validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          subtotal: 1900.00,
          taxAmount: 190.00,
          totalAmount: 2090.00,
          notes: 'Special offer with bulk discount',
        },
      });

      await prisma.supplierQuotationItem.create({
        data: {
          tenantId: tenant.id,
          supplierQuotationId: quote1.id,
          productId: monitorId,
          description: '4K IPS Curved Monitor 32" - Bulk Promo',
          quantity: 10,
          unitPrice: 190.00,
          taxRate: 10,
          taxAmount: 190.00,
          totalAmount: 2090.00,
        },
      });

      const quote2 = await prisma.supplierQuotation.create({
        data: {
          tenantId: tenant.id,
          orgId: org.id,
          rfqId: rfq.id,
          vendorId: lexcorp.id,
          quotationNumber: 'SQ-LEX-999',
          status: 'DRAFT',
          validUntil: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          subtotal: 2100.00,
          taxAmount: 210.00,
          totalAmount: 2310.00,
          notes: 'Standard commercial pricing',
        },
      });

      await prisma.supplierQuotationItem.create({
        data: {
          tenantId: tenant.id,
          supplierQuotationId: quote2.id,
          productId: monitorId,
          description: '4K IPS Curved Monitor 32"',
          quantity: 10,
          unitPrice: 210.00,
          taxRate: 10,
          taxAmount: 210.00,
          totalAmount: 2310.00,
        },
      });
    }
  }

  // 10. Create Phase 3 Project Management & Manufacturing seed data
  const existingProject = await prisma.project.findFirst({
    where: { tenantId: tenant.id, code: 'PRJ-ERP' },
  });
  if (!existingProject) {
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        name: 'UniERP Core Integration',
        code: 'PRJ-ERP',
        description: 'Complete the integration of PM & Manufacturing modules',
        status: 'ACTIVE',
        startDate: new Date(),
        budget: 50000,
      },
    });

    const task1 = await prisma.task.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'Database Schema Updates',
        description: 'Create tables and link relationships',
        status: 'DONE',
        priority: 'HIGH',
      },
    });

    const task2 = await prisma.task.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'API Controller and Service Development',
        description: 'Implement NestJS business logic endpoints',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      },
    });

    await prisma.milestone.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'API Skeleton Complete',
        dueDate: new Date(),
        isCompleted: true,
      },
    });

    const employee = await prisma.employee.findFirst({ where: { tenantId: tenant.id } });
    if (employee) {
      await prisma.timesheet.create({
        data: {
          tenantId: tenant.id,
          taskId: task1.id,
          employeeId: employee.id,
          date: new Date(),
          hours: 8.0,
          notes: 'Completed model definition and migration creation',
        },
      });
    }
    console.log('Project Management initial seed data complete.');
  }

  const existingBOM = await prisma.bOM.findFirst({
    where: { tenantId: tenant.id, code: 'BOM-LAP-001' },
  });
  if (!existingBOM && laptopId) {
    const bom = await prisma.bOM.create({
      data: {
        tenantId: tenant.id,
        productId: laptopId,
        name: 'UltraBook Laptop assembly',
        code: 'BOM-LAP-001',
        isActive: true,
      },
    });

    await prisma.bOMItem.create({
      data: {
        tenantId: tenant.id,
        bomId: bom.id,
        productId: laptopId,
        quantity: 1,
      },
    });

    await prisma.workOrder.create({
      data: {
        tenantId: tenant.id,
        bomId: bom.id,
        workOrderNumber: 'WO-2026-001',
        status: 'PLANNED',
        quantity: 50,
      },
    });
    console.log('Manufacturing initial seed data complete.');
  }

  // 11. Create Phase 4 Analytics, Documents, Communication seeds
  const existingDashboard = await prisma.dashboard.findFirst({
    where: { tenantId: tenant.id, name: 'Executive Overview' },
  });
  if (!existingDashboard) {
    await prisma.dashboard.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        name: 'Executive Overview',
        description: 'Key performance indicators and charts',
        isSystem: true,
        layout: [],
      },
    });

    await prisma.folder.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        name: 'Financial Reports',
      },
    });

    await prisma.channel.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        name: 'announcements',
        description: 'Company-wide announcements and alerts',
        type: 'PUBLIC',
      },
    });
    console.log('Phase 4 (BI, Documents, Communication) initial seed data complete.');
  }

  // 12. Create Phase 5 POS & Advanced Inventory seeds
  const existingTerminal = await prisma.pOSTerminal.findFirst({
    where: { tenantId: tenant.id, code: 'POS-TERM-01' },
  });
  if (!existingTerminal) {
    await prisma.pOSTerminal.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        name: 'Retail Checkout Counter 1',
        code: 'POS-TERM-01',
        warehouseId: warehouse.id,
      },
    });

    if (laptopId) {
      await prisma.serialNumber.create({
        data: {
          tenantId: tenant.id,
          productId: laptopId,
          warehouseId: warehouse.id,
          serialNumber: 'SN-LAP-998811',
          status: 'AVAILABLE',
        },
      });

      await prisma.batch.create({
        data: {
          tenantId: tenant.id,
          productId: laptopId,
          batchNumber: 'BAT-2026-06',
          quantity: 20,
          costPrice: 650.00,
        },
      });
    }

    await prisma.binLocation.create({
      data: {
        tenantId: tenant.id,
        warehouseId: warehouse.id,
        name: 'Aisle-4-Shelf-B',
        zone: 'Zone-A',
        aisle: 'Aisle-4',
        rack: 'Rack-B',
        bin: 'Bin-12',
        code: 'A4RB12',
      },
    });
    console.log('Phase 5 (POS & Advanced Inventory) initial seed data complete.');
  }

  // 13. Create Phase 6 to Phase 10 Seeds
  const existingAccount = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: '1000' },
  });
  if (!existingAccount) {
    const cashAcc = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        orgId: org.id,
        code: '1000',
        name: 'Cash Account',
        type: 'ASSET',
        balance: 5000,
      },
    });

    await prisma.exchangeRate.create({
      data: {
        tenantId: tenant.id,
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92,
      },
    });

    const emp = await prisma.employee.findFirst({ where: { tenantId: tenant.id } });
    if (emp) {
      await prisma.salaryStructure.create({
        data: {
          tenantId: tenant.id,
          employeeId: emp.id,
          baseSalary: 4500.00,
        },
      });

      // Seed Appraisal
      await prisma.appraisal.create({
        data: {
          tenantId: tenant.id,
          employeeId: emp.id,
          reviewerId: adminUser.id,
          appraisalPeriod: 'FY 2026 Q1',
          score: 4.5,
          feedback: 'Excellent performance in core modules integration and type resolutions.',
          status: 'COMPLETED',
        },
      });
    }

    // Seed Training
    await prisma.training.create({
      data: {
        tenantId: tenant.id,
        name: 'Advanced ERP Development and Compliance',
        description: 'Comprehensive bootcamp on Turborepo, NestJS, and Statutory Audit practices.',
        instructor: 'Dr. Jane Foster',
        startDate: new Date('2026-07-10T09:00:00Z'),
        endDate: new Date('2026-07-12T17:00:00Z'),
      },
    });

    const sickLeave = await prisma.leavePolicy.create({
      data: {
        tenantId: tenant.id,
        name: 'Sick Leave Policy',
        leaveType: 'SICK',
        annualAllocation: 12,
      },
    });

    const flow = await prisma.workflow.create({
      data: {
        tenantId: tenant.id,
        name: 'Purchase Order Approval Workflow',
        triggerType: 'PO_CREATED',
        status: 'ACTIVE',
      },
    });

    await prisma.workflowStep.create({
      data: {
        tenantId: tenant.id,
        workflowId: flow.id,
        stepOrder: 1,
        actionType: 'APPROVAL',
        assigneeRole: 'Admin',
      },
    });

    await prisma.notificationChannel.createMany({
      data: [
        { tenantId: tenant.id, name: 'Web', isEnabled: true },
        { tenantId: tenant.id, name: 'Email', isEnabled: true },
        { tenantId: tenant.id, name: 'SMS', isEnabled: false },
      ],
    });

    console.log('Phase 6-10 (Advanced Finance, HR, Workflows, Notifications) seed data complete.');
  }

  // 14. Create Phase 11 to Phase 15 Seeds
  const existingPatient = await prisma.patient.findFirst({
    where: { tenantId: tenant.id },
  });
  if (!existingPatient) {
    // Phase 11: Advanced Reporting
    await prisma.reportWidget.create({
      data: {
        tenantId: tenant.id,
        dashboardId: 'main-db',
        title: 'Weekly Patient Encounters',
        chartType: 'BAR',
        queryConfig: JSON.stringify({ series: 'encounters', period: 'weekly' }),
        position: JSON.stringify({ x: 0, y: 0, w: 6, h: 4 }),
      },
    });

    await prisma.reportView.create({
      data: {
        tenantId: tenant.id,
        name: 'Executive Medical Operations Summary',
        queryConfig: JSON.stringify({ filter: 'all' }),
        isScheduled: true,
        scheduleCron: '0 8 * * 1',
        recipientEmails: 'admin@unerp.dev',
      },
    });

    // Phase 12: Healthcare
    const patientObj = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        email: 'john.doe@gmail.com',
        phone: '123-456-7890',
        medicalHistory: JSON.stringify({ history: 'Mild allergies' }),
        vitalsHistory: JSON.stringify([{ bp: '120/80', pulse: 72 }]),
        allergies: JSON.stringify(['Peanuts']),
        status: 'ACTIVE',
      },
    });

    const empObj = await prisma.employee.findFirst({ where: { tenantId: tenant.id } });
    if (empObj) {
      const practitionerObj = await prisma.practitioner.create({
        data: {
          tenantId: tenant.id,
          employeeId: empObj.id,
          specialty: 'Cardiology',
          licenseNumber: 'LIC-98765-USA',
          status: 'ACTIVE',
        },
      });

      await prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          patientId: patientObj.id,
          practitionerId: practitionerObj.id,
          startTime: new Date('2026-06-12T09:00:00Z'),
          endTime: new Date('2026-06-12T10:00:00Z'),
          status: 'CONFIRMED',
          notes: 'Routine cardiovascular checkup',
        },
      });

      await prisma.prescription.create({
        data: {
          tenantId: tenant.id,
          patientId: patientObj.id,
          practitionerId: practitionerObj.id,
          details: JSON.stringify({ medication: 'Aspirin', dosage: '81mg daily' }),
          status: 'ACTIVE',
        },
      });

      await prisma.medicalEncounter.create({
        data: {
          tenantId: tenant.id,
          patientId: patientObj.id,
          practitionerId: practitionerObj.id,
          diagnosis: 'Essential hypertension',
          treatmentCode: 'ICD10-I10',
          claimStatus: 'SUBMITTED',
          billingAmount: 150.00,
        },
      });
    }

    await prisma.drugRegister.create({
      data: {
        tenantId: tenant.id,
        name: 'Amoxicillin 500mg',
        batchNumber: 'BATCH-AMX-001',
        expiryDate: new Date('2027-12-31'),
        isControlled: false,
        quantity: 500,
      },
    });

    // Phase 13: Education
    const studentObj = await prisma.student.create({
      data: {
        tenantId: tenant.id,
        firstName: 'Alice',
        lastName: 'Smith',
        dateOfBirth: new Date('2010-05-15'),
        enrollmentNumber: 'STU-2026-0001',
        parentContact: JSON.stringify({ mother: 'Jane Smith', phone: '987-654-3210' }),
      },
    });

    const courseObj = await prisma.course.create({
      data: {
        tenantId: tenant.id,
        name: 'Introduction to Computer Science',
        code: 'CS-101',
        credits: 4,
        description: 'Foundational programming concepts',
      },
    });

    await prisma.timetable.create({
      data: {
        tenantId: tenant.id,
        courseId: courseObj.id,
        room: 'Lab-A',
        weekday: 'MONDAY',
        startTime: '09:00',
        endTime: '11:00',
        instructorId: 'inst-001',
      },
    });

    const feeObj = await prisma.feeStructure.create({
      data: {
        tenantId: tenant.id,
        name: 'Fall Tuition 2026',
        amount: 2500.00,
        dueDate: new Date('2026-09-01'),
      },
    });

    await prisma.studentFee.create({
      data: {
        tenantId: tenant.id,
        studentId: studentObj.id,
        feeStructureId: feeObj.id,
        amountPaid: 500.00,
        balance: 2000.00,
        status: 'PARTIAL',
      },
    });

    const bookObj = await prisma.bookRegister.create({
      data: {
        tenantId: tenant.id,
        title: 'Structure and Interpretation of Computer Programs',
        isbn: '978-0262510875',
        author: 'Harold Abelson',
        quantity: 10,
        available: 9,
      },
    });

    await prisma.bookTransaction.create({
      data: {
        tenantId: tenant.id,
        studentId: studentObj.id,
        bookId: bookObj.id,
        checkoutDate: new Date('2026-06-10T10:00:00Z'),
        dueDate: new Date('2026-06-24T10:00:00Z'),
        status: 'ISSUED',
      },
    });

    // Phase 14: Real Estate
    const propertyObj = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        name: 'Unit 502 - Grand Horizon Plaza',
        type: 'COMMERCIAL',
        portfolio: 'Horizon Portfolio',
        address: JSON.stringify({ street: '100 Business Pkwy', suite: '502', city: 'Seattle' }),
        status: 'AVAILABLE',
      },
    });

    await prisma.lease.create({
      data: {
        tenantId: tenant.id,
        propertyId: propertyObj.id,
        tenantName: 'TechCorp Solutions Inc.',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2027-06-30'),
        rentAmount: 3200.00,
        securityDeposit: 6400.00,
        billingFrequency: 'MONTHLY',
        status: 'ACTIVE',
      },
    });

    await prisma.propertyMaintenance.create({
      data: {
        tenantId: tenant.id,
        propertyId: propertyObj.id,
        description: 'HVAC system inspection and filter replacement',
        status: 'OPEN',
        cost: 120.00,
      },
    });

    await prisma.agentCommission.create({
      data: {
        tenantId: tenant.id,
        agentId: 'agent-007',
        amount: 320.00,
        splitRatio: 0.10,
        generalLedgerRef: 'GL-COMM-502',
        status: 'PENDING',
      },
    });

    // Phase 15: Field Service
    const ticketObj = await prisma.serviceTicket.create({
      data: {
        tenantId: tenant.id,
        title: 'Server Room AC Unit Leaking Water',
        customerName: 'Acme Corp Office',
        description: 'Water dripping from unit #3 onto secondary server rack',
        priority: 'URGENT',
        slaDeadline: new Date('2026-06-11T22:00:00Z'),
        status: 'OPEN',
      },
    });

    const dispatchObj = await prisma.serviceDispatch.create({
      data: {
        tenantId: tenant.id,
        ticketId: ticketObj.id,
        technicianId: 'tech-99',
        scheduledTime: new Date('2026-06-11T19:00:00Z'),
        routeDetails: JSON.stringify({ startingPoint: 'Main Depot', route: ['1st Ave', 'Business Park Rd'] }),
        status: 'ASSIGNED',
      },
    });

    await prisma.technicianChecklist.create({
      data: {
        tenantId: tenant.id,
        dispatchId: dispatchObj.id,
        items: JSON.stringify([
          { task: 'Clean condenser coils', isDone: true },
          { task: 'Check drain pan line blockages', isDone: false },
        ]),
        isOfflineSynced: false,
      },
    });

    await prisma.preventativeMaintenance.create({
      data: {
        tenantId: tenant.id,
        customerName: 'Acme HQ Building',
        description: 'Quarterly facility elevator inspection',
        recurrenceCron: '0 0 1 */3 *',
        nextRunDate: new Date('2026-09-01T00:00:00Z'),
        status: 'ACTIVE',
      },
    });

    console.log('Phase 11-15 (Reporting, Healthcare, Education, Real Estate, Field Service) seed data complete.');
  }

  // 15. Create Phase 16 to Phase 20 Seeds (API Platform, i18n, PWA, SaaS)
  const existingApiKey = await prisma.apiKey.findFirst({
    where: { tenantId: tenant.id },
  });
  if (!existingApiKey) {
    // Phase 16: API Platform & Integrations
    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        name: 'Read-only API Key',
        hashedKey: 'd3b07384d113edec49eaa6238ad5ff00', // Mock MD5/SHA hash
        prefix: 'ue_live_',
        rateLimit: 120,
        status: 'ACTIVE',
      },
    });

    const webhookSub = await prisma.webhookSubscription.create({
      data: {
        tenantId: tenant.id,
        name: 'Invoice Paid Event Webhook',
        targetUrl: 'https://api.external-service.com/webhooks/invoice',
        events: JSON.stringify(['invoice.paid', 'invoice.created']),
        secret: 'whsec_secret_123',
        status: 'ACTIVE',
      },
    });

    await prisma.webhookDeliveryLog.create({
      data: {
        tenantId: tenant.id,
        subscriptionId: webhookSub.id,
        event: 'invoice.paid',
        payload: JSON.stringify({ invoiceId: 'INV-2026-001', amount: 1320.00 }),
        responseStatus: 200,
        responseBody: '{"received": true}',
        status: 'SUCCESS',
      },
    });

    // Phase 17: Localization
    await prisma.languageOverride.createMany({
      data: [
        {
          tenantId: tenant.id,
          locale: 'es',
          key: 'dashboard.welcome',
          translation: '¡Bienvenido al sistema UniERP!',
        },
        {
          tenantId: tenant.id,
          locale: 'fr',
          key: 'dashboard.welcome',
          translation: 'Bienvenue dans le système UniERP !',
        },
      ],
    });

    // Phase 18: PWA Sync
    await prisma.offlineSyncQueue.create({
      data: {
        tenantId: tenant.id,
        clientId: 'client-iphone-14-pro',
        operation: 'CREATE',
        entityType: 'ServiceTicket',
        payload: JSON.stringify({ title: 'Offline Ticket #1', description: 'Created during field visit' }),
        status: 'PENDING',
      },
    });

    // Phase 20: SaaS Billing
    const saasPlan = await prisma.saaSPlan.create({
      data: {
        name: 'Enterprise Growth Plan',
        stripePriceId: 'price_12345_growth',
        maxUsers: 50,
        maxStorage: 10240, // 10 GB
        features: JSON.stringify(['finance', 'hr', 'crm', 'inventory', 'healthcare']),
      },
    });

    await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planId: saasPlan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    await prisma.usageRecord.createMany({
      data: [
        {
          tenantId: tenant.id,
          metric: 'USERS_COUNT',
          currentValue: 12,
          limitValue: 50,
        },
        {
          tenantId: tenant.id,
          metric: 'STORAGE_MB',
          currentValue: 2048,
          limitValue: 10240,
        },
        {
          tenantId: tenant.id,
          metric: 'API_CALLS_COUNT',
          currentValue: 450,
          limitValue: 10000,
        },
      ],
    });

    // Seed default installed apps
    const defaultApps = ['healthcare', 'education', 'real-estate', 'field-service'];
    for (const appId of defaultApps) {
      await prisma.installedApp.upsert({
        where: {
          tenantId_appId: {
            tenantId: tenant.id,
            appId,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          appId,
        },
      });
    }

    // Seed system apps in MarketplaceApp catalog and Install them for the tenant
    const systemAppsData = [
      {
        slug: 'dashboard', name: 'Dashboard',
        description: 'Overview of key metrics and KPIs across all modules.',
        longDescription: 'The UniERP Dashboard provides a centralized overview of your entire business. Access real-time widgets, key performance indicators (KPIs), and critical notifications in one place. Customize layout widgets for finance, HR, inventory, and sales to keep your finger on the pulse of your operations.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Real-time KPI cards', 'Activity feed monitoring', 'Custom widget layout', 'In-app notification center'],
        tags: ['dashboard', 'home', 'overview', 'kpi'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'finance', name: 'Finance & Accounting',
        description: 'Double-entry bookkeeping, ledger, invoices, payments, and financial reporting.',
        longDescription: 'Manage your company\'s financial health with our comprehensive double-entry accounting engine. Features include accounts receivable, accounts payable, general ledger posting, bank reconciliation, multi-currency transactions, and real-time generation of balance sheets, profit & loss statements, and tax returns.',
        category: 'Finance', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Double-entry bookkeeping', 'General Ledger', 'Invoices & Payments', 'Financial statements (P&L, Balance Sheet)'],
        tags: ['finance', 'accounting', 'ledger', 'invoice', 'payments'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'hr', name: 'Human Resources',
        description: 'Employee directory, department structures, leave management, and attendance.',
        longDescription: 'Streamline employee lifecycle management and operations. Keep a centralized directory of employee records, contracts, departments, and roles. Manage leave requests, shift calendars, holidays, and attendance tracking seamlessly integrated with payroll processing.',
        category: 'HR', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Employee directory', 'Org chart & department hierarchy', 'Leave management workflow', 'Attendance tracking'],
        tags: ['hr', 'employees', 'leaves', 'attendance', 'people'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'crm', name: 'CRM & Sales',
        description: 'Customer profiles, lead tracking, opportunities, and pipeline management.',
        longDescription: 'Empower your sales team to close more deals. Manage customer registers, log contact details, track sales leads, and manage pipelines through multiple custom stages. Leverage interaction logging (calls, emails, meetings) to build strong customer relationships.',
        category: 'Sales', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Customer & contact management', 'Lead intake and scoring', 'Opportunity pipeline management', 'Activity tracking (meetings, calls)'],
        tags: ['crm', 'sales', 'leads', 'pipeline', 'customers'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'inventory', name: 'Inventory & Stock',
        description: 'Warehouse locations, product catalogs, stock valuation, and serial/batch tracking.',
        longDescription: 'Take control of your physical stock levels. Define warehouses with bin locations, track product units of measurement, configure automatic reorder thresholds, and trace inventory movements with FIFO, LIFO, or moving average valuation.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Multi-warehouse management', 'SKU & barcode catalog', 'Stock movements & ledger', 'Reorder level automation'],
        tags: ['inventory', 'stock', 'warehouse', 'products', 'sku'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'procurement', name: 'Procurement',
        description: 'Vendor registry, RFQs, purchase orders, and goods receipts.',
        longDescription: 'Manage the procure-to-pay workflow easily. Register vendors and track performance. Raise Requests for Quotations (RFQs), issue Purchase Orders (POs), and record Goods Receipt Notes (GRN) to automatically update warehouse inventory levels.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Vendor management', 'Request for Quotation (RFQ)', 'Purchase Order generation', 'Goods Receipt Notes (GRN)'],
        tags: ['procurement', 'purchase', 'vendors', 'po', 'goods-receipt'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'sales', name: 'Sales & Orders',
        description: 'Quotations, sales orders, delivery notes, and invoicing workflows.',
        longDescription: 'Complete your order-to-cash lifecycle efficiently. Generate and email quotes to clients, convert approved quotes to Sales Orders, issue Delivery Notes to logistics, and trigger invoice creation automatically upon delivery.',
        category: 'Sales', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Client quotations', 'Sales Orders pipeline', 'Delivery Notes', 'Auto invoice creation'],
        tags: ['sales', 'orders', 'quotations', 'billing', 'delivery'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'supply-chain', name: 'Supply Chain',
        description: 'Shipment tracking, carrier management, and demand forecasting.',
        longDescription: 'Optimize distribution and logistics pipelines. Monitor outbound shipments, assign carriers, calculate logistics rates, and leverage historical demand data to forecast future inventory stocking requirements.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Outbound shipment tracking', 'Logistics carrier registry', 'Shipping cost calculations', 'Demand forecasting models'],
        tags: ['shipping', 'supply-chain', 'logistics', 'carriers', 'forecasting'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'projects', name: 'Project Management',
        description: 'Projects, tasks, Gantt charts, timesheets, and budget monitoring.',
        longDescription: 'Track time-bound operations and client services. Create projects with milestones and tasks. Plan visual schedules using Gantt charts, record employee work hours on timesheets, and manage actual vs. budgeted project costs.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Project milestones & tasks', 'Interactive Gantt charts', 'Employee timesheets', 'Budget & cost tracking'],
        tags: ['projects', 'tasks', 'gantt', 'timesheets', 'budgeting'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'manufacturing', name: 'Manufacturing',
        description: 'Bill of Materials (BOM), work orders, production routing, and MRP.',
        longDescription: 'Plan and execute raw material conversion workflows. Define multi-level Bills of Materials (BOM), set up workstations and resource capacity, issue Work Orders, and run Manufacturing Resource Planning (MRP) calculations to generate purchase requisitions.',
        category: 'Manufacturing', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Bill of Materials (BOM)', 'Workstation & capacity planning', 'Work Order routing', 'MRP calculations'],
        tags: ['manufacturing', 'mrp', 'bom', 'production', 'workstations'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'analytics', name: 'Business Intelligence',
        description: 'Custom reporting, pivots, visual dashboards, and automated exports.',
        longDescription: 'Unlock hidden potential in your database. Construct visual charts and dashboards via a drag-and-drop builder, build custom spreadsheet-like pivot tables, and schedule reports to be automatically emailed in PDF or CSV formats.',
        category: 'Analytics', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Drag-and-drop dashboard widgets', 'Pivot table matrices', 'Query builder filters', 'Scheduled email exports (PDF/CSV)'],
        tags: ['analytics', 'reporting', 'bi', 'dashboards', 'charts'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'drive', name: 'Drive',
        description: 'Centralized document library, folder sharing, and version control.',
        longDescription: 'Manage files and compliance documentation in a unified workspace. Organize documents in hierarchies, customize permissions per folder, view version histories, and share time-expiring external links safely.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['File & folder structure', 'Version history tracking', 'Expiring share links', 'Access permissions control'],
        tags: ['drive', 'storage', 'files', 'documents', 'sharing'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'communication', name: 'Connect',
        description: 'Internal messaging spaces, group chat, calendar, and meetings.',
        longDescription: 'Bridge internal collaboration gaps. Join discussion channels, start thread replies, send direct messages (DMs), schedule company-wide calendars, and launch unified meetings directly from your ERP dashboard.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Chat spaces & channels', 'Direct messaging & threads', 'Company-wide calendar', 'Web meetings integration'],
        tags: ['connect', 'chat', 'messaging', 'calendar', 'collaboration'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'pos', name: 'POS & Retail',
        description: 'Point-of-Sale terminal checkout, registers, barcode scanners, and shifts.',
        longDescription: 'Run physical retail frontends with ease. Launch retail terminals, scan product barcodes, manage cash register draw limits, track employee register shifts, print receipts, and sync inventory counts in real-time.',
        category: 'Sales', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Retail checkout interface', 'Barcode scanning support', 'Cash register drawer control', 'Shift management'],
        tags: ['pos', 'retail', 'terminal', 'checkout', 'billing'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'api-keys', name: 'API Platform',
        description: 'Developer public keys, webhooks subscriptions, and rate limiting.',
        longDescription: 'Integrate external tools with the UniERP API ecosystem. Developers can create public API keys, configure event webhook subscriptions (e.g. order.created, invoice.paid), and monitor rate limits and webhook delivery logs.',
        category: 'AI & Automation', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['API key generation & rotation', 'Webhooks subscriptions manager', 'Webhook delivery logging', 'Rate limit rules config'],
        tags: ['api', 'webhooks', 'developer', 'integrations'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'saas', name: 'SaaS Portal',
        description: 'SaaS tenant subscription billing, plans, and resource utilization counters.',
        longDescription: 'For SaaS deployments: manage billing, upgrade or downgrade pricing packages, review active Stripe subscription statuses, and monitor resource usage counters (users count, storage MB, api calls count).',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Billing subscription status', 'Usage metrics monitoring', 'Plan upgrades & options'],
        tags: ['saas', 'billing', 'subscription', 'usage', 'stripe'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'admin', name: 'Admin Console',
        description: 'RBAC authorization, workflow builders, system logging, and settings.',
        longDescription: 'Central command for your ERP instance. Configure tenants, manage users, assign security roles and permissions, construct approval workflows, view system logs, verify data backups, and customize look-and-feel branding.',
        category: 'Operations', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['User & role RBAC matrix', 'Workflow approval engines', 'System configurations', 'Audit log registries'],
        tags: ['admin', 'settings', 'security', 'backup', 'rbac'],
        screenshots: [],
        metadata: { isSystem: true },
      },
      {
        slug: 'builder', name: 'Studio',
        description: 'No-code visual page builder, schema creator, and CMS designer.',
        longDescription: 'Empower non-technical users to build custom modules. Visually design forms and layouts using a drag-and-drop editor, construct new database tables, define relationships, and deploy custom pages instantly without writing code.',
        category: 'AI & Automation', publisher: 'UniERP', version: '1.0.0', pricing: 'FREE', rating: 5.0, installs: 5000, verified: true,
        features: ['Visual form layout editor', 'Dynamic schema architect', 'Page registry deployments', 'No-code workflows'],
        tags: ['builder', 'no-code', 'studio', 'pages', 'forms'],
        screenshots: [],
        metadata: { isSystem: true },
      },
    ];

    for (const app of systemAppsData) {
      const seededApp = await prisma.marketplaceApp.upsert({
        where: { slug: app.slug },
        update: {
          name: app.name,
          description: app.description,
          longDescription: app.longDescription,
          category: app.category,
          publisher: app.publisher,
          version: app.version,
          pricing: app.pricing,
          rating: app.rating,
          installs: app.installs,
          verified: app.verified,
          features: app.features as any,
          tags: app.tags as any,
          metadata: app.metadata as any,
        },
        create: app as any,
      });

      await prisma.installedApp.upsert({
        where: {
          tenantId_appId: {
            tenantId: tenant.id,
            appId: seededApp.slug,
          },
        },
        update: {
          appSlug: seededApp.slug,
          appName: seededApp.name,
          installedVersion: seededApp.version,
          status: 'ACTIVE',
        },
        create: {
          tenantId: tenant.id,
          appId: seededApp.slug,
          appSlug: seededApp.slug,
          appName: seededApp.name,
          installedVersion: seededApp.version,
          status: 'ACTIVE',
        },
      });
    }

    console.log('Phase 16-20 (API Platform, i18n, PWA, SaaS) seed data complete.');
  }

  // 15. Seeding HR Gaps models
  console.log('🌱 Seeding HR Gaps models...');
  
  // Benefit Schemes
  const healthIns = await prisma.benefitScheme.upsert({
    where: { id: 'health-scheme' },
    update: {},
    create: {
      id: 'health-scheme',
      tenantId: tenant.id,
      name: 'Standard Health Insurance',
      type: 'HEALTH_INSURANCE',
      provider: 'Blue Cross Blue Shield',
      description: 'Comprehensive medical coverage',
      employeeCostShare: 150.00,
      employerCostShare: 350.00,
      isActive: true,
    }
  });

  const pensionScheme = await prisma.benefitScheme.upsert({
    where: { id: 'pension-scheme' },
    update: {},
    create: {
      id: 'pension-scheme',
      tenantId: tenant.id,
      name: '401(k) Retirement Plan',
      type: 'PENSION',
      provider: 'Fidelity Investments',
      description: 'Tax-deferred retirement savings',
      employeeCostShare: 200.00,
      employerCostShare: 200.00,
      isActive: true,
    }
  });

  // Tax Tables
  await prisma.taxTable.createMany({
    data: [
      {
        tenantId: tenant.id,
        country: 'US',
        incomeBracketMin: 0.00,
        incomeBracketMax: 11600.00,
        taxRate: 10.00,
        allowanceAmount: 0.00,
      },
      {
        tenantId: tenant.id,
        country: 'US',
        incomeBracketMin: 11600.01,
        incomeBracketMax: 47150.00,
        taxRate: 12.00,
        allowanceAmount: 0.00,
      },
      {
        tenantId: tenant.id,
        country: 'US',
        incomeBracketMin: 47150.01,
        incomeBracketMax: 100525.00,
        taxRate: 22.00,
        allowanceAmount: 0.00,
      },
    ],
    skipDuplicates: true,
  });

  // Holiday Calendar
  await prisma.holidayCalendar.upsert({
    where: { tenantId_date_region: { tenantId: tenant.id, date: new Date('2026-07-04T00:00:00Z'), region: 'US' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Independence Day',
      date: new Date('2026-07-04T00:00:00Z'),
      region: 'US',
    }
  });

  await prisma.holidayCalendar.upsert({
    where: { tenantId_date_region: { tenantId: tenant.id, date: new Date('2026-12-25T00:00:00Z'), region: 'US' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Christmas Day',
      date: new Date('2026-12-25T00:00:00Z'),
      region: 'US',
    }
  });

  // Skill Requirements
  await prisma.skillRequirement.upsert({
    where: { tenantId_designation_skillName: { tenantId: tenant.id, designation: 'HR Director', skillName: 'Recruitment' } },
    update: {},
    create: {
      tenantId: tenant.id,
      designation: 'HR Director',
      skillName: 'Recruitment',
      requiredLevel: 4,
    }
  });

  await prisma.skillRequirement.upsert({
    where: { tenantId_designation_skillName: { tenantId: tenant.id, designation: 'HR Director', skillName: 'Labor Compliance' } },
    update: {},
    create: {
      tenantId: tenant.id,
      designation: 'HR Director',
      skillName: 'Labor Compliance',
      requiredLevel: 5,
    }
  });

  // Positions Control
  if (departmentMap['HUMAN_RESOURCES'] && departmentMap['FINANCE']) {
    await prisma.position.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'POS-HR-DIR' } },
      update: {},
      create: {
        tenantId: tenant.id,
        departmentId: hrDeptId,
        title: 'HR Director',
        code: 'POS-HR-DIR',
        budgetedSalary: 8500.00,
        status: 'FILLED',
      }
    });

    await prisma.position.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'POS-HR-SPEC' } },
      update: {},
      create: {
        tenantId: tenant.id,
        departmentId: hrDeptId,
        title: 'HR Specialist',
        code: 'POS-HR-SPEC',
        budgetedSalary: 5000.00,
        status: 'VACANT',
      }
    });
  }

  // 16. Seeding Project Management Gaps models
  console.log('🌱 Seeding Project Management Gaps models...');
  
  // Find a Customer
  const customer = await prisma.customer.findFirst({
    where: { tenantId: tenant.id },
  });
  
  if (customer) {
    // Portfolios
    const portfolio = await prisma.projectPortfolio.upsert({
      where: { id: 'enterprise-portfolio' },
      update: {},
      create: {
        id: 'enterprise-portfolio',
        tenantId: tenant.id,
        orgId: org.id,
        name: 'Enterprise Software Enhancements',
        description: 'Portfolio containing core enterprise upgrade projects',
        riskScore: 2.50,
        strategicAlignment: 'HIGH',
        budget: 500000.00,
      }
    });

    // Create a new Project linked to this Portfolio & Customer
    const project = await prisma.project.upsert({
      where: { tenantId_orgId_code: { tenantId: tenant.id, orgId: org.id, code: 'PRJ-ERP-UPGRADE' } },
      update: {
        portfolioId: portfolio.id,
        customerId: customer.id,
      },
      create: {
        tenantId: tenant.id,
        orgId: org.id,
        name: 'ERP Suite Upgrade Project',
        code: 'PRJ-ERP-UPGRADE',
        description: 'Migrating legacy ERP workloads to UniERP Cloud Platform',
        status: 'ACTIVE',
        startDate: new Date('2026-06-01T00:00:00Z'),
        endDate: new Date('2026-12-31T23:59:59Z'),
        budget: 150000.00,
        portfolioId: portfolio.id,
        customerId: customer.id,
        overallHealth: 'HEALTHY',
      }
    });

    // Add some tasks if they don't exist
    const task1 = await prisma.task.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'Requirement Analysis & Solution Design',
        description: 'Complete fit-gap analysis and sign-off spec',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date('2026-06-15T00:00:00Z'),
      }
    });

    const task2 = await prisma.task.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'Database Migration Scripting',
        description: 'Draft and test PostgreSQL schemas and mapping scripts',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2026-07-30T00:00:00Z'),
      }
    });

    const task3 = await prisma.task.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: 'UAT & Client Verification',
        description: 'Perform user acceptance testing with customer stakeholders',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2026-11-30T00:00:00Z'),
      }
    });

    // Add timesheets to completed tasks for cost calculations
    const emp = await prisma.employee.findFirst({ where: { tenantId: tenant.id } });
    if (emp) {
      await prisma.timesheet.create({
        data: {
          tenantId: tenant.id,
          taskId: task1.id,
          employeeId: emp.id,
          date: new Date('2026-06-10T00:00:00Z'),
          hours: 12.50,
          notes: 'Worked on solution blueprint design',
        }
      });
      await prisma.timesheet.create({
        data: {
          tenantId: tenant.id,
          taskId: task2.id,
          employeeId: emp.id,
          date: new Date('2026-06-13T00:00:00Z'),
          hours: 8.00,
          notes: 'Configured Prisma migrations',
        }
      });
    }

    // Risks
    await prisma.projectRisk.createMany({
      data: [
        {
          tenantId: tenant.id,
          projectId: project.id,
          title: 'Database migration performance bottleneck',
          description: 'Large historical tables might experience high latency during lockups',
          probability: 'MEDIUM',
          impact: 'HIGH',
          mitigationPlan: 'Run trial runs on staging and optimize indices beforehand.',
          status: 'OPEN',
        },
        {
          tenantId: tenant.id,
          projectId: project.id,
          title: 'Developer resource constraint',
          description: 'Key database developers assigned to multiple projects simultaneously',
          probability: 'HIGH',
          impact: 'MEDIUM',
          mitigationPlan: 'Pre-allocate dedicated sprint capacity and cross-train team members.',
          status: 'MITIGATED',
        }
      ],
      skipDuplicates: true,
    });

    // Change Requests
    await prisma.changeRequest.createMany({
      data: [
        {
          tenantId: tenant.id,
          projectId: project.id,
          title: 'Add Advanced Financial Reporting dashboard',
          description: 'Client requested extra real-time drilldowns for regional tax structures.',
          requestedAmount: 25000.00,
          requestedScheduleDays: 15,
          status: 'PENDING',
        },
        {
          tenantId: tenant.id,
          projectId: project.id,
          title: 'Additional SSO providers scope expansion',
          description: 'Integrate Okta OIDC protocol in addition to simple credential logins.',
          requestedAmount: 12000.00,
          requestedScheduleDays: 7,
          status: 'APPROVED',
          approvedBy: 'admin@unerp.dev',
          approvedAt: new Date('2026-06-12T00:00:00Z'),
        }
      ],
      skipDuplicates: true,
    });
  }

  // === MANUFACTURING MODULE SEEDING ===
  console.log('🌱 Seeding Manufacturing, QC, CMMS & Subcontracting data...');

  // 1. Workstations
  const wsCNC = await prisma.workstation.upsert({
    where: { tenantId_orgId_code: { tenantId: tenant.id, orgId: org.id, code: 'WS-CNC' } },
    update: {},
    create: {
      tenantId: tenant.id,
      orgId: org.id,
      name: 'CNC Cutting Machine',
      code: 'WS-CNC',
      capacityHours: 80.0,
      hourlyOverheadRate: 25.0,
    },
  });

  const wsASM = await prisma.workstation.upsert({
    where: { tenantId_orgId_code: { tenantId: tenant.id, orgId: org.id, code: 'WS-ASM' } },
    update: {},
    create: {
      tenantId: tenant.id,
      orgId: org.id,
      name: 'Assembly Line A',
      code: 'WS-ASM',
      capacityHours: 120.0,
      hourlyOverheadRate: 15.0,
    },
  });

  const wsPKG = await prisma.workstation.upsert({
    where: { tenantId_orgId_code: { tenantId: tenant.id, orgId: org.id, code: 'WS-PKG' } },
    update: {},
    create: {
      tenantId: tenant.id,
      orgId: org.id,
      name: 'Packaging Station',
      code: 'WS-PKG',
      capacityHours: 60.0,
      hourlyOverheadRate: 10.0,
    },
  });

  // Seed Workstation Shifts
  await prisma.workstationShift.createMany({
    data: [
      {
        tenantId: tenant.id,
        workstationId: wsCNC.id,
        name: 'Day Shift A',
        startTime: '08:00',
        endTime: '16:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      {
        tenantId: tenant.id,
        workstationId: wsASM.id,
        name: 'Night Shift B',
        startTime: '16:00',
        endTime: '00:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
    ],
    skipDuplicates: true,
  });

  // Seed Equipment Tools
  await prisma.equipmentTool.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'TL-CNC-01' } },
    update: {},
    create: {
      tenantId: tenant.id,
      workstationId: wsCNC.id,
      name: 'Diamond Blade Cutter',
      code: 'TL-CNC-01',
      maxCycles: 500,
      currentCycles: 120,
      status: 'OK',
    },
  });

  await prisma.equipmentTool.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'TL-ASM-02' } },
    update: {},
    create: {
      tenantId: tenant.id,
      workstationId: wsASM.id,
      name: 'Laser Welder Nozzle',
      code: 'TL-ASM-02',
      maxCycles: 1000,
      currentCycles: 980,
      status: 'OK',
    },
  });


  // Find laptop product
  const laptop = await prisma.product.findFirst({ where: { tenantId: tenant.id, sku: 'SKU-LAP-001' } });
  if (laptop) {
    // Create BOM Components
    const component1 = await prisma.product.upsert({
      where: { tenantId_orgId_sku: { tenantId: tenant.id, orgId: org.id, sku: 'SKU-CHASSIS-01' } },
      update: {},
      create: {
        tenantId: tenant.id,
        orgId: org.id,
        sku: 'SKU-CHASSIS-01',
        name: 'Aluminium Laptop Chassis',
        costPrice: 150.0,
        sellPrice: 300.0,
        type: 'GOODS',
      },
    });

    const component2 = await prisma.product.upsert({
      where: { tenantId_orgId_sku: { tenantId: tenant.id, orgId: org.id, sku: 'SKU-MOBO-01' } },
      update: {},
      create: {
        tenantId: tenant.id,
        orgId: org.id,
        sku: 'SKU-MOBO-01',
        name: 'Core i7 Motherboard',
        costPrice: 200.0,
        sellPrice: 400.0,
        type: 'GOODS',
      },
    });

    const component3 = await prisma.product.upsert({
      where: { tenantId_orgId_sku: { tenantId: tenant.id, orgId: org.id, sku: 'SKU-RAM-01' } },
      update: {},
      create: {
        tenantId: tenant.id,
        orgId: org.id,
        sku: 'SKU-RAM-01',
        name: '16GB RAM DDR5 Module',
        costPrice: 50.0,
        sellPrice: 100.0,
        type: 'GOODS',
      },
    });

    // Create By-Product (e.g. scrap aluminium)
    const byproduct = await prisma.product.upsert({
      where: { tenantId_orgId_sku: { tenantId: tenant.id, orgId: org.id, sku: 'SKU-SCRAP-AL' } },
      update: {},
      create: {
        tenantId: tenant.id,
        orgId: org.id,
        sku: 'SKU-SCRAP-AL',
        name: 'Scrap Aluminium Sheets',
        costPrice: 2.0,
        sellPrice: 5.0,
        type: 'GOODS',
      },
    });

    // Seed BOM
    const bom = await prisma.bOM.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'BOM-LAP-001' } },
      update: {},
      create: {
        tenantId: tenant.id,
        productId: laptop.id,
        name: 'UltraBook Laptop Pro Assembly',
        code: 'BOM-LAP-001',
        materialCost: 400.0,
        overheadCost: 150.0,
        standardCost: 550.0,
        routingJson: JSON.stringify([
          { sequence: 1, name: 'CNC casing chassis cutting', workstationCode: 'WS-CNC', durationMinutes: 60 },
          { sequence: 2, name: 'Assembly of motherboard and components', workstationCode: 'WS-ASM', durationMinutes: 120 },
          { sequence: 3, name: 'Screen calibration and final testing', workstationCode: 'WS-ASM', durationMinutes: 30 },
          { sequence: 4, name: 'Packaging and scanning', workstationCode: 'WS-PKG', durationMinutes: 15 },
        ]),
      },
    });

    // Seed BOM Items (Components)
    await prisma.bOMItem.deleteMany({ where: { bomId: bom.id } });
    await prisma.bOMItem.createMany({
      data: [
        { tenantId: tenant.id, bomId: bom.id, productId: component1.id, quantity: 1.0, type: 'COMPONENT' },
        { tenantId: tenant.id, bomId: bom.id, productId: component2.id, quantity: 1.0, type: 'COMPONENT' },
        { tenantId: tenant.id, bomId: bom.id, productId: component3.id, quantity: 1.0, type: 'COMPONENT' },
        { tenantId: tenant.id, bomId: bom.id, productId: byproduct.id, quantity: 0.5, type: 'BY_PRODUCT' },
      ],
    });

    // Seed Work Orders
    await prisma.workOrder.deleteMany({ where: { bomId: bom.id } });
    const wo1 = await prisma.workOrder.create({
      data: {
        tenantId: tenant.id,
        bomId: bom.id,
        workOrderNumber: 'WO-LAP-001',
        status: 'PLANNED',
        quantity: 50.0,
        startDate: new Date('2026-06-15T08:00:00Z'),
        workstationId: wsASM.id,
        standardCost: 27500.0,
      },
    });

    const wo2 = await prisma.workOrder.create({
      data: {
        tenantId: tenant.id,
        bomId: bom.id,
        workOrderNumber: 'WO-LAP-002',
        status: 'IN_PROGRESS',
        quantity: 20.0,
        startDate: new Date('2026-06-14T09:00:00Z'),
        workstationId: wsASM.id,
        standardCost: 11000.0,
        actualCost: 11200.0,
        costVariance: 200.0,
        lotNumber: 'LOT-20260614-01',
      },
    });

    const wo3 = await prisma.workOrder.create({
      data: {
        tenantId: tenant.id,
        bomId: bom.id,
        workOrderNumber: 'WO-LAP-003',
        status: 'COMPLETED',
        quantity: 10.0,
        startDate: new Date('2026-06-13T08:00:00Z'),
        endDate: new Date('2026-06-13T12:00:00Z'),
        workstationId: wsASM.id,
        standardCost: 5500.0,
        actualCost: 5450.0,
        costVariance: -50.0,
        lotNumber: 'LOT-20260613-01',
        oeeScore: 92.5,
        scrapQuantity: 1.0,
      },
    });

    // Seed Quality Plans
    const qPlan = await prisma.qualityInspectionPlan.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: 'QPLAN-LAP-001' } },
      update: {},
      create: {
        tenantId: tenant.id,
        productId: laptop.id,
        name: 'Laptop Inspection Standards Plan',
        code: 'QPLAN-LAP-001',
        checks: JSON.stringify([
          { parameter: 'Chassis Thickness (mm)', minVal: 1.4, maxVal: 1.6 },
          { parameter: 'Screen Brightness (nits)', minVal: 350, maxVal: 450 },
          { parameter: 'Keyboard Functional Key Test', minVal: 1, maxVal: 1 },
        ]),
      },
    });

    // Seed Quality Inspection
    await prisma.qualityInspection.upsert({
      where: { tenantId_orgId_inspectionNumber: { tenantId: tenant.id, orgId: org.id, inspectionNumber: 'QI-LAP-001' } },
      update: {},
      create: {
        tenantId: tenant.id,
        orgId: org.id,
        inspectionNumber: 'QI-LAP-001',
        referenceType: 'Work Order',
        referenceId: wo3.id,
        productId: laptop.id,
        status: 'PASSED',
        inspectedQty: 10.0,
        passedQty: 10.0,
        rejectedQty: 0.0,
        inspectedBy: 'admin@unerp.dev',
        checklist: JSON.stringify([
          { parameter: 'Chassis Thickness (mm)', target: '1.5', actual: '1.5', status: 'PASS' },
          { parameter: 'Screen Brightness (nits)', target: '400', actual: '410', status: 'PASS' },
          { parameter: 'Keyboard Functional Key Test', target: '1', actual: '1', status: 'PASS' },
        ]),
      },
    });

    // Seed Non-Conformance Report
    await prisma.nonConformanceReport.create({
      data: {
        tenantId: tenant.id,
        workOrderId: wo2.id,
        productId: laptop.id,
        title: 'Screen Calibration Backlight Leakage',
        description: '3 laptops in batch WO-LAP-002 had backlight leakage exceeding threshold checks.',
        disposition: 'REWORK',
        status: 'OPEN',
        loggedBy: 'inspector.qc@unerp.dev',
      },
    });

    // Pre-seed Engineering Change Order (ECO)
    await prisma.engineeringChangeOrder.create({
      data: {
        tenantId: tenant.id,
        bomId: bom.id,
        changeDescription: 'Upgrade chassis to grade-A brushed aluminum finish and motherboard BIOS configuration updates.',
        requestedBy: 'lead.designer@unerp.dev',
        status: 'PENDING',
      },
    });

    // Pre-seed operations execution steps for WOs
    const routing = Array.isArray(bom.routingJson) ? bom.routingJson : JSON.parse(bom.routingJson as string || '[]');
    for (const step of routing) {
      await prisma.workOrderOperation.create({
        data: {
          tenantId: tenant.id,
          workOrderId: wo2.id,
          sequence: step.sequence,
          name: step.name,
          workstationCode: step.workstationCode,
          durationMinutes: step.durationMinutes,
          status: step.sequence === 1 ? 'RUNNING' : 'PENDING',
          startedAt: step.sequence === 1 ? new Date() : null,
        },
      });
      await prisma.workOrderOperation.create({
        data: {
          tenantId: tenant.id,
          workOrderId: wo3.id,
          sequence: step.sequence,
          name: step.name,
          workstationCode: step.workstationCode,
          durationMinutes: step.durationMinutes,
          status: 'COMPLETED',
          startedAt: new Date(Date.now() - 4 * 3600 * 1000),
          completedAt: new Date(Date.now() - 3.5 * 3600 * 1000),
        },
      });
    }

    // Pre-seed material genealogy component lot consumptions
    await prisma.workOrderComponentConsumption.createMany({
      data: [
        {
          tenantId: tenant.id,
          workOrderId: wo3.id,
          productId: component1.id,
          lotNumber: 'LOT-CHASSIS-CNC-2026',
          quantityConsumed: 10,
        },
        {
          tenantId: tenant.id,
          workOrderId: wo3.id,
          productId: component2.id,
          lotNumber: 'LOT-MOBO-INT-2026',
          quantityConsumed: 10,
        },
      ],
    });
  }

  // 2. Machine Downtime Logs
  await prisma.machineDowntimeLog.create({
    data: {
      tenantId: tenant.id,
      workstationId: wsCNC.id,
      downtimeCode: 'MECHANICAL',
      startTime: new Date('2026-06-14T08:00:00Z'),
      endTime: new Date('2026-06-14T09:15:00Z'),
      durationMinutes: 75,
      notes: 'Chassis cutter blade swap and motor oil check.',
    },
  });

  // 3. CMMS / Maintenance Requests
  await prisma.maintenanceRequest.create({
    data: {
      tenantId: tenant.id,
      workstationId: wsASM.id,
      type: 'PREVENTIVE',
      priority: 'MEDIUM',
      title: 'Assembly Belt Greasing & Calibration',
      description: 'Bi-weekly routine belt inspection and maintenance checklist.',
      status: 'SCHEDULED',
      assignedTo: 'Technical Team B',
    },
  });

  // 4. Subcontracting Orders
  const lexcorpVendor = await prisma.vendor.findFirst({ where: { tenantId: tenant.id, name: 'LexCorp Heavy Industries' } });
  const rawSteel = await prisma.product.findFirst({ where: { tenantId: tenant.id, sku: 'SKU-CHASSIS-01' } });
  if (lexcorpVendor && rawSteel) {
    await prisma.subcontractingOrder.create({
      data: {
        tenantId: tenant.id,
        vendorId: lexcorpVendor.id,
        productId: rawSteel.id,
        quantity: 100.0,
        unitCost: 15.0,
        totalCost: 1500.0,
        status: 'MATERIALS_SHIPPED',
        deliveryDate: new Date('2026-06-25T00:00:00Z'),
      },
    });
  }

  // === BUILDER STUDIO MODULE SEEDING ===
  console.log('🌱 Seeding Builder Studio data...');

  const builderForm = await prisma.builderForm.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'employee-onboarding' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Employee Onboarding',
      slug: 'employee-onboarding',
      description: 'Standard onboarding checklist form',
      status: 'PUBLISHED',
      module: 'HR',
      fields: JSON.stringify([
        { name: 'firstName', type: 'text', label: 'First Name', required: true },
        { name: 'lastName', type: 'text', label: 'Last Name', required: true },
        { name: 'department', type: 'select', label: 'Department', required: true, options: ['Engineering', 'Sales', 'HR'] },
      ]),
    },
  });

  await prisma.builderWorkflow.create({
    data: {
      tenantId: tenant.id,
      name: 'Leave Approval Workflow',
      docType: 'LeaveRequest',
      status: 'ACTIVE',
      trigger: 'SUBMIT',
      nodes: JSON.stringify([
        { id: '1', type: 'start', label: 'Submitted' },
        { id: '2', type: 'approval', label: 'Manager Approval' },
        { id: '3', type: 'end', label: 'Approved' },
      ]),
      edges: JSON.stringify([
        { from: '1', to: '2' },
        { from: '2', to: '3' },
      ]),
    },
  });

  await prisma.builderDashboard.create({
    data: {
      tenantId: tenant.id,
      name: 'Executive Overview',
      description: 'High-level metrics for executives',
      status: 'PUBLISHED',
      widgets: JSON.stringify([
        { type: 'kpi', title: 'Total Revenue', dataSource: 'Invoice', position: { x: 0, y: 0, w: 3, h: 2 } },
        { type: 'chart', title: 'Sales Trend', dataSource: 'SalesOrder', chartType: 'line', position: { x: 3, y: 0, w: 9, h: 4 } },
      ]),
    },
  });

  await prisma.builderModule.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'fleet-management' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Fleet Management',
      slug: 'fleet-management',
      description: 'Manage company vehicles and maintenance',
      icon: 'Truck',
      status: 'ACTIVE',
      scope: 'ORGANIZATION',
      entities: JSON.stringify([
        { name: 'Vehicle', fields: ['plateNumber', 'model', 'status'] },
        { name: 'MaintenanceLog', fields: ['vehicleId', 'date', 'cost'] },
      ]),
    },
  });

  await prisma.automationRule.create({
    data: {
      tenantId: tenant.id,
      name: 'Auto-assign Lead',
      description: 'Assign leads from website to sales team',
      trigger: 'lead.created',
      status: 'ACTIVE',
      conditions: JSON.stringify([{ field: 'source', operator: 'equals', value: 'Website' }]),
      actions: JSON.stringify([{ type: 'assignTo', target: 'Sales Team' }]),
    },
  });

  await prisma.webPage.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'home' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Home Page',
      slug: 'home',
      status: 'PUBLISHED',
      sections: JSON.stringify([
        { type: 'hero', content: { title: 'Welcome to UniERP', subtitle: 'The modern way to run your business' } },
        { type: 'features', content: { items: ['Fast', 'Secure', 'Customizable'] } },
      ]),
    },
  });

  await prisma.blogPost.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'getting-started-with-unierp' } },
    update: {},
    create: {
      tenantId: tenant.id,
      title: 'Getting Started with UniERP',
      slug: 'getting-started-with-unierp',
      content: 'Welcome to your new ERP system. In this post...',
      excerpt: 'Learn the basics of navigating and setting up UniERP.',
      status: 'PUBLISHED',
      author: 'Admin',
      readTime: '5 min',
    },
  });

  await prisma.webAsset.create({
    data: {
      tenantId: tenant.id,
      name: 'hero-banner.jpg',
      url: 'https://example.com/assets/hero-banner.jpg',
      type: 'IMAGE',
      sizeBytes: 1048576,
      uploadedBy: 'Admin',
    },
  });

  await prisma.webTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Standard Page Template',
      description: 'Default layout for standard pages',
      htmlContent: '<html><body><header></header><main>{{content}}</main><footer></footer></body></html>',
      status: 'ACTIVE',
      author: 'Admin',
    },
  });

  await prisma.webMenu.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Navigation',
      location: 'HEADER',
      items: JSON.stringify([
        { label: 'Home', url: '/', order: 1 },
        { label: 'About', url: '/about', order: 2 },
        { label: 'Products', url: '/products', order: 3 },
      ]),
    },
  });

  await prisma.webSeo.upsert({
    where: { tenantId_path: { tenantId: tenant.id, path: '/' } },
    update: {},
    create: {
      tenantId: tenant.id,
      path: '/',
      title: 'Home | UniERP',
      description: 'Welcome to UniERP, the future of enterprise.',
      keywords: 'erp, business, unierp',
      ogImage: 'https://example.com/assets/og-home.jpg',
    },
  });

  const existingTemplatesCount = await prisma.webTemplate.count({ where: { tenantId: tenant.id } });
  if (existingTemplatesCount <= 1) { // 1 is the default standard page template seeded above
    await seedWebTemplates(prisma, tenant.id);
  }

  // Seed Requisitions & Blanket Agreements
  const defaultOrg = await prisma.organization.findFirst({ where: { tenantId: tenant.id } });
  const defaultDept = await prisma.department.findFirst({ where: { tenantId: tenant.id, code: 'FINANCE' } });
  const lapProduct = await prisma.product.findFirst({ where: { tenantId: tenant.id, sku: 'SKU-LAP-001' } });
  const monProduct = await prisma.product.findFirst({ where: { tenantId: tenant.id, sku: 'SKU-MON-002' } });

  if (defaultOrg && lapProduct && monProduct) {
    const existingReq = await prisma.purchaseRequisition.findFirst({
      where: { tenantId: tenant.id, requisitionNumber: 'PR-2026-001' }
    });
    if (!existingReq) {
      const pr = await prisma.purchaseRequisition.create({
        data: {
          tenantId: tenant.id,
          orgId: defaultOrg.id,
          requisitionNumber: 'PR-2026-001',
          title: 'Office Hardware Replenishment',
          description: 'Departmental laptop and monitor refresh request',
          status: 'PENDING_APPROVAL',
          requestedById: adminUser.id,
          departmentId: defaultDept?.id || null,
          estimatedCost: 1550,
          notes: 'Standard approval flow is active'
        }
      });

      await prisma.purchaseRequisitionItem.createMany({
        data: [
          {
            tenantId: tenant.id,
            requisitionId: pr.id,
            productId: lapProduct.id,
            description: lapProduct.name,
            quantity: 2,
            estimatedPrice: 650,
            totalAmount: 1300,
            sortOrder: 0
          },
          {
            tenantId: tenant.id,
            requisitionId: pr.id,
            productId: monProduct.id,
            description: monProduct.name,
            quantity: 1,
            estimatedPrice: 250,
            totalAmount: 250,
            sortOrder: 1
          }
        ]
      });
    }

    // Seed Blanket Agreements
    const existingBpa = await prisma.blanketPurchaseAgreement.findFirst({
      where: { tenantId: tenant.id, agreementNumber: 'BPA-2026-001' }
    });
    const defaultVendor = await prisma.vendor.findFirst({ where: { tenantId: tenant.id } });
    if (!existingBpa && defaultVendor) {
      const start = new Date();
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);

      const bpa = await prisma.blanketPurchaseAgreement.create({
        data: {
          tenantId: tenant.id,
          orgId: defaultOrg.id,
          vendorId: defaultVendor.id,
          agreementNumber: 'BPA-2026-001',
          title: 'Annual Hardware Supply Agreement',
          status: 'ACTIVE',
          startDate: start,
          endDate: end,
          agreementLimit: 50000,
          releasedAmount: 0,
          currency: 'USD',
          notes: 'Pre-negotiated contract prices'
        }
      });

      await prisma.blanketPurchaseAgreementItem.createMany({
        data: [
          {
            tenantId: tenant.id,
            agreementId: bpa.id,
            productId: lapProduct.id,
            description: lapProduct.name,
            quantity: 50,
            releasedQty: 0,
            unitPrice: 600,
            totalAmount: 30000,
            sortOrder: 0
          },
          {
            tenantId: tenant.id,
            agreementId: bpa.id,
            productId: monProduct.id,
            description: monProduct.name,
            quantity: 100,
            releasedQty: 0,
            unitPrice: 200,
            totalAmount: 20000,
            sortOrder: 1
          }
        ]
      });
    }
  }

  // 20. E-Commerce Storefront (module #33) — StorefrontConfig, StorefrontCategory, ProductListing
  let storefrontConfig = await prisma.storefrontConfig.findFirst({
    where: { tenantId: tenant.id },
  });
  if (!storefrontConfig) {
    storefrontConfig = await prisma.storefrontConfig.create({
      data: {
        tenantId: tenant.id,
        storeName: 'Acme Online Store',
        storeSlug: tenant.slug,
        isEnabled: true,
        currency: 'USD',
        contactEmail: 'store@unerp.dev',
      },
    });
  }
  console.log(`Storefront config verified: ${storefrontConfig.storeSlug}`);

  let electronicsCategory = await prisma.storefrontCategory.findFirst({
    where: { tenantId: tenant.id, slug: 'electronics' },
  });
  if (!electronicsCategory) {
    electronicsCategory = await prisma.storefrontCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Laptops, monitors, and accessories',
        sortOrder: 0,
      },
    });
  }

  const laptopProductId = productMap['SKU-LAP-001'];
  const monitorProductId = productMap['SKU-MON-002'];
  const storefrontListingSeeds = [
    { productId: laptopProductId, sortOrder: 0 },
    { productId: monitorProductId, sortOrder: 1 },
  ].filter((item): item is { productId: string; sortOrder: number } => Boolean(item.productId));

  for (const item of storefrontListingSeeds) {
    const existingListing = await prisma.productListing.findFirst({
      where: { tenantId: tenant.id, productId: item.productId },
    });
    if (!existingListing) {
      await prisma.productListing.create({
        data: {
          tenantId: tenant.id,
          productId: item.productId,
          categoryId: electronicsCategory.id,
          isPublished: true,
          sortOrder: item.sortOrder,
        },
      });
    }
  }
  console.log('Storefront categories and product listings seeded.');

  console.log('🚀 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
