-- Education and Real Estate moved to unierp-app-education / unierp-app-realestate
-- (their own databases). Archive-then-drop; a later release drops the _archived_ tables.
ALTER TABLE IF EXISTS "students" RENAME TO "_archived_students";
ALTER TABLE IF EXISTS "courses" RENAME TO "_archived_courses";
ALTER TABLE IF EXISTS "timetables" RENAME TO "_archived_timetables";
ALTER TABLE IF EXISTS "fee_structures" RENAME TO "_archived_fee_structures";
ALTER TABLE IF EXISTS "student_fees" RENAME TO "_archived_student_fees";
ALTER TABLE IF EXISTS "book_register" RENAME TO "_archived_book_register";
ALTER TABLE IF EXISTS "book_transactions" RENAME TO "_archived_book_transactions";
ALTER TABLE IF EXISTS "properties" RENAME TO "_archived_properties";
ALTER TABLE IF EXISTS "leases" RENAME TO "_archived_leases";
ALTER TABLE IF EXISTS "property_maintenances" RENAME TO "_archived_property_maintenances";
ALTER TABLE IF EXISTS "agent_commissions" RENAME TO "_archived_agent_commissions";
