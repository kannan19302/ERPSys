import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/domain/entities/session.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/mfa_challenge_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/auth/presentation/pages/verify_email_pending_page.dart';
import '../../features/auth/presentation/providers/auth_providers.dart';
import '../../features/auth/presentation/providers/auth_state.dart';
import '../../features/crm/presentation/pages/customer_detail_page.dart';
import '../../features/crm/presentation/pages/customer_list_page.dart';
import '../../features/crm/presentation/pages/lead_list_page.dart';
import '../../features/finance/presentation/pages/invoice_detail_page.dart';
import '../../features/finance/presentation/pages/invoice_list_page.dart';
import '../../features/finance/presentation/pages/payment_list_page.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/hr/presentation/pages/employee_detail_page.dart';
import '../../features/hr/presentation/pages/employee_list_page.dart';
import '../../features/hr/presentation/pages/leave_request_list_page.dart';
import '../../features/inventory/presentation/pages/product_detail_page.dart';
import '../../features/inventory/presentation/pages/product_list_page.dart';
import '../../features/notifications/presentation/pages/notifications_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/procurement/presentation/pages/purchase_order_detail_page.dart';
import '../../features/procurement/presentation/pages/purchase_order_list_page.dart';
import '../../features/procurement/presentation/pages/vendor_list_page.dart';
import '../../features/sales/presentation/pages/quotation_detail_page.dart';
import '../../features/sales/presentation/pages/quotation_list_page.dart';
import '../../features/sales/presentation/pages/sales_order_detail_page.dart';
import '../../features/sales/presentation/pages/sales_order_list_page.dart';
import '../../features/supply_chain/presentation/pages/shipment_list_page.dart';
import '../../features/supply_chain/presentation/pages/carrier_list_page.dart';
import '../../features/supply_chain/presentation/pages/demand_forecast_list_page.dart';
import '../../features/supply_chain/presentation/pages/reorder_suggestion_list_page.dart';
import '../../features/pos/presentation/pages/pos_order_list_page.dart';
import '../../features/pos/presentation/pages/pos_register_list_page.dart';
import '../../features/pos/presentation/pages/pos_shift_list_page.dart';
import '../../features/manufacturing/presentation/pages/work_order_list_page.dart';
import '../../features/manufacturing/presentation/pages/work_order_detail_page.dart';
import '../../features/manufacturing/presentation/pages/bom_list_page.dart';
import '../../features/manufacturing/presentation/pages/bom_detail_page.dart';
import '../../features/manufacturing/presentation/pages/mrp_run_list_page.dart';
import '../../features/manufacturing/presentation/pages/mrp_run_detail_page.dart';
import '../../features/projects/presentation/pages/project_list_page.dart';
import '../../features/projects/presentation/pages/milestone_list_page.dart';
import '../../features/projects/presentation/pages/task_list_page.dart';
import '../../features/documents/presentation/pages/documents_list_page.dart';
import '../../features/documents/presentation/pages/document_folders_list_page.dart';
import '../../features/drive/presentation/pages/drive_file_list_page.dart';
import '../../features/drive/presentation/pages/drive_folder_list_page.dart';
import '../../features/workflow/presentation/pages/workflow_list_page.dart';
import '../../features/workflow/presentation/pages/workflow_approval_list_page.dart';
import '../../features/advanced_finance/presentation/pages/financial_close_task_list_page.dart';
import '../../features/advanced_finance/presentation/pages/multi_currency_rate_list_page.dart';
import '../../features/fixed_assets/presentation/pages/fixed_asset_list_page.dart';
import '../../features/advanced_hr/presentation/pages/compensation_band_list_page.dart';
import '../../features/advanced_hr/presentation/pages/learning_path_list_page.dart';
import '../../features/people/presentation/pages/person_list_page.dart';

// analytics & reporting
import '../../features/analytics/presentation/pages/dashboard_list_page.dart';
import '../../features/analytics/presentation/pages/kpi_list_page.dart';
import '../../features/analytics/presentation/pages/pipeline_list_page.dart';
import '../../features/analytics/presentation/pages/report_list_page.dart';
import '../../features/reporting/presentation/pages/compliance_list_page.dart';
import '../../features/reporting/presentation/pages/export_list_page.dart';
import '../../features/reporting/presentation/pages/job_list_page.dart';
import '../../features/reporting/presentation/pages/template_list_page.dart';

