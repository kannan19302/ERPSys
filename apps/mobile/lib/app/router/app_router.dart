import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/entities/session.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/mfa_challenge_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/auth/presentation/pages/verify_email_pending_page.dart';
import '../../features/auth/presentation/pages/auth_profile_page.dart';
import '../../features/auth/presentation/pages/auth_security_page.dart';
import '../../features/auth/presentation/pages/auth_sessions_page.dart';
import '../../features/auth/presentation/providers/auth_providers.dart';
import '../../features/auth/presentation/providers/auth_state.dart';
import '../../features/crm/presentation/pages/customer_detail_page.dart';
import '../../features/crm/presentation/pages/customer_list_page.dart';
import '../../features/crm/presentation/pages/customer_form_page.dart';
import '../../features/crm/presentation/pages/lead_list_page.dart';
import '../../features/crm/presentation/pages/lead_form_page.dart';
import '../../features/crm/presentation/pages/contact_list_page.dart';
import '../../features/crm/presentation/pages/contact_detail_page.dart';
import '../../features/crm/presentation/pages/contact_form_page.dart';
import '../../features/crm/presentation/pages/activity_list_page.dart';
import '../../features/crm/presentation/pages/activity_detail_page.dart';
import '../../features/crm/presentation/pages/activity_form_page.dart';
import '../../features/crm/presentation/pages/lead_source_list_page.dart';
import '../../features/crm/presentation/pages/lead_source_form_page.dart';
import '../../features/crm/presentation/pages/email_template_list_page.dart';
import '../../features/crm/presentation/pages/email_template_detail_page.dart';
import '../../features/crm/presentation/pages/email_template_form_page.dart';
import '../../features/finance/presentation/pages/invoice_detail_page.dart';
import '../../features/finance/presentation/pages/invoice_list_page.dart';
import '../../features/finance/presentation/pages/payment_list_page.dart';
import '../../features/finance/presentation/pages/payment_detail_page.dart';
import '../../features/finance/presentation/pages/payment_form_page.dart';
import '../../features/finance/presentation/pages/credit_note_list_page.dart';
import '../../features/finance/presentation/pages/credit_note_detail_page.dart';
import '../../features/finance/presentation/pages/credit_note_form_page.dart';
import '../../features/finance/presentation/pages/journal_entry_list_page.dart';
import '../../features/finance/presentation/pages/journal_entry_detail_page.dart';
import '../../features/finance/presentation/pages/journal_entry_form_page.dart';
import '../../features/finance/presentation/pages/chart_of_account_list_page.dart';
import '../../features/finance/presentation/pages/chart_of_account_detail_page.dart';
import '../../features/finance/presentation/pages/chart_of_account_form_page.dart';
import '../../features/finance/presentation/pages/budget_list_page.dart';
import '../../features/finance/presentation/pages/budget_detail_page.dart';
import '../../features/finance/presentation/pages/budget_form_page.dart';
import '../../features/finance/presentation/pages/tax_rate_list_page.dart';
import '../../features/finance/presentation/pages/tax_rate_detail_page.dart';
import '../../features/finance/presentation/pages/tax_rate_form_page.dart';
import '../../features/finance/presentation/pages/tax_filing_list_page.dart';
import '../../features/finance/presentation/pages/tax_filing_detail_page.dart';
import '../../features/finance/presentation/pages/tax_filing_form_page.dart';
import '../../features/finance/presentation/pages/bank_account_list_page.dart';
import '../../features/finance/presentation/pages/bank_account_detail_page.dart';
import '../../features/finance/presentation/pages/bank_account_form_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/hr/presentation/pages/employee_detail_page.dart';
import '../../features/hr/presentation/pages/employee_list_page.dart';
import '../../features/hr/presentation/pages/leave_request_list_page.dart';
import '../../features/hr/presentation/pages/leave_request_form_page.dart';
import '../../features/hr/presentation/pages/leave_type_list_page.dart';
import '../../features/hr/presentation/pages/leave_type_detail_page.dart';
import '../../features/hr/presentation/pages/leave_type_form_page.dart';
import '../../features/hr/presentation/pages/department_list_page.dart';
import '../../features/hr/presentation/pages/department_detail_page.dart';
import '../../features/hr/presentation/pages/department_form_page.dart';
import '../../features/hr/presentation/pages/attendance_list_page.dart';
import '../../features/hr/presentation/pages/attendance_detail_page.dart';
import '../../features/hr/presentation/pages/attendance_form_page.dart';
import '../../features/hr/presentation/pages/timesheet_list_page.dart' as hr_ts;
import '../../features/hr/presentation/pages/timesheet_detail_page.dart' as hr_ts_det;
import '../../features/hr/presentation/pages/timesheet_form_page.dart' as hr_ts_form;
import '../../features/hr/presentation/pages/performance_review_list_page.dart';
import '../../features/hr/presentation/pages/performance_review_detail_page.dart';
import '../../features/hr/presentation/pages/performance_review_form_page.dart';
import '../../features/hr/presentation/pages/payroll_run_list_page.dart';
import '../../features/hr/presentation/pages/payroll_run_detail_page.dart';
import '../../features/hr/presentation/pages/payroll_run_form_page.dart';
import '../../features/hr/presentation/pages/payroll_entry_list_page.dart';
import '../../features/hr/presentation/pages/payroll_entry_detail_page.dart';
import '../../features/inventory/presentation/pages/product_detail_page.dart';
import '../../features/inventory/presentation/pages/product_list_page.dart';
import '../../features/inventory/presentation/pages/product_category_list_page.dart';
import '../../features/inventory/presentation/pages/product_category_detail_page.dart';
import '../../features/inventory/presentation/pages/product_category_form_page.dart';
import '../../features/inventory/presentation/pages/warehouse_list_page.dart';
import '../../features/inventory/presentation/pages/warehouse_detail_page.dart';
import '../../features/inventory/presentation/pages/warehouse_form_page.dart';
import '../../features/inventory/presentation/pages/stock_movement_list_page.dart';
import '../../features/inventory/presentation/pages/stock_movement_detail_page.dart';
import '../../features/inventory/presentation/pages/stock_movement_form_page.dart';
import '../../features/inventory/presentation/pages/stock_level_list_page.dart';
import '../../features/inventory/presentation/pages/stock_level_detail_page.dart';
import '../../features/inventory/presentation/pages/reorder_rule_list_page.dart';
import '../../features/inventory/presentation/pages/reorder_rule_detail_page.dart';
import '../../features/inventory/presentation/pages/reorder_rule_form_page.dart';
import '../../features/inventory/presentation/pages/inventory_adjustment_list_page.dart';
import '../../features/inventory/presentation/pages/inventory_adjustment_detail_page.dart';
import '../../features/inventory/presentation/pages/inventory_adjustment_form_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/procurement/presentation/pages/purchase_order_detail_page.dart';
import '../../features/procurement/presentation/pages/purchase_order_list_page.dart';
import '../../features/procurement/presentation/pages/purchase_order_form_page.dart';
import '../../features/procurement/presentation/pages/vendor_list_page.dart';
import '../../features/procurement/presentation/pages/vendor_detail_page.dart';
import '../../features/procurement/presentation/pages/vendor_form_page.dart';
import '../../features/procurement/presentation/pages/rfq_list_page.dart';
import '../../features/procurement/presentation/pages/rfq_detail_page.dart';
import '../../features/procurement/presentation/pages/rfq_form_page.dart';
import '../../features/procurement/presentation/pages/purchase_receipt_list_page.dart';
import '../../features/procurement/presentation/pages/purchase_receipt_detail_page.dart';
import '../../features/procurement/presentation/pages/purchase_receipt_form_page.dart';
import '../../features/procurement/presentation/pages/purchase_requisition_list_page.dart';
import '../../features/procurement/presentation/pages/purchase_requisition_detail_page.dart';
import '../../features/procurement/presentation/pages/purchase_requisition_form_page.dart';
import '../../features/procurement/presentation/pages/supplier_quotation_list_page.dart';
import '../../features/procurement/presentation/pages/supplier_quotation_detail_page.dart';
import '../../features/procurement/presentation/pages/supplier_quotation_form_page.dart';
import '../../features/procurement/presentation/pages/supplier_contract_list_page.dart';
import '../../features/procurement/presentation/pages/supplier_contract_detail_page.dart';
import '../../features/procurement/presentation/pages/supplier_contract_form_page.dart';
import '../../features/sales/presentation/pages/quotation_detail_page.dart';
import '../../features/sales/presentation/pages/quotation_list_page.dart';
import '../../features/sales/presentation/pages/quotation_form_page.dart';
import '../../features/sales/presentation/pages/sales_order_detail_page.dart';
import '../../features/sales/presentation/pages/sales_order_list_page.dart';
import '../../features/sales/presentation/pages/sales_order_form_page.dart';
import '../../features/sales/presentation/pages/opportunity_list_page.dart';
import '../../features/sales/presentation/pages/opportunity_detail_page.dart';
import '../../features/sales/presentation/pages/opportunity_form_page.dart';
import '../../features/sales/presentation/pages/delivery_note_list_page.dart';
import '../../features/sales/presentation/pages/delivery_note_detail_page.dart';
import '../../features/sales/presentation/pages/delivery_note_form_page.dart';
import '../../features/sales/presentation/pages/sales_return_list_page.dart';
import '../../features/sales/presentation/pages/sales_return_detail_page.dart';
import '../../features/sales/presentation/pages/sales_return_form_page.dart';
import '../../features/supply_chain/presentation/pages/shipment_list_page.dart';
import '../../features/supply_chain/presentation/pages/shipment_detail_page.dart';
import '../../features/supply_chain/presentation/pages/carrier_list_page.dart';
import '../../features/supply_chain/presentation/pages/carrier_detail_page.dart';
import '../../features/supply_chain/presentation/pages/demand_forecast_list_page.dart';
import '../../features/supply_chain/presentation/pages/reorder_suggestion_list_page.dart';
import '../../features/supply_chain/presentation/pages/supply_chain_route_list_page.dart';
import '../../features/supply_chain/presentation/pages/supply_chain_route_detail_page.dart';
import '../../features/supply_chain/presentation/pages/supply_chain_route_form_page.dart';
import '../../features/supply_chain/presentation/pages/dock_appointment_list_page.dart';
import '../../features/supply_chain/presentation/pages/dock_appointment_detail_page.dart';
import '../../features/supply_chain/presentation/pages/dock_appointment_form_page.dart';
import '../../features/supply_chain/presentation/pages/warehouse_transfer_list_page.dart';
import '../../features/supply_chain/presentation/pages/warehouse_transfer_detail_page.dart';
import '../../features/supply_chain/presentation/pages/warehouse_transfer_form_page.dart';
import '../../features/supply_chain/presentation/pages/tracking_event_list_page.dart';
import '../../features/pos/presentation/pages/pos_order_list_page.dart';
import '../../features/pos/presentation/pages/pos_order_detail_page.dart';
import '../../features/pos/presentation/pages/pos_order_form_page.dart';
import '../../features/pos/presentation/pages/pos_register_list_page.dart';
import '../../features/pos/presentation/pages/pos_register_detail_page.dart';
import '../../features/pos/presentation/pages/pos_register_form_page.dart';
import '../../features/pos/presentation/pages/pos_shift_list_page.dart';
import '../../features/pos/presentation/pages/pos_shift_detail_page.dart';
import '../../features/pos/presentation/pages/pos_shift_form_page.dart';
import '../../features/pos/presentation/pages/pos_price_list_list_page.dart';
import '../../features/pos/presentation/pages/pos_price_list_detail_page.dart';
import '../../features/pos/presentation/pages/pos_price_list_form_page.dart';
import '../../features/pos/presentation/pages/pos_discount_list_page.dart';
import '../../features/pos/presentation/pages/pos_discount_detail_page.dart';
import '../../features/pos/presentation/pages/pos_discount_form_page.dart';
import '../../features/pos/presentation/pages/pos_coupon_list_page.dart';
import '../../features/pos/presentation/pages/pos_coupon_detail_page.dart';
import '../../features/pos/presentation/pages/pos_coupon_form_page.dart';
import '../../features/pos/presentation/pages/pos_gift_card_list_page.dart';
import '../../features/pos/presentation/pages/pos_gift_card_detail_page.dart';
import '../../features/pos/presentation/pages/pos_gift_card_form_page.dart';
import '../../features/pos/presentation/pages/pos_loyalty_program_list_page.dart';
import '../../features/pos/presentation/pages/pos_loyalty_program_detail_page.dart';
import '../../features/pos/presentation/pages/pos_loyalty_program_form_page.dart';
import '../../features/pos/presentation/pages/pos_loyalty_member_list_page.dart';
import '../../features/pos/presentation/pages/pos_loyalty_member_detail_page.dart';
import '../../features/manufacturing/presentation/pages/work_order_list_page.dart';
import '../../features/manufacturing/presentation/pages/work_order_detail_page.dart';
import '../../features/manufacturing/presentation/pages/work_order_form_page.dart';
import '../../features/manufacturing/presentation/pages/bom_list_page.dart';
import '../../features/manufacturing/presentation/pages/bom_detail_page.dart';
import '../../features/manufacturing/presentation/pages/bom_form_page.dart';
import '../../features/manufacturing/presentation/pages/mrp_run_list_page.dart';
import '../../features/manufacturing/presentation/pages/mrp_run_detail_page.dart';
import '../../features/manufacturing/presentation/pages/mrp_run_form_page.dart';
import '../../features/manufacturing/presentation/pages/manufacturing_dashboard_page.dart';
import '../../features/manufacturing/presentation/pages/workstation_list_page.dart';
import '../../features/manufacturing/presentation/pages/workstation_detail_page.dart';
import '../../features/manufacturing/presentation/pages/workstation_form_page.dart';
import '../../features/manufacturing/presentation/pages/routing_list_page.dart';
import '../../features/manufacturing/presentation/pages/routing_detail_page.dart';
import '../../features/manufacturing/presentation/pages/routing_form_page.dart';
import '../../features/manufacturing/presentation/pages/quality_inspection_list_page.dart';
import '../../features/manufacturing/presentation/pages/quality_inspection_detail_page.dart';
import '../../features/manufacturing/presentation/pages/quality_inspection_form_page.dart';
import '../../features/manufacturing/presentation/pages/eco_list_page.dart';
import '../../features/manufacturing/presentation/pages/eco_detail_page.dart';
import '../../features/manufacturing/presentation/pages/eco_form_page.dart';
import '../../features/projects/presentation/pages/project_list_page.dart';
import '../../features/projects/presentation/pages/project_detail_page.dart';
import '../../features/projects/presentation/pages/project_form_page.dart';
import '../../features/projects/presentation/pages/milestone_list_page.dart';
import '../../features/projects/presentation/pages/project_milestone_form_page.dart';
import '../../features/projects/presentation/pages/task_list_page.dart';
import '../../features/projects/presentation/pages/project_task_form_page.dart';
import '../../features/projects/presentation/pages/timesheet_list_page.dart' as proj_ts;
import '../../features/projects/presentation/pages/timesheet_detail_page.dart' as proj_ts_det;
import '../../features/projects/presentation/pages/timesheet_form_page.dart' as proj_ts_form;
import '../../features/projects/presentation/pages/project_portfolio_list_page.dart';
import '../../features/projects/presentation/pages/project_portfolio_detail_page.dart';
import '../../features/projects/presentation/pages/project_portfolio_form_page.dart';
import '../../features/projects/presentation/pages/project_budget_list_page.dart';
import '../../features/projects/presentation/pages/project_budget_detail_page.dart';
import '../../features/projects/presentation/pages/project_budget_form_page.dart';
import '../../features/projects/presentation/pages/project_risk_list_page.dart';
import '../../features/projects/presentation/pages/project_risk_detail_page.dart';
import '../../features/projects/presentation/pages/project_risk_form_page.dart';
import '../../features/documents/presentation/pages/documents_list_page.dart';
import '../../features/documents/presentation/pages/document_folders_list_page.dart';
import '../../features/documents/presentation/pages/folder_detail_page.dart';
import '../../features/documents/presentation/pages/folder_form_page.dart';
import '../../features/documents/presentation/pages/document_template_detail_page.dart';
import '../../features/documents/presentation/pages/document_template_form_page.dart';
import '../../features/drive/presentation/pages/drive_file_list_page.dart';
import '../../features/drive/presentation/pages/drive_folder_list_page.dart';
import '../../features/drive/presentation/pages/file_detail_page.dart';
import '../../features/workflow/presentation/pages/workflow_list_page.dart';
import '../../features/workflow/presentation/pages/workflow_approval_list_page.dart';
import '../../features/workflow/presentation/pages/workflow_detail_page.dart';
import '../../features/advanced_finance/presentation/pages/financial_close_task_list_page.dart';
import '../../features/advanced_finance/presentation/pages/financial_close_task_detail_page.dart';
import '../../features/advanced_finance/presentation/pages/financial_close_task_form_page.dart';
import '../../features/advanced_finance/presentation/pages/multi_currency_rate_list_page.dart';
import '../../features/advanced_finance/presentation/pages/multi_currency_rate_detail_page.dart';
import '../../features/advanced_finance/presentation/pages/multi_currency_rate_form_page.dart';
import '../../features/fixed_assets/presentation/pages/fixed_asset_list_page.dart';
import '../../features/fixed_assets/presentation/pages/asset_detail_page.dart';
import '../../features/advanced_hr/presentation/pages/compensation_band_list_page.dart';
import '../../features/advanced_hr/presentation/pages/compensation_band_detail_page.dart';
import '../../features/advanced_hr/presentation/pages/compensation_band_form_page.dart';
import '../../features/advanced_hr/presentation/pages/learning_path_list_page.dart';
import '../../features/advanced_hr/presentation/pages/learning_path_detail_page.dart';
import '../../features/advanced_hr/presentation/pages/learning_path_form_page.dart';
import '../../features/people/presentation/pages/person_list_page.dart';
import '../../features/people/presentation/pages/person_detail_page.dart';
import '../../features/people/presentation/pages/person_form_page.dart';

