-- Field Service moved to unierp-app-fieldservice (its own database).
-- Archive-then-drop: rename core tables so a bad cutover is recoverable;
-- a later release drops the _archived_ tables.
ALTER TABLE IF EXISTS "service_tickets" RENAME TO "_archived_service_tickets";
ALTER TABLE IF EXISTS "service_dispatches" RENAME TO "_archived_service_dispatches";
ALTER TABLE IF EXISTS "technician_checklists" RENAME TO "_archived_technician_checklists";
ALTER TABLE IF EXISTS "preventative_maintenances" RENAME TO "_archived_preventative_maintenances";