// ai, search & saved_views
import '../../features/ai/presentation/pages/model_list_page.dart';
import '../../features/ai/presentation/pages/prediction_list_page.dart';
import '../../features/ai/presentation/pages/prompt_list_page.dart';
import '../../features/ai/presentation/pages/training_data_list_page.dart';
import '../../features/search/presentation/pages/search_result_page.dart';
import '../../features/search/presentation/pages/search_synonym_list_page.dart';
import '../../features/saved_views/presentation/pages/saved_view_list_page.dart';

// builder
import '../../features/builder/presentation/pages/builder_form_list_page.dart';

// communication
import '../../features/communication/presentation/pages/message_list_page.dart';
import '../../features/communication/presentation/pages/notification_list_page.dart';

// ecommerce & marketplace
import '../../features/ecommerce/presentation/pages/ecommerce_product_list_page.dart';
import '../../features/marketplace/presentation/pages/marketplace_app_list_page.dart';

// service management
import '../../features/service_management/presentation/pages/service_catalog_list_page.dart';

// admin & system
import '../../features/admin/presentation/pages/admin_user_list_page.dart';
import '../../features/admin/presentation/pages/audit_log_list_page.dart';
import '../../features/api_platform/presentation/pages/api_key_list_page.dart';
import '../../features/api_platform/presentation/pages/usage_log_list_page.dart';
import '../../features/localization/presentation/pages/language_list_page.dart';
import '../../features/pwa/presentation/pages/push_subscription_list_page.dart';
import '../../features/storage/presentation/pages/bucket_list_page.dart';
import '../../features/storage/presentation/pages/file_list_page.dart';

// saas & platform
import '../../features/saas/presentation/pages/saas_plan_list_page.dart';
import '../../features/saas/presentation/pages/saas_subscription_list_page.dart';
import '../../features/saas/presentation/pages/saas_tenant_list_page.dart';
import '../../features/saas_portal/presentation/pages/portal_plan_list_page.dart';
import '../../features/saas_portal/presentation/pages/portal_support_ticket_list_page.dart';
import '../../features/subscriptions/presentation/pages/subscription_billing_list_page.dart';
import '../../features/subscriptions/presentation/pages/subscription_plan_list_page.dart';
import '../../features/blockchain/presentation/pages/blockchain_contract_list_page.dart';
import '../../features/blockchain/presentation/pages/blockchain_transaction_list_page.dart';

// industry modules
import '../../features/healthcare/presentation/pages/appointment_list_page.dart';
import '../../features/healthcare/presentation/pages/patient_list_page.dart';
import '../../features/education/presentation/pages/course_list_page.dart';
import '../../features/education/presentation/pages/student_list_page.dart';
import '../../features/field_service/presentation/pages/service_ticket_list_page.dart';
import '../../features/field_service/presentation/pages/technician_list_page.dart';
import '../../features/real_estate/presentation/pages/property_list_page.dart';

