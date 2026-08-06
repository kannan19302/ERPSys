-- ─────────────────────────────────────────────────────────────────
-- PostgreSQL Row-Level Security (RLS) Setup
-- ─────────────────────────────────────────────────────────────────
-- Run this SQL on the database to enable RLS and tenant isolation.
-- ─────────────────────────────────────────────────────────────────

-- Helper function to extract tenant ID from local transaction setting
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS VARCHAR AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::VARCHAR;
$$ LANGUAGE sql STABLE;

-- Helper to enable RLS and apply policies to a table
-- Parameters: table_name (text)
CREATE OR REPLACE PROCEDURE enable_tenant_rls(table_name text) AS $$
BEGIN
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Drop existing policy if any
  EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I', table_name);
  
  -- Create policy for Select/Insert/Update/Delete
  EXECUTE format(
    'CREATE POLICY tenant_isolation_policy ON %I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())',
    table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Apply RLS to all multi-tenant tables
DO $$
DECLARE
  t text;
  tables_to_isolate text[] := ARRAY[
    'users',
    'roles',
    'organizations',
    'departments',
    'employees',
    'customers',
    'vendors',
    'products',
    'warehouses',
    'inventory_items',
    'sales_orders',
    'sales_order_lines',
    'purchase_orders',
    'purchase_order_lines',
    'invoices',
    'invoice_lines',
    'payments',
    'audit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_isolate LOOP
    -- Only apply if table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = t
    ) THEN
      CALL enable_tenant_rls(t);
    END IF;
  END LOOP;
END;
$$;
