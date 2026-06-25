/**
 * Representative reference datasets for the Healthcare app's smart services. These are
 * demo subsets (NOT licensed full code sets) — enough to make eligibility checks, claim
 * scrubbing, drug-interaction checks, CDS and quality measures produce real results.
 */

export const REFERENCE_DATA = {
  payers: [
    { name: 'BlueCross', plan_type: 'PPO', payer_id: 'BCBS01', phone: '800-111-2222' },
    { name: 'Aetna', plan_type: 'HMO', payer_id: 'AETNA1', phone: '800-333-4444' },
    { name: 'UnitedHealth', plan_type: 'PPO', payer_id: 'UHC001', phone: '800-555-6666' },
    { name: 'Medicare', plan_type: 'Government', payer_id: 'MCARE0', phone: '800-633-4227' },
  ],

  // drug-drug / drug-class interactions (name pairs, severity)
  drugInteractions: [
    { a: 'Warfarin', b: 'Aspirin', severity: 'Major', note: 'Increased bleeding risk' },
    { a: 'Warfarin', b: 'Ibuprofen', severity: 'Major', note: 'Increased bleeding risk' },
    { a: 'Metformin', b: 'Contrast Dye', severity: 'Major', note: 'Risk of lactic acidosis' },
    { a: 'Lisinopril', b: 'Potassium', severity: 'Moderate', note: 'Hyperkalemia risk' },
    { a: 'Oxycodone', b: 'Benzodiazepine', severity: 'Major', note: 'Respiratory depression' },
  ],

  // ICD-10 subset (code → description)
  icd10: [
    { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
    { code: 'I10', description: 'Essential (primary) hypertension' },
    { code: 'J06.9', description: 'Acute upper respiratory infection' },
    { code: 'Z00.00', description: 'General adult medical examination' },
  ],

  // CPT subset (code → description, requires modifier?)
  cpt: [
    { code: '99213', description: 'Office visit, established, low complexity' },
    { code: '99214', description: 'Office visit, established, moderate complexity' },
    { code: '99395', description: 'Preventive visit, established, 18-39 yrs' },
    { code: '36415', description: 'Routine venipuncture', requiresModifier: false },
  ],

  loinc: [
    { code: '4548-4', name: 'Hemoglobin A1c' },
    { code: '2823-3', name: 'Potassium' },
    { code: '2160-0', name: 'Creatinine' },
  ],

  vaccines: [
    { name: 'Influenza', cvx_code: '88', series: 'Annual' },
    { name: 'COVID-19', cvx_code: '208', series: 'Primary + boosters' },
    { name: 'Tdap', cvx_code: '115', series: 'Every 10 years' },
  ],
};