// analytics & reporting
import '../../features/analytics/presentation/pages/dashboard_list_page.dart';
import '../../features/analytics/presentation/pages/dashboard_detail_page.dart';
import '../../features/analytics/presentation/pages/dashboard_form_page.dart';
import '../../features/analytics/presentation/pages/kpi_list_page.dart';
import '../../features/analytics/presentation/pages/kpi_detail_page.dart';
import '../../features/analytics/presentation/pages/kpi_form_page.dart';
import '../../features/analytics/presentation/pages/pipeline_list_page.dart';
import '../../features/analytics/presentation/pages/pipeline_detail_page.dart';
import '../../features/analytics/presentation/pages/report_list_page.dart';
import '../../features/analytics/presentation/pages/report_detail_page.dart';
import '../../features/analytics/presentation/pages/report_form_page.dart';
import '../../features/reporting/presentation/pages/compliance_list_page.dart';
import '../../features/reporting/presentation/pages/compliance_form_page.dart';
import '../../features/reporting/presentation/pages/export_list_page.dart';
import '../../features/reporting/presentation/pages/export_form_page.dart';
import '../../features/reporting/presentation/pages/job_list_page.dart';
import '../../features/reporting/presentation/pages/job_detail_page.dart';
import '../../features/reporting/presentation/pages/job_form_page.dart';
import '../../features/reporting/presentation/pages/template_list_page.dart';
import '../../features/reporting/presentation/pages/template_detail_page.dart';
import '../../features/reporting/presentation/pages/template_form_page.dart';

// ai, search & saved_views
import '../../features/ai/presentation/pages/model_list_page.dart';
import '../../features/ai/presentation/pages/model_detail_page.dart';
import '../../features/ai/presentation/pages/model_form_page.dart';
import '../../features/ai/presentation/pages/prediction_list_page.dart';
import '../../features/ai/presentation/pages/prediction_detail_page.dart';
import '../../features/ai/presentation/pages/prediction_form_page.dart';
import '../../features/ai/presentation/pages/prompt_list_page.dart';
import '../../features/ai/presentation/pages/prompt_detail_page.dart';
import '../../features/ai/presentation/pages/prompt_form_page.dart';
import '../../features/ai/presentation/pages/training_data_list_page.dart';
import '../../features/ai/presentation/pages/training_data_detail_page.dart';
import '../../features/ai/presentation/pages/training_data_form_page.dart';
import '../../features/search/presentation/pages/search_result_page.dart';
import '../../features/search/presentation/pages/search_synonym_list_page.dart';
import '../../features/search/presentation/pages/synonym_form_page.dart';
import '../../features/saved_views/presentation/pages/saved_view_list_page.dart';
import '../../features/saved_views/presentation/pages/saved_view_detail_page.dart';
import '../../features/saved_views/presentation/pages/saved_view_form_page.dart';