import '../shell/app_shell.dart';

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
      StatefulShellRoute.indexedStack(
        builder: (_, __, StatefulNavigationShell shell) =>
            AppShell(navigationShell: shell),
        branches: <StatefulShellBranch>[
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: HomePage.routePath,
                name: HomePage.routeName,
                builder: (_, __) => const HomePage(),
              ),
            ],
          ),
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
                ],
              ),
            ],
          ),
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
                    ],
                  ),
                  GoRoute(
                    path: 'leads',
                    name: LeadListPage.routeName,
                    builder: (_, __) => const LeadListPage(),
                  ),
                ],
              ),
            ],
          ),
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
                    ],
                  ),
                  GoRoute(
                    path: 'vendors',
                    name: VendorListPage.routeName,
                    builder: (_, __) => const VendorListPage(),
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
                      ),
                      GoRoute(
                        path: 'currency-rates',
                        name: MultiCurrencyRateListPage.routeName,
                        builder: (_, __) => const MultiCurrencyRateListPage(),
                      ),
                    ],
                  ),
                  // ── Fixed Assets ──
                  GoRoute(
                    path: 'fixed-assets',
                    name: FixedAssetListPage.routeName,
                    builder: (_, __) => const FixedAssetListPage(),
                  ),
                ],
              ),
            ],
          ),
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
                      ),
                      GoRoute(
                        path: 'learning-paths',
                        name: LearningPathListPage.routeName,
                        builder: (_, __) => const LearningPathListPage(),
                      ),
                    ],
                  ),
                  // ── People Directory ──
                  GoRoute(
                    path: 'people',
                    name: PersonListPage.routeName,
                    builder: (_, __) => const PersonListPage(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: NotificationsPage.routePath,
                name: NotificationsPage.routeName,
                builder: (_, __) => const NotificationsPage(),
              ),
            ],
          ),
          // ── Supply Chain ──────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ShipmentListPage.routePath,
                name: ShipmentListPage.routeName,
                builder: (_, __) => const ShipmentListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'carriers',
                    name: CarrierListPage.routeName,
                    builder: (_, __) => const CarrierListPage(),
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
                ],
              ),
            ],
          ),
          // ── POS ───────────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: PosOrderListPage.routePath,
                name: PosOrderListPage.routeName,
                builder: (_, __) => const PosOrderListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'registers',
                    name: PosRegisterListPage.routeName,
                    builder: (_, __) => const PosRegisterListPage(),
                  ),
                  GoRoute(
                    path: 'shifts',
                    name: PosShiftListPage.routeName,
                    builder: (_, __) => const PosShiftListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ── Manufacturing ─────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: WorkOrderListPage.routePath,
                name: WorkOrderListPage.routeName,
                builder: (_, __) => const WorkOrderListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: WorkOrderDetailPage.routeName,
                    builder: (_, GoRouterState state) => WorkOrderDetailPage(
                      workOrderId: state.pathParameters['id']!,
                    ),
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
                          bomId: state.pathParameters['id']!,
                        ),
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
                      mrpRunId: state.pathParameters['id']!,
                    ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Projects ──────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: ProjectListPage.routePath,
                name: ProjectListPage.routeName,
                builder: (_, __) => const ProjectListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'milestones',
                    name: MilestoneListPage.routeName,
                    builder: (_, __) => const MilestoneListPage(),
                  ),
                  GoRoute(
                    path: 'tasks',
                    name: TaskListPage.routeName,
                    builder: (_, __) => const TaskListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ── Documents ─────────────────────────────────────────────────
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
                      ),
                      GoRoute(
                        path: 'folders',
                        name: DriveFolderListPage.routeName,
                        builder: (_, __) => const DriveFolderListPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ── Workflow ──────────────────────────────────────────────────
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/workflow/workflows',
                name: WorkflowListPage.routeName,
                builder: (_, __) => const WorkflowListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'approvals',
                    name: WorkflowApprovalListPage.routeName,
                    builder: (_, __) => const WorkflowApprovalListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Analytics & BI
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/analytics/dashboards',
                name: DashboardListPage.routeName,
                builder: (_, __) => const DashboardListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'kpis',
                    name: KpiListPage.routeName,
                    builder: (_, __) => const KpiListPage(),
                  ),
                  GoRoute(
                    path: 'pipelines',
                    name: PipelineListPage.routeName,
                    builder: (_, __) => const PipelineListPage(),
                  ),
                  GoRoute(
                    path: 'reports',
                    name: AnalyticsReportListPage.routeName,
                    builder: (_, __) => const AnalyticsReportListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'compliance',
                        name: ReportComplianceListPage.routeName,
                        builder: (_, __) => const ReportComplianceListPage(),
                      ),
                      GoRoute(
                        path: 'exports',
                        name: ReportExportListPage.routeName,
                        builder: (_, __) => const ReportExportListPage(),
                      ),
                      GoRoute(
                        path: 'jobs',
                        name: ReportJobListPage.routeName,
                        builder: (_, __) => const ReportJobListPage(),
                      ),
                      GoRoute(
                        path: 'templates',
                        name: ReportTemplateListPage.routeName,
                        builder: (_, __) => const ReportTemplateListPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: AI & Search
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/ai/models',
                name: AiModelListPage.routeName,
                builder: (_, __) => const AiModelListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'predictions',
                    name: AiPredictionListPage.routeName,
                    builder: (_, __) => const AiPredictionListPage(),
                  ),
                  GoRoute(
                    path: 'prompts',
                    name: AiPromptListPage.routeName,
                    builder: (_, __) => const AiPromptListPage(),
                  ),
                  GoRoute(
                    path: 'training',
                    name: AiTrainingDataListPage.routeName,
                    builder: (_, __) => const AiTrainingDataListPage(),
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
                      ),
                      GoRoute(
                        path: 'saved-views',
                        name: SavedViewListPage.routeName,
                        builder: (_, __) => const SavedViewListPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Builder Studio
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/builder/forms',
                name: BuilderFormListPage.routeName,
                builder: (_, __) => const BuilderFormListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'pages',
                    name: BuilderPageListPage.routeName,
                    builder: (_, __) => const BuilderPageListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Communication
          // ═══════════════════════════════════════════════════════════════
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
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: E-Commerce & Marketplace
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/ecommerce/products',
                name: EcommerceProductListPage.routeName,
                builder: (_, __) => const EcommerceProductListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'orders',
                    name: EcommerceOrderListPage.routeName,
                    builder: (_, __) => const EcommerceOrderListPage(),
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
          // ═══════════════════════════════════════════════════════════════
          // NEW: Admin & System
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/admin/users',
                name: AdminUserListPage.routeName,
                builder: (_, __) => const AdminUserListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'audit-log',
                    name: AuditLogListPage.routeName,
                    builder: (_, __) => const AuditLogListPage(),
                  ),
                  GoRoute(
                    path: 'api-keys',
                    name: ApiKeyListPage.routeName,
                    builder: (_, __) => const ApiKeyListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'usage',
                        name: UsageLogListPage.routeName,
                        builder: (_, __) => const UsageLogListPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'languages',
                    name: LanguageListPage.routeName,
                    builder: (_, __) => const LanguageListPage(),
                  ),
                  GoRoute(
                    path: 'pwa',
                    name: PushSubscriptionListPage.routeName,
                    builder: (_, __) => const PushSubscriptionListPage(),
                  ),
                  GoRoute(
                    path: 'storage',
                    name: 'storage',
                    builder: (_, __) => const BucketListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'files',
                        name: StorageFileListPage.routeName,
                        builder: (_, __) => const StorageFileListPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: SaaS & Platform
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/saas/plans',
                name: SaasPlanListPage.routeName,
                builder: (_, __) => const SaasPlanListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'subscriptions',
                    name: SaasSubscriptionListPage.routeName,
                    builder: (_, __) => const SaasSubscriptionListPage(),
                  ),
                  GoRoute(
                    path: 'tenants',
                    name: SaasTenantListPage.routeName,
                    builder: (_, __) => const SaasTenantListPage(),
                  ),
                  GoRoute(
                    path: 'portal',
                    name: 'portal',
                    builder: (_, __) => const PortalPlanListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'support',
                        name: PortalSupportTicketListPage.routeName,
                        builder: (_, __) => const PortalSupportTicketListPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'billing',
                    name: SubscriptionBillingListPage.routeName,
                    builder: (_, __) => const SubscriptionBillingListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'plans',
                        name: SubscriptionPlanListPage.routeName,
                        builder: (_, __) => const SubscriptionPlanListPage(),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'blockchain',
                    name: 'blockchain',
                    builder: (_, __) => const BlockchainContractListPage(),
                    routes: <RouteBase>[
                      GoRoute(
                        path: 'transactions',
                        name: BlockchainTransactionListPage.routeName,
                        builder: (_, __) => const BlockchainTransactionListPage(),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Healthcare
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/healthcare/appointments',
                name: AppointmentListPage.routeName,
                builder: (_, __) => const AppointmentListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'patients',
                    name: PatientListPage.routeName,
                    builder: (_, __) => const PatientListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Education
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/education/courses',
                name: CourseListPage.routeName,
                builder: (_, __) => const CourseListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'students',
                    name: StudentListPage.routeName,
                    builder: (_, __) => const StudentListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Field Service
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/field-service/tickets',
                name: ServiceTicketListPage.routeName,
                builder: (_, __) => const ServiceTicketListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'technicians',
                    name: TechnicianListPage.routeName,
                    builder: (_, __) => const TechnicianListPage(),
                  ),
                ],
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Real Estate
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/real-estate/properties',
                name: PropertyListPage.routeName,
                builder: (_, __) => const PropertyListPage(),
              ),
            ],
          ),
          // ═══════════════════════════════════════════════════════════════
          // NEW: Service Management
          // ═══════════════════════════════════════════════════════════════
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: '/service-management/catalogs',
                name: ServiceCatalogListPage.routeName,
                builder: (_, __) => const ServiceCatalogListPage(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'requests',
                    name: ServiceRequestListPage.routeName,
                    builder: (_, __) => const ServiceRequestListPage(),
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
