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
        shelf: 'Shelf-B',
        bin: 'Bin-12',
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
    }

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

    console.log('Phase 16-20 (API Platform, i18n, PWA, SaaS) seed data complete.');
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
