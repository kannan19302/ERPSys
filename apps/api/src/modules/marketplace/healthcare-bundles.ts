import { AppManifest, ManifestModule } from './manifest';
import { REFERENCE_DATA } from '../healthcare/reference-data';

/**
 * The Healthcare vertical as a SINGLE industry app (vendor "HealthTech") — a broad
 * EHR / HIS / RCM / patient-engagement suite competitive with top health-IT platforms.
 * Each capability is a toggleable module managed from the in-app admin console; live
 * dashboards use the `kpi` (computed metrics) + `table` (live records) widgets, and
 * "smart" workflows are backed by the /api/v1/healthcare/* services. Runs at /app/healthcare.
 */

let _wid = 0;
const wid = () => `w${++_wid}`;

const f = (name: string, type: string, required = false, extra: Record<string, any> = {}) => ({
  name, label: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), type, required, ...extra,
});

// ── dashboard widget helpers ──
const header = (title: string, subtitle?: string, badge?: string) => ({ id: wid(), type: 'header', title, gridSpan: 12, config: { subtitle, badge } });
const kpi = (title: string, items: { metric: string; label: string; color?: string }[]) => ({ id: wid(), type: 'kpi', title, gridSpan: 12, config: { items } });
const alert = (text: string, type: 'info' | 'warning' | 'danger' | 'success' = 'info') => ({ id: wid(), type: 'alert', gridSpan: 12, config: { text, type } });
const table = (title: string, dataModelSlug: string, gridSpan = 6, maxRows = 6) => ({ id: wid(), type: 'table', title, gridSpan, config: { dataModelSlug, maxRows } });
const dashboard = (slug: string, title: string, layout: any[]) => ({ slug, title, type: 'custom' as const, layout });

const C = { red: '#ef4444', amber: '#f59e0b', green: '#10b981', blue: '#3b82f6', violet: '#8b5cf6', teal: '#14b8a6', pink: '#ec4899' };

