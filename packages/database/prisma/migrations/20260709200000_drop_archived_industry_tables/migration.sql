-- Drop the archived industry-module tables now that healthcare/education/
-- real-estate/field-service data lives in their own service databases and the
-- cutover is verified (#11). Safe: these tables are no longer read by any code.
DROP TABLE IF EXISTS "_archived_service_tickets" CASCADE;
DROP TABLE IF EXISTS "_archived_service_dispatches" CASCADE;
DROP TABLE IF EXISTS "_archived_technician_checklists" CASCADE;
DROP TABLE IF EXISTS "_archived_preventative_maintenances" CASCADE;
DROP TABLE IF EXISTS "_archived_students" CASCADE;
DROP TABLE IF EXISTS "_archived_courses" CASCADE;
DROP TABLE IF EXISTS "_archived_timetables" CASCADE;
DROP TABLE IF EXISTS "_archived_fee_structures" CASCADE;
DROP TABLE IF EXISTS "_archived_student_fees" CASCADE;
DROP TABLE IF EXISTS "_archived_book_register" CASCADE;
DROP TABLE IF EXISTS "_archived_book_transactions" CASCADE;
DROP TABLE IF EXISTS "_archived_properties" CASCADE;
DROP TABLE IF EXISTS "_archived_leases" CASCADE;
DROP TABLE IF EXISTS "_archived_property_maintenances" CASCADE;
DROP TABLE IF EXISTS "_archived_agent_commissions" CASCADE;
DROP TABLE IF EXISTS "_archived_patients" CASCADE;
DROP TABLE IF EXISTS "_archived_practitioners" CASCADE;
DROP TABLE IF EXISTS "_archived_appointments" CASCADE;
DROP TABLE IF EXISTS "_archived_prescriptions" CASCADE;
DROP TABLE IF EXISTS "_archived_drug_register" CASCADE;
DROP TABLE IF EXISTS "_archived_medical_encounters" CASCADE;
