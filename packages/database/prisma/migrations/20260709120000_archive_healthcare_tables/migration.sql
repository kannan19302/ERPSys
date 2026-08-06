-- Healthcare moved to unierp-app-healthcare (its own database).
-- Archive-then-drop; a later release drops the _archived_ tables.
ALTER TABLE IF EXISTS "patients" RENAME TO "_archived_patients";
ALTER TABLE IF EXISTS "practitioners" RENAME TO "_archived_practitioners";
ALTER TABLE IF EXISTS "appointments" RENAME TO "_archived_appointments";
ALTER TABLE IF EXISTS "prescriptions" RENAME TO "_archived_prescriptions";
ALTER TABLE IF EXISTS "drug_register" RENAME TO "_archived_drug_register";
ALTER TABLE IF EXISTS "medical_encounters" RENAME TO "_archived_medical_encounters";