const MODULES: ManifestModule[] = [
  // ───────────────────────── Overview ─────────────────────────
  {
    slug: 'overview', name: 'Command Center', icon: '🏥', description: 'Executive clinical + revenue overview.', enabledByDefault: true,
    pages: [
      dashboard('command-center', 'Clinical Command Center', [
        header('Clinical Command Center', 'Live operational overview across clinical and revenue cycle', 'LIVE'),
        kpi('Today', [
          { metric: 'count:patient', label: 'Total Patients', color: C.blue },
          { metric: 'todays_appointments', label: "Today's Appointments", color: C.teal },
          { metric: 'active_inpatients', label: 'Inpatients', color: C.violet },
          { metric: 'critical_labs', label: 'Critical Labs', color: C.red },
        ]),
        kpi('Revenue Cycle', [
          { metric: 'pending_claims', label: 'Pending Claims', color: C.amber },
          { metric: 'denied_claims', label: 'Denied Claims', color: C.red },
          { metric: 'open_invoices', label: 'Open Invoices', color: C.blue },
          { metric: 'ar_total', label: 'A/R Balance', color: C.green },
        ]),
        alert('Review denied claims and critical lab results promptly.', 'warning'),
        table('Recent Patients', 'patient', 6),
        table('Appointments', 'appointment', 6),
      ]),
    ],
  },

  // ───────────────────────── Clinical / EHR ─────────────────────────
  {
    slug: 'patient-management', name: 'Patient Management', icon: '🩺', description: 'Demographics, problems, allergies, meds, vitals, care team.', enabledByDefault: true, roles: ['Physician', 'Nurse', 'Front Desk'],
    schemas: [
      { slug: 'patient', name: 'Patient', fields: [f('mrn', 'text', true), f('first_name', 'text', true), f('last_name', 'text', true), f('date_of_birth', 'date'), f('sex', 'select', false, { options: ['Male', 'Female', 'Other'] }), f('phone', 'text'), f('email', 'email'), f('blood_group', 'text'), f('primary_provider', 'text'), f('insurance_payer', 'text'), f('risk_level', 'select', false, { options: ['Low', 'Moderate', 'High'] })],
        sampleData: [
          { mrn: 'MRN1001', first_name: 'Alice', last_name: 'Morgan', date_of_birth: '1984-03-12', sex: 'Female', phone: '555-0101', blood_group: 'O+', primary_provider: 'Dr. Patel', insurance_payer: 'BlueCross', risk_level: 'Moderate' },
          { mrn: 'MRN1002', first_name: 'Brian', last_name: 'Lee', date_of_birth: '1971-09-30', sex: 'Male', phone: '555-0102', blood_group: 'A-', primary_provider: 'Dr. Nguyen', insurance_payer: 'Aetna', risk_level: 'High' },
          { mrn: 'MRN1003', first_name: 'Carla', last_name: 'Diaz', date_of_birth: '1995-06-21', sex: 'Female', phone: '555-0103', blood_group: 'B+', primary_provider: 'Dr. Patel', insurance_payer: 'UnitedHealth', risk_level: 'Low' },
          { mrn: 'MRN1004', first_name: 'David', last_name: 'Okafor', date_of_birth: '1958-12-02', sex: 'Male', phone: '555-0104', blood_group: 'AB+', primary_provider: 'Dr. Singh', insurance_payer: 'Medicare', risk_level: 'High' },
        ] },
      { slug: 'problem', name: 'Problem', fields: [f('patient_mrn', 'text', true), f('icd10_code', 'text'), f('description', 'text', true), f('onset_date', 'date'), f('status', 'select', false, { options: ['Active', 'Resolved', 'Chronic'] })],
        sampleData: [
          { patient_mrn: 'MRN1002', icd10_code: 'E11.9', description: 'Type 2 diabetes mellitus', onset_date: '2018-01-15', status: 'Chronic' },
          { patient_mrn: 'MRN1004', icd10_code: 'I10', description: 'Essential hypertension', onset_date: '2015-05-10', status: 'Chronic' },
        ] },
      { slug: 'allergy', name: 'Allergy', fields: [f('patient_mrn', 'text', true), f('allergen', 'text', true), f('reaction', 'text'), f('severity', 'select', false, { options: ['Mild', 'Moderate', 'Severe'] })],
        sampleData: [{ patient_mrn: 'MRN1001', allergen: 'Penicillin', reaction: 'Hives', severity: 'Severe' }] },
      { slug: 'medication', name: 'Medication', fields: [f('patient_mrn', 'text', true), f('drug', 'text', true), f('dose', 'text'), f('frequency', 'text'), f('status', 'select', false, { options: ['Active', 'Stopped'] })],
        sampleData: [{ patient_mrn: 'MRN1002', drug: 'Metformin', dose: '500mg', frequency: 'BID', status: 'Active' }] },
      { slug: 'vital', name: 'Vital Sign', fields: [f('patient_mrn', 'text', true), f('recorded_at', 'date'), f('systolic', 'number'), f('diastolic', 'number'), f('heart_rate', 'number'), f('temperature', 'number'), f('spo2', 'number')],
        sampleData: [{ patient_mrn: 'MRN1004', recorded_at: new Date().toISOString().slice(0, 10), systolic: 158, diastolic: 96, heart_rate: 82, temperature: 98.6, spo2: 97 }] },
      { slug: 'care-team', name: 'Care Team Member', fields: [f('patient_mrn', 'text', true), f('member', 'text', true), f('role', 'text')] },
    ],
    pages: [
      { slug: 'patients', title: 'Patients', type: 'list', schema: 'patient' },
      { slug: 'patient-record', title: 'New Patient', type: 'form', schema: 'patient' },
      { slug: 'problems', title: 'Problem List', type: 'list', schema: 'problem' },
      { slug: 'allergies', title: 'Allergies', type: 'list', schema: 'allergy' },
      { slug: 'medications', title: 'Medications', type: 'list', schema: 'medication' },
      { slug: 'vitals', title: 'Vitals', type: 'list', schema: 'vital' },
      dashboard('patient-360', 'Patient Overview', [
        header('Patient Overview', 'Population snapshot'),
        kpi('Population', [
          { metric: 'count:patient', label: 'Patients', color: C.blue },
          { metric: 'count:problem', label: 'Active Problems', color: C.amber },
          { metric: 'count:allergy', label: 'Allergies', color: C.red },
          { metric: 'count:medication', label: 'Medications', color: C.violet },
        ]),
        table('Patients', 'patient', 12),
      ]),
    ],
  },

  {
    slug: 'clinical-charting', name: 'Clinical Charting', icon: '📝', description: 'Encounters, SOAP notes and clinical documents.', enabledByDefault: true,
    schemas: [
      { slug: 'encounter', name: 'Encounter', fields: [f('patient_mrn', 'text', true), f('encounter_date', 'date', true), f('type', 'select', false, { options: ['Outpatient', 'Inpatient', 'Emergency', 'Telehealth'] }), f('chief_complaint', 'text'), f('subjective', 'textarea'), f('objective', 'textarea'), f('assessment', 'textarea'), f('plan', 'textarea'), f('provider', 'text'), f('status', 'select', false, { options: ['Open', 'Signed'] })],
        sampleData: [
          { patient_mrn: 'MRN1002', encounter_date: new Date().toISOString().slice(0, 10), type: 'Outpatient', chief_complaint: 'Follow-up diabetes', assessment: 'A1c elevated', plan: 'Increase Metformin', provider: 'Dr. Nguyen', status: 'Signed' },
          { patient_mrn: 'MRN1004', encounter_date: new Date().toISOString().slice(0, 10), type: 'Outpatient', chief_complaint: 'BP check', assessment: 'Uncontrolled HTN', plan: 'Add lisinopril', provider: 'Dr. Singh', status: 'Open' },
        ] },
      { slug: 'clinical-document', name: 'Clinical Document', fields: [f('patient_mrn', 'text', true), f('title', 'text', true), f('doc_type', 'select', false, { options: ['Progress Note', 'Discharge Summary', 'Consult', 'Referral'] }), f('author', 'text'), f('date', 'date')] },
    ],
    pages: [
      { slug: 'encounters', title: 'Encounters', type: 'list', schema: 'encounter' },
      { slug: 'new-encounter', title: 'New Encounter (SOAP)', type: 'form', schema: 'encounter' },
      { slug: 'documents', title: 'Clinical Documents', type: 'list', schema: 'clinical-document' },
    ],
  },

  {
    slug: 'cpoe-orders', name: 'Orders (CPOE)', icon: '🧪', description: 'Computerized order entry with decision support.', enabledByDefault: false,
    schemas: [
      { slug: 'order', name: 'Order', fields: [f('patient_mrn', 'text', true), f('order_type', 'select', false, { options: ['Lab', 'Imaging', 'Medication', 'Referral'] }), f('detail', 'text', true), f('priority', 'select', false, { options: ['Routine', 'Urgent', 'STAT'] }), f('ordered_by', 'text'), f('status', 'select', false, { options: ['Draft', 'Active', 'Completed', 'Cancelled'] })],
        sampleData: [{ patient_mrn: 'MRN1002', order_type: 'Lab', detail: 'HbA1c', priority: 'Routine', ordered_by: 'Dr. Nguyen', status: 'Active' }] },
      { slug: 'order-set', name: 'Order Set', fields: [f('name', 'text', true), f('description', 'text'), f('items', 'textarea')] },
    ],
    pages: [
      { slug: 'orders', title: 'Orders', type: 'list', schema: 'order' },
      { slug: 'new-order', title: 'New Order', type: 'form', schema: 'order' },
      { slug: 'order-sets', title: 'Order Sets', type: 'list', schema: 'order-set' },
    ],
  },

  {
    slug: 'eprescribing', name: 'e-Prescribing', icon: '💊', description: 'Prescriptions with drug-interaction checks; pharmacy formulary & stock.', enabledByDefault: true, roles: ['Physician', 'Pharmacist'],
    schemas: [
      { slug: 'drug', name: 'Drug', fields: [f('name', 'text', true), f('form', 'text'), f('strength', 'text'), f('unit_price', 'number'), f('reorder_level', 'number'), f('controlled', 'boolean')],
        sampleData: [
          { name: 'Metformin', form: 'Tablet', strength: '500mg', unit_price: 0.1, reorder_level: 100, controlled: false },
          { name: 'Lisinopril', form: 'Tablet', strength: '10mg', unit_price: 0.12, reorder_level: 80, controlled: false },
          { name: 'Warfarin', form: 'Tablet', strength: '5mg', unit_price: 0.2, reorder_level: 60, controlled: false },
          { name: 'Oxycodone', form: 'Tablet', strength: '5mg', unit_price: 0.5, reorder_level: 40, controlled: true },
        ] },
      { slug: 'prescription', name: 'Prescription', fields: [f('patient_mrn', 'text', true), f('drug', 'text', true), f('dosage', 'text'), f('frequency', 'text'), f('quantity', 'number'), f('prescriber', 'text'), f('status', 'select', false, { options: ['Pending', 'Sent', 'Dispensed', 'Cancelled'] })],
        sampleData: [{ patient_mrn: 'MRN1002', drug: 'Metformin', dosage: '500mg', frequency: 'BID', quantity: 60, prescriber: 'Dr. Nguyen', status: 'Dispensed' }] },
      { slug: 'stock-batch', name: 'Stock Batch', fields: [f('drug', 'text', true), f('batch_no', 'text'), f('quantity', 'number'), f('expiry_date', 'date')],
        sampleData: [
          { drug: 'Metformin', batch_no: 'B-100', quantity: 40, expiry_date: '2027-01-01' },
          { drug: 'Lisinopril', batch_no: 'B-200', quantity: 30, expiry_date: '2026-09-01' },
          { drug: 'Warfarin', batch_no: 'B-300', quantity: 20, expiry_date: '2026-06-01' },
        ] },
    ],
    pages: [
      { slug: 'formulary', title: 'Formulary', type: 'list', schema: 'drug' },
      { slug: 'prescriptions', title: 'Prescriptions', type: 'list', schema: 'prescription' },
      { slug: 'prescribe', title: 'New Prescription', type: 'form', schema: 'prescription' },
      { slug: 'stock', title: 'Stock Batches', type: 'list', schema: 'stock-batch' },
      dashboard('pharmacy-dashboard', 'Pharmacy Dashboard', [
        header('Pharmacy', 'Formulary, dispensing and stock health'),
        kpi('Stock', [
          { metric: 'count:drug', label: 'Formulary Items', color: C.violet },
          { metric: 'low_stock_drugs', label: 'Low Stock', color: C.red },
          { metric: 'count:prescription', label: 'Prescriptions', color: C.blue },
        ]),
        alert('Reorder drugs below their reorder level to avoid stockouts.', 'warning'),
        table('Formulary', 'drug', 6),
        table('Stock Batches', 'stock-batch', 6),
      ]),
    ],
    automations: [
      { name: 'Low Stock Alert', trigger: { type: 'record.created', entity: 'stock-batch' }, actions: [{ type: 'notify', config: { template: 'low_stock' } }], enabled: true },
    ],
  },

  {
    slug: 'immunization', name: 'Immunizations', icon: '💉', description: 'Vaccine registry, schedule forecast and reactions.', enabledByDefault: false,
    schemas: [
      { slug: 'vaccine', name: 'Vaccine', fields: [f('name', 'text', true), f('cvx_code', 'text'), f('series', 'text')] },
      { slug: 'immunization-record', name: 'Immunization Record', fields: [f('patient_mrn', 'text', true), f('vaccine', 'text', true), f('dose_number', 'number'), f('administered_date', 'date'), f('next_due', 'date'), f('status', 'select', false, { options: ['Administered', 'Due', 'Overdue', 'Refused'] })],
        sampleData: [{ patient_mrn: 'MRN1003', vaccine: 'Influenza', dose_number: 1, administered_date: '2025-10-01', next_due: '2026-10-01', status: 'Administered' }] },
    ],
    pages: [
      { slug: 'vaccines', title: 'Vaccines', type: 'list', schema: 'vaccine' },
      { slug: 'immunizations', title: 'Immunization Records', type: 'list', schema: 'immunization-record' },
      { slug: 'administer', title: 'Record Immunization', type: 'form', schema: 'immunization-record' },
    ],
    automations: [{ name: 'Immunization Due Reminder', trigger: { type: 'schedule.daily' }, actions: [{ type: 'notify', config: { template: 'immunization_due' } }], enabled: true }],
  },

  {
    slug: 'care-management', name: 'Care Management', icon: '🧑‍⚕️', description: 'Care plans, goals, tasks and population registries.', enabledByDefault: false,
    schemas: [
      { slug: 'care-plan', name: 'Care Plan', fields: [f('patient_mrn', 'text', true), f('condition', 'text'), f('goal', 'text'), f('status', 'select', false, { options: ['Active', 'Met', 'Discontinued'] }), f('owner', 'text')] },
      { slug: 'care-task', name: 'Care Task', fields: [f('patient_mrn', 'text', true), f('task', 'text', true), f('due_date', 'date'), f('assignee', 'text'), f('status', 'select', false, { options: ['Open', 'Done'] })] },
    ],
    pages: [
      { slug: 'care-plans', title: 'Care Plans', type: 'list', schema: 'care-plan' },
      { slug: 'tasks', title: 'Care Tasks', type: 'list', schema: 'care-task' },
    ],
  },

  // ───────────────────────── Diagnostics ─────────────────────────
  {
    slug: 'lab-diagnostics', name: 'Lab & Diagnostics', icon: '🔬', description: 'Lab orders, results (LOINC) and critical-value alerts.', enabledByDefault: true,
    schemas: [
      { slug: 'lab-order', name: 'Lab Order', fields: [f('patient_mrn', 'text', true), f('test_name', 'text', true), f('loinc_code', 'text'), f('ordered_by', 'text'), f('ordered_at', 'date'), f('priority', 'select', false, { options: ['Routine', 'Urgent', 'STAT'] }), f('status', 'select', false, { options: ['Ordered', 'Collected', 'Resulted'] })],
        sampleData: [{ patient_mrn: 'MRN1002', test_name: 'HbA1c', loinc_code: '4548-4', ordered_by: 'Dr. Nguyen', ordered_at: new Date().toISOString().slice(0, 10), priority: 'Routine', status: 'Resulted' }] },
      { slug: 'lab-result', name: 'Lab Result', fields: [f('patient_mrn', 'text', true), f('test_name', 'text', true), f('value', 'text'), f('unit', 'text'), f('reference_range', 'text'), f('flag', 'select', false, { options: ['Normal', 'High', 'Low', 'Critical'] }), f('resulted_at', 'date')],
        sampleData: [
          { patient_mrn: 'MRN1002', test_name: 'HbA1c', value: '9.1', unit: '%', reference_range: '4.0-5.6', flag: 'High', resulted_at: new Date().toISOString().slice(0, 10) },
          { patient_mrn: 'MRN1004', test_name: 'Potassium', value: '6.3', unit: 'mmol/L', reference_range: '3.5-5.1', flag: 'Critical', resulted_at: new Date().toISOString().slice(0, 10) },
        ] },
    ],
    pages: [
      { slug: 'lab-orders', title: 'Lab Orders', type: 'list', schema: 'lab-order' },
      { slug: 'new-lab-order', title: 'New Lab Order', type: 'form', schema: 'lab-order' },
      { slug: 'results', title: 'Results Worklist', type: 'list', schema: 'lab-result' },
      dashboard('lab-dashboard', 'Lab Dashboard', [
        header('Laboratory', 'Orders and results'),
        kpi('Results', [
          { metric: 'count:lab-order', label: 'Orders', color: C.blue },
          { metric: 'critical_labs', label: 'Critical', color: C.red },
          { metric: 'abnormal_labs', label: 'Abnormal', color: C.amber },
        ]),
        alert('Critical results require provider notification within 60 minutes.', 'danger'),
        table('Results', 'lab-result', 12),
      ]),
    ],
  },

  {
    slug: 'radiology-imaging', name: 'Radiology & Imaging', icon: '🩻', description: 'Imaging orders, modality worklist and reports.', enabledByDefault: false,
    schemas: [
      { slug: 'imaging-order', name: 'Imaging Order', fields: [f('patient_mrn', 'text', true), f('modality', 'select', false, { options: ['X-Ray', 'CT', 'MRI', 'Ultrasound'] }), f('body_part', 'text'), f('ordered_by', 'text'), f('status', 'select', false, { options: ['Ordered', 'Scheduled', 'Performed', 'Reported'] })] },
      { slug: 'imaging-report', name: 'Imaging Report', fields: [f('patient_mrn', 'text', true), f('modality', 'text'), f('findings', 'textarea'), f('impression', 'textarea'), f('radiologist', 'text')] },
    ],
    pages: [
      { slug: 'imaging-orders', title: 'Imaging Orders', type: 'list', schema: 'imaging-order' },
      { slug: 'reports', title: 'Reports', type: 'list', schema: 'imaging-report' },
    ],
  },

  // ───────────────────────── Inpatient / HIS ─────────────────────────
  {
    slug: 'inpatient-adt', name: 'Inpatient (ADT)', icon: '🛏️', description: 'Admissions, transfers, discharges and bed management.', enabledByDefault: false, roles: ['Nurse', 'Bed Manager', 'Physician'],
    schemas: [
      { slug: 'ward', name: 'Ward', fields: [f('name', 'text', true), f('floor', 'text'), f('bed_count', 'number')],
        sampleData: [{ name: 'General Ward A', floor: '2', bed_count: 10 }] },
      { slug: 'bed', name: 'Bed', fields: [f('bed_no', 'text', true), f('ward', 'text'), f('status', 'select', false, { options: ['Available', 'Occupied', 'Cleaning'] }), f('patient_mrn', 'text')],
        sampleData: [
          { bed_no: 'A-01', ward: 'General Ward A', status: 'Occupied', patient_mrn: 'MRN1004' },
          { bed_no: 'A-02', ward: 'General Ward A', status: 'Available' },
          { bed_no: 'A-03', ward: 'General Ward A', status: 'Cleaning' },
        ] },
      { slug: 'admission', name: 'Admission', fields: [f('patient_mrn', 'text', true), f('admit_date', 'date'), f('bed_no', 'text'), f('attending', 'text'), f('status', 'select', false, { options: ['Admitted', 'Transferred', 'Discharged'] })],
        sampleData: [{ patient_mrn: 'MRN1004', admit_date: new Date().toISOString().slice(0, 10), bed_no: 'A-01', attending: 'Dr. Singh', status: 'Admitted' }] },
    ],
    pages: [
      { slug: 'admissions', title: 'Admissions', type: 'list', schema: 'admission' },
      { slug: 'admit', title: 'Admit Patient', type: 'form', schema: 'admission' },
      { slug: 'beds', title: 'Bed Board', type: 'list', schema: 'bed' },
      dashboard('census-dashboard', 'Bed Census', [
        header('Inpatient Census', 'Occupancy and admissions'),
        kpi('Census', [
          { metric: 'active_inpatients', label: 'Occupied Beds', color: C.violet },
          { metric: 'bed_occupancy_pct', label: 'Occupancy %', color: C.amber },
          { metric: 'count:admission', label: 'Admissions', color: C.blue },
        ]),
        table('Bed Board', 'bed', 12),
      ]),
    ],
  },

  {
    slug: 'surgery-or', name: 'Surgery / OR', icon: '🔪', description: 'OR scheduling and case tracking.', enabledByDefault: false,
    schemas: [
      { slug: 'or-case', name: 'OR Case', fields: [f('patient_mrn', 'text', true), f('procedure', 'text', true), f('surgeon', 'text'), f('or_room', 'text'), f('scheduled_at', 'date'), f('status', 'select', false, { options: ['Scheduled', 'In Progress', 'Recovery', 'Completed', 'Cancelled'] })] },
    ],
    pages: [
      { slug: 'cases', title: 'OR Cases', type: 'list', schema: 'or-case' },
      { slug: 'schedule-case', title: 'Schedule Case', type: 'form', schema: 'or-case' },
    ],
  },

  {
    slug: 'nursing', name: 'Nursing', icon: '🩹', description: 'Assessments and medication administration (MAR).', enabledByDefault: false,
    schemas: [
      { slug: 'nursing-note', name: 'Nursing Note', fields: [f('patient_mrn', 'text', true), f('shift', 'select', false, { options: ['Day', 'Evening', 'Night'] }), f('note', 'textarea'), f('nurse', 'text')] },
      { slug: 'mar-entry', name: 'MAR Entry', fields: [f('patient_mrn', 'text', true), f('drug', 'text', true), f('dose', 'text'), f('administered_at', 'date'), f('nurse', 'text'), f('status', 'select', false, { options: ['Given', 'Held', 'Refused'] })] },
    ],
    pages: [
      { slug: 'notes', title: 'Nursing Notes', type: 'list', schema: 'nursing-note' },
      { slug: 'mar', title: 'MAR', type: 'list', schema: 'mar-entry' },
    ],
  },

  // ───────────────────────── Scheduling ─────────────────────────
  {
    slug: 'appointment-scheduling', name: 'Scheduling', icon: '📅', description: 'Multi-provider calendar, booking, waitlist and reminders.', enabledByDefault: true, roles: ['Front Desk', 'Nurse'],
    schemas: [
      { slug: 'provider', name: 'Provider', fields: [f('name', 'text', true), f('specialty', 'text'), f('room', 'text'), f('active', 'boolean')],
        sampleData: [
          { name: 'Dr. Patel', specialty: 'Family Medicine', room: '101', active: true },
          { name: 'Dr. Nguyen', specialty: 'Endocrinology', room: '102', active: true },
          { name: 'Dr. Singh', specialty: 'Cardiology', room: '103', active: true },
        ] },
      { slug: 'appointment', name: 'Appointment', fields: [f('patient_mrn', 'text', true), f('provider', 'text', true), f('start_time', 'date', true), f('duration_min', 'number'), f('reason', 'text'), f('status', 'select', false, { options: ['Booked', 'Checked In', 'Completed', 'No Show', 'Cancelled'] })],
        sampleData: [
          { patient_mrn: 'MRN1001', provider: 'Dr. Patel', start_time: new Date().toISOString().slice(0, 10), duration_min: 20, reason: 'Annual physical', status: 'Booked' },
          { patient_mrn: 'MRN1002', provider: 'Dr. Nguyen', start_time: new Date().toISOString().slice(0, 10), duration_min: 30, reason: 'Diabetes follow-up', status: 'Checked In' },
          { patient_mrn: 'MRN1003', provider: 'Dr. Patel', start_time: new Date().toISOString().slice(0, 10), duration_min: 15, reason: 'Sick visit', status: 'Booked' },
        ] },
      { slug: 'waitlist', name: 'Waitlist Entry', fields: [f('patient_mrn', 'text', true), f('provider', 'text'), f('requested_after', 'date'), f('priority', 'select', false, { options: ['Normal', 'Urgent'] })] },
    ],
    pages: [
      { slug: 'calendar', title: 'Appointments', type: 'list', schema: 'appointment' },
      { slug: 'book', title: 'Book Appointment', type: 'form', schema: 'appointment' },
      { slug: 'providers', title: 'Providers', type: 'list', schema: 'provider' },
      { slug: 'waitlist', title: 'Waitlist', type: 'list', schema: 'waitlist' },
      dashboard('schedule-dashboard', 'Front Desk', [
        header('Front Desk', "Today's schedule"),
        kpi('Today', [
          { metric: 'todays_appointments', label: "Today's Appointments", color: C.teal },
          { metric: 'no_shows', label: 'No Shows', color: C.red },
          { metric: 'count:provider', label: 'Providers', color: C.blue },
        ]),
        table('Appointments', 'appointment', 12),
      ]),
    ],
    automations: [{ name: 'Appointment Reminder', trigger: { type: 'schedule.daily' }, actions: [{ type: 'notify', config: { template: 'appointment_reminder' } }], enabled: true }],
  },

  // ───────────────────────── Revenue Cycle ─────────────────────────
  {
    slug: 'billing-claims', name: 'Billing & Claims', icon: '🧾', description: 'Charge capture, coding, claims worklist, scrubbing and denials.', enabledByDefault: true, roles: ['Biller', 'Admin'],
    schemas: [
      { slug: 'charge', name: 'Charge', fields: [f('patient_mrn', 'text', true), f('cpt_code', 'text'), f('description', 'text'), f('amount', 'number'), f('date', 'date')],
        sampleData: [{ patient_mrn: 'MRN1002', cpt_code: '99214', description: 'Office visit, established', amount: 180, date: new Date().toISOString().slice(0, 10) }] },
      { slug: 'claim', name: 'Insurance Claim', fields: [f('patient_mrn', 'text', true), f('payer', 'text', true), f('icd10_code', 'text'), f('cpt_code', 'text'), f('amount', 'number'), f('status', 'select', false, { options: ['Draft', 'Submitted', 'Accepted', 'Denied', 'Paid'] }), f('denial_reason', 'text')],
        sampleData: [
          { patient_mrn: 'MRN1002', payer: 'Aetna', icd10_code: 'E11.9', cpt_code: '99214', amount: 180, status: 'Submitted' },
          { patient_mrn: 'MRN1004', payer: 'Medicare', icd10_code: 'I10', cpt_code: '99213', amount: 120, status: 'Denied', denial_reason: 'Missing modifier' },
          { patient_mrn: 'MRN1001', payer: 'BlueCross', icd10_code: 'Z00.00', cpt_code: '99395', amount: 220, status: 'Paid' },
        ] },
    ],
    pages: [
      { slug: 'charges', title: 'Charges', type: 'list', schema: 'charge' },
      { slug: 'claims', title: 'Claims Worklist', type: 'list', schema: 'claim' },
      { slug: 'new-claim', title: 'New Claim', type: 'form', schema: 'claim' },
      dashboard('claims-dashboard', 'Revenue Cycle', [
        header('Revenue Cycle', 'Claims and denials'),
        kpi('Claims', [
          { metric: 'count:claim', label: 'Total Claims', color: C.blue },
          { metric: 'pending_claims', label: 'Pending', color: C.amber },
          { metric: 'denied_claims', label: 'Denied', color: C.red },
        ]),
        alert('Work denied claims first — they directly impact net collections.', 'danger'),
        table('Claims', 'claim', 12),
      ]),
    ],
    automations: [{ name: 'Claim Denial Follow-up', trigger: { type: 'record.created', entity: 'claim' }, actions: [{ type: 'task', config: { template: 'denial_followup' } }], enabled: true }],
  },

  {
    slug: 'eligibility', name: 'Eligibility & Auth', icon: '🪪', description: 'Payer registry, eligibility (270/271) and prior authorization.', enabledByDefault: false,
    schemas: [
      { slug: 'payer', name: 'Payer', fields: [f('name', 'text', true), f('plan_type', 'text'), f('payer_id', 'text'), f('phone', 'text')],
        sampleData: REFERENCE_DATA.payers },
      { slug: 'coverage', name: 'Coverage', fields: [f('patient_mrn', 'text', true), f('payer', 'text', true), f('member_id', 'text'), f('group_no', 'text'), f('copay', 'number'), f('deductible', 'number'), f('active', 'boolean')],
        sampleData: [
          { patient_mrn: 'MRN1002', payer: 'Aetna', member_id: 'AET-22', group_no: 'G1', copay: 25, deductible: 1500, active: true },
          { patient_mrn: 'MRN1004', payer: 'Medicare', member_id: 'MED-44', group_no: 'A', copay: 0, deductible: 240, active: true },
        ] },
      { slug: 'prior-auth', name: 'Prior Authorization', fields: [f('patient_mrn', 'text', true), f('service', 'text'), f('payer', 'text'), f('status', 'select', false, { options: ['Requested', 'Approved', 'Denied'] }), f('auth_number', 'text')] },
    ],
    pages: [
      { slug: 'payers', title: 'Payers', type: 'list', schema: 'payer' },
      { slug: 'coverages', title: 'Coverage', type: 'list', schema: 'coverage' },
      { slug: 'prior-auths', title: 'Prior Authorizations', type: 'list', schema: 'prior-auth' },
    ],
  },

  {
    slug: 'payments-ar', name: 'Payments & A/R', icon: '💳', description: 'ERA/EOB posting, statements and AR aging.', enabledByDefault: false,
    schemas: [
      { slug: 'invoice', name: 'Invoice', fields: [f('patient_mrn', 'text', true), f('service_date', 'date'), f('amount', 'number', true), f('status', 'select', false, { options: ['Open', 'Paid', 'Partially Paid', 'Written Off'] })],
        sampleData: [
          { patient_mrn: 'MRN1004', service_date: new Date().toISOString().slice(0, 10), amount: 120, status: 'Open' },
          { patient_mrn: 'MRN1002', service_date: new Date().toISOString().slice(0, 10), amount: 180, status: 'Partially Paid' },
        ] },
      { slug: 'payment', name: 'Payment', fields: [f('patient_mrn', 'text', true), f('amount', 'number', true), f('method', 'select', false, { options: ['Card', 'Cash', 'Check', 'ERA'] }), f('posted_date', 'date')] },
    ],
    pages: [
      { slug: 'invoices', title: 'Invoices', type: 'list', schema: 'invoice' },
      { slug: 'payments', title: 'Payments', type: 'list', schema: 'payment' },
      dashboard('ar-dashboard', 'Accounts Receivable', [
        header('Accounts Receivable', 'Outstanding balances'),
        kpi('A/R', [
          { metric: 'open_invoices', label: 'Open Invoices', color: C.amber },
          { metric: 'ar_total', label: 'A/R Balance', color: C.green },
        ]),
        table('Invoices', 'invoice', 12),
      ]),
    ],
  },

  // ───────────────────────── Engagement ─────────────────────────
  {
    slug: 'patient-portal', name: 'Patient Portal', icon: '🌐', description: 'Patient accounts, secure messages and intake forms.', enabledByDefault: false,
    schemas: [
      { slug: 'portal-account', name: 'Portal Account', fields: [f('patient_mrn', 'text', true), f('email', 'email'), f('status', 'select', false, { options: ['Invited', 'Active', 'Disabled'] })] },
      { slug: 'message', name: 'Secure Message', fields: [f('patient_mrn', 'text', true), f('subject', 'text'), f('body', 'textarea'), f('direction', 'select', false, { options: ['Inbound', 'Outbound'] }), f('status', 'select', false, { options: ['Unread', 'Read', 'Replied'] })] },
      { slug: 'intake-form', name: 'Intake Form', fields: [f('patient_mrn', 'text', true), f('form_type', 'text'), f('submitted_at', 'date'), f('status', 'select', false, { options: ['Pending', 'Completed'] })] },
    ],
    pages: [
      { slug: 'accounts', title: 'Portal Accounts', type: 'list', schema: 'portal-account' },
      { slug: 'messages', title: 'Secure Messages', type: 'list', schema: 'message' },
      { slug: 'intake', title: 'Intake Forms', type: 'list', schema: 'intake-form' },
    ],
  },

  {
    slug: 'telehealth', name: 'Telehealth', icon: '📹', description: 'Virtual visits and waiting room.', enabledByDefault: false,
    schemas: [
      { slug: 'tele-visit', name: 'Telehealth Visit', fields: [f('patient_mrn', 'text', true), f('provider', 'text'), f('scheduled_at', 'date'), f('join_url', 'url'), f('status', 'select', false, { options: ['Scheduled', 'Waiting', 'In Visit', 'Completed'] })] },
    ],
    pages: [
      { slug: 'visits', title: 'Telehealth Visits', type: 'list', schema: 'tele-visit' },
      { slug: 'schedule-visit', title: 'Schedule Visit', type: 'form', schema: 'tele-visit' },
    ],
  },

  // ───────────────────────── Analytics / Compliance / Interop ─────────────────────────
  {
    slug: 'analytics-quality', name: 'Analytics & Quality', icon: '📊', description: 'Quality measures and population registries.', enabledByDefault: false,
    pages: [
      dashboard('quality-dashboard', 'Quality & Analytics', [
        header('Quality & Population Health', 'HEDIS / MIPS-style measures computed from records'),
        kpi('Volumes', [
          { metric: 'count:patient', label: 'Patients', color: C.blue },
          { metric: 'count:encounter', label: 'Encounters', color: C.teal },
          { metric: 'count:claim', label: 'Claims', color: C.violet },
          { metric: 'abnormal_labs', label: 'Abnormal Labs', color: C.amber },
        ]),
        alert('Open the Quality Measures API (/api/v1/healthcare/quality/measures) for computed care-gap rates.', 'info'),
      ]),
    ],
  },

  {
    slug: 'compliance-audit', name: 'Compliance & Audit', icon: '🛡️', description: 'HIPAA audit log, consent and RBAC roles.', enabledByDefault: false, roles: ['Compliance Officer', 'Admin'],
    schemas: [
      { slug: 'audit-log', name: 'Audit Log', fields: [f('actor', 'text'), f('action', 'text'), f('entity', 'text'), f('record_id', 'text'), f('at', 'date')] },
      { slug: 'consent', name: 'Consent', fields: [f('patient_mrn', 'text', true), f('consent_type', 'text'), f('granted', 'boolean'), f('date', 'date')] },
    ],
    pages: [
      { slug: 'audit', title: 'Audit Log', type: 'list', schema: 'audit-log' },
      { slug: 'consents', title: 'Consents', type: 'list', schema: 'consent' },
    ],
  },

  {
    slug: 'interoperability', name: 'Interoperability', icon: '🔗', description: 'FHIR read API, referrals and document exchange.', enabledByDefault: false,
    schemas: [
      { slug: 'referral', name: 'Referral', fields: [f('patient_mrn', 'text', true), f('to_provider', 'text'), f('specialty', 'text'), f('reason', 'text'), f('status', 'select', false, { options: ['Sent', 'Scheduled', 'Completed'] })] },
    ],
    pages: [
      { slug: 'referrals', title: 'Referrals', type: 'list', schema: 'referral' },
      dashboard('interop', 'Interoperability', [
        header('Interoperability', 'FHIR R4 read API + referral exchange'),
        alert('FHIR endpoints: /api/v1/healthcare/fhir/Patient and /fhir/Observation (read-only projections).', 'info'),
        table('Referrals', 'referral', 12),
      ]),
    ],
  },
];

const HEALTHCARE: AppManifest = {
  name: 'Healthcare', slug: 'healthcare', version: '2.0.0', category: 'Healthcare', vendor: 'healthtech', runtime: 'declarative',
  description: 'Enterprise EHR/HIS/RCM suite — clinical charting, CPOE, e-Rx, labs, inpatient ADT, revenue cycle, patient engagement, analytics & interoperability. Manage modules from the in-app admin console.',
  longDescription: 'A complete, modular Healthcare platform competitive with leading health-IT systems: electronic health records, clinical charting (SOAP), computerized order entry with decision support, e-prescribing with drug-interaction checks, lab & radiology, inpatient ADT and bed management, full revenue-cycle (charge capture, claim scrubbing, eligibility, denials, A/R), patient portal & telehealth, quality analytics, HIPAA audit, and FHIR interoperability. Enable only the modules you need.',
  icon: '🏥', pricing: 'FREE', tags: ['healthcare', 'ehr', 'emr', 'his', 'rcm', 'fhir', 'clinic', 'hospital', 'industry'],
  modules: MODULES,
};

export const HEALTHCARE_BUNDLES: AppManifest[] = [HEALTHCARE];