// builder
import '../../features/builder/presentation/pages/builder_form_list_page.dart';
import '../../features/builder/presentation/pages/builder_form_detail_page.dart';
import '../../features/builder/presentation/pages/builder_form_form_page.dart';
import '../../features/builder/presentation/pages/builder_page_detail_page.dart';
import '../../features/builder/presentation/pages/builder_page_form_page.dart';

// communication
import '../../features/communication/presentation/pages/message_list_page.dart';
import '../../features/communication/presentation/pages/notification_list_page.dart';
import '../../features/communication/presentation/pages/channel_detail_page.dart';
import '../../features/communication/presentation/pages/channel_form_page.dart';
import '../../features/communication/presentation/pages/message_detail_page.dart';
import '../../features/communication/presentation/pages/meeting_form_page.dart';
import '../../features/communication/presentation/pages/poll_form_page.dart';

// ecommerce & marketplace
import '../../features/ecommerce/presentation/pages/ecommerce_product_list_page.dart';
import '../../features/ecommerce/presentation/pages/product_detail_page.dart';
import '../../features/ecommerce/presentation/pages/product_form_page.dart';
import '../../features/ecommerce/presentation/pages/category_form_page.dart';
import '../../features/ecommerce/presentation/pages/order_detail_page.dart';
import '../../features/marketplace/presentation/pages/marketplace_app_list_page.dart';

// service management
import '../../features/service_management/presentation/pages/service_catalog_list_page.dart';

import '../../features/service_management/presentation/pages/service_request_detail_page.dart';
import '../../features/service_management/presentation/pages/catalog_item_detail_page.dart';
import '../../features/service_management/presentation/pages/sla_detail_page.dart';

// admin & system
import '../../features/admin/presentation/pages/admin_user_list_page.dart';
import '../../features/admin/presentation/pages/admin_user_form_page.dart';
import '../../features/admin/presentation/pages/admin_role_list_page.dart';
import '../../features/admin/presentation/pages/admin_role_detail_page.dart';
import '../../features/admin/presentation/pages/admin_role_form_page.dart';
import '../../features/admin/presentation/pages/admin_tenant_list_page.dart';
import '../../features/admin/presentation/pages/admin_tenant_detail_page.dart';
import '../../features/admin/presentation/pages/admin_tenant_form_page.dart';
import '../../features/admin/presentation/pages/audit_log_list_page.dart';
import '../../features/admin/presentation/pages/admin_api_key_list_page.dart';
import '../../features/admin/presentation/pages/admin_api_key_detail_page.dart';
import '../../features/admin/presentation/pages/admin_api_key_form_page.dart';
import '../../features/admin/presentation/pages/admin_settings_list_page.dart';
import '../../features/admin/presentation/pages/admin_settings_detail_page.dart';
import '../../features/admin/presentation/pages/admin_setting_edit_page.dart';
import '../../features/admin/presentation/pages/admin_system_health_page.dart';
import '../../features/api_platform/presentation/pages/api_key_list_page.dart';
import '../../features/api_platform/presentation/pages/api_key_detail_page.dart';
import '../../features/api_platform/presentation/pages/api_key_form_page.dart';
import '../../features/api_platform/presentation/pages/webhook_form_page.dart';
import '../../features/api_platform/presentation/pages/usage_log_list_page.dart';
import '../../features/api_platform/presentation/pages/usage_log_detail_page.dart';
import '../../features/localization/presentation/pages/language_list_page.dart';
import '../../features/localization/presentation/pages/language_detail_page.dart';
import '../../features/localization/presentation/pages/language_form_page.dart';
import '../../features/pwa/presentation/pages/push_subscription_list_page.dart';
import '../../features/pwa/presentation/pages/push_subscription_detail_page.dart';
import '../../features/pwa/presentation/pages/offline_queue_page.dart';
import '../../features/pwa/presentation/pages/manifest_form_page.dart';
import '../../features/storage/presentation/pages/bucket_list_page.dart';
import '../../features/storage/presentation/pages/file_list_page.dart';
import '../../features/storage/presentation/pages/bucket_detail_page.dart';
import '../../features/storage/presentation/pages/bucket_form_page.dart';

// saas & platform
import '../../features/saas/presentation/pages/saas_plan_list_page.dart';
import '../../features/saas/presentation/pages/saas_plan_detail_page.dart';
import '../../features/saas/presentation/pages/saas_plan_form_page.dart';
import '../../features/saas/presentation/pages/saas_subscription_list_page.dart';
import '../../features/saas/presentation/pages/saas_subscription_detail_page.dart';
import '../../features/saas/presentation/pages/saas_tenant_list_page.dart';
import '../../features/saas/presentation/pages/saas_tenant_detail_page.dart';
import '../../features/saas/presentation/pages/saas_tenant_form_page.dart';
import '../../features/saas_portal/presentation/pages/portal_plan_list_page.dart';
import '../../features/saas_portal/presentation/pages/portal_support_ticket_list_page.dart';
import '../../features/saas_portal/presentation/pages/plan_detail_page.dart';
import '../../features/subscriptions/presentation/pages/subscription_billing_list_page.dart';
import '../../features/subscriptions/presentation/pages/subscription_plan_list_page.dart';
import '../../features/subscriptions/presentation/pages/plan_detail_page.dart' as sub_plan_detail;
import '../../features/subscriptions/presentation/pages/billing_form_page.dart';
import '../../features/subscriptions/presentation/pages/plan_form_page.dart';
import '../../features/subscriptions/presentation/pages/billing_detail_page.dart';
import '../../features/blockchain/presentation/pages/blockchain_contract_list_page.dart';
import '../../features/blockchain/presentation/pages/blockchain_transaction_list_page.dart';
import '../../features/blockchain/presentation/pages/contract_detail_page.dart';
import '../../features/blockchain/presentation/pages/contract_form_page.dart';
import '../../features/blockchain/presentation/pages/transaction_detail_page.dart';

// industry modules
import '../../features/healthcare/presentation/pages/appointment_list_page.dart';
import '../../features/healthcare/presentation/pages/appointment_detail_page.dart';
import '../../features/healthcare/presentation/pages/patient_list_page.dart';
import '../../features/healthcare/presentation/pages/patient_detail_page.dart';
import '../../features/education/presentation/pages/course_list_page.dart';
import '../../features/education/presentation/pages/course_detail_page.dart';
import '../../features/education/presentation/pages/course_form_page.dart';
import '../../features/education/presentation/pages/student_list_page.dart';
import '../../features/education/presentation/pages/student_detail_page.dart';
import '../../features/education/presentation/pages/student_form_page.dart';
import '../../features/education/presentation/pages/enrollment_form_page.dart';
import '../../features/education/presentation/pages/exam_form_page.dart';
import '../../features/education/presentation/pages/gradebook_form_page.dart';
import '../../features/field_service/presentation/pages/service_ticket_list_page.dart';
import '../../features/field_service/presentation/pages/technician_list_page.dart';
import '../../features/field_service/presentation/pages/ticket_detail_page.dart';
import '../../features/field_service/presentation/pages/technician_detail_page.dart';
import '../../features/field_service/presentation/pages/contract_detail_page.dart';
import '../../features/real_estate/presentation/pages/property_list_page.dart';
import '../../features/real_estate/presentation/pages/property_detail_page.dart';
import '../../features/real_estate/presentation/pages/property_form_page.dart';
import '../../features/real_estate/presentation/pages/lease_detail_page.dart';
import '../../features/real_estate/presentation/pages/tenant_detail_page.dart';

import '../shell/app_shell.dart';
import '../../features/field_service/presentation/pages/schedule_form_page.dart';
import '../../features/field_service/presentation/pages/technician_form_page.dart';
import '../../features/field_service/presentation/pages/ticket_form_page.dart';
import '../../features/fixed_assets/presentation/pages/asset_form_page.dart';
import '../../features/fixed_assets/presentation/pages/disposal_form_page.dart';
import '../../features/fixed_assets/presentation/pages/maintenance_form_page.dart';
import '../../features/healthcare/presentation/pages/lab_order_form_page.dart';
import '../../features/healthcare/presentation/pages/patient_form_page.dart';
import '../../features/healthcare/presentation/pages/prescription_detail_page.dart';
import '../../features/healthcare/presentation/pages/prescription_form_page.dart';
import '../../features/saas_portal/presentation/pages/saas_portal_plan_detail_page.dart';
import '../../features/saas_portal/presentation/pages/saas_portal_support_ticket_detail_page.dart';
import '../../features/saas_portal/presentation/pages/saas_portal_support_ticket_form_page.dart';

final Provider<GoRouter> appRouterProvider = Provider<GoRouter>((Ref ref) {
  final GoRouter router = GoRouter(
    initialLocation: HomePage.routePath,
    refreshListenable: _AuthRefreshListenable(ref),
    redirect: (BuildContext context, GoRouterState state) {
      final AuthState auth = ref.read(authControllerProvider);
      final String location = state.matchedLocation;

      final bool onSplash = location == '/splash';
      final bool onLogin = location == LoginPage.routePath;
      final bool onMfa = location == MfaChallengePage.routePath;
      final bool onRegister = location == RegisterPage.routePath;
      final bool onVerifyPending = location == VerifyEmailPendingPage.routePath;

      if (auth.status == AuthStatus.initialising) {
        return onSplash ? null : '/splash';
      }
      if (auth.status == AuthStatus.mfaRequired) {
        return onMfa ? null : MfaChallengePage.routePath;
      }
      if (!auth.isAuthenticated) {
        if (onLogin || onRegister || onVerifyPending) return null;
        return LoginPage.routePath;
      }
      if (onLogin || onMfa || onSplash || onRegister || onVerifyPending) {
        return HomePage.routePath;
      }
      return null;
    },
    routes: <RouteBase>[
      GoRoute(path: '/splash', builder: (_, __) => const SplashPage()),
      GoRoute(
        path: LoginPage.routePath,
        name: LoginPage.routeName,
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: RegisterPage.routePath,
        name: RegisterPage.routeName,
        builder: (_, __) => const RegisterPage(),
      ),
      GoRoute(
        path: VerifyEmailPendingPage.routePath,
        name: VerifyEmailPendingPage.routeName,
        redirect: (_, GoRouterState state) =>
            state.extra is RegisteredAccount ? null : LoginPage.routePath,
        builder: (_, GoRouterState state) => VerifyEmailPendingPage(
          account: state.extra! as RegisteredAccount,
        ),
      ),
      GoRoute(
        path: MfaChallengePage.routePath,
        name: MfaChallengePage.routeName,
        builder: (_, __) => const MfaChallengePage(),
      ),
      GoRoute(
        path: OnboardingPage.routePath,
        name: OnboardingPage.routeName,
        builder: (_, __) => const OnboardingPage(),
      ),
      GoRoute(
        path: AuthProfilePage.routePath,
        name: AuthProfilePage.routeName,
        builder: (_, __) => const AuthProfilePage(),
      ),
      GoRoute(
        path: AuthSecurityPage.routePath,
        name: AuthSecurityPage.routeName,
        builder: (_, __) => const AuthSecurityPage(),
      ),
      GoRoute(
        path: AuthSessionsPage.routePath,
        name: AuthSessionsPage.routeName,
        builder: (_, __) => const AuthSessionsPage(),
      ),
            GoRoute(
        path: ScheduleFormPage.routePath,
        name: ScheduleFormPage.routeName,
        builder: (_, __) => const ScheduleFormPage(),
      ),
      GoRoute(
        path: TechnicianFormPage.routePath,
        name: TechnicianFormPage.routeName,
        builder: (_, __) => const TechnicianFormPage(),
      ),
      GoRoute(
        path: TicketFormPage.routePath,
        name: TicketFormPage.routeName,
        builder: (_, __) => const TicketFormPage(),
      ),
      GoRoute(
        path: AssetFormPage.routePath,
        name: AssetFormPage.routeName,
        builder: (_, __) => const AssetFormPage(),
      ),
      GoRoute(
        path: DisposalFormPage.routePath,
        name: DisposalFormPage.routeName,
        builder: (_, __) => const DisposalFormPage(),
      ),
      GoRoute(
        path: MaintenanceFormPage.routePath,
        name: MaintenanceFormPage.routeName,
        builder: (_, __) => const MaintenanceFormPage(),
      ),
      GoRoute(
        path: LabOrderFormPage.routePath,
        name: LabOrderFormPage.routeName,
        builder: (_, __) => const LabOrderFormPage(),
      ),
      GoRoute(
        path: PatientFormPage.routePath,
        name: PatientFormPage.routeName,
        builder: (_, __) => const PatientFormPage(),
      ),
      GoRoute(
        path: PrescriptionDetailPage.routePath,
        name: PrescriptionDetailPage.routeName,
        builder: (_, GoRouterState state) => PrescriptionDetailPage(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: PrescriptionFormPage.routePath,
        name: PrescriptionFormPage.routeName,
        builder: (_, __) => const PrescriptionFormPage(),
      ),
      GoRoute(
        path: SaasPortalPlanDetailPage.routePath,
        name: SaasPortalPlanDetailPage.routeName,
        builder: (_, GoRouterState state) => SaasPortalPlanDetailPage(planId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(
        path: SaasPortalSupportTicketDetailPage.routePath,
        name: SaasPortalSupportTicketDetailPage.routeName,
        builder: (_, GoRouterState state) => SaasPortalSupportTicketDetailPage(ticketId: state.pathParameters['id'] ?? ''),
      ),
      GoRoute(
        path: SaasPortalSupportTicketFormPage.routePath,
        name: SaasPortalSupportTicketFormPage.routeName,
        builder: (_, __) => const SaasPortalSupportTicketFormPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, StatefulNavigationShell shell) =>
            AppShell(navigationShell: shell),
        branches: <StatefulShellBranch>[
          // ── Home ──
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: HomePage.routePath,
                name: HomePage.routeName,
                builder: (_, __) => const HomePage(),
              ),
            ],
          ),
          // ── Inventory ──────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ProductListPage.routePath,
                name: ProductListPage.routeName,
                builder: (_, __) => const ProductListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: ProductDetailPage.routeName,
                    builder: (_, GoRouterState state) => ProductDetailPage(
                      productId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'categories',
                    name: ProductCategoryListPage.routeName,
                    builder: (_, __) => const ProductCategoryListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ProductCategoryDetailPage.routeName,
                        builder: (_, GoRouterState state) => ProductCategoryDetailPage(
                          categoryId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ProductCategoryFormPage.routeName,
                        builder: (_, __) => const ProductCategoryFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'warehouses',
                    name: WarehouseListPage.routeName,
                    builder: (_, __) => const WarehouseListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: WarehouseDetailPage.routeName,
                        builder: (_, GoRouterState state) => WarehouseDetailPage(
                          warehouseId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: WarehouseFormPage.routeName,
                        builder: (_, __) => const WarehouseFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'stock-levels',
                    name: StockLevelListPage.routeName,
                    builder: (_, __) => const StockLevelListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: StockLevelDetailPage.routeName,
                        builder: (_, GoRouterState state) => StockLevelDetailPage(
                          stockLevelId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'stock-movements',
                    name: StockMovementListPage.routeName,
                    builder: (_, __) => const StockMovementListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: StockMovementDetailPage.routeName,
                        builder: (_, GoRouterState state) => StockMovementDetailPage(
                          movementId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: StockMovementFormPage.routeName,
                        builder: (_, __) => const StockMovementFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'reorder-rules',
                    name: ReorderRuleListPage.routeName,
                    builder: (_, __) => const ReorderRuleListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ReorderRuleDetailPage.routeName,
                        builder: (_, GoRouterState state) => ReorderRuleDetailPage(
                          ruleId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ReorderRuleFormPage.routeName,
                        builder: (_, __) => const ReorderRuleFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'adjustments',
                    name: InventoryAdjustmentListPage.routeName,
                    builder: (_, __) => const InventoryAdjustmentListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: InventoryAdjustmentDetailPage.routeName,
                        builder: (_, GoRouterState state) => InventoryAdjustmentDetailPage(
                          adjustmentId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: InventoryAdjustmentFormPage.routeName,
                        builder: (_, __) => const InventoryAdjustmentFormPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Sales ──────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: QuotationListPage.routePath,
                name: QuotationListPage.routeName,
                builder: (_, __) => const QuotationListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'quotation/:id',
                    name: QuotationDetailPage.routeName,
                    builder: (_, GoRouterState state) => QuotationDetailPage(
                      quotationId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: QuotationFormPage.routeName,
                    builder: (_, __) => const QuotationFormPage(),
                  ),
                  GoRoute(
                    path: 'orders',
                    name: SalesOrderListPage.routeName,
                    builder: (_, __) => const SalesOrderListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'order/:id',
                        name: SalesOrderDetailPage.routeName,
                        builder: (_, GoRouterState state) => SalesOrderDetailPage(
                          orderId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: SalesOrderFormPage.routeName,
                        builder: (_, __) => const SalesOrderFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'customers',
                    name: CustomerListPage.routeName,
                    builder: (_, __) => const CustomerListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: CustomerDetailPage.routeName,
                        builder: (_, GoRouterState state) => CustomerDetailPage(
                          customerId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
name: CustomerFormPage.routeName,
                      builder: (_, __) => const CustomerFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'leads',
                    name: LeadListPage.routeName,
                    builder: (_, __) => const LeadListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'new',
                        name: LeadFormPage.routeName,
                        builder: (_, __) => const LeadFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'opportunities',
                    name: OpportunityListPage.routeName,
                    builder: (_, __) => const OpportunityListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: OpportunityDetailPage.routeName,
                        builder: (_, GoRouterState state) => OpportunityDetailPage(
                          opportunityId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: OpportunityFormPage.routeName,
                        builder: (_, __) => const OpportunityFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'delivery-notes',
                    name: DeliveryNoteListPage.routeName,
                    builder: (_, __) => const DeliveryNoteListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: DeliveryNoteDetailPage.routeName,
                        builder: (_, GoRouterState state) => DeliveryNoteDetailPage(
                          deliveryNoteId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: DeliveryNoteFormPage.routeName,
                        builder: (_, __) => const DeliveryNoteFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'returns',
                    name: SalesReturnListPage.routeName,
                    builder: (_, __) => const SalesReturnListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: SalesReturnDetailPage.routeName,
                        builder: (_, GoRouterState state) => SalesReturnDetailPage(
                          salesReturnId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: SalesReturnFormPage.routeName,
                        builder: (_, __) => const SalesReturnFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'contacts',
                    name: 'contacts',
                    builder: (_, __) => const ContactListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ContactDetailPage.routeName,
                        builder: (_, GoRouterState state) => ContactDetailPage(
                          contactId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ContactFormPage.routeName,
                        builder: (_, __) => const ContactFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'activities',
                    name: ActivityListPage.routeName,
                    builder: (_, __) => const ActivityListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ActivityDetailPage.routeName,
                        builder: (_, GoRouterState state) => ActivityDetailPage(
                          activityId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ActivityFormPage.routeName,
                        builder: (_, __) => const ActivityFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'email-templates',
                    name: EmailTemplateListPage.routeName,
                    builder: (_, __) => const EmailTemplateListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: EmailTemplateDetailPage.routeName,
                        builder: (_, GoRouterState state) => EmailTemplateDetailPage(
                          templateId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: EmailTemplateFormPage.routeName,
                        builder: (_, __) => const EmailTemplateFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'lead-sources',
                    name: LeadSourceListPage.routeName,
                    builder: (_, __) => const LeadSourceListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'new',
                        name: LeadSourceFormPage.routeName,
                        builder: (_, __) => const LeadSourceFormPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Finance ────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: InvoiceListPage.routePath,
                name: InvoiceListPage.routeName,
                builder: (_, __) => const InvoiceListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: InvoiceDetailPage.routeName,
                    builder: (_, GoRouterState state) => InvoiceDetailPage(
                      invoiceId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'payments',
                    name: PaymentListPage.routeName,
                    builder: (_, __) => const PaymentListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PaymentDetailPage.routeName,
                        builder: (_, GoRouterState state) => PaymentDetailPage(
                          paymentId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PaymentFormPage.routeName,
                        builder: (_, __) => const PaymentFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'purchase-orders',
                    name: PurchaseOrderListPage.routeName,
                    builder: (_, __) => const PurchaseOrderListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PurchaseOrderDetailPage.routeName,
                        builder: (_, GoRouterState state) => PurchaseOrderDetailPage(
                          poId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'po-new',
                        builder: (_, __) => const PurchaseOrderFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'vendors',
                    name: VendorListPage.routeName,
                    builder: (_, __) => const VendorListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'vendor-detail',
                        builder: (_, GoRouterState state) => VendorDetailPage(
                          vendorId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'vendor-new',
                        builder: (_, __) => const VendorFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'credit-notes',
                    name: CreditNoteListPage.routeName,
                    builder: (_, __) => const CreditNoteListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: CreditNoteDetailPage.routeName,
                        builder: (_, GoRouterState state) => CreditNoteDetailPage(
                          creditNoteId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: CreditNoteFormPage.routeName,
                        builder: (_, __) => const CreditNoteFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'journal-entries',
                    name: JournalEntryListPage.routeName,
                    builder: (_, __) => const JournalEntryListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: JournalEntryDetailPage.routeName,
                        builder: (_, GoRouterState state) => JournalEntryDetailPage(
                          journalEntryId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: JournalEntryFormPage.routeName,
                        builder: (_, __) => const JournalEntryFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'chart-of-accounts',
                    name: ChartOfAccountListPage.routeName,
                    builder: (_, __) => const ChartOfAccountListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ChartOfAccountDetailPage.routeName,
                        builder: (_, GoRouterState state) => ChartOfAccountDetailPage(
                          accountId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ChartOfAccountFormPage.routeName,
                        builder: (_, __) => const ChartOfAccountFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'budgets',
                    name: BudgetListPage.routeName,
                    builder: (_, __) => const BudgetListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: BudgetDetailPage.routeName,
                        builder: (_, GoRouterState state) => BudgetDetailPage(
                          budgetId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: BudgetFormPage.routeName,
                        builder: (_, __) => const BudgetFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'tax-rates',
                    name: TaxRateListPage.routeName,
                    builder: (_, __) => const TaxRateListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: TaxRateDetailPage.routeName,
                        builder: (_, GoRouterState state) => TaxRateDetailPage(
                          taxRateId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: TaxRateFormPage.routeName,
                        builder: (_, __) => const TaxRateFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'tax-filings',
                    name: TaxFilingListPage.routeName,
                    builder: (_, __) => const TaxFilingListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: TaxFilingDetailPage.routeName,
                        builder: (_, GoRouterState state) => TaxFilingDetailPage(
                          taxFilingId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: TaxFilingFormPage.routeName,
                        builder: (_, __) => const TaxFilingFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'bank-accounts',
                    name: BankAccountListPage.routeName,
                    builder: (_, __) => const BankAccountListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: BankAccountDetailPage.routeName,
                        builder: (_, GoRouterState state) => BankAccountDetailPage(
                          bankAccountId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: BankAccountFormPage.routeName,
                        builder: (_, __) => const BankAccountFormPage(),
                      ),
                    ],
                  ),
                  // ── Procurement sub-routes ──
                  GoRoute(
                    path: 'rfqs',
                    name: RFQListPage.routeName,
                    builder: (_, __) => const RFQListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: RFQDetailPage.routeName,
                        builder: (_, GoRouterState state) => RFQDetailPage(
                          rfqId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: RFQFormPage.routeName,
                        builder: (_, __) => const RFQFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'purchase-receipts',
                    name: PurchaseReceiptListPage.routeName,
                    builder: (_, __) => const PurchaseReceiptListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PurchaseReceiptDetailPage.routeName,
                        builder: (_, GoRouterState state) => PurchaseReceiptDetailPage(
                          receiptId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PurchaseReceiptFormPage.routeName,
                        builder: (_, __) => const PurchaseReceiptFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'purchase-requisitions',
                    name: PurchaseRequisitionListPage.routeName,
                    builder: (_, __) => const PurchaseRequisitionListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PurchaseRequisitionDetailPage.routeName,
                        builder: (_, GoRouterState state) => PurchaseRequisitionDetailPage(
                          requisitionId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PurchaseRequisitionFormPage.routeName,
                        builder: (_, __) => const PurchaseRequisitionFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'supplier-quotations',
                    name: SupplierQuotationListPage.routeName,
                    builder: (_, __) => const SupplierQuotationListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: SupplierQuotationDetailPage.routeName,
                        builder: (_, GoRouterState state) => SupplierQuotationDetailPage(
                          quotationId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: SupplierQuotationFormPage.routeName,
                        builder: (_, __) => const SupplierQuotationFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'supplier-contracts',
                    name: SupplierContractListPage.routeName,
                    builder: (_, __) => const SupplierContractListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: SupplierContractDetailPage.routeName,
                        builder: (_, GoRouterState state) => SupplierContractDetailPage(
                          contractId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: SupplierContractFormPage.routeName,
                        builder: (_, __) => const SupplierContractFormPage(),
                      ),
                    ],
                  ),
                  // ── Advanced Finance ──
                  GoRoute(
                    path: 'advanced-finance',
                    name: 'advanced-finance',
                    builder: (_, __) => const FinancialCloseTaskListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'close-tasks',
                        name: FinancialCloseTaskListPage.routeName,
                        builder: (_, __) => const FinancialCloseTaskListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: FinancialCloseTaskDetailPage.routeName,
                            builder: (_, GoRouterState state) => FinancialCloseTaskDetailPage(
                              taskId: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: FinancialCloseTaskFormPage.routeName,
                            builder: (_, __) => const FinancialCloseTaskFormPage(),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'currency-rates',
                        name: MultiCurrencyRateListPage.routeName,
                        builder: (_, __) => const MultiCurrencyRateListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: MultiCurrencyRateDetailPage.routeName,
                            builder: (_, GoRouterState state) => MultiCurrencyRateDetailPage(
                              rateId: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: MultiCurrencyRateFormPage.routeName,
                            builder: (_, __) => const MultiCurrencyRateFormPage(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  // ── Fixed Assets ──
                  GoRoute(
                    path: 'fixed-assets',
                    name: FixedAssetListPage.routeName,
                    builder: (_, __) => const FixedAssetListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'fixed-asset-detail',
                        builder: (_, GoRouterState state) => AssetDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── HR ──────────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: EmployeeListPage.routePath,
                name: EmployeeListPage.routeName,
                builder: (_, __) => const EmployeeListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: EmployeeDetailPage.routeName,
                    builder: (_, GoRouterState state) => EmployeeDetailPage(
                      employeeId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'leave',
                    name: LeaveRequestListPage.routeName,
                    builder: (_, __) => const LeaveRequestListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'new',
                        name: LeaveRequestFormPage.routeName,
                        builder: (_, __) => const LeaveRequestFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'leave-types',
                    name: LeaveTypeListPage.routeName,
                    builder: (_, __) => const LeaveTypeListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: LeaveTypeDetailPage.routeName,
                        builder: (_, GoRouterState state) => LeaveTypeDetailPage(
                          leaveTypeId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: LeaveTypeFormPage.routeName,
                        builder: (_, __) => const LeaveTypeFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'departments',
                    name: DepartmentListPage.routeName,
                    builder: (_, __) => const DepartmentListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: DepartmentDetailPage.routeName,
                        builder: (_, GoRouterState state) => DepartmentDetailPage(
                          departmentId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: DepartmentFormPage.routeName,
                        builder: (_, __) => const DepartmentFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'attendance',
                    name: AttendanceListPage.routeName,
                    builder: (_, __) => const AttendanceListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: AttendanceDetailPage.routeName,
                        builder: (_, GoRouterState state) => AttendanceDetailPage(
                          attendanceId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: AttendanceFormPage.routeName,
                        builder: (_, __) => const AttendanceFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'timesheets',
                    name: hr_ts.TimesheetListPage.routeName,
                    builder: (_, __) => const hr_ts.TimesheetListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: hr_ts_det.TimesheetDetailPage.routeName,
                        builder: (_, GoRouterState state) => hr_ts_det.TimesheetDetailPage(
                          timesheetId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: hr_ts_form.TimesheetFormPage.routeName,
                        builder: (_, __) => const hr_ts_form.TimesheetFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'performance-reviews',
                    name: PerformanceReviewListPage.routeName,
                    builder: (_, __) => const PerformanceReviewListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PerformanceReviewDetailPage.routeName,
                        builder: (_, GoRouterState state) => PerformanceReviewDetailPage(
                          performanceReviewId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PerformanceReviewFormPage.routeName,
                        builder: (_, __) => const PerformanceReviewFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'payroll',
                    name: PayrollRunListPage.routeName,
                    builder: (_, __) => const PayrollRunListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PayrollRunDetailPage.routeName,
                        builder: (_, GoRouterState state) => PayrollRunDetailPage(
                          payrollRunId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PayrollRunFormPage.routeName,
                        builder: (_, __) => const PayrollRunFormPage(),
                      ),
                      GoRoute(
                        path: ':runId/entries',
                        name: PayrollEntryListPage.routeName,
                        builder: (_, GoRouterState state) => PayrollEntryListPage(
                          payrollRunId: state.pathParameters['runId']!,
                        ),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: PayrollEntryDetailPage.routeName,
                            builder: (_, GoRouterState state) => PayrollEntryDetailPage(
                              payslipId: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  // ── Advanced HR ──
                  GoRoute(
                    path: 'advanced-hr',
                    name: 'advanced-hr',
                    builder: (_, __) => const CompensationBandListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'compensation-bands',
                        name: CompensationBandListPage.routeName,
                        builder: (_, __) => const CompensationBandListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: CompensationBandDetailPage.routeName,
                            builder: (_, GoRouterState state) => CompensationBandDetailPage(
                              bandId: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: CompensationBandFormPage.routeName,
                            builder: (_, __) => const CompensationBandFormPage(),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'learning-paths',
                        name: LearningPathListPage.routeName,
                        builder: (_, __) => const LearningPathListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: LearningPathDetailPage.routeName,
                            builder: (_, GoRouterState state) => LearningPathDetailPage(
                              pathId: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: LearningPathFormPage.routeName,
                            builder: (_, __) => const LearningPathFormPage(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  // ── People Directory ──
                  GoRoute(
                    path: 'people',
                    name: PersonListPage.routeName,
                    builder: (_, __) => const PersonListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'person-detail',
                        builder: (_, GoRouterState state) => PersonDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'person-new',
                        builder: (_, __) => const PersonFormPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Notifications ──
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: NotificationsPage.routePath,
                name: NotificationsPage.routeName,
                builder: (_, __) => const NotificationsPage(),
              ),
            ],
          ),
          // ── Supply Chain ───────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ShipmentListPage.routePath,
                name: ShipmentListPage.routeName,
                builder: (_, __) => const ShipmentListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: ShipmentDetailPage.routeName,
                    builder: (_, GoRouterState state) => ShipmentDetailPage(
                      shipmentId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'carriers',
                    name: CarrierListPage.routeName,
                    builder: (_, __) => const CarrierListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: CarrierDetailPage.routeName,
                        builder: (_, GoRouterState state) => CarrierDetailPage(
                          carrierId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'demand-forecast',
                    name: DemandForecastListPage.routeName,
                    builder: (_, __) => const DemandForecastListPage(),
                  ),
                  GoRoute(
                    path: 'reorder-suggestions',
                    name: ReorderSuggestionListPage.routeName,
                    builder: (_, __) => const ReorderSuggestionListPage(),
                  ),
                  GoRoute(
                    path: 'routes',
                    name: SupplyChainRouteListPage.routeName,
                    builder: (_, __) => const SupplyChainRouteListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: SupplyChainRouteDetailPage.routeName,
                        builder: (_, GoRouterState state) => SupplyChainRouteDetailPage(
                          routeId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: SupplyChainRouteFormPage.routeName,
                        builder: (_, __) => const SupplyChainRouteFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'dock-appointments',
                    name: DockAppointmentListPage.routeName,
                    builder: (_, __) => const DockAppointmentListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: DockAppointmentDetailPage.routeName,
                        builder: (_, GoRouterState state) => DockAppointmentDetailPage(
                          appointmentId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: DockAppointmentFormPage.routeName,
                        builder: (_, __) => const DockAppointmentFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'warehouse-transfers',
                    name: WarehouseTransferListPage.routeName,
                    builder: (_, __) => const WarehouseTransferListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: WarehouseTransferDetailPage.routeName,
                        builder: (_, GoRouterState state) => WarehouseTransferDetailPage(
                          transferId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: WarehouseTransferFormPage.routeName,
                        builder: (_, __) => const WarehouseTransferFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'tracking-events',
                    name: TrackingEventListPage.routeName,
                    builder: (_, __) => const TrackingEventListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ── POS ────────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: PosOrderListPage.routePath,
                name: PosOrderListPage.routeName,
                builder: (_, __) => const PosOrderListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: PosOrderDetailPage.routeName,
                    builder: (_, GoRouterState state) => PosOrderDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: PosOrderFormPage.routeName,
                    builder: (_, __) => const PosOrderFormPage(),
                  ),
                  GoRoute(
                    path: 'registers',
                    name: PosRegisterListPage.routeName,
                    builder: (_, __) => const PosRegisterListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PosRegisterDetailPage.routeName,
                        builder: (_, GoRouterState state) => PosRegisterDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PosRegisterFormPage.routeName,
                        builder: (_, __) => const PosRegisterFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'shifts',
                    name: PosShiftListPage.routeName,
                    builder: (_, __) => const PosShiftListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PosShiftDetailPage.routeName,
                        builder: (_, GoRouterState state) => PosShiftDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'pos-shift-new',
                        builder: (_, __) => const PosShiftFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'price-lists',
                    name: PosPriceListListPage.routeName,
                    builder: (_, __) => const PosPriceListListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'pos-price-list-detail',
                        builder: (_, GoRouterState state) => PosPriceListDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PosPriceListFormPage.routeName,
                        builder: (_, __) => const PosPriceListFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'discounts',
                    name: PosDiscountListPage.routeName,
                    builder: (_, __) => const PosDiscountListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PosDiscountDetailPage.routeName,
                        builder: (_, GoRouterState state) => PosDiscountDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: PosDiscountFormPage.routeName,
                        builder: (_, __) => const PosDiscountFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'coupons',
                    name: 'pos-coupons',
                    builder: (_, __) => const PosCouponListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'pos-coupon-detail',
                        builder: (_, GoRouterState state) => PosCouponDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'pos-coupon-new',
                        builder: (_, __) => const PosCouponFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'gift-cards',
                    name: 'pos-gift-cards',
                    builder: (_, __) => const PosGiftCardListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'pos-gift-card-detail',
                        builder: (_, GoRouterState state) => PosGiftCardDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'pos-gift-card-new',
                        builder: (_, __) => const PosGiftCardFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'loyalty-programs',
                    name: 'pos-loyalty-programs',
                    builder: (_, __) => const PosLoyaltyProgramListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'pos-loyalty-program-detail',
                        builder: (_, GoRouterState state) => PosLoyaltyProgramDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'pos-loyalty-program-new',
                        builder: (_, __) => const PosLoyaltyProgramFormPage(),
                      ),
                      GoRoute(
                        path: 'members',
                        name: 'pos-loyalty-members',
                        builder: (_, __) => const PosLoyaltyMemberListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'pos-loyalty-member-detail',
                            builder: (_, GoRouterState state) => PosLoyaltyMemberDetailPage(
                              id: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Manufacturing ──────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ManufacturingDashboardPage.routePath,
                name: ManufacturingDashboardPage.routeName,
                builder: (_, __) => const ManufacturingDashboardPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'work-orders',
                    name: WorkOrderListPage.routeName,
                    builder: (_, __) => const WorkOrderListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: WorkOrderDetailPage.routeName,
                        builder: (_, GoRouterState state) => WorkOrderDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: WorkOrderFormPage.routeName,
                        builder: (_, __) => const WorkOrderFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'boms',
                    name: BomListPage.routeName,
                    builder: (_, __) => const BomListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: BomDetailPage.routeName,
                        builder: (_, GoRouterState state) => BomDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: BomFormPage.routeName,
                        builder: (_, __) => const BomFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'mrp',
                    name: MrpRunListPage.routeName,
                    builder: (_, __) => const MrpRunListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: MrpRunDetailPage.routeName,
                        builder: (_, GoRouterState state) => MrpRunDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: MrpRunFormPage.routeName,
                        builder: (_, __) => const MrpRunFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'workstations',
                    name: WorkstationListPage.routeName,
                    builder: (_, __) => const WorkstationListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: WorkstationDetailPage.routeName,
                        builder: (_, GoRouterState state) => WorkstationDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: WorkstationFormPage.routeName,
                        builder: (_, __) => const WorkstationFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'routings',
                    name: RoutingListPage.routeName,
                    builder: (_, __) => const RoutingListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: RoutingDetailPage.routeName,
                        builder: (_, GoRouterState state) => RoutingDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: RoutingFormPage.routeName,
                        builder: (_, __) => const RoutingFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'quality-inspections',
                    name: QualityInspectionListPage.routeName,
                    builder: (_, __) => const QualityInspectionListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: QualityInspectionDetailPage.routeName,
                        builder: (_, GoRouterState state) => QualityInspectionDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: QualityInspectionFormPage.routeName,
                        builder: (_, __) => const QualityInspectionFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'engineering-change-orders',
                    name: EcoListPage.routeName,
                    builder: (_, __) => const EcoListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: EcoDetailPage.routeName,
                        builder: (_, GoRouterState state) => EcoDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: EcoFormPage.routeName,
                        builder: (_, __) => const EcoFormPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Projects ───────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ProjectListPage.routePath,
                name: ProjectListPage.routeName,
                builder: (_, __) => const ProjectListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: ProjectDetailPage.routeName,
                    builder: (_, GoRouterState state) => ProjectDetailPage(
                      projectId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: ProjectFormPage.routeName,
                    builder: (_, __) => const ProjectFormPage(),
                  ),
                  GoRoute(
                    path: 'milestones',
                    name: MilestoneListPage.routeName,
                    builder: (_, __) => const MilestoneListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'new',
                        name: ProjectMilestoneFormPage.routeName,
                        builder: (_, __) => const ProjectMilestoneFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'tasks',
                    name: TaskListPage.routeName,
                    builder: (_, __) => const TaskListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'new',
                        name: ProjectTaskFormPage.routeName,
                        builder: (_, __) => const ProjectTaskFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'portfolios',
                    name: ProjectPortfolioListPage.routeName,
                    builder: (_, __) => const ProjectPortfolioListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ProjectPortfolioDetailPage.routeName,
                        builder: (_, GoRouterState state) => ProjectPortfolioDetailPage(
                          portfolioId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ProjectPortfolioFormPage.routeName,
                        builder: (_, __) => const ProjectPortfolioFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'budgets',
                    name: ProjectBudgetListPage.routeName,
                    builder: (_, __) => const ProjectBudgetListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ProjectBudgetDetailPage.routeName,
                        builder: (_, GoRouterState state) => ProjectBudgetDetailPage(
                          budgetId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ProjectBudgetFormPage.routeName,
                        builder: (_, __) => const ProjectBudgetFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'risks',
                    name: ProjectRiskListPage.routeName,
                    builder: (_, __) => const ProjectRiskListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: ProjectRiskDetailPage.routeName,
                        builder: (_, GoRouterState state) => ProjectRiskDetailPage(
                          riskId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: ProjectRiskFormPage.routeName,
                        builder: (_, __) => const ProjectRiskFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'timesheets',
                    name: proj_ts.TimesheetListPage.routeName,
                    builder: (_, __) => const proj_ts.TimesheetListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: proj_ts_det.TimesheetDetailPage.routeName,
                        builder: (_, GoRouterState state) => proj_ts_det.TimesheetDetailPage(
                          timesheetId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: proj_ts_form.TimesheetFormPage.routeName,
                        builder: (_, __) => const proj_ts_form.TimesheetFormPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Documents & Drive ──────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: DocumentsListPage.routePath,
                name: DocumentsListPage.routeName,
                builder: (_, __) => const DocumentsListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'folders',
                    name: DocumentFoldersListPage.routeName,
                    builder: (_, __) => const DocumentFoldersListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'folder-detail',
                        builder: (_, GoRouterState state) => FolderDetailPage(
                          folderId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'folder-new',
                        builder: (_, __) => const FolderFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'templates',
                    name: 'document-templates',
                    builder: (_, __) => const ReportTemplateListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'template-detail',
                        builder: (_, GoRouterState state) => DocumentTemplateDetailPage(
                          templateId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'template-new',
                        builder: (_, __) => const DocumentTemplateFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'drive',
                    name: 'drive',
                    builder: (_, __) => const DriveFileListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'files',
                        name: DriveFileListPage.routeName,
                        builder: (_, __) => const DriveFileListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'drive-file-detail',
                            builder: (_, GoRouterState state) => DriveFileDetailPage(
                              fileId: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'folders',
                        name: DriveFolderListPage.routeName,
                        builder: (_, __) => const DriveFolderListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'drive-folder-detail',
                            builder: (_, GoRouterState state) => DriveFolderDetailPage(
                              folderId: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Workflow ───────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: WorkflowListPage.routePath,
                name: WorkflowListPage.routeName,
                builder: (_, __) => const WorkflowListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'definitions/:id',
                    name: 'workflow-detail',
                    builder: (_, GoRouterState state) => WorkflowDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'definitions/new',
                    name: 'workflow-new',
                    builder: (_, __) => const WorkflowDetailPage(),
                  ),
                  GoRoute(
                    path: 'approvals',
                    name: WorkflowApprovalListPage.routeName,
                    builder: (_, __) => const WorkflowApprovalListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'approval-detail',
                        builder: (_, GoRouterState state) => WorkflowDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: ':id/action',
                        name: 'approval-action',
                        builder: (_, GoRouterState state) => WorkflowDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'tasks/new',
                        name: 'workflow-task-new',
                        builder: (_, __) => const WorkflowDetailPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Analytics & BI
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: DashboardListPage.routePath,
                name: DashboardListPage.routeName,
                builder: (_, __) => const DashboardListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'dashboard-detail',
                    builder: (_, GoRouterState state) => DashboardDetailPage(
                      dashboardId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: 'dashboard-new',
                    builder: (_, __) => const DashboardFormPage(),
                  ),
                  GoRoute(
                    path: 'kpis',
                    name: KpiListPage.routeName,
                    builder: (_, __) => const KpiListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'kpi-detail',
                        builder: (_, GoRouterState state) => KpiDetailPage(
                          kpiId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'kpi-new',
                        builder: (_, __) => const KpiFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'pipelines',
                    name: PipelineListPage.routeName,
                    builder: (_, __) => const PipelineListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'pipeline-detail',
                        builder: (_, GoRouterState state) => PipelineDetailPage(
                          pipelineId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'reports',
                    name: AnalyticsReportListPage.routeName,
                    builder: (_, __) => const AnalyticsReportListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'report-detail',
                        builder: (_, GoRouterState state) => ReportDetailPage(
                          reportId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'report-new',
                        builder: (_, __) => const ReportFormPage(),
                      ),
                      GoRoute(
                        path: 'compliance',
                        name: ReportComplianceListPage.routeName,
                        builder: (_, __) => const ReportComplianceListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: 'new',
                            name: 'compliance-new',
                            builder: (_, __) => const ComplianceFormPage(),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'exports',
                        name: ReportExportListPage.routeName,
                        builder: (_, __) => const ReportExportListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: 'new',
                            name: 'export-new',
                            builder: (_, __) => const ExportFormPage(),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'jobs',
                        name: ReportJobListPage.routeName,
                        builder: (_, __) => const ReportJobListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'job-detail',
                            builder: (_, GoRouterState state) => ReportJobDetailPage(
                              jobId: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: 'job-new',
                            builder: (_, __) => const ReportJobFormPage(),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'templates',
                        name: 'report-templates',
                        builder: (_, __) => const ReportTemplateListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'report-template-detail',
                            builder: (_, GoRouterState state) => TemplateDetailPage(
                          id: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: 'report-template-new',
                            builder: (_, __) => const ReportTemplateFormPage(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // AI & Search
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AiModelListPage.routePath,
                name: AiModelListPage.routeName,
                builder: (_, __) => const AiModelListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'ai-model-detail',
                    builder: (_, GoRouterState state) => AiModelDetailPage(
                      modelId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: 'ai-model-new',
                    builder: (_, __) => const AiModelFormPage(),
                  ),
                  GoRoute(
                    path: 'predictions',
                    name: AiPredictionListPage.routeName,
                    builder: (_, __) => const AiPredictionListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'ai-prediction-detail',
                        builder: (_, GoRouterState state) => AiPredictionDetailPage(
                          predictionId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'ai-prediction-new',
                        builder: (_, __) => const AiPredictionFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'prompts',
                    name: AiPromptListPage.routeName,
                    builder: (_, __) => const AiPromptListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'ai-prompt-detail',
                        builder: (_, GoRouterState state) => PromptDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'ai-prompt-new',
                        builder: (_, __) => const AiPromptFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'training',
                    name: AiTrainingDataListPage.routeName,
                    builder: (_, __) => const AiTrainingDataListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'ai-training-data-detail',
                        builder: (_, GoRouterState state) => TrainingDataDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'ai-training-data-new',
                        builder: (_, __) => const AiTrainingDataFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'search',
                    name: 'search',
                    builder: (_, __) => const SearchResultPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'synonyms',
                        name: SearchSynonymListPage.routeName,
                        builder: (_, __) => const SearchSynonymListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: 'new',
                            name: 'synonym-new',
                            builder: (_, __) => const SynonymFormPage(),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'saved-views',
                        name: SavedViewListPage.routeName,
                        builder: (_, __) => const SavedViewListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'saved-view-detail',
                            builder: (_, GoRouterState state) => SavedViewDetailPage(
                              id: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: 'saved-view-new',
                            builder: (_, __) => const SavedViewFormPage(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Builder Studio
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: BuilderFormListPage.routePath,
                name: BuilderFormListPage.routeName,
                builder: (_, __) => const BuilderFormListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'builder-form-detail',
                    builder: (_, GoRouterState state) => BuilderFormDetailPage(
                      formId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: 'builder-form-new',
                    builder: (_, __) => const BuilderFormFormPage(),
                  ),
                  GoRoute(
                    path: 'pages',
                    name: BuilderPageListPage.routeName,
                    builder: (_, __) => const BuilderPageListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'builder-page-detail',
                        builder: (_, GoRouterState state) => BuilderPageDetailPage(
                          pageId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'builder-page-new',
                        builder: (_, __) => const BuilderPageFormPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Communication
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/communication',
                name: 'communication',
                builder: (_, __) => const NotificationListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'channels/:id/messages',
                    name: MessageListPage.routeName,
                    builder: (_, GoRouterState state) => MessageListPage(
                      channelId: state.pathParameters['id']!,
                    ),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':messageId',
                        name: 'message-detail',
                        builder: (_, GoRouterState state) => MessageDetailPage(
                          messageId: state.pathParameters['messageId']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'channels/new',
                    name: 'channel-new',
                    builder: (_, __) => const ChannelFormPage(),
                  ),
                  GoRoute(
                    path: 'channels/:id',
                    name: 'channel-detail',
                    builder: (_, GoRouterState state) => ChannelDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'meetings/new',
                    name: 'meeting-new',
                    builder: (_, __) => const MeetingFormPage(),
                  ),
                  GoRoute(
                    path: 'polls/new',
                    name: 'poll-new',
                    builder: (_, __) => const PollFormPage(),
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // E-Commerce & Marketplace
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: EcommerceProductListPage.routePath,
                name: EcommerceProductListPage.routeName,
                builder: (_, __) => const EcommerceProductListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: EcommerceProductDetailPage.routeName,
                    builder: (_, GoRouterState state) => EcommerceProductDetailPage(
                      productId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: EcommerceProductFormPage.routeName,
                    builder: (_, __) => const EcommerceProductFormPage(),
                  ),
                  GoRoute(
                    path: 'categories/new',
                    name: EcommerceCategoryFormPage.routeName,
                    builder: (_, __) => const EcommerceCategoryFormPage(),
                  ),
                  GoRoute(
                    path: 'orders',
                    name: EcommerceOrderListPage.routeName,
                    builder: (_, __) => const EcommerceOrderListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: EcommerceOrderDetailPage.routeName,
                        builder: (_, GoRouterState state) => EcommerceOrderDetailPage(
                          orderId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'marketplace',
                    name: 'marketplace',
                    builder: (_, __) => const MarketplaceAppListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'submissions',
                        name: MarketplaceSubmissionListPage.routeName,
                        builder: (_, __) => const MarketplaceSubmissionListPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Admin & System
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AdminUserListPage.routePath,
                name: AdminUserListPage.routeName,
                builder: (_, __) => const AdminUserListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'new',
                    name: 'admin-user-new',
                    builder: (_, __) => const AdminUserFormPage(),
                  ),
                  GoRoute(
                    path: 'audit-log',
                    name: AuditLogListPage.routeName,
                    builder: (_, __) => const AuditLogListPage(),
                  ),
                  GoRoute(
                    path: 'roles',
                    name: 'admin-roles',
                    builder: (_, __) => const AdminRoleListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'admin-role-detail',
                        builder: (_, GoRouterState state) => AdminRoleDetailPage(
                          roleId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'admin-role-new',
                        builder: (_, __) => const AdminRoleFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'tenants',
                    name: 'admin-tenants',
                    builder: (_, __) => const AdminTenantListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'admin-tenant-detail',
                        builder: (_, GoRouterState state) => AdminTenantDetailPage(
                          tenantId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'admin-tenant-new',
                        builder: (_, __) => const AdminTenantFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'settings',
                    name: 'admin-settings',
                    builder: (_, __) => const AdminSettingsListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':key',
                        name: 'admin-setting-detail',
                        builder: (_, GoRouterState state) => AdminSettingsDetailPage(
                          id: state.pathParameters['key']!,
                        ),
                      ),
                      GoRoute(
                        path: ':key/edit',
                        name: 'admin-setting-edit',
                        builder: (_, GoRouterState state) => AdminSettingEditPage(
                          settingKey: state.pathParameters['key']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'system-health',
                    name: 'admin-system-health',
                    builder: (_, __) => const AdminSystemHealthPage(),
                  ),
                  GoRoute(
                    path: 'api-keys',
                    name: 'admin-api-keys',
                    builder: (_, __) => const AdminApiKeyListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'admin-api-key-detail',
                        builder: (_, GoRouterState state) => AdminApiKeyDetailPage(
                          apiKeyId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'admin-api-key-new',
                        builder: (_, __) => const AdminApiKeyFormPage(),
                      ),
                      GoRoute(
                        path: 'usage',
                        name: 'admin-api-key-usage',
                        builder: (_, __) => const UsageLogListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'admin-api-key-usage-detail',
                            builder: (_, GoRouterState state) => UsageLogDetailPage(
                              id: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'languages',
                    name: 'languages',
                    builder: (_, __) => const LanguageListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'language-detail',
                        builder: (_, GoRouterState state) => LanguageDetailPage(
                          languageId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'language-new',
                        builder: (_, __) => const LanguageFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'pwa',
                    name: PushSubscriptionListPage.routeName,
                    builder: (_, __) => const PushSubscriptionListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'push-subscription-detail',
                        builder: (_, GoRouterState state) => PushSubscriptionDetailPage(
                          subscriptionId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'offline-queue',
                        name: 'offline-queue',
                        builder: (_, __) => const OfflineQueuePage(),
                      ),
                      GoRoute(
                        path: 'manifest/edit',
                        name: 'manifest-edit',
                        builder: (_, __) => const ManifestFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'api-platform',
                    name: 'api-platform',
                    builder: (_, __) => const ApiKeyListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'keys',
                        name: 'api-keys',
                        builder: (_, __) => const ApiKeyListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'api-key-detail',
                            builder: (_, GoRouterState state) => ApiKeyDetailPage(
                              id: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: 'api-key-new',
                            builder: (_, __) => const ApiKeyFormPage(),
                          ),
                        ],
                      ),
                      GoRoute(
                        path: 'webhooks/new',
                        name: 'webhook-new',
                        builder: (_, __) => const WebhookFormPage(),
                      ),
                      GoRoute(
                        path: 'usage-logs',
                        name: 'api-usage-logs',
                        builder: (_, __) => const UsageLogListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'api-usage-log-detail',
                            builder: (_, GoRouterState state) => UsageLogDetailPage(
                              id: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'storage',
                    name: 'storage',
                    builder: (_, __) => const BucketListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'bucket-detail',
                        builder: (_, GoRouterState state) => BucketDetailPage(
                          bucketId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'bucket-new',
                        builder: (_, __) => const BucketFormPage(),
                      ),
                      GoRoute(
                        path: 'files',
                        name: StorageFileListPage.routeName,
                        builder: (_, __) => const StorageFileListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'storage-file-detail',
                            builder: (_, GoRouterState state) => StorageFileDetailPage(
                              fileId: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // SaaS & Platform
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: SaasPlanListPage.routePath,
                name: SaasPlanListPage.routeName,
                builder: (_, __) => const SaasPlanListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: SaasPlanDetailPage.routeName,
                    builder: (_, GoRouterState state) => SaasPlanDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: SaasPlanFormPage.routeName,
                    builder: (_, __) => const SaasPlanFormPage(),
                  ),
                  GoRoute(
                    path: 'subscriptions',
                    name: SaasSubscriptionListPage.routeName,
                    builder: (_, __) => const SaasSubscriptionListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: SaasSubscriptionDetailPage.routeName,
                        builder: (_, GoRouterState state) => SaasSubscriptionDetailPage(
                          subscriptionId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'tenants',
                    name: SaasTenantListPage.routeName,
                    builder: (_, __) => const SaasTenantListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: SaasTenantDetailPage.routeName,
                        builder: (_, GoRouterState state) => SaasTenantDetailPage(
                          tenantId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: SaasTenantFormPage.routeName,
                        builder: (_, __) => const SaasTenantFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'portal',
                    name: 'portal',
                    builder: (_, __) => const PortalPlanListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: PortalPlanDetailPage.routeName,
                        builder: (_, GoRouterState state) => PortalPlanDetailPage(
                          planId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'support',
                        name: PortalSupportTicketListPage.routeName,
                        builder: (_, __) => const PortalSupportTicketListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'portal-ticket-detail',
                            builder: (_, GoRouterState state) => PortalSupportTicketDetailPage(
                              ticketId: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: 'portal-ticket-new',
                            builder: (_, __) => const PortalSupportTicketFormPage(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'billing',
                    name: SubscriptionBillingListPage.routeName,
                    builder: (_, __) => const SubscriptionBillingListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'billing-detail',
                        builder: (_, GoRouterState state) => BillingDetailPage(
                          billingId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'billing-new',
                        builder: (_, __) => const BillingFormPage(),
                      ),
                      GoRoute(
                        path: 'plans',
                        name: SubscriptionPlanListPage.routeName,
                        builder: (_, __) => const SubscriptionPlanListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'subscription-plan-detail',
                            builder: (_, GoRouterState state) => sub_plan_detail.PlanDetailPage(
                              id: state.pathParameters['id']!,
                            ),
                          ),
                          GoRoute(
                            path: 'new',
                            name: 'subscription-plan-new',
                            builder: (_, __) => const SubscriptionPlanFormPage(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'blockchain',
                    name: 'blockchain',
                    builder: (_, __) => const BlockchainContractListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'contract-detail',
                        builder: (_, GoRouterState state) => BlockchainContractDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'contract-new',
                        builder: (_, __) => const BlockchainContractFormPage(),
                      ),
                      GoRoute(
                        path: 'transactions',
                        name: BlockchainTransactionListPage.routeName,
                        builder: (_, __) => const BlockchainTransactionListPage(),
                        routes: <RouteBase>[
                          GoRoute(
                            path: ':id',
                            name: 'transaction-detail',
                            builder: (_, GoRouterState state) => BlockchainTransactionDetailPage(
                              id: state.pathParameters['id']!,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Healthcare
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppointmentListPage.routePath,
                name: AppointmentListPage.routeName,
                builder: (_, __) => const AppointmentListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'appointment-detail',
                    builder: (_, GoRouterState state) => AppointmentDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'patients',
                    name: PatientListPage.routeName,
                    builder: (_, __) => const PatientListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'patient-detail',
                        builder: (_, GoRouterState state) => PatientDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Education
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: CourseListPage.routePath,
                name: CourseListPage.routeName,
                builder: (_, __) => const CourseListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'course-detail',
                    builder: (_, GoRouterState state) => CourseDetailPage(
                      courseId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: 'course-new',
                    builder: (_, __) => const CourseFormPage(),
                  ),
                  GoRoute(
                    path: 'students',
                    name: StudentListPage.routeName,
                    builder: (_, __) => const StudentListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'student-detail',
                        builder: (_, GoRouterState state) => StudentDetailPage(
                          studentId: state.pathParameters['id']!,
                        ),
                      ),
                      GoRoute(
                        path: 'new',
                        name: 'student-new',
                        builder: (_, __) => const StudentFormPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'enrollments/new',
                    name: 'enrollment-new',
                    builder: (_, __) => const EnrollmentFormPage(),
                  ),
                  GoRoute(
                    path: 'exams/new',
                    name: 'exam-new',
                    builder: (_, __) => const ExamFormPage(),
                  ),
                  GoRoute(
                    path: 'gradebook/new',
                    name: 'gradebook-new',
                    builder: (_, __) => const GradebookFormPage(),
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Field Service
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ServiceTicketListPage.routePath,
                name: ServiceTicketListPage.routeName,
                builder: (_, __) => const ServiceTicketListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'field-service-ticket-detail',
                    builder: (_, GoRouterState state) => TicketDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'technicians',
                    name: TechnicianListPage.routeName,
                    builder: (_, __) => const TechnicianListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'technician-detail',
                        builder: (_, GoRouterState state) => TechnicianDetailPage(
                          id: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'contracts/:id',
                    name: 'field-service-contract-detail',
                    builder: (_, GoRouterState state) => ContractDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Real Estate
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: PropertyListPage.routePath,
                name: PropertyListPage.routeName,
                builder: (_, __) => const PropertyListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'real-estate-property-detail',
                    builder: (_, GoRouterState state) => PropertyDetailPage(
                      propertyId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'new',
                    name: 'real-estate-property-new',
                    builder: (_, __) => const PropertyFormPage(),
                  ),
                  GoRoute(
                    path: 'leases/:id',
                    name: 'real-estate-lease-detail',
                    builder: (_, GoRouterState state) => LeaseDetailPage(
                      leaseId: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'tenants/:id',
                    name: 'real-estate-tenant-detail',
                    builder: (_, GoRouterState state) => TenantDetailPage(
                      tenantId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          // ════════════════════════════════════════════════════════════
          // Service Management
          // ════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/service-management/catalogs',
                name: ServiceCatalogListPage.routeName,
                builder: (_, __) => const ServiceCatalogListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: 'catalog-item-detail',
                    builder: (_, GoRouterState state) => CatalogItemDetailPage(
                      id: state.pathParameters['id']!,
                    ),
                  ),
                  GoRoute(
                    path: 'requests',
                    name: ServiceRequestListPage.routeName,
                    builder: (_, __) => const ServiceRequestListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: ':id',
                        name: 'service-request-detail',
                        builder: (_, GoRouterState state) => ServiceRequestDetailPage(
                          requestId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'slas/:id',
                    name: 'sla-detail',
                    builder: (_, GoRouterState state) => SlaDetailPage(
                      slaId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});

class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(Ref ref) {
    ref.listen<AuthState>(
      authControllerProvider,
      (AuthState? previous, AuthState next) {
        if (previous?.status != next.status) notifyListeners();
      },
    );
  }
}
